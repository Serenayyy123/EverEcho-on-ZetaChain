import { expect } from "chai";
import { ethers } from "hardhat";
import { EOCHOToken, Register, TaskEscrow } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * 集成测试：完整任务生命周期
 * 覆盖所有主要路径和分支
 */
describe("TaskLifecycle Integration Tests", function () {
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
  const T_OPEN = 7 * 24 * 60 * 60;
  const T_PROGRESS = 14 * 24 * 60 * 60;
  const T_REVIEW = 3 * 24 * 60 * 60;
  const T_TERMINATE_RESPONSE = 48 * 60 * 60;
  const T_FIX_EXTENSION = 3 * 24 * 60 * 60;
  const FEE_BPS = 200n;

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
  });

  describe("路径 1: 主流程 - Open → InProgress → Submitted → Completed", function () {
    it("应该完成完整的成功任务流程", async function () {
      // 记录初始余额
      const creatorInitialBalance = await echoToken.balanceOf(creator.address);
      const helperInitialBalance = await echoToken.balanceOf(helper.address);
      const totalSupplyInitial = await echoToken.totalSupply();

      // 1. Creator 创建任务
      await expect(taskEscrow.connect(creator).createTask(REWARD, TASK_URI))
        .to.emit(taskEscrow, "TaskCreated")
        .withArgs(1, creator.address, REWARD, TASK_URI);

      let task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(0); // Open
      expect(task.creator).to.equal(creator.address);
      expect(task.reward).to.equal(REWARD);

      // Creator 抵押了 REWARD
      expect(await echoToken.balanceOf(creator.address)).to.equal(creatorInitialBalance - REWARD);

      // 2. Helper 接受任务
      await expect(taskEscrow.connect(helper).acceptTask(1))
        .to.emit(taskEscrow, "TaskAccepted")
        .withArgs(1, helper.address);

      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(1); // InProgress
      expect(task.helper).to.equal(helper.address);
      expect(task.acceptedAt).to.be.gt(0);

      // Helper 抵押了 REWARD
      expect(await echoToken.balanceOf(helper.address)).to.equal(helperInitialBalance - REWARD);

      // 3. Helper 提交工作
      await expect(taskEscrow.connect(helper).submitWork(1))
        .to.emit(taskEscrow, "TaskSubmitted")
        .withArgs(1);

      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(2); // Submitted
      expect(task.submittedAt).to.be.gt(0);

      // 4. Creator 确认完成
      const fee = (REWARD * FEE_BPS) / 10000n;
      const helperReceived = REWARD - fee;

      await expect(taskEscrow.connect(creator).confirmComplete(1))
        .to.emit(taskEscrow, "TaskCompleted")
        .withArgs(1, helperReceived, fee);

      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(3); // Completed

      // 验证最终余额
      const creatorFinalBalance = await echoToken.balanceOf(creator.address);
      const helperFinalBalance = await echoToken.balanceOf(helper.address);
      const totalSupplyFinal = await echoToken.totalSupply();

      // Creator: 初始 - REWARD（抵押，已支付给 Helper）
      expect(creatorFinalBalance).to.equal(creatorInitialBalance - REWARD);

      // Helper: 初始 + helperReceived（0.98R 奖励）
      expect(helperFinalBalance).to.equal(helperInitialBalance + helperReceived);

      // 总供应量减少 fee（0.02R burn）
      expect(totalSupplyInitial - totalSupplyFinal).to.equal(fee);
    });

    it("应该正确记录所有时间戳", async function () {
      const blockBefore = await ethers.provider.getBlock("latest");
      const timestampBefore = blockBefore!.timestamp;

      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      let task = await taskEscrow.tasks(1);
      expect(task.createdAt).to.be.gte(timestampBefore);

      await taskEscrow.connect(helper).acceptTask(1);
      task = await taskEscrow.tasks(1);
      expect(task.acceptedAt).to.be.gt(task.createdAt);

      await taskEscrow.connect(helper).submitWork(1);
      task = await taskEscrow.tasks(1);
      expect(task.submittedAt).to.be.gt(task.acceptedAt);
    });
  });

  describe("路径 2: Submitted 超时自动完成", function () {
    it("应该在 T_REVIEW 后自动完成任务", async function () {
      // 创建并推进到 Submitted
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
      await taskEscrow.connect(helper).submitWork(1);

      const helperInitialBalance = await echoToken.balanceOf(helper.address);
      const totalSupplyInitial = await echoToken.totalSupply();

      // 快进 T_REVIEW
      await ethers.provider.send("evm_increaseTime", [T_REVIEW]);
      await ethers.provider.send("evm_mine", []);

      // 任何人可以触发超时完成
      const fee = (REWARD * FEE_BPS) / 10000n;
      const helperReceived = REWARD - fee;

      await expect(taskEscrow.connect(other).completeTimeout(1))
        .to.emit(taskEscrow, "TaskCompleted")
        .withArgs(1, helperReceived, fee);

      const task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(3); // Completed

      // 验证资金结算
      const helperFinalBalance = await echoToken.balanceOf(helper.address);
      // Helper 收到：0.98R（奖励）+ R（保证金退回）
      expect(helperFinalBalance - helperInitialBalance).to.equal(helperReceived + REWARD);

      const totalSupplyFinal = await echoToken.totalSupply();
      expect(totalSupplyInitial - totalSupplyFinal).to.equal(fee);
    });

    it("T_REVIEW 前不应该超时", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
      await taskEscrow.connect(helper).submitWork(1);

      // 快进 T_REVIEW - 1 秒
      await ethers.provider.send("evm_increaseTime", [T_REVIEW - 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        taskEscrow.connect(other).completeTimeout(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Timeout");
    });
  });

  describe("路径 3: 协商终止流程", function () {
    it("应该完成 Creator 发起 → Helper 同意 → Cancelled 流程", async function () {
      // 创建并推进到 InProgress
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      const creatorBalanceBefore = await echoToken.balanceOf(creator.address);
      const helperBalanceBefore = await echoToken.balanceOf(helper.address);
      const totalSupplyBefore = await echoToken.totalSupply();

      // 1. Creator 请求终止
      await expect(taskEscrow.connect(creator).requestTerminate(1))
        .to.emit(taskEscrow, "TerminateRequested")
        .withArgs(1, creator.address);

      let task = await taskEscrow.tasks(1);
      expect(task.terminateRequestedBy).to.equal(creator.address);
      expect(task.terminateRequestedAt).to.be.gt(0);
      expect(task.status).to.equal(1); // 仍为 InProgress

      // 2. Helper 同意终止
      await expect(taskEscrow.connect(helper).agreeTerminate(1))
        .to.emit(taskEscrow, "TerminateAgreed")
        .withArgs(1)
        .to.emit(taskEscrow, "TaskCancelled")
        .withArgs(1, "Mutually terminated");

      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(4); // Cancelled
      expect(task.terminateRequestedBy).to.equal(ethers.ZeroAddress);
      expect(task.terminateRequestedAt).to.equal(0);

      // 验证资金退回
      const creatorBalanceAfter = await echoToken.balanceOf(creator.address);
      const helperBalanceAfter = await echoToken.balanceOf(helper.address);
      const totalSupplyAfter = await echoToken.totalSupply();

      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(REWARD);
      expect(helperBalanceAfter - helperBalanceBefore).to.equal(REWARD);
      expect(totalSupplyAfter).to.equal(totalSupplyBefore); // 无 burn
    });

    it("应该完成 Helper 发起 → Creator 同意 → Cancelled 流程", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      // Helper 发起
      await taskEscrow.connect(helper).requestTerminate(1);
      let task = await taskEscrow.tasks(1);
      expect(task.terminateRequestedBy).to.equal(helper.address);

      // Creator 同意
      await taskEscrow.connect(creator).agreeTerminate(1);
      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(4); // Cancelled
    });

    it("应该完成 请求 → 超时 → 重置 → 再次请求 流程", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      // 1. Creator 请求终止
      await taskEscrow.connect(creator).requestTerminate(1);

      // 2. 超时
      await ethers.provider.send("evm_increaseTime", [T_TERMINATE_RESPONSE]);
      await ethers.provider.send("evm_mine", []);

      // 3. 重置
      await taskEscrow.connect(other).terminateTimeout(1);
      let task = await taskEscrow.tasks(1);
      expect(task.terminateRequestedBy).to.equal(ethers.ZeroAddress);
      expect(task.status).to.equal(1); // 仍为 InProgress

      // 4. Helper 再次请求终止
      await taskEscrow.connect(helper).requestTerminate(1);
      task = await taskEscrow.tasks(1);
      expect(task.terminateRequestedBy).to.equal(helper.address);

      // 5. Creator 同意
      await taskEscrow.connect(creator).agreeTerminate(1);
      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(4); // Cancelled
    });

    it("超过 48 小时后不应该同意终止", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      await taskEscrow.connect(creator).requestTerminate(1);

      // 快进 48 小时 + 1 秒
      await ethers.provider.send("evm_increaseTime", [T_TERMINATE_RESPONSE + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        taskEscrow.connect(helper).agreeTerminate(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Timeout");
    });
  });

  describe("路径 4: Request Fix 分支", function () {
    it("应该完成 Submitted → requestFix → 延长验收期 → 超时完成 流程", async function () {
      // 创建并推进到 Submitted
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
      await taskEscrow.connect(helper).submitWork(1);

      const taskBefore = await taskEscrow.tasks(1);
      const submittedAtBefore = taskBefore.submittedAt;

      // 1. Creator 请求修复
      await expect(taskEscrow.connect(creator).requestFix(1))
        .to.emit(taskEscrow, "FixRequested")
        .withArgs(1);

      let task = await taskEscrow.tasks(1);
      expect(task.fixRequested).to.be.true;
      expect(task.fixRequestedAt).to.be.gt(0);
      expect(task.submittedAt).to.equal(submittedAtBefore); // 不变

      // 2. T_REVIEW 后仍不能超时
      await ethers.provider.send("evm_increaseTime", [T_REVIEW]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        taskEscrow.connect(other).completeTimeout(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Timeout");

      // 3. T_REVIEW + T_FIX_EXTENSION 后可以超时
      await ethers.provider.send("evm_increaseTime", [T_FIX_EXTENSION]);
      await ethers.provider.send("evm_mine", []);

      const helperBalanceBefore = await echoToken.balanceOf(helper.address);
      const totalSupplyBefore = await echoToken.totalSupply();

      const fee = (REWARD * FEE_BPS) / 10000n;
      const helperReceived = REWARD - fee;

      await expect(taskEscrow.connect(other).completeTimeout(1))
        .to.emit(taskEscrow, "TaskCompleted")
        .withArgs(1, helperReceived, fee);

      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(3); // Completed

      // 验证资金结算
      const helperBalanceAfter = await echoToken.balanceOf(helper.address);
      // Helper 收到：0.98R（奖励）+ R（保证金退回）
      expect(helperBalanceAfter - helperBalanceBefore).to.equal(helperReceived + REWARD);

      const totalSupplyAfter = await echoToken.totalSupply();
      expect(totalSupplyBefore - totalSupplyAfter).to.equal(fee);
    });

    it("应该完成 Submitted → requestFix → Creator 确认完成 流程", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
      await taskEscrow.connect(helper).submitWork(1);

      // 请求修复
      await taskEscrow.connect(creator).requestFix(1);
      let task = await taskEscrow.tasks(1);
      expect(task.fixRequested).to.be.true;

      // Creator 仍可以确认完成
      await expect(taskEscrow.connect(creator).confirmComplete(1))
        .to.emit(taskEscrow, "TaskCompleted");

      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(3); // Completed
    });

    it("requestFix 应该仅允许一次", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
      await taskEscrow.connect(helper).submitWork(1);

      await taskEscrow.connect(creator).requestFix(1);

      await expect(
        taskEscrow.connect(creator).requestFix(1)
      ).to.be.revertedWithCustomError(taskEscrow, "AlreadyRequested");
    });
  });

  describe("其他取消路径", function () {
    it("应该完成 Open → Creator 取消 → Cancelled 流程", async function () {
      const creatorBalanceBefore = await echoToken.balanceOf(creator.address);

      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      
      await expect(taskEscrow.connect(creator).cancelTask(1))
        .to.emit(taskEscrow, "TaskCancelled")
        .withArgs(1, "Cancelled by creator");

      const task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(4); // Cancelled

      // Creator 拿回抵押
      const creatorBalanceAfter = await echoToken.balanceOf(creator.address);
      expect(creatorBalanceAfter).to.equal(creatorBalanceBefore);
    });

    it("应该完成 Open → 超时 → Cancelled 流程", async function () {
      const creatorBalanceBefore = await echoToken.balanceOf(creator.address);

      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);

      // 快进 T_OPEN
      await ethers.provider.send("evm_increaseTime", [T_OPEN]);
      await ethers.provider.send("evm_mine", []);

      await expect(taskEscrow.connect(other).cancelTaskTimeout(1))
        .to.emit(taskEscrow, "TaskCancelled")
        .withArgs(1, "Timeout in Open");

      const task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(4); // Cancelled

      // Creator 拿回抵押
      const creatorBalanceAfter = await echoToken.balanceOf(creator.address);
      expect(creatorBalanceAfter).to.equal(creatorBalanceBefore);
    });

    it("应该完成 InProgress → 超时 → Cancelled 流程", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      const creatorBalanceBefore = await echoToken.balanceOf(creator.address);
      const helperBalanceBefore = await echoToken.balanceOf(helper.address);

      // 快进 T_PROGRESS
      await ethers.provider.send("evm_increaseTime", [T_PROGRESS]);
      await ethers.provider.send("evm_mine", []);

      await expect(taskEscrow.connect(other).progressTimeout(1))
        .to.emit(taskEscrow, "TaskCancelled")
        .withArgs(1, "Timeout in InProgress");

      const task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(4); // Cancelled

      // 双方各拿回抵押
      const creatorBalanceAfter = await echoToken.balanceOf(creator.address);
      const helperBalanceAfter = await echoToken.balanceOf(helper.address);
      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(REWARD);
      expect(helperBalanceAfter - helperBalanceBefore).to.equal(REWARD);
    });
  });

  describe("状态机约束验证", function () {
    it("InProgress 状态 Creator 不可单方取消（冻结点 1.3-16）", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      // InProgress 状态不能调用 cancelTask
      await expect(
        taskEscrow.connect(creator).cancelTask(1)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
    });

    it("Submitted 状态不可取消（冻结点 1.3-17）", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
      await taskEscrow.connect(helper).submitWork(1);

      // Submitted 状态不能调用 cancelTask
      await expect(
        taskEscrow.connect(creator).cancelTask(1)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
    });

    it("只能从 Open 状态接受任务", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      // 注册 other 用户并授权
      await register.connect(other).register(PROFILE_URI + other.address);
      await echoToken.connect(other).approve(await taskEscrow.getAddress(), ethers.MaxUint256);

      // InProgress 状态不能再次接受
      await expect(
        taskEscrow.connect(other).acceptTask(1)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
    });

    it("只能从 InProgress 状态提交工作", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);

      // Open 状态不能提交
      await expect(
        taskEscrow.connect(helper).submitWork(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");
    });

    it("只能从 Submitted 状态确认完成", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      // InProgress 状态不能确认完成
      await expect(
        taskEscrow.connect(creator).confirmComplete(1)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
    });
  });

  describe("资金流验证", function () {
    it("双向抵押：Creator 和 Helper 各抵押 R", async function () {
      const creatorBalanceBefore = await echoToken.balanceOf(creator.address);
      const helperBalanceBefore = await echoToken.balanceOf(helper.address);
      const escrowBalanceBefore = await echoToken.balanceOf(await taskEscrow.getAddress());

      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      
      // Creator 抵押 R
      expect(await echoToken.balanceOf(creator.address)).to.equal(creatorBalanceBefore - REWARD);
      expect(await echoToken.balanceOf(await taskEscrow.getAddress())).to.equal(escrowBalanceBefore + REWARD);

      await taskEscrow.connect(helper).acceptTask(1);

      // Helper 抵押 R
      expect(await echoToken.balanceOf(helper.address)).to.equal(helperBalanceBefore - REWARD);
      expect(await echoToken.balanceOf(await taskEscrow.getAddress())).to.equal(escrowBalanceBefore + REWARD * 2n);
    });

    it("完成结算：Helper 得 0.98R，0.02R burn，保证金退回", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
      await taskEscrow.connect(helper).submitWork(1);

      const creatorBalanceBefore = await echoToken.balanceOf(creator.address);
      const helperBalanceBefore = await echoToken.balanceOf(helper.address);
      const totalSupplyBefore = await echoToken.totalSupply();
      const escrowBalanceBefore = await echoToken.balanceOf(await taskEscrow.getAddress());

      await taskEscrow.connect(creator).confirmComplete(1);

      const fee = (REWARD * FEE_BPS) / 10000n;
      const helperReceived = REWARD - fee;

      // Creator 余额不变（已抵押的 R 支付给 Helper）
      expect(await echoToken.balanceOf(creator.address)).to.equal(creatorBalanceBefore);

      // Helper 收到 0.98R + R（保证金）
      expect(await echoToken.balanceOf(helper.address)).to.equal(helperBalanceBefore + helperReceived + REWARD);

      // 总供应量减少 0.02R
      expect(await echoToken.totalSupply()).to.equal(totalSupplyBefore - fee);

      // Escrow 余额清零
      expect(await echoToken.balanceOf(await taskEscrow.getAddress())).to.equal(escrowBalanceBefore - REWARD * 2n);
    });

    it("协商终止：双方各拿回 R，无 burn", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      const creatorBalanceBefore = await echoToken.balanceOf(creator.address);
      const helperBalanceBefore = await echoToken.balanceOf(helper.address);
      const totalSupplyBefore = await echoToken.totalSupply();

      await taskEscrow.connect(creator).requestTerminate(1);
      await taskEscrow.connect(helper).agreeTerminate(1);

      // 双方各拿回 R
      expect(await echoToken.balanceOf(creator.address)).to.equal(creatorBalanceBefore + REWARD);
      expect(await echoToken.balanceOf(helper.address)).to.equal(helperBalanceBefore + REWARD);

      // 无 burn
      expect(await echoToken.totalSupply()).to.equal(totalSupplyBefore);
    });

    it("InProgress 超时：双方各拿回 R，无 burn", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      const creatorBalanceBefore = await echoToken.balanceOf(creator.address);
      const helperBalanceBefore = await echoToken.balanceOf(helper.address);
      const totalSupplyBefore = await echoToken.totalSupply();

      await ethers.provider.send("evm_increaseTime", [T_PROGRESS]);
      await ethers.provider.send("evm_mine", []);

      await taskEscrow.connect(other).progressTimeout(1);

      // 双方各拿回 R
      expect(await echoToken.balanceOf(creator.address)).to.equal(creatorBalanceBefore + REWARD);
      expect(await echoToken.balanceOf(helper.address)).to.equal(helperBalanceBefore + REWARD);

      // 无 burn
      expect(await echoToken.totalSupply()).to.equal(totalSupplyBefore);
    });
  });

  describe("事件顺序验证", function () {
    it("完整流程应该触发所有预期事件", async function () {
      // TaskCreated
      await expect(taskEscrow.connect(creator).createTask(REWARD, TASK_URI))
        .to.emit(taskEscrow, "TaskCreated");

      // TaskAccepted
      await expect(taskEscrow.connect(helper).acceptTask(1))
        .to.emit(taskEscrow, "TaskAccepted");

      // TaskSubmitted
      await expect(taskEscrow.connect(helper).submitWork(1))
        .to.emit(taskEscrow, "TaskSubmitted");

      // TaskCompleted
      await expect(taskEscrow.connect(creator).confirmComplete(1))
        .to.emit(taskEscrow, "TaskCompleted");
    });

    it("协商终止应该触发正确的事件序列", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      // TerminateRequested
      await expect(taskEscrow.connect(creator).requestTerminate(1))
        .to.emit(taskEscrow, "TerminateRequested");

      // TerminateAgreed + TaskCancelled
      await expect(taskEscrow.connect(helper).agreeTerminate(1))
        .to.emit(taskEscrow, "TerminateAgreed")
        .to.emit(taskEscrow, "TaskCancelled");
    });

    it("Request Fix 应该触发 FixRequested 事件", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
      await taskEscrow.connect(helper).submitWork(1);

      await expect(taskEscrow.connect(creator).requestFix(1))
        .to.emit(taskEscrow, "FixRequested");
    });
  });

  describe("多任务并发", function () {
    it("应该支持多个任务同时进行", async function () {
      const smallReward = ethers.parseEther("20"); // 使用更小的奖励以避免余额不足

      // 创建 3 个任务
      await taskEscrow.connect(creator).createTask(smallReward, TASK_URI);
      await taskEscrow.connect(creator).createTask(smallReward, TASK_URI);
      await taskEscrow.connect(creator).createTask(smallReward, TASK_URI);

      // 任务 1: 完成
      await taskEscrow.connect(helper).acceptTask(1);
      await taskEscrow.connect(helper).submitWork(1);
      await taskEscrow.connect(creator).confirmComplete(1);

      // 任务 2: 协商终止
      await taskEscrow.connect(helper).acceptTask(2);
      await taskEscrow.connect(creator).requestTerminate(2);
      await taskEscrow.connect(helper).agreeTerminate(2);

      // 任务 3: 仍在 Open
      const task1 = await taskEscrow.tasks(1);
      const task2 = await taskEscrow.tasks(2);
      const task3 = await taskEscrow.tasks(3);

      expect(task1.status).to.equal(3); // Completed
      expect(task2.status).to.equal(4); // Cancelled
      expect(task3.status).to.equal(0); // Open
    });
  });
});
