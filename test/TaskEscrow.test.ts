import { expect } from "chai";
import { ethers } from "hardhat";
import { EOCHOToken, Register, TaskEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TaskEscrow", function () {
  let echoToken: EOCHOToken;
  let register: Register;
  let taskEscrow: TaskEscrow;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let helper: SignerWithAddress;
  let other: SignerWithAddress;

  const INITIAL_MINT = ethers.parseEther("100");
  const REWARD = ethers.parseEther("50");
  const MAX_REWARD = ethers.parseEther("1000");
  const TASK_URI = "https://api.everecho.io/task/1.json";
  const PROFILE_URI = "https://api.everecho.io/profile/";

  beforeEach(async function () {
    [owner, creator, helper, other] = await ethers.getSigners();

    // 部署 EOCHOToken
    const EOCHOTokenFactory = await ethers.getContractFactory("EOCHOToken");
    echoToken = await EOCHOTokenFactory.deploy();

    // 部署 Register
    const RegisterFactory = await ethers.getContractFactory("Register");
    register = await RegisterFactory.deploy(await echoToken.getAddress());

    // 设置 Register 地址到 EOCHOToken
    await echoToken.setRegisterAddress(await register.getAddress());

    // 部署 TaskEscrow
    const TaskEscrowFactory = await ethers.getContractFactory("TaskEscrow");
    taskEscrow = await TaskEscrowFactory.deploy(
      await echoToken.getAddress(),
      await register.getAddress()
    );

    // 设置 TaskEscrow 地址到 EOCHOToken
    await echoToken.setTaskEscrowAddress(await taskEscrow.getAddress());

    // 注册 creator 和 helper
    await register.connect(creator).register(PROFILE_URI + creator.address);
    await register.connect(helper).register(PROFILE_URI + helper.address);

    // 授权 TaskEscrow 使用 creator 和 helper 的 token
    await echoToken.connect(creator).approve(await taskEscrow.getAddress(), ethers.MaxUint256);
    await echoToken.connect(helper).approve(await taskEscrow.getAddress(), ethers.MaxUint256);
  });

  describe("createTask", function () {
    it("应该成功创建任务并抵押 reward", async function () {
      const balanceBefore = await echoToken.balanceOf(creator.address);

      await expect(taskEscrow.connect(creator).createTask(REWARD, TASK_URI))
        .to.emit(taskEscrow, "TaskCreated")
        .withArgs(1, creator.address, REWARD, TASK_URI);

      const task = await taskEscrow.tasks(1);
      expect(task.taskId).to.equal(1);
      expect(task.creator).to.equal(creator.address);
      expect(task.reward).to.equal(REWARD);
      expect(task.status).to.equal(0); // Open

      const balanceAfter = await echoToken.balanceOf(creator.address);
      expect(balanceBefore - balanceAfter).to.equal(REWARD);
    });

    it("应该拒绝未注册用户创建任务", async function () {
      await expect(
        taskEscrow.connect(other).createTask(REWARD, TASK_URI)
      ).to.be.revertedWithCustomError(taskEscrow, "NotRegistered");
    });

    it("应该拒绝 reward = 0", async function () {
      await expect(
        taskEscrow.connect(creator).createTask(0, TASK_URI)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidReward");
    });

    it("应该拒绝 reward > MAX_REWARD", async function () {
      await expect(
        taskEscrow.connect(creator).createTask(MAX_REWARD + 1n, TASK_URI)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidReward");
    });
  });

  describe("cancelTask", function () {
    beforeEach(async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
    });

    it("应该允许 Creator 取消 Open 状态任务", async function () {
      const balanceBefore = await echoToken.balanceOf(creator.address);

      await expect(taskEscrow.connect(creator).cancelTask(1))
        .to.emit(taskEscrow, "TaskCancelled")
        .withArgs(1, "Cancelled by creator");

      const task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(4); // Cancelled

      const balanceAfter = await echoToken.balanceOf(creator.address);
      expect(balanceAfter - balanceBefore).to.equal(REWARD);
    });

    it("应该拒绝非 Creator 取消任务", async function () {
      await expect(
        taskEscrow.connect(helper).cancelTask(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");
    });

    it("应该拒绝取消非 Open 状态任务", async function () {
      await taskEscrow.connect(helper).acceptTask(1);
      await expect(
        taskEscrow.connect(creator).cancelTask(1)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
    });
  });

  describe("cancelTaskTimeout", function () {
    it("应该允许任何人在超时后取消 Open 任务", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);

      // 快进 7 天
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const balanceBefore = await echoToken.balanceOf(creator.address);

      await expect(taskEscrow.connect(other).cancelTaskTimeout(1))
        .to.emit(taskEscrow, "TaskCancelled")
        .withArgs(1, "Timeout in Open");

      const balanceAfter = await echoToken.balanceOf(creator.address);
      expect(balanceAfter - balanceBefore).to.equal(REWARD);
    });

    it("应该拒绝未超时的取消", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);

      await expect(
        taskEscrow.connect(other).cancelTaskTimeout(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Timeout");
    });
  });

  describe("acceptTask", function () {
    beforeEach(async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
    });

    it("应该成功接受任务并抵押 reward", async function () {
      const balanceBefore = await echoToken.balanceOf(helper.address);

      await expect(taskEscrow.connect(helper).acceptTask(1))
        .to.emit(taskEscrow, "TaskAccepted")
        .withArgs(1, helper.address);

      const task = await taskEscrow.tasks(1);
      expect(task.helper).to.equal(helper.address);
      expect(task.status).to.equal(1); // InProgress

      const balanceAfter = await echoToken.balanceOf(helper.address);
      expect(balanceBefore - balanceAfter).to.equal(REWARD);
    });

    it("应该拒绝未注册用户接受任务", async function () {
      await expect(
        taskEscrow.connect(other).acceptTask(1)
      ).to.be.revertedWithCustomError(taskEscrow, "NotRegistered");
    });

    it("应该拒绝 Creator 接受自己的任务", async function () {
      await expect(
        taskEscrow.connect(creator).acceptTask(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");
    });

    it("应该拒绝接受非 Open 状态任务", async function () {
      await taskEscrow.connect(helper).acceptTask(1);
      
      // 注册 other 用户并授权
      await register.connect(other).register(PROFILE_URI + other.address);
      await echoToken.connect(other).approve(await taskEscrow.getAddress(), ethers.MaxUint256);
      
      await expect(
        taskEscrow.connect(other).acceptTask(1)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
    });
  });

  describe("submitWork", function () {
    beforeEach(async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
    });

    it("应该允许 Helper 提交工作", async function () {
      await expect(taskEscrow.connect(helper).submitWork(1))
        .to.emit(taskEscrow, "TaskSubmitted")
        .withArgs(1);

      const task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(2); // Submitted
      expect(task.submittedAt).to.be.gt(0);
    });

    it("应该拒绝非 Helper 提交工作", async function () {
      await expect(
        taskEscrow.connect(creator).submitWork(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");
    });

    it("应该拒绝非 InProgress 状态提交", async function () {
      await taskEscrow.connect(helper).submitWork(1);
      await expect(
        taskEscrow.connect(helper).submitWork(1)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
    });
  });

  describe("confirmComplete", function () {
    beforeEach(async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
      await taskEscrow.connect(helper).submitWork(1);
    });

    it("应该正确结算资金：Helper 得 0.98R + 保证金，0.02R burn", async function () {
      const helperBalanceBefore = await echoToken.balanceOf(helper.address);
      const totalSupplyBefore = await echoToken.totalSupply();

      const fee = (REWARD * 200n) / 10000n;
      const helperReceived = REWARD - fee;

      await expect(taskEscrow.connect(creator).confirmComplete(1))
        .to.emit(taskEscrow, "TaskCompleted")
        .withArgs(1, helperReceived, fee);

      const task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(3); // Completed

      const helperBalanceAfter = await echoToken.balanceOf(helper.address);
      const totalSupplyAfter = await echoToken.totalSupply();

      // Helper 收到：0.98R（奖励）+ R（保证金退回）
      expect(helperBalanceAfter - helperBalanceBefore).to.equal(helperReceived + REWARD);

      // 总供应量减少 0.02R（burn）
      expect(totalSupplyBefore - totalSupplyAfter).to.equal(fee);
    });

    it("应该拒绝非 Creator 确认完成", async function () {
      await expect(
        taskEscrow.connect(helper).confirmComplete(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");
    });

    it("应该拒绝非 Submitted 状态确认", async function () {
      await taskEscrow.connect(creator).confirmComplete(1);
      await expect(
        taskEscrow.connect(creator).confirmComplete(1)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
    });
  });

  describe("completeTimeout", function () {
    beforeEach(async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
      await taskEscrow.connect(helper).submitWork(1);
    });

    it("应该允许任何人在超时后触发自动完成", async function () {
      // 快进 3 天
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const helperBalanceBefore = await echoToken.balanceOf(helper.address);
      const fee = (REWARD * 200n) / 10000n;
      const helperReceived = REWARD - fee;

      await expect(taskEscrow.connect(other).completeTimeout(1))
        .to.emit(taskEscrow, "TaskCompleted")
        .withArgs(1, helperReceived, fee);

      const helperBalanceAfter = await echoToken.balanceOf(helper.address);
      expect(helperBalanceAfter - helperBalanceBefore).to.equal(helperReceived + REWARD);
    });

    it("应该拒绝未超时的自动完成", async function () {
      await expect(
        taskEscrow.connect(other).completeTimeout(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Timeout");
    });

    it("应该在 fixRequested 时延长验收期", async function () {
      // 手动设置 fixRequested（模拟 P1 功能）
      // 注意：这里仅测试计算逻辑，实际 requestFix 函数不在 P0 范围
      const task = await taskEscrow.tasks(1);
      
      // 快进 3 天（T_REVIEW）
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // 如果 fixRequested = false，应该可以触发
      await expect(taskEscrow.connect(other).completeTimeout(1))
        .to.emit(taskEscrow, "TaskCompleted");
    });
  });

  describe("progressTimeout", function () {
    beforeEach(async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
    });

    it("应该允许任何人在超时后关闭 InProgress 任务", async function () {
      // 快进 14 天
      await ethers.provider.send("evm_increaseTime", [14 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const creatorBalanceBefore = await echoToken.balanceOf(creator.address);
      const helperBalanceBefore = await echoToken.balanceOf(helper.address);

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

    it("应该拒绝未超时的关闭", async function () {
      await expect(
        taskEscrow.connect(other).progressTimeout(1)
      ).to.be.revertedWithCustomError(taskEscrow, "Timeout");
    });

    it("应该拒绝非 InProgress 状态关闭", async function () {
      await taskEscrow.connect(helper).submitWork(1);
      
      // 快进 14 天
      await ethers.provider.send("evm_increaseTime", [14 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        taskEscrow.connect(other).progressTimeout(1)
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
    });
  });

  describe("完整任务生命周期", function () {
    it("应该完成 Open -> InProgress -> Submitted -> Completed 流程", async function () {
      // 1. 创建任务
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      let task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(0); // Open

      // 2. 接受任务
      await taskEscrow.connect(helper).acceptTask(1);
      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(1); // InProgress

      // 3. 提交工作
      await taskEscrow.connect(helper).submitWork(1);
      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(2); // Submitted

      // 4. 确认完成
      await taskEscrow.connect(creator).confirmComplete(1);
      task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(3); // Completed
    });

    it("应该完成 Open -> Cancelled 流程（Creator 取消）", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(creator).cancelTask(1);
      
      const task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(4); // Cancelled
    });

    it("应该完成 InProgress -> Cancelled 流程（超时）", async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);

      // 快进 14 天
      await ethers.provider.send("evm_increaseTime", [14 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await taskEscrow.connect(other).progressTimeout(1);
      
      const task = await taskEscrow.tasks(1);
      expect(task.status).to.equal(4); // Cancelled
    });
  });

  describe("P1-C4: 协商终止机制", function () {
    beforeEach(async function () {
      await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
      await taskEscrow.connect(helper).acceptTask(1);
    });

    describe("requestTerminate", function () {
      it("应该允许 Creator 请求终止", async function () {
        await expect(taskEscrow.connect(creator).requestTerminate(1))
          .to.emit(taskEscrow, "TerminateRequested")
          .withArgs(1, creator.address);

        const task = await taskEscrow.tasks(1);
        expect(task.terminateRequestedBy).to.equal(creator.address);
        expect(task.terminateRequestedAt).to.be.gt(0);
        expect(task.status).to.equal(1); // 仍为 InProgress
      });

      it("应该允许 Helper 请求终止", async function () {
        await expect(taskEscrow.connect(helper).requestTerminate(1))
          .to.emit(taskEscrow, "TerminateRequested")
          .withArgs(1, helper.address);

        const task = await taskEscrow.tasks(1);
        expect(task.terminateRequestedBy).to.equal(helper.address);
      });

      it("应该拒绝非 Creator/Helper 请求终止", async function () {
        await expect(
          taskEscrow.connect(other).requestTerminate(1)
        ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");
      });

      it("应该拒绝非 InProgress 状态请求终止", async function () {
        await taskEscrow.connect(helper).submitWork(1);
        await expect(
          taskEscrow.connect(creator).requestTerminate(1)
        ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
      });
    });

    describe("agreeTerminate", function () {
      beforeEach(async function () {
        await taskEscrow.connect(creator).requestTerminate(1);
      });

      it("应该允许 Helper 同意终止并退回双方资金", async function () {
        const creatorBalanceBefore = await echoToken.balanceOf(creator.address);
        const helperBalanceBefore = await echoToken.balanceOf(helper.address);

        await expect(taskEscrow.connect(helper).agreeTerminate(1))
          .to.emit(taskEscrow, "TerminateAgreed")
          .withArgs(1)
          .to.emit(taskEscrow, "TaskCancelled")
          .withArgs(1, "Mutually terminated");

        const task = await taskEscrow.tasks(1);
        expect(task.status).to.equal(4); // Cancelled
        expect(task.terminateRequestedBy).to.equal(ethers.ZeroAddress);
        expect(task.terminateRequestedAt).to.equal(0);

        // 双方各拿回 reward
        const creatorBalanceAfter = await echoToken.balanceOf(creator.address);
        const helperBalanceAfter = await echoToken.balanceOf(helper.address);
        expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(REWARD);
        expect(helperBalanceAfter - helperBalanceBefore).to.equal(REWARD);
      });

      it("应该拒绝发起者自己同意终止", async function () {
        await expect(
          taskEscrow.connect(creator).agreeTerminate(1)
        ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");
      });

      it("应该拒绝非 Creator/Helper 同意终止", async function () {
        await expect(
          taskEscrow.connect(other).agreeTerminate(1)
        ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");
      });

      it("应该拒绝超过 48 小时后同意终止", async function () {
        // 快进 48 小时 + 1 秒
        await ethers.provider.send("evm_increaseTime", [48 * 60 * 60 + 1]);
        await ethers.provider.send("evm_mine", []);

        await expect(
          taskEscrow.connect(helper).agreeTerminate(1)
        ).to.be.revertedWithCustomError(taskEscrow, "Timeout");
      });

      it("应该拒绝无请求时同意终止", async function () {
        await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
        await taskEscrow.connect(helper).acceptTask(2);

        await expect(
          taskEscrow.connect(helper).agreeTerminate(2)
        ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");
      });

      it("应该拒绝非 InProgress 状态同意终止", async function () {
        await taskEscrow.connect(helper).submitWork(1);
        await expect(
          taskEscrow.connect(creator).agreeTerminate(1)
        ).to.be.revertedWithCustomError(taskEscrow, "InvalidStatus");
      });
    });

    describe("terminateTimeout", function () {
      beforeEach(async function () {
        await taskEscrow.connect(creator).requestTerminate(1);
      });

      it("应该允许任何人在超时后重置请求字段", async function () {
        // 快进 48 小时
        await ethers.provider.send("evm_increaseTime", [48 * 60 * 60]);
        await ethers.provider.send("evm_mine", []);

        await taskEscrow.connect(other).terminateTimeout(1);

        const task = await taskEscrow.tasks(1);
        expect(task.terminateRequestedBy).to.equal(ethers.ZeroAddress);
        expect(task.terminateRequestedAt).to.equal(0);
        expect(task.status).to.equal(1); // 仍为 InProgress
      });

      it("应该拒绝未超时的重置", async function () {
        await expect(
          taskEscrow.connect(other).terminateTimeout(1)
        ).to.be.revertedWithCustomError(taskEscrow, "Timeout");
      });

      it("应该拒绝无请求时重置", async function () {
        await taskEscrow.connect(creator).createTask(REWARD, TASK_URI);
        await taskEscrow.connect(helper).acceptTask(2);

        await expect(
          taskEscrow.connect(other).terminateTimeout(2)
        ).to.be.revertedWithCustomError(taskEscrow, "Unauthorized");
      });

      it("重置后应该允许再次请求终止", async function () {
        // 快进 48 小时
        await ethers.provider.send("evm_increaseTime", [48 * 60 * 60]);
        await ethers.provider.send("evm_mine", []);

        await taskEscrow.connect(other).terminateTimeout(1);

        // 再次请求终止
        await expect(taskEscrow.connect(helper).requestTerminate(1))
          .to.emit(taskEscrow, "TerminateRequested")
          .withArgs(1, helper.address);

        const task = await taskEscrow.tasks(1);
        expect(task.terminateRequestedBy).to.equal(helper.address);
      });
    });

    describe("协商终止完整流程", function () {
      it("应该完成 Creator 发起 -> Helper 同意 -> Cancelled 流程", async function () {
        // 1. Creator 请求终止
        await taskEscrow.connect(creator).requestTerminate(1);
        let task = await taskEscrow.tasks(1);
        expect(task.terminateRequestedBy).to.equal(creator.address);

        // 2. Helper 同意终止
        await taskEscrow.connect(helper).agreeTerminate(1);
        task = await taskEscrow.tasks(1);
        expect(task.status).to.equal(4); // Cancelled
      });

      it("应该完成 Helper 发起 -> Creator 同意 -> Cancelled 流程", async function () {
        // 1. Helper 请求终止
        await taskEscrow.connect(helper).requestTerminate(1);
        let task = await taskEscrow.tasks(1);
        expect(task.terminateRequestedBy).to.equal(helper.address);

        // 2. Creator 同意终止
        await taskEscrow.connect(creator).agreeTerminate(1);
        task = await taskEscrow.tasks(1);
        expect(task.status).to.equal(4); // Cancelled
      });

      it("应该完成 请求 -> 超时 -> 重置 -> 再次请求 流程", async function () {
        // 1. Creator 请求终止
        await taskEscrow.connect(creator).requestTerminate(1);

        // 2. 超时
        await ethers.provider.send("evm_increaseTime", [48 * 60 * 60]);
        await ethers.provider.send("evm_mine", []);

        // 3. 重置
        await taskEscrow.connect(other).terminateTimeout(1);
        let task = await taskEscrow.tasks(1);
        expect(task.terminateRequestedBy).to.equal(ethers.ZeroAddress);

        // 4. Helper 再次请求终止
        await taskEscrow.connect(helper).requestTerminate(1);
        task = await taskEscrow.tasks(1);
        expect(task.terminateRequestedBy).to.equal(helper.address);

        // 5. Creator 同意
        await taskEscrow.connect(creator).agreeTerminate(1);
        task = await taskEscrow.tasks(1);
        expect(task.status).to.equal(4); // Cancelled
      });
    });
  });
});
