/**
 * 详细调试 confirmComplete 方法的执行过程
 */

import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🔍 详细调试 confirmComplete 执行过程...");
  console.log("=".repeat(60));

  // 读取部署信息
  const deploymentPath = "./deployment.json";
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contracts = deploymentData.localhost.contracts;

  // 获取合约实例
  const [deployer, creator, helper] = await ethers.getSigners();
  
  const echoToken = await ethers.getContractAt("EOCHOToken", contracts.EOCHOToken.address);
  const register = await ethers.getContractAt("Register", contracts.Register.address);
  const taskEscrow = await ethers.getContractAt("TaskEscrow", contracts.TaskEscrow.address);

  // 确保账户注册
  const isCreatorRegistered = await register.isRegistered(creator.address);
  const isHelperRegistered = await register.isRegistered(helper.address);
  
  if (!isCreatorRegistered) {
    await register.connect(creator).register("ipfs://creator-profile");
    console.log("✓ Creator 注册完成");
  }
  
  if (!isHelperRegistered) {
    await register.connect(helper).register("ipfs://helper-profile");
    console.log("✓ Helper 注册完成");
  }

  // 创建并完成任务到 Submitted 状态
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

  // 获取任务详细信息
  const task = await taskEscrow.tasks(taskId);
  console.log("");
  console.log("📋 任务详细信息（confirmComplete 前）：");
  console.log(`taskId: ${task.taskId}`);
  console.log(`creator: ${task.creator}`);
  console.log(`helper: ${task.helper}`);
  console.log(`reward: ${ethers.formatEther(task.reward)} ECHO`);
  console.log(`echoPostFee: ${ethers.formatEther(task.echoPostFee)} ECHO`);
  console.log(`status: ${task.status}`); // 应该是 3 (Submitted)
  console.log("");

  // 计算期望的转账金额（模拟合约内部计算）
  const rewardValue = task.reward;
  const postFeeValue = task.echoPostFee;
  const FEE_BPS = 200n; // 2%
  
  const fee = (rewardValue * FEE_BPS) / 10000n;
  const helperReward = rewardValue - fee;
  const totalHelperPayout = helperReward + rewardValue + postFeeValue;

  console.log("🧮 期望计算结果：");
  console.log(`reward: ${ethers.formatEther(rewardValue)} ECHO`);
  console.log(`postFee: ${ethers.formatEther(postFeeValue)} ECHO`);
  console.log(`fee (2%): ${ethers.formatEther(fee)} ECHO`);
  console.log(`helperReward (98%): ${ethers.formatEther(helperReward)} ECHO`);
  console.log(`totalHelperPayout: ${ethers.formatEther(totalHelperPayout)} ECHO`);
  console.log(`  = helperReward(${ethers.formatEther(helperReward)}) + deposit(${ethers.formatEther(rewardValue)}) + postFee(${ethers.formatEther(postFeeValue)})`);
  console.log("");

  // 记录执行前余额
  const helperBefore = await echoToken.balanceOf(helper.address);
  const contractBefore = await echoToken.balanceOf(taskEscrow.target);
  
  console.log("💰 执行前余额：");
  console.log(`Helper: ${ethers.formatEther(helperBefore)} ECHO`);
  console.log(`Contract: ${ethers.formatEther(contractBefore)} ECHO`);
  console.log("");

  // 执行 confirmComplete 并监听事件
  console.log("🎯 执行 confirmComplete...");
  
  const confirmTx = await taskEscrow.connect(creator).confirmComplete(taskId);
  const receipt = await confirmTx.wait();
  
  console.log(`✓ 交易成功，gas used: ${receipt.gasUsed}`);
  console.log("");

  // 解析事件
  console.log("📡 交易事件：");
  for (const log of receipt.logs) {
    try {
      const parsedLog = taskEscrow.interface.parseLog({
        topics: log.topics,
        data: log.data
      });
      if (parsedLog) {
        console.log(`Event: ${parsedLog.name}`);
        console.log(`Args:`, parsedLog.args);
      }
    } catch (e) {
      // 可能是其他合约的事件，跳过
    }
  }
  console.log("");

  // 记录执行后余额
  const helperAfter = await echoToken.balanceOf(helper.address);
  const contractAfter = await echoToken.balanceOf(taskEscrow.target);
  
  console.log("💰 执行后余额：");
  console.log(`Helper: ${ethers.formatEther(helperAfter)} ECHO`);
  console.log(`Contract: ${ethers.formatEther(contractAfter)} ECHO`);
  console.log("");

  // 计算实际转账金额
  const actualHelperGain = helperAfter - helperBefore;
  const actualContractChange = contractAfter - contractBefore;
  
  console.log("📊 实际结果 vs 期望：");
  console.log(`Helper 实际收到: ${ethers.formatEther(actualHelperGain)} ECHO`);
  console.log(`Helper 期望收到: ${ethers.formatEther(totalHelperPayout)} ECHO`);
  console.log(`差额: ${ethers.formatEther(totalHelperPayout - actualHelperGain)} ECHO`);
  console.log("");
  console.log(`Contract 实际变化: ${ethers.formatEther(actualContractChange)} ECHO`);
  console.log(`Contract 期望变化: ${ethers.formatEther(-contractBefore)} ECHO (应该清空)`);
  console.log("");

  // 检查任务状态
  const taskAfter = await taskEscrow.tasks(taskId);
  console.log("📋 任务状态（confirmComplete 后）：");
  console.log(`status: ${taskAfter.status}`); // 应该是 4 (Completed)
  console.log(`echoPostFee: ${ethers.formatEther(taskAfter.echoPostFee)} ECHO`);
  console.log("");

  // 分析问题
  if (actualHelperGain < totalHelperPayout) {
    const missingAmount = totalHelperPayout - actualHelperGain;
    console.log("❌ 发现问题！");
    console.log(`缺失金额: ${ethers.formatEther(missingAmount)} ECHO`);
    
    if (missingAmount === postFeeValue) {
      console.log("🎯 问题确认：postFee 未发放！");
      console.log("");
      console.log("🔍 可能的原因：");
      console.log("1. confirmComplete 中的 totalHelperPayout 计算有误");
      console.log("2. transfer 调用失败但没有 revert");
      console.log("3. postFee 在计算前被意外修改");
      console.log("4. 存在其他资金流出路径");
    } else {
      console.log(`🤔 缺失金额 ${ethers.formatEther(missingAmount)} 不等于 postFee ${ethers.formatEther(postFeeValue)}`);
    }
  } else {
    console.log("✅ 金额正确！postFee 已正确发放");
  }

  console.log("");
  console.log("🔍 详细调试完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });