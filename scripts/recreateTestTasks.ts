import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🔧 重新创建测试任务");
  console.log("=====================================");
  
  // 读取部署信息
  const deploymentData = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
  const contracts = deploymentData.localhost.contracts;
  
  // 获取账户
  const [deployer, creator1, helper1, creator2, helper2] = await ethers.getSigners();
  
  // 连接合约
  const echoToken = await ethers.getContractAt("EOCHOToken", contracts.EOCHOToken.address);
  const taskEscrow = await ethers.getContractAt("TaskEscrow", contracts.TaskEscrow.address);
  
  console.log("📝 创建 Task1 (Creator1 → Helper1)...");
  
  // Creator1 创建 Task1
  const task1URI = "task1-test-uri";
  const reward1 = ethers.parseEther("10"); // 10 ECHO
  const postFee1 = ethers.parseEther("10"); // 10 ECHO
  
  // Creator1 approve
  await echoToken.connect(creator1).approve(taskEscrow.target, reward1 + postFee1);
  
  // 创建任务
  await taskEscrow.connect(creator1).createTask(
    reward1,
    task1URI
  );
  
  console.log("✅ Task1 创建成功");
  
  // Helper1 接受任务
  console.log("📝 Helper1 接受 Task1...");
  const deposit1 = ethers.parseEther("10"); // 10 ECHO 押金
  await echoToken.connect(helper1).approve(taskEscrow.target, deposit1);
  await taskEscrow.connect(helper1).acceptTask(1);
  console.log("✅ Helper1 接受 Task1 成功");
  
  // Helper1 提交工作
  console.log("📝 Helper1 提交 Task1 工作...");
  await taskEscrow.connect(helper1).submitWork(1);
  console.log("✅ Helper1 提交工作成功");
  
  // Creator1 确认完成
  console.log("📝 Creator1 确认 Task1 完成...");
  await taskEscrow.connect(creator1).confirmComplete(1);
  console.log("✅ Task1 完成！");
  
  // 创建 Task2 (Creator1 创建，保持开放状态)
  console.log("\n📝 创建 Task2 (Creator1，保持开放)...");
  const task2URI = "task2-test-uri";
  const reward2 = ethers.parseEther("15"); // 15 ECHO
  const postFee2 = ethers.parseEther("15"); // 15 ECHO
  
  await echoToken.connect(creator1).approve(taskEscrow.target, reward2 + postFee2);
  await taskEscrow.connect(creator1).createTask(
    reward2,
    task2URI
  );
  console.log("✅ Task2 创建成功 (保持开放状态)");
  
  // 检查任务状态
  console.log("\n📊 任务状态检查:");
  const taskCounter = await taskEscrow.taskCounter();
  console.log(`   任务总数: ${taskCounter}`);
  
  for (let i = 1; i <= Number(taskCounter); i++) {
    const task = await taskEscrow.tasks(i);
    const statusNames = ['Open', 'InProgress', 'Submitted', 'Completed', 'Terminated'];
    console.log(`   Task${i}: ${statusNames[Number(task.status)]} (Creator: ${task.creator.slice(0,8)}...)`);
  }
  
  // 检查余额
  console.log("\n💰 账户余额检查:");
  const creator1Balance = await echoToken.balanceOf(creator1.address);
  const helper1Balance = await echoToken.balanceOf(helper1.address);
  const creator2Balance = await echoToken.balanceOf(creator2.address);
  const helper2Balance = await echoToken.balanceOf(helper2.address);
  
  console.log(`   Creator1: ${ethers.formatEther(creator1Balance)} ECHO`);
  console.log(`   Helper1:  ${ethers.formatEther(helper1Balance)} ECHO`);
  console.log(`   Creator2: ${ethers.formatEther(creator2Balance)} ECHO`);
  console.log(`   Helper2:  ${ethers.formatEther(helper2Balance)} ECHO`);
  
  console.log("\n🎯 测试环境准备完成！");
  console.log("=====================================");
  console.log("现在你可以：");
  console.log("1. 用 Creator2 创建 Task3 (跨链奖励任务)");
  console.log("2. 用 Helper2 测试跨链奖励功能");
  console.log("3. 前端应该正确显示所有任务历史");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});