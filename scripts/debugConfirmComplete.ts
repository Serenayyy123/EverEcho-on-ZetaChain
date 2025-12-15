/**
 * 调试 confirmComplete 交易
 */

import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🔍 调试 confirmComplete");
  
  // 读取部署信息
  const deploymentData = JSON.parse(fs.readFileSync("./deployment.json", "utf8"));
  const contracts = deploymentData.localhost.contracts;

  // 获取合约实例
  const [deployer, creator, helper] = await ethers.getSigners();
  
  const echoToken = await ethers.getContractAt("EOCHOToken", contracts.EOCHOToken.address);
  const register = await ethers.getContractAt("Register", contracts.Register.address);
  const taskEscrow = await ethers.getContractAt("TaskEscrow", contracts.TaskEscrow.address);

  // 检查用户注册状态
  const creatorRegistered = await register.isRegistered(creator.address);
  const helperRegistered = await register.isRegistered(helper.address);
  
  if (!creatorRegistered) {
    await register.connect(creator).register("ipfs://creator");
  }
  if (!helperRegistered) {
    await register.connect(helper).register("ipfs://helper");
  }
  
  // 给 deployer 注册并 mint ECHO
  const deployerRegistered = await register.isRegistered(deployer.address);
  if (!deployerRegistered) {
    await register.connect(deployer).register("ipfs://deployer");
    console.log("✓ Deployer 注册并获得 100 ECHO");
  }
  
  // 给 Creator 一些 ECHO（从 deployer 转账）
  const creatorBalance = await echoToken.balanceOf(creator.address);
  if (creatorBalance < ethers.parseEther("50")) {
    await echoToken.connect(deployer).transfer(creator.address, ethers.parseEther("50"));
    console.log("✓ 给 Creator 转账 50 ECHO");
  }

  // 记录初始余额
  const creatorInitial = await echoToken.balanceOf(creator.address);
  const helperInitial = await echoToken.balanceOf(helper.address);
  
  console.log(`Creator 初始余额: ${ethers.formatEther(creatorInitial)} ECHO`);
  console.log(`Helper 初始余额: ${ethers.formatEther(helperInitial)} ECHO`);

  // 创建任务
  const reward = ethers.parseEther("10");
  const postFee = ethers.parseEther("10");
  const totalRequired = reward + postFee;
  
  await echoToken.connect(creator).approve(taskEscrow.target, totalRequired);
  await taskEscrow.connect(creator).createTask(reward, "ipfs://test-task");
  
  const taskCounter = await taskEscrow.taskCounter();
  const taskId = Number(taskCounter);
  console.log(`✓ 创建任务 ${taskId}`);

  // Helper 接受任务
  await echoToken.connect(helper).approve(taskEscrow.target, ethers.parseEther("10"));
  await taskEscrow.connect(helper).acceptTask(taskId);
  console.log(`✓ Helper 接受任务`);

  // Helper 提交工作
  await taskEscrow.connect(helper).submitWork(taskId);
  console.log(`✓ Helper 提交工作`);

  // 检查任务状态
  const taskBefore = await taskEscrow.tasks(taskId);
  console.log(`\n📊 confirmComplete 前任务状态：`);
  console.log(`reward: ${ethers.formatEther(taskBefore.reward)} ECHO`);
  console.log(`echoPostFee: ${ethers.formatEther(taskBefore.echoPostFee)} ECHO`);
  console.log(`helper: ${taskBefore.helper}`);
  console.log(`status: ${taskBefore.status}`);

  // 检查合约余额
  const contractBalanceBefore = await echoToken.balanceOf(taskEscrow.target);
  console.log(`合约余额: ${ethers.formatEther(contractBalanceBefore)} ECHO`);

  // Creator 确认完成 - 监听事件
  console.log("\n准备确认完成...");
  
  const filter = echoToken.filters.Transfer();
  const startBlock = await ethers.provider.getBlockNumber();
  
  try {
    const tx = await taskEscrow.connect(creator).confirmComplete(taskId);
    const receipt = await tx.wait();
    console.log(`✓ confirmComplete 交易成功，gas used: ${receipt.gasUsed}`);
    
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
    
  } catch (error) {
    console.error("❌ confirmComplete 失败:", error.message);
    return;
  }

  // 检查任务状态
  const taskAfter = await taskEscrow.tasks(taskId);
  console.log(`\n📊 confirmComplete 后任务状态：`);
  console.log(`echoPostFee: ${ethers.formatEther(taskAfter.echoPostFee)} ECHO`);
  console.log(`status: ${taskAfter.status}`);

  // 检查最终余额
  const creatorFinal = await echoToken.balanceOf(creator.address);
  const helperFinal = await echoToken.balanceOf(helper.address);
  const contractBalanceAfter = await echoToken.balanceOf(taskEscrow.target);
  
  const creatorSpent = creatorInitial - creatorFinal;
  const helperGained = helperFinal - helperInitial;
  
  console.log("\n📊 最终结果：");
  console.log(`Creator 支付: ${ethers.formatEther(creatorSpent)} ECHO`);
  console.log(`Helper 收益: ${ethers.formatEther(helperGained)} ECHO`);
  console.log(`合约余额: ${ethers.formatEther(contractBalanceAfter)} ECHO`);
  
  // 期望值
  console.log("\n📊 期望值：");
  console.log(`期望 Helper 收益: 29.8 ECHO (9.8 + 10 + 10)`);
  
  if (helperGained >= ethers.parseEther("29.8")) {
    console.log("✅ postFee 修复成功！");
  } else {
    console.log("❌ postFee 修复失败");
    console.log(`差额: ${ethers.formatEther(ethers.parseEther("29.8") - helperGained)} ECHO`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });