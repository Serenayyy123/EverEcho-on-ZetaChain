/**
 * 简单测试脚本：验证 postFee 修复
 */

import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🧪 测试 postFee 修复");
  
  // 读取部署信息
  const deploymentData = JSON.parse(fs.readFileSync("./deployment.json", "utf8"));
  const contracts = deploymentData.localhost.contracts;

  // 获取合约实例
  const [deployer, creator, helper] = await ethers.getSigners();
  
  const echoToken = await ethers.getContractAt("EOCHOToken", contracts.EOCHOToken.address);
  const register = await ethers.getContractAt("Register", contracts.Register.address);
  const taskEscrow = await ethers.getContractAt("TaskEscrow", contracts.TaskEscrow.address);

  console.log("📋 合约地址：");
  console.log("TaskEscrow:", contracts.TaskEscrow.address);
  console.log("");

  // 检查用户注册状态
  const creatorRegistered = await register.isRegistered(creator.address);
  const helperRegistered = await register.isRegistered(helper.address);
  
  if (!creatorRegistered) {
    await register.connect(creator).register("ipfs://creator");
  }
  if (!helperRegistered) {
    await register.connect(helper).register("ipfs://helper");
  }
  console.log("✓ 用户注册检查完成");

  // 记录初始余额
  const creatorInitial = await echoToken.balanceOf(creator.address);
  const helperInitial = await echoToken.balanceOf(helper.address);
  
  console.log(`Creator 初始余额: ${ethers.formatEther(creatorInitial)} ECHO`);
  console.log(`Helper 初始余额: ${ethers.formatEther(helperInitial)} ECHO`);

  // 创建任务
  const reward = ethers.parseEther("10");
  const totalRequired = reward + ethers.parseEther("10"); // reward + postFee
  
  await echoToken.connect(creator).approve(taskEscrow.target, totalRequired);
  await taskEscrow.connect(creator).createTask(reward, "ipfs://test-task");
  
  const taskId = 1;
  console.log(`✓ 创建任务 ${taskId}`);

  // 检查任务信息
  const task = await taskEscrow.tasks(taskId);
  console.log(`任务 reward: ${ethers.formatEther(task.reward)} ECHO`);
  console.log(`任务 echoPostFee: ${ethers.formatEther(task.echoPostFee)} ECHO`);

  // Helper 接受任务
  await echoToken.connect(helper).approve(taskEscrow.target, ethers.parseEther("10"));
  await taskEscrow.connect(helper).acceptTask(taskId);
  console.log(`✓ Helper 接受任务`);

  // Helper 提交工作
  await taskEscrow.connect(helper).submitWork(taskId);
  console.log(`✓ Helper 提交工作`);

  // Creator 确认完成
  console.log("准备确认完成...");
  
  // 监听 Transfer 事件
  const filter = echoToken.filters.Transfer();
  const startBlock = await ethers.provider.getBlockNumber();
  
  await taskEscrow.connect(creator).confirmComplete(taskId);
  console.log(`✓ Creator 确认完成`);

  // 检查 Transfer 事件
  const endBlock = await ethers.provider.getBlockNumber();
  const events = await echoToken.queryFilter(filter, startBlock, endBlock);
  
  console.log("\n📊 Transfer 事件：");
  for (const event of events) {
    const from = event.args[0];
    const to = event.args[1];
    const amount = event.args[2];
    
    console.log(`从 ${from} 到 ${to}: ${ethers.formatEther(amount)} ECHO`);
  }

  // 检查最终余额
  const creatorFinal = await echoToken.balanceOf(creator.address);
  const helperFinal = await echoToken.balanceOf(helper.address);
  
  const creatorSpent = creatorInitial - creatorFinal;
  const helperGained = helperFinal - helperInitial;
  
  console.log("\n📊 最终结果：");
  console.log(`Creator 支付: ${ethers.formatEther(creatorSpent)} ECHO`);
  console.log(`Helper 收益: ${ethers.formatEther(helperGained)} ECHO`);
  
  // 期望值
  console.log("\n📊 期望值：");
  console.log(`期望 Creator 支付: 20.0 ECHO`);
  console.log(`期望 Helper 收益: 29.8 ECHO (9.8 + 10 + 10)`);
  
  if (helperGained >= ethers.parseEther("29.8")) {
    console.log("✅ postFee 修复成功！");
  } else {
    console.log("❌ postFee 修复失败");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });