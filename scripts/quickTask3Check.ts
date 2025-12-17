import { ethers } from "hardhat";

async function main() {
  console.log("🔍 快速检查Task3问题");
  console.log("=====================================");
  
  // 使用正确的localhost部署地址
  const fs = require('fs');
  const deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
  const localhostContracts = deploymentData.localhost.contracts;
  
  console.log("📋 使用的合约地址:");
  console.log(`   TaskEscrow: ${localhostContracts.TaskEscrow.address}`);
  console.log(`   EverEchoGateway: ${localhostContracts.EverEchoGateway.address}`);
  
  // 连接到正确的合约
  const TaskEscrow = await ethers.getContractAt("TaskEscrow", localhostContracts.TaskEscrow.address);
  
  try {
    // 检查任务总数
    const taskCounter = await TaskEscrow.taskCounter();
    console.log(`📊 链上任务总数: ${taskCounter}`);
    
    if (Number(taskCounter) >= 3) {
      console.log("\n📝 Task3 详细信息:");
      const task3 = await TaskEscrow.tasks(3);
      
      console.log(`   Creator: ${task3.creator}`);
      console.log(`   Helper: ${task3.helper}`);
      console.log(`   Reward: ${ethers.formatEther(task3.reward)} ECHO`);
      console.log(`   Status: ${task3.status} (${getStatusName(Number(task3.status))})`);
      console.log(`   TaskURI: ${task3.taskURI}`);
      console.log(`   PostFee: ${ethers.formatEther(task3.echoPostFee)} ECHO`);
      
      // 检查跨链奖励
      if (task3.rewardAsset && task3.rewardAsset !== ethers.ZeroAddress) {
        console.log(`   🌉 跨链奖励资产: ${task3.rewardAsset}`);
        console.log(`   🌉 跨链奖励数量: ${ethers.formatEther(task3.rewardAmount)}`);
        
        // 检查Gateway存款
        const Gateway = await ethers.getContractAt("EverEchoGateway", localhostContracts.EverEchoGateway.address);
        try {
          const deposit = await Gateway.deposits(3);
          console.log(`   Gateway存款:`);
          console.log(`   - 资产: ${deposit.asset}`);
          console.log(`   - 数量: ${ethers.formatEther(deposit.amount)}`);
          console.log(`   - 已领取: ${deposit.claimed}`);
        } catch (err) {
          console.log(`   ❌ Gateway存款检查失败: ${err.message}`);
        }
      } else {
        console.log("   ℹ️ 未设置跨链奖励");
      }
      
      // 检查后端数据
      console.log("\n🔗 检查后端数据:");
      try {
        const response = await fetch('http://localhost:3001/api/tasks/3');
        if (response.ok) {
          const task = await response.json();
          console.log(`   ✅ Task3 后端数据存在:`);
          console.log(`   - 标题: ${task.title}`);
          console.log(`   - 描述: ${task.description?.substring(0, 50)}...`);
          console.log(`   - 创建者: ${task.creator}`);
        } else {
          console.log(`   ❌ Task3 后端数据不存在 (${response.status})`);
        }
      } catch (err) {
        console.log(`   ❌ 后端连接失败: ${err.message}`);
      }
      
    } else {
      console.log("❌ Task3 不存在，当前只有 " + taskCounter + " 个任务");
    }
    
  } catch (error) {
    console.error("❌ 合约调用失败:", error.message);
    
    // 尝试简单的网络连接测试
    console.log("\n🔧 网络连接测试:");
    try {
      const provider = ethers.provider;
      const blockNumber = await provider.getBlockNumber();
      console.log(`   当前区块高度: ${blockNumber}`);
      
      const network = await provider.getNetwork();
      console.log(`   网络信息: ${network.name} (ChainId: ${network.chainId})`);
    } catch (netErr) {
      console.log(`   ❌ 网络连接失败: ${netErr.message}`);
    }
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