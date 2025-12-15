/**
 * 调试任务创建问题
 */

import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🔍 调试任务创建");
  
  // 读取部署信息
  const deploymentData = JSON.parse(fs.readFileSync("./deployment.json", "utf8"));
  const contracts = deploymentData.localhost.contracts;

  // 获取合约实例
  const [deployer, creator] = await ethers.getSigners();
  
  const echoToken = await ethers.getContractAt("EOCHOToken", contracts.EOCHOToken.address);
  const register = await ethers.getContractAt("Register", contracts.Register.address);
  const taskEscrow = await ethers.getContractAt("TaskEscrow", contracts.TaskEscrow.address);

  console.log("📋 合约地址：");
  console.log("TaskEscrow:", contracts.TaskEscrow.address);
  
  // 检查常量
  const taskPostFee = await taskEscrow.TASK_POST_FEE();
  console.log(`TASK_POST_FEE 常量: ${ethers.formatEther(taskPostFee)} ECHO`);
  
  // 检查 taskCounter
  const taskCounter = await taskEscrow.taskCounter();
  console.log(`当前 taskCounter: ${taskCounter}`);
  
  // 检查用户注册状态
  const isRegistered = await register.isRegistered(creator.address);
  console.log(`Creator 注册状态: ${isRegistered}`);
  
  if (!isRegistered) {
    await register.connect(creator).register("ipfs://creator");
    console.log("✓ Creator 注册完成");
  }

  // 创建任务前检查余额
  const balance = await echoToken.balanceOf(creator.address);
  console.log(`Creator 余额: ${ethers.formatEther(balance)} ECHO`);

  // 创建任务
  const reward = ethers.parseEther("10");
  const totalRequired = reward + taskPostFee;
  
  console.log(`准备创建任务，reward: ${ethers.formatEther(reward)} ECHO`);
  console.log(`总需要: ${ethers.formatEther(totalRequired)} ECHO`);
  
  await echoToken.connect(creator).approve(taskEscrow.target, totalRequired);
  console.log("✓ Approve 完成");
  
  const tx = await taskEscrow.connect(creator).createTask(reward, "ipfs://test-task");
  const receipt = await tx.wait();
  console.log("✓ 任务创建交易完成");
  
  const newTaskCounter = await taskEscrow.taskCounter();
  const taskId = Number(newTaskCounter);
  console.log(`新任务 ID: ${taskId}`);

  // 立即检查任务信息
  const task = await taskEscrow.tasks(taskId);
  console.log("\n📊 任务信息：");
  console.log(`taskId: ${task.taskId}`);
  console.log(`creator: ${task.creator}`);
  console.log(`reward: ${ethers.formatEther(task.reward)} ECHO`);
  console.log(`echoPostFee: ${ethers.formatEther(task.echoPostFee)} ECHO`);
  console.log(`status: ${task.status}`);
  console.log(`rewardAsset: ${task.rewardAsset}`);
  console.log(`rewardAmount: ${ethers.formatEther(task.rewardAmount)} ECHO`);
  
  if (task.echoPostFee === taskPostFee) {
    console.log("✅ echoPostFee 设置正确！");
  } else {
    console.log("❌ echoPostFee 设置错误！");
    console.log(`期望: ${ethers.formatEther(taskPostFee)}`);
    console.log(`实际: ${ethers.formatEther(task.echoPostFee)}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });