import { ethers } from "hardhat";

async function main() {
  console.log("🔍 检查任务 #1 和 #2 的链上状态");
  console.log("=====================================");
  
  // 从部署文件读取当前合约地址
  const fs = require('fs');
  let deploymentData;
  try {
    deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
    console.log("📋 从 deployment.json 读取合约地址:");
    console.log(`   TaskEscrow: ${deploymentData.TaskEscrow}`);
    console.log(`   ProfileService: ${deploymentData.ProfileService}`);
  } catch (error) {
    console.log("⚠️ 无法读取 deployment.json，使用默认地址");
  }
  
  const TaskEscrowAddress = deploymentData?.TaskEscrow || "0xA7c59f010700930003b33aB25a7a0679C860f29c";
  
  try {
    const TaskEscrow = await ethers.getContractAt("TaskEscrow", TaskEscrowAddress);
    
    // 检查 taskCounter
    const taskCounter = await TaskEscrow.taskCounter();
    console.log(`\n📊 当前 TaskCounter: ${taskCounter}`);
    
    if (Number(taskCounter) < 2) {
      console.log("❌ TaskCounter 小于 2，任务 #1 和 #2 不存在");
      return;
    }
    
    // 检查任务 #1
    console.log("\n🔍 检查任务 #1:");
    try {
      const task1 = await TaskEscrow.tasks(1);
      console.log("✅ 任务 #1 存在:");
      console.log(`   Creator: ${task1.creator}`);
      console.log(`   Helper: ${task1.helper}`);
      console.log(`   Reward: ${ethers.formatEther(task1.reward)} ECHO`);
      console.log(`   Status: ${task1.status} (${getStatusName(Number(task1.status))})`);
      console.log(`   TaskURI: ${task1.taskURI}`);
      console.log(`   Created At: ${new Date(Number(task1.createdAt) * 1000).toLocaleString()}`);
      console.log(`   PostFee: ${ethers.formatEther(task1.echoPostFee)} ECHO`);
      
      // 检查是否过期
      const now = Math.floor(Date.now() / 1000);
      const deadline = Number(task1.deadline);
      if (deadline > 0 && now > deadline) {
        console.log(`   ⚠️ 任务已过期 (deadline: ${new Date(deadline * 1000).toLocaleString()})`);
      }
      
    } catch (error) {
      console.log("❌ 任务 #1 读取失败:");
      console.log(`   错误: ${error}`);
    }
    
    // 检查任务 #2
    console.log("\n🔍 检查任务 #2:");
    try {
      const task2 = await TaskEscrow.tasks(2);
      console.log("✅ 任务 #2 存在:");
      console.log(`   Creator: ${task2.creator}`);
      console.log(`   Helper: ${task2.helper}`);
      console.log(`   Reward: ${ethers.formatEther(task2.reward)} ECHO`);
      console.log(`   Status: ${task2.status} (${getStatusName(Number(task2.status))})`);
      console.log(`   TaskURI: ${task2.taskURI}`);
      console.log(`   Created At: ${new Date(Number(task2.createdAt) * 1000).toLocaleString()}`);
      console.log(`   PostFee: ${ethers.formatEther(task2.echoPostFee)} ECHO`);
      
      // 检查是否过期
      const now = Math.floor(Date.now() / 1000);
      const deadline = Number(task2.deadline);
      if (deadline > 0 && now > deadline) {
        console.log(`   ⚠️ 任务已过期 (deadline: ${new Date(deadline * 1000).toLocaleString()})`);
      }
      
    } catch (error) {
      console.log("❌ 任务 #2 读取失败:");
      console.log(`   错误: ${error}`);
    }
    
    // 检查任务 #0 (不应该存在)
    console.log("\n🔍 检查任务 #0 (不应该存在):");
    try {
      const task0 = await TaskEscrow.tasks(0);
      console.log("⚠️ 任务 #0 存在 (异常):");
      console.log(`   Creator: ${task0.creator}`);
      console.log(`   Status: ${task0.status} (${getStatusName(Number(task0.status))})`);
      console.log(`   TaskURI: ${task0.taskURI}`);
    } catch (error) {
      console.log("✅ 任务 #0 不存在 (正常)");
    }
    
    // 查询所有 TaskCreated 事件
    console.log("\n🔍 查询所有 TaskCreated 事件:");
    const currentBlock = await ethers.provider.getBlockNumber();
    const filter = TaskEscrow.filters.TaskCreated();
    
    const events = await TaskEscrow.queryFilter(filter, 0, currentBlock);
    console.log(`📋 找到 ${events.length} 个 TaskCreated 事件:`);
    
    const creator1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    
    events.forEach((event, index) => {
      const taskId = event.args?.[0];
      const creator = event.args?.[1];
      const reward = event.args?.[2];
      
      console.log(`   事件 ${index + 1}:`);
      console.log(`     TaskId: ${taskId}`);
      console.log(`     Creator: ${creator}`);
      console.log(`     Reward: ${ethers.formatEther(reward || 0)} ECHO`);
      console.log(`     区块: ${event.blockNumber}`);
      console.log(`     交易: ${event.transactionHash}`);
      
      if (creator?.toLowerCase() === creator1.toLowerCase()) {
        console.log(`     ✅ 这是 Creator1 创建的任务`);
      }
    });
    
    // 检查前端地址配置
    console.log("\n🔍 检查前端合约地址配置:");
    try {
      const frontendAddresses = fs.readFileSync('frontend/src/contracts/addresses.ts', 'utf8');
      console.log("前端地址配置内容:");
      console.log(frontendAddresses);
    } catch (error) {
      console.log("无法读取前端地址配置文件");
    }
    
  } catch (error) {
    console.error("❌ 检查失败:", error);
  }
}

function getStatusName(status: number): string {
  const statusNames = {
    0: "Open",
    1: "InProgress", 
    2: "Submitted",
    3: "Completed",
    4: "Cancelled"
  };
  return statusNames[status as keyof typeof statusNames] || "Unknown";
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});