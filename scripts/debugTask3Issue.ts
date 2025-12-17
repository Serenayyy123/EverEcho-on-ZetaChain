import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Task3 数据问题诊断");
  console.log("=====================================");
  
  // 读取部署信息
  const fs = require('fs');
  const deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
  const TaskEscrowAddress = deploymentData.localhost.contracts.TaskEscrow.address;
  
  console.log(`📋 TaskEscrow 地址: ${TaskEscrowAddress}`);
  
  // 连接合约
  const TaskEscrow = await ethers.getContractAt("TaskEscrow", TaskEscrowAddress);
  
  // 检查任务总数
  const taskCounter = await TaskEscrow.taskCounter();
  console.log(`📊 链上任务总数: ${taskCounter}`);
  
  // 检查所有任务
  for (let i = 1; i <= Number(taskCounter); i++) {
    console.log(`\n📝 Task ${i}:`);
    try {
      const task = await TaskEscrow.tasks(i);
      console.log(`   Creator: ${task.creator}`);
      console.log(`   Helper: ${task.helper}`);
      console.log(`   Reward: ${ethers.formatEther(task.reward)} ECHO`);
      console.log(`   Status: ${task.status} (${getStatusName(Number(task.status))})`);
      console.log(`   TaskURI: ${task.taskURI}`);
      console.log(`   CreatedAt: ${new Date(Number(task.createdAt) * 1000).toLocaleString()}`);
      
      // 检查跨链奖励字段
      if (task.rewardAsset && task.rewardAsset !== ethers.ZeroAddress) {
        console.log(`   🌉 跨链奖励资产: ${task.rewardAsset}`);
        console.log(`   🌉 跨链奖励数量: ${ethers.formatEther(task.rewardAmount)}`);
      }
    } catch (error) {
      console.log(`   ❌ 读取失败: ${error.message}`);
    }
  }
  
  // 检查测试账户地址
  console.log("\n👥 测试账户地址:");
  const accounts = await ethers.getSigners();
  console.log(`   Creator1: ${accounts[1].address}`);
  console.log(`   Helper1:  ${accounts[2].address}`);
  console.log(`   Creator2: ${accounts[3].address}`);
  console.log(`   Helper2:  ${accounts[4].address}`);
  
  // 检查最新任务的详细信息
  if (Number(taskCounter) >= 3) {
    console.log("\n🔍 Task3 详细检查:");
    const task3 = await TaskEscrow.tasks(3);
    
    // 检查是否是Creator2创建的
    const creator2Address = accounts[3].address;
    if (task3.creator.toLowerCase() === creator2Address.toLowerCase()) {
      console.log("✅ Task3 确实由 Creator2 创建");
    } else {
      console.log(`❌ Task3 创建者不匹配: 期望 ${creator2Address}, 实际 ${task3.creator}`);
    }
    
    // 检查跨链奖励设置
    if (task3.rewardAsset && task3.rewardAsset !== ethers.ZeroAddress) {
      console.log("✅ Task3 设置了跨链奖励");
      
      // 检查Gateway中的奖励存款
      const GatewayAddress = deploymentData.localhost.contracts.EverEchoGateway.address;
      const Gateway = await ethers.getContractAt("EverEchoGateway", GatewayAddress);
      
      try {
        const deposit = await Gateway.deposits(3);
        console.log(`   Gateway存款状态:`);
        console.log(`   - 资产地址: ${deposit.asset}`);
        console.log(`   - 存款数量: ${ethers.formatEther(deposit.amount)}`);
        console.log(`   - 已领取: ${deposit.claimed}`);
      } catch (error) {
        console.log(`   ❌ Gateway存款检查失败: ${error.message}`);
      }
    } else {
      console.log("ℹ️ Task3 未设置跨链奖励");
    }
  }
  
  // 检查后端API数据
  console.log("\n🔗 检查后端API数据:");
  try {
    const response = await fetch('http://localhost:3001/api/tasks');
    if (response.ok) {
      const tasks = await response.json();
      console.log(`   后端任务数量: ${tasks.length}`);
      
      const task3Backend = tasks.find(t => t.taskId === '3');
      if (task3Backend) {
        console.log(`   Task3 后端数据存在:`);
        console.log(`   - 标题: ${task3Backend.title}`);
        console.log(`   - 创建者: ${task3Backend.creator}`);
        console.log(`   - 状态: ${task3Backend.status}`);
      } else {
        console.log(`   ❌ Task3 后端数据不存在`);
      }
    } else {
      console.log(`   ❌ 后端API请求失败: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ 后端API连接失败: ${error.message}`);
  }
}

function getStatusName(status: number): string {
  const statusNames = ['Open', 'InProgress', 'Submitted', 'Completed', 'Terminated'];
  return statusNames[status] || 'Unknown';
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});