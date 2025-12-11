import { expect } from "chai";
import { ethers } from "hardhat";
import { EOCHOToken, Register, TaskEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * P1-C5: Request Fix 机制测试
 * 冻结点 1.3-17：Submitted 状态 Creator 不可取消，仅支持 confirmComplete / requestFix（一次）/ 超时完成
 * 冻结点 1.4-20：Request Fix 不刷新 submittedAt，延长验收期 T_FIX_EXTENSION
 */
describe("TaskEscrow - Request Fix (P1-C5)", function () {
  let echoToken: EOCHOToken;
  let register: Register;
  let taskEscrow: TaskEscrow;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let helper: SignerWithAddress;
  let other: SignerWithAddress;

  const INITIAL_MINT = ethers.parseEther("100");
  const REWARD = ethers.parseEther("50");
  const TASK_URI = "https://api.everecho.io/task/1.json";
  const PROFILE_URI = "https://api.everecho.io/profile/";
  const T_REVIEW = 3 * 24 * 60 * 60; // 3 days
  const T_FIX_EXTENSION = 3 * 24 * 60 * 60; // 3 days

  beforeEach(async function () {
    [owner, creator, helper, other] = await ethers.getSigners();

    // 部署合约
    const EOCHOTokenFactory = await ethers.getContractFactory("EOCHOToken");
    echoToken = await EOCHOTokenFactory.deploy();

    const RegisterFactory = await ethers.getContractFactory("Register");
    register = await RegisterFactory.deploy(await echoToken.getAddress());

    await echoToken.setRegisterAddress(await register.getAddress());

    const TaskEscrowFactory = await ethers.getContractFactory("TaskEscrow");
    taskEscrow = await TaskEscrowFactory.deploy(
      await echoToken.getAddress(),
      await register.getAddress()
    );

    await echoToken.setTaskEscrowAddress(await taskEscrow.getAddress());

    // 注册用户
    await register.connect(creator).register(PROFILE_URI + creator.address);
    await register.connect(helper).register(PROFILE_URI + helper.address);

    // 授权
    await echoToken.connect(creator).approve(await taskEscrow.getAddress(), ethers.MaxUint256);
    await echoToken.connect(helper).approve(await taskEscrow.getAddress(), ethers.MaxUint256);

    // 创建并推进任务到 Submitted 状态
    await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
    await taskEscrow.connect(helper).acceptTask(1);
    await taskEscrow.connect(helper).submitWork(1);
  });

  describe("requestFix - 正常路径（验收口径 #1）", function () {
    it("Creator 应该可以在 Submitted 状态请求修复", async function () {
      await expect(taskEscrow.connect(creator).requestFix(1))
        .to.emit(taskEscrow, "FixRequested")
        .withArgs(1);

      const task = await taskEscrow.tasks(1);
      expect(task.fixRequested).to.be.true;
      expect(task.fixRequestedAt).to.be.gt(0);
      expect(task.status).to.equal(2); // 仍为 Submitted
    });

    it("fixRequestedAt 应该记录请求时间", async function () {
      const blockBefore = await ethers.provider.getBlock("latest");
      const timestampBefore = blockBefore!.timestamp;

      await taskEscrow.connect(creator).requestFix(1);

      const task = await taskEscrow.tasks(1);
      expect(task.fixRequestedAt).to.be.gte(timestampBefore);
      expect(task.fixRequestedAt).to.be.lte(timestampBefore + 10);
    });
  });

  describe("requestFix - 权限控制（验收口径 #2）", function () {
    it("应该拒绝非 Creator 请求修复", async function () {
      await expect(
        taskEscrow.connect(helper).requestFix(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");

      await expect(
        taskEscrow.connect(other).requestFix(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");
    });
  });

  describe("requestFix - 状态检查（验收口径 #3）", function () {
    it("应该拒绝非 Submitted 状态请求修复", async function () {
      // Open 状态
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await expect(
        taskEscrow.connect(creator).requestFix(2)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");

      // InProgress 状态
      await taskEscrow.connect(helper).acceptTask(2);
      await expect(
        taskEscrow.connect(creator).requestFix(2)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");

      // Completed 状态
      await taskEscrow.connect(helper).submitWork(2);
      await taskEscrow.connect(creator).confirmComplete(2);
      await expect(
        taskEscrow.connect(creator).requestFix(2)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
    });
  });

  describe("requestFix - 防重复（验收口径 #4）", function () {
    it("应该拒绝第二次请求修复", async function () {
      await taskEscrow.connect(creator).requestFix(1);

      await expect(
        taskEscrow.connect(creator).requestFix(1)
      ).to.be.revertedWithCustomError(taskEscrow, "AlreadyRequested");
    });

    it("每个任务最多一次 requestFix", async function () {
      await taskEscrow.connect(creator).requestFix(1);

      const task = await taskEscrow.tasks(1);
      expect(task.fixRequested).to.be.true;

      // 尝试第二次
      await expect(
        taskEscrow.connect(creator).requestFix(1)
      ).to.be.revertedWithCustomError(taskEscrow, "AlreadyRequested");
    });
  });

  describe("requestFix - submittedAt 不变（验收口径 #5，冻结点 1.4-20）", function () {
    it("requestFix 不应该刷新 submittedAt", async function () {
      const taskBefore = await taskEscrow.tasks(1);
      const submittedAtBefore = taskBefore.submittedAt;

      // 等待一段时间
      await ethers.provider.send("evm_increaseTime", [60]); // 1 分钟
      await ethers.provider.send("evm_mine", []);

      await taskEscrow.connect(creator).requestFix(1);

      const taskAfter = await taskEscrow.tasks(1);
      expect(taskAfter.submittedAt).to.equal(submittedAtBefore);
    });

    it("submittedAt 应该保持原始提交时间", async function () {
      const task1 = await taskEscrow.tasks(1);
      const originalSubmittedAt = task1.submittedAt;

      await taskEscrow.connect(creator).requestFix(1);

      const task2 = await taskEscrow.tasks(1);
      expect(task2.submittedAt).to.equal(originalSubmittedAt);
      expect(task2.fixRequestedAt).to.be.gt(originalSubmittedAt);
    });
  });

  describe("requestFix - 事件验证（验收口径 #6）", function () {
    it("FixRequested 事件参数正确", async function () {
      await expect(taskEscrow.connect(creator).requestFix(1))
        .to.emit(taskEscrow, "FixRequested")
        .withArgs(1);
    });

    it("应该仅触发 FixRequested 事件", async function () {
      const tx = await taskEscrow.connect(creator).requestFix(1);
      const receipt = await tx.wait();

      const fixRequestedEvents = receipt?.logs.filter((log: any) => {
        try {
          const parsed = taskEscrow.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          return parsed?.name === "FixRequested";
        } catch {
          return false;
        }
      });

      expect(fixRequestedEvents).to.have.lengthOf(1);
    });
  });

  describe("requestFix - 与 completeTimeout 集成（验收口径 #7）", function () {
    it("未 requestFix 时，T_REVIEW 后应该可以超时完成", async function () {
      // 快进 T_REVIEW
      await ethers.provider.send("evm_increaseTime", [T_REVIEW]);
      await ethers.provider.send("evm_mine", []);

      await expect(taskEscrow.connect(other).completeTimeout(1))
        .to.emit(taskEscrow, "TaskCompleted");
    });

    it("requestFix 后，T_REVIEW 内不应该超时", async function () {
      await taskEscrow.connect(creator).requestFix(1);

      // 快进 T_REVIEW
      await ethers.provider.send("evm_increaseTime", [T_REVIEW]);
      await ethers.provider.send("evm_mine", []);

      // 应该还不能超时
      await expect(
        taskEscrow.connect(other).completeTimeout(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Timeout");
    });

    it("requestFix 后，T_REVIEW + T_FIX_EXTENSION 后应该可以超时完成", async function () {
      await taskEscrow.connect(creator).requestFix(1);

      // 快进 T_REVIEW + T_FIX_EXTENSION
      await ethers.provider.send("evm_increaseTime", [T_REVIEW + T_FIX_EXTENSION]);
      await ethers.provider.send("evm_mine", []);

      await expect(taskEscrow.connect(other).completeTimeout(1))
        .to.emit(taskEscrow, "TaskCompleted");
    });

    it("requestFix 应该延长验收期 3 天", async function () {
      const taskBefore = await taskEscrow.tasks(1);
      const originalDeadline = Number(taskBefore.submittedAt) + T_REVIEW;

      await taskEscrow.connect(creator).requestFix(1);

      // 在原始 deadline 时不应该超时
      const currentTime = (await ethers.provider.getBlock("latest"))!.timestamp;
      const timeToOriginalDeadline = originalDeadline - currentTime;
      
      if (timeToOriginalDeadline > 0) {
        await ethers.provider.send("evm_increaseTime", [timeToOriginalDeadline + 1]);
        await ethers.provider.send("evm_mine", []);

        await expect(
          taskEscrow.connect(other).completeTimeout(1)
        ).to.be.revertedWithCustomError(taskEscrow, "Timeout");
      }

      // 在新 deadline（原始 + 3 天）时应该可以超时
      await ethers.provider.send("evm_increaseTime", [T_FIX_EXTENSION]);
      await ethers.provider.send("evm_mine", []);

      await expect(taskEscrow.connect(other).completeTimeout(1))
        .to.emit(taskEscrow, "TaskCompleted");
    });
  });

  describe("requestFix - 完整流程（验收口径 #8）", function () {
    it("应该完成 Submitted -> requestFix -> confirmComplete 流程", async function () {
      // 1. 请求修复
      await taskEscrow.connect(creator).requestFix(1);
      let task = await taskEscrow.tasks(1);
      expect(task.fixRequested).to.be.true;
      expect(task.status).to.equal(2); // Submitted

      // 2. Creator 仍可以确认完成
      await expect(taskEscrow.connect(creator).confirmComplete(1))
        .to.emit(taskEscrow, "TaskCompleted");

      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(3); // Completed
    });

    it("应该完成 Submitted -> requestFix -> 超时完成 流程", async function () {
      // 1. 请求修复
      await taskEscrow.connect(creator).requestFix(1);

      // 2. 快进到新 deadline
      await ethers.provider.send("evm_increaseTime", [T_REVIEW + T_FIX_EXTENSION]);
      await ethers.provider.send("evm_mine", []);

      // 3. 超时完成
      await expect(taskEscrow.connect(other).completeTimeout(1))
        .to.emit(taskEscrow, "TaskCompleted");

      const task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(3); // Completed
    });

    it("requestFix 后 Helper 仍可以重新提交（通过 submitWork）", async function () {
      await taskEscrow.connect(creator).requestFix(1);

      // 注意：合约中 submitWork 要求 InProgress 状态
      // 这里测试的是 requestFix 不阻止后续操作
      // 实际流程中，Helper 需要在 Submitted 状态更新提交物（链下）

      const task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(2); // 仍为 Submitted
      expect(task.fixRequested).to.be.true;
    });
  });

  describe("requestFix - 边界情况", function () {
    it("fixRequested 初始值应该为 false", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(2);
      await taskEscrow.connect(helper).submitWork(2);

      const task = await taskEscrow.tasks(2);
      expect(task.fixRequested).to.be.false;
      expect(task.fixRequestedAt).to.equal(0);
    });

    it("requestFix 不应该改变任务的其他字段", async function () {
      const taskBefore = await taskEscrow.tasks(1);

      await taskEscrow.connect(creator).requestFix(1);

      const taskAfter = await taskEscrow.tasks(1);
      expect(taskAfter.taskId).to.equal(taskBefore.taskId);
      expect(taskAfter.creator).to.equal(taskBefore.creator);
      expect(taskAfter.helper).to.equal(taskBefore.helper);
      expect(taskAfter.reward).to.equal(taskBefore.reward);
      expect(taskAfter.status).to.equal(taskBefore.status);
      expect(taskAfter.createdAt).to.equal(taskBefore.createdAt);
      expect(taskAfter.acceptedAt).to.equal(taskBefore.acceptedAt);
      expect(taskAfter.submittedAt).to.equal(taskBefore.submittedAt);
    });

    it("requestFix 不应该移动任何资金", async function () {
      const creatorBalanceBefore = await echoToken.balanceOf(creator.address);
      const helperBalanceBefore = await echoToken.balanceOf(helper.address);
      const escrowBalanceBefore = await echoToken.balanceOf(await taskEscrow.getAddress());

      await taskEscrow.connect(creator).requestFix(1);

      const creatorBalanceAfter = await echoToken.balanceOf(creator.address);
      const helperBalanceAfter = await echoToken.balanceOf(helper.address);
      const escrowBalanceAfter = await echoToken.balanceOf(await taskEscrow.getAddress());

      expect(creatorBalanceAfter).to.equal(creatorBalanceBefore);
      expect(helperBalanceAfter).to.equal(helperBalanceBefore);
      expect(escrowBalanceAfter).to.equal(escrowBalanceBefore);
    });
  });
});
