import { ethers } from "hardhat";

async function main() {
  console.log("🔍 调试前端任务数据来源");
  console.log("=====================================");
  
  // 1. 检查链上任务状态
  console.log("\n📋 1. 检查链上任务状态:");
  const fs = require('fs');
  const deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
  const TaskEscrowAddress = deploymentData.localhost.contracts.TaskEscrow.address;
  
  const TaskEscrow = await ethers.getContractAt("TaskEscrow", TaskEscrowAddress);
  const taskCounter = await TaskEscrow.taskCounter();
  console.log(`   TaskCounter: ${taskCounter}`);
  
  // 2. 检查后端API任务数据
  console.log("\n📋 2. 检查后端API任务数据:");
  const axios = require('axios');
  
  try {
    const task1Response = await axios.get('http://localhost:3001/api/task/1');
    console.log("   任务1 (后端API):");
    console.log(`     Title: ${task1Response.data.title}`);
    console.log(`     Creator: ${task1Response.data.creator}`);
    console.log(`     CreatedAt: ${task1Response.data.createdAt}`);
  } catch (error) {
    console.log("   任务1 (后端API): 不存在或错误");
  }
  
  try {
    const task2Response = await axios.get('http://localhost:3001/api/task/2');
    console.log("   任务2 (后端API):");
    console.log(`     Title: ${task2Response.data.title}`);
    console.log(`     Creator: ${task2Response.data.creator}`);
  } catch (error) {
    console.log("   任务2 (后端API): 不存在或错误");
  }
  
  // 3. 模拟前端TaskDetail页面的行为
  console.log("\n📋 3. 模拟前端TaskDetail页面行为:");
  
  // 尝试从链上读取任务1
  try {
    console.log("   尝试从链上读取任务1...");
    const task1OnChain = await TaskEscrow.tasks(1);
    console.log("   ✅ 任务1在链上存在:");
    console.log(`     Creator: ${task1OnChain.creator}`);
    console.log(`     Status: ${task1OnChain.status}`);
    console.log(`     TaskURI: ${task1OnChain.taskURI}`);
  } catch (error) {
    console.log("   ❌ 任务1在链上不存在或读取失败");
    console.log(`     错误: ${error.message}`);
  }
  
  // 尝试从链上读取任务2
  try {
    console.log("   尝试从链上读取任务2...");
    const task2OnChain = await TaskEscrow.tasks(2);
    console.log("   ✅ 任务2在链上存在:");
    console.log(`     Creator: ${task2OnChain.creator}`);
    console.log(`     Status: ${task2OnChain.status}`);
  } catch (error) {
    console.log("   ❌ 任务2在链上不存在或读取失败");
    console.log(`     错误: ${error.message}`);
  }
  
  // 4. 检查前端可能使用的任务列表API
  console.log("\n📋 4. 检查前端任务列表数据源:");
  
  // 检查是否有任务列表API
  try {
    const tasksResponse = await axios.get('http://localhost:3001/api/tasks');
    console.log("   后端任务列表API存在，返回数据:");
    console.log(JSON.stringify(tasksResponse.data, null, 2));
  } catch (error) {
    console.log("   后端任务列表API不存在或错误");
  }
  
  // 5. 分析问题
  console.log("\n📋 5. 问题分析:");
  console.log("   前端任务广场显示的任务数据来源:");
  console.log("   - 如果来自链上: TaskCounter=0，不应该有任务显示");
  console.log("   - 如果来自后端API: 需要检查前端的useTasks hook");
  console.log("   - 如果来自缓存: 需要清除浏览器缓存");
  
  console.log("\n   点击任务进入详情页的问题:");
  console.log("   - TaskDetail页面直接从链上读取任务数据");
  console.log("   - 链上TaskCounter=0，所以任务1和2不存在");
  console.log("   - 这会导致'Task not found'或类似错误");
  
  console.log("\n📋 6. 建议解决方案:");
  console.log("   1. 检查前端useTasks hook的数据来源");
  console.log("   2. 确保任务在链上正确创建");
  console.log("   3. 或者修改TaskDetail页面支持从后端API获取任务数据");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});