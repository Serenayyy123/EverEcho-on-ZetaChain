/**
 * 追踪 PostFee 执行的每一步
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🔍 追踪 PostFee 执行过程");
  console.log("=".repeat(50));

  // 获取账户
  const [deployer, creator, helper] = await ethers.getSigners();
  
  // 部署合约
  const EOCHOTokenFactory = await ethers.getContractFactory("EOCHOToken");
  const echoToken = await EOCHOTokenFactory.deploy();
  await echoToken.waitForDeployment();

  const RegisterFactory = await ethers.getContractFactory("Register");
  const register = await RegisterFactory.deploy(echoToken.target);
  await register.waitForDeployment();

  await echoToken.setRegisterAddress(register.target);

  const TaskEscrowFactory = await ethers.getContractFactory("TaskEscrow");
  const taskEscrow = await TaskEscrowFactory.deploy(echoToken.target, register.target);
  await taskEscrow.waitForDeployment();

  await echoToken.setTaskEscrowAddress(taskEscrow.target);

  // 注册账户
  await register.connect(creator).register("ipfs://creator-profile");
  await register.connect(helper).register("ipfs://helper-profile");

  console.log("✓ 合约部署和账户注册完成");
  console.log("");

  // 执行任务流程到 Submitted 状态
  const reward = ethers.parseEther("10");
  const totalRequired = reward + ethers.parseEther("10"); // reward + postFee

  await echoToken.connect(creator).approve(taskEscrow.target, totalRequired);
  const createTx = await taskEscrow.connect(creator).createTask(reward, "ipfs://test-task");
  const taskCounter = await taskEscrow.taskCounter();
  const taskId = Number(taskCounter);

  await echoToken.connect(helper).approve(taskEscrow.target, reward);
  await taskEscrow.connect(helper).acceptTask(taskId);
  await taskEscrow.connect(helper).submitWork(taskId);

  console.log(`✓ 任务 ${taskId} 已到达 Submitted 状态`);
  console.log("");

  // 获取执行前的详细状态
  const taskBefore = await taskEscrow.tasks(taskId);
  const helperBalanceBefore = await echoToken.balanceOf(helper.address);
  const contractBalanceBefore = await echoToken.balanceOf(taskEscrow.target);

  console.log("📋 执行前状态：");
  console.log(`Task reward: ${ethers.formatEther(taskBefore.reward)} ECHO`);
  console.log(`Task echoPostFee: ${ethers.formatEther(taskBefore.echoPostFee)} ECHO`);
  console.log(`Task status: ${taskBefore.status}`);
  console.log(`Helper balance: ${ethers.formatEther(helperBalanceBefore)} ECHO`);
  console.log(`Contract balance: ${ethers.formatEther(contractBalanceBefore)} ECHO`);
  console.log("");

  // 手动计算期望的转账金额
  const rewardValue = taskBefore.reward;
  const postFeeValue = taskBefore.echoPostFee;
  const FEE_BPS = 200n;
  
  const fee = (rewardValue * FEE_BPS) / 10000n;
  const helperReward = rewardValue - fee;
  const expectedTotalPayout = helperReward + rewardValue + postFeeValue;

  console.log("🧮 期望计算：");
  console.log(`reward: ${ethers.formatEther(rewardValue)} ECHO`);
  console.log(`postFee: ${ethers.formatEther(postFeeValue)} ECHO`);
  console.log(`fee (2%): ${ethers.formatEther(fee)} ECHO`);
  console.log(`helperReward (98%): ${ethers.formatEther(helperReward)} ECHO`);
  console.log(`expectedTotalPayout: ${ethers.formatEther(expectedTotalPayout)} ECHO`);
  console.log(`  = helperReward(${ethers.formatEther(helperReward)}) + deposit(${ethers.formatEther(rewardValue)}) + postFee(${ethers.formatEther(postFeeValue)})`);
  console.log("");

  // 执行 confirmComplete 并捕获详细信息
  console.log("🎯 执行 confirmComplete...");
  
  try {
    const confirmTx = await taskEscrow.connect(creator).confirmComplete(taskId);
    const receipt = await confirmTx.wait();
    
    console.log(`✓ 交易成功，gas used: ${receipt.gasUsed}`);
    
    // 解析事件
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === taskEscrow.target.toString().toLowerCase()) {
          const parsedLog = taskEscrow.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (parsedLog && parsedLog.name === 'TaskCompleted') {
            console.log(`📡 TaskCompleted 事件:`);
            console.log(`  taskId: ${parsedLog.args[0]}`);
            console.log(`  helperReceived: ${ethers.formatEther(parsedLog.args[1])} ECHO`);
            console.log(`  feeBurned: ${ethers.formatEther(parsedLog.args[2])} ECHO`);
          }
        } else if (log.address.toLowerCase() === echoToken.target.toString().toLowerCase()) {
          const parsedLog = echoToken.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (parsedLog) {
            console.log(`📡 ECHO 事件: ${parsedLog.name}`);
            if (parsedLog.name === 'Transfer') {
              console.log(`  from: ${parsedLog.args[0]}`);
              console.log(`  to: ${parsedLog.args[1]}`);
              console.log(`  value: ${ethers.formatEther(parsedLog.args[2])} ECHO`);
            }
          }
        }
      } catch (e) {
        // 跳过无法解析的事件
      }
    }
  } catch (error) {
    console.error("❌ confirmComplete 执行失败:", error);
    return;
  }
  console.log("");

  // 获取执行后的状态
  const taskAfter = await taskEscrow.tasks(taskId);
  const helperBalanceAfter = await echoToken.balanceOf(helper.address);
  const contractBalanceAfter = await echoToken.balanceOf(taskEscrow.target);

  console.log("📋 执行后状态：");
  console.log(`Task echoPostFee: ${ethers.formatEther(taskAfter.echoPostFee)} ECHO`);
  console.log(`Task status: ${taskAfter.status}`);
  console.log(`Helper balance: ${ethers.formatEther(helperBalanceAfter)} ECHO`);
  console.log(`Contract balance: ${ethers.formatEther(contractBalanceAfter)} ECHO`);
  console.log("");

  // 计算实际变化
  const actualHelperGain = helperBalanceAfter - helperBalanceBefore;
  const actualContractChange = contractBalanceAfter - contractBalanceBefore;

  console.log("📊 实际变化：");
  console.log(`Helper 实际收到: ${ethers.formatEther(actualHelperGain)} ECHO`);
  console.log(`Helper 期望收到: ${ethers.formatEther(expectedTotalPayout)} ECHO`);
  console.log(`差额: ${ethers.formatEther(expectedTotalPayout - actualHelperGain)} ECHO`);
  console.log(`Contract 变化: ${ethers.formatEther(actualContractChange)} ECHO`);
  console.log("");

  // 分析问题
  if (actualHelperGain < expectedTotalPayout) {
    const missingAmount = expectedTotalPayout - actualHelperGain;
    console.log("❌ 发现问题！");
    console.log(`缺失金额: ${ethers.formatEther(missingAmount)} ECHO`);
    
    if (missingAmount === postFeeValue) {
      console.log("🎯 确认：postFee 未发放！");
    } else if (missingAmount === rewardValue) {
      console.log("🎯 确认：押金未返还！");
    } else if (missingAmount === helperReward) {
      console.log("🎯 确认：helperReward 未发放！");
    } else {
      console.log("🤔 缺失金额不匹配任何单项");
    }
    
    console.log("");
    console.log("🔍 可能的原因分析：");
    console.log("1. totalHelperPayout 计算错误");
    console.log("2. transfer 调用参数错误");
    console.log("3. 合约余额不足");
    console.log("4. 存在其他资金流出");
  } else {
    console.log("✅ 金额正确！");
  }

  console.log("");
  console.log("🔍 追踪完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });