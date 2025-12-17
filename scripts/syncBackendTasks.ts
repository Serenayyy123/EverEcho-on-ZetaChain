import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🔄 同步后端任务数据");
  console.log("=====================================");
  
  // 读取部署信息
  const deploymentData = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
  const contracts = deploymentData.localhost.contracts;
  
  // 连接合约
  const taskEscrow = await ethers.getContractAt("TaskEscrow", contracts.TaskEscrow.address);
  
  // 获取链上任务数据
  const taskCounter = await taskEscrow.taskCounter();
  console.log(`📊 链上任务总数: ${taskCounter}`);
  
  const backendTasks = [];
  
  for (let i = 1; i <= Number(taskCounter); i++) {
    const task = await taskEscrow.tasks(i);
    
    // 创建后端任务数据
    const backendTask = {
      taskId: i.toString(),
      creator: task.creator,
      title: `Test Task ${i}`,
      description: `This is test task ${i} for manual testing. Created by ${task.creator.slice(0,8)}...`,
      reward: ethers.formatEther(task.reward),
      status: Number(task.status),
      createdAt: new Date(Number(task.createdAt) * 1000).toISOString(),
      tags: i === 1 ? ["Testing", "Completed"] : i === 2 ? ["Testing", "Open"] : ["Testing", "Cross-chain"],
      difficulty: "Medium",
      estimatedTime: "2-4 hours"
    };
    
    backendTasks.push(backendTask);
    
    const statusNames = ['Open', 'InProgress', 'Submitted', 'Completed', 'Terminated'];
    console.log(`📝 Task${i}: ${statusNames[Number(task.status)]} - ${task.creator.slice(0,8)}...`);
  }
  
  // 调用后端API创建任务
  console.log("\n🔗 同步到后端API...");
  
  for (const task of backendTasks) {
    try {
      const response = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task)
      });
      
      if (response.ok) {
        console.log(`✅ Task${task.taskId} 同步成功`);
      } else {
        const error = await response.text();
        console.log(`❌ Task${task.taskId} 同步失败: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Task${task.taskId} 同步失败: ${error.message}`);
    }
  }
  
  // 验证后端数据
  console.log("\n🔍 验证后端数据...");
  try {
    const response = await fetch('http://localhost:3001/api/tasks');
    if (response.ok) {
      const tasks = await response.json();
      console.log(`✅ 后端任务数量: ${tasks.length}`);
      
      tasks.forEach(task => {
        console.log(`   Task${task.taskId}: ${task.title} (${task.creator.slice(0,8)}...)`);
      });
    } else {
      console.log(`❌ 后端验证失败: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ 后端验证失败: ${error.message}`);
  }
  
  console.log("\n🎯 现在你可以:");
  console.log("1. 访问前端 http://localhost:5173");
  console.log("2. 查看任务列表应该显示 Task1 (已完成) 和 Task2 (开放中)");
  console.log("3. 用 Creator2 创建 Task3 (跨链奖励任务)");
  console.log("4. 用 Helper2 测试跨链奖励功能");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});