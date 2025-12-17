import { ethers } from "hardhat";

async function main() {
  console.log("🔍 详细检查链上任务数据结构");
  console.log("=====================================");
  
  const fs = require('fs');
  const deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
  const TaskEscrowAddress = deploymentData.localhost.contracts.TaskEscrow.address;
  
  const TaskEscrow = await ethers.getContractAt("TaskEscrow", TaskEscrowAddress);
  
  // 检查taskCounter
  const taskCounter = await TaskEscrow.taskCounter();
  console.log(`📊 TaskCounter: ${taskCounter}`);
  
  // 检查任务0, 1, 2的详细数据
  for (let i = 0; i <= 2; i++) {
    console.log(`\n🔍 检查任务 #${i}:`);
    try {
      const task = await TaskEscrow.tasks(i);
      console.log(`   TaskId: ${task.taskId}`);
      console.log(`   Creator: ${task.creator}`);
      console.log(`   Helper: ${task.helper}`);
      console.log(`   Reward: ${ethers.formatEther(task.reward)} ECHO`);
      console.log(`   TaskURI: "${task.taskURI}"`);
      console.log(`   Status: ${task.status}`);
      console.log(`   CreatedAt: ${task.createdAt} (${new Date(Number(task.createdAt) * 1000).toLocaleString()})`);
      console.log(`   AcceptedAt: ${task.acceptedAt}`);
      console.log(`   SubmittedAt: ${task.submittedAt}`);
      console.log(`   PostFee: ${ethers.formatEther(task.echoPostFee)} ECHO`);
      
      // 判断任务是否为空
      const isEmpty = task.creator === ethers.ZeroAddress && 
                     task.reward === 0n && 
                     task.taskURI === "" && 
                     task.createdAt === 0n;
      
      if (isEmpty) {
        console.log(`   ❌ 任务 #${i} 是空的（未初始化）`);
      } else {
        console.log(`   ✅ 任务 #${i} 有数据`);
      }
      
    } catch (error) {
      console.log(`   ❌ 任务 #${i} 读取失败: ${error.message}`);
    }
  }
  
  // 检查TaskCreated事件
  console.log(`\n🔍 检查 TaskCreated 事件:`);
  const currentBlock = await ethers.provider.getBlockNumber();
  const filter = TaskEscrow.filters.TaskCreated();
  
  const events = await TaskEscrow.queryFilter(filter, 0, currentBlock);
  console.log(`📋 找到 ${events.length} 个 TaskCreated 事件:`);
  
  events.forEach((event, index) => {
    console.log(`   事件 ${index + 1}:`);
    console.log(`     TaskId: ${event.args?.[0]}`);
    console.log(`     Creator: ${event.args?.[1]}`);
    console.log(`     Reward: ${ethers.formatEther(event.args?.[2] || 0)} ECHO`);
    console.log(`     区块: ${event.blockNumber}`);
    console.log(`     交易: ${event.transactionHash}`);
  });
  
  // 分析问题
  console.log(`\n📋 问题分析:`);
  console.log(`   1. TaskCounter = ${taskCounter}，说明合约认为有 ${taskCounter} 个任务`);
  console.log(`   2. 但实际任务数据可能是空的（creator为零地址）`);
  console.log(`   3. 前端useTasks会遍历1到${taskCounter}的所有任务`);
  console.log(`   4. 前端从后端API获取metadata，所以能显示任务信息`);
  console.log(`   5. 但TaskDetail页面直接从链上读取，所以显示空数据`);
  
  if (Number(taskCounter) > 0 && events.length === 0) {
    console.log(`\n⚠️ 异常情况: TaskCounter > 0 但没有 TaskCreated 事件`);
    console.log(`   这可能是因为:`);
    console.log(`   - 合约被重新部署但taskCounter没有重置`);
    console.log(`   - 或者有其他方式修改了taskCounter`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});