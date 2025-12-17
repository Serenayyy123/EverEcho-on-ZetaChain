import { ethers } from "hardhat";

async function main() {
  console.log("🔍 验证任务历史功能");
  console.log("=====================================");
  
  const fs = require('fs');
  const deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
  const TaskEscrowAddress = deploymentData.localhost.contracts.TaskEscrow.address;
  
  const TaskEscrow = await ethers.getContractAt("TaskEscrow", TaskEscrowAddress);
  
  // 测试账户地址
  const testAccounts = {
    creator1: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    helper1: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    creator2: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    helper2: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
  };
  
  console.log("📋 1. 检查链上任务状态");
  console.log("=====================================");
  
  const taskCounter = await TaskEscrow.taskCounter();
  console.log(`TaskCounter: ${taskCounter}`);
  
  const allTasks = [];
  
  for (let i = 1; i <= Number(taskCounter); i++) {
    const task = await TaskEscrow.tasks(i);
    allTasks.push({
      taskId: i,
      creator: task.creator,
      helper: task.helper,
      reward: ethers.formatEther(task.reward),
      status: Number(task.status),
      createdAt: Number(task.createdAt),
      acceptedAt: Number(task.acceptedAt),
      submittedAt: Number(task.submittedAt)
    });
    
    console.log(`\n任务 #${i}:`);
    console.log(`  Creator: ${task.creator}`);
    console.log(`  Helper: ${task.helper}`);
    console.log(`  Reward: ${ethers.formatEther(task.reward)} ECHO`);
    console.log(`  Status: ${getStatusName(Number(task.status))}`);
    console.log(`  Created: ${new Date(Number(task.createdAt) * 1000).toLocaleString()}`);
    
    if (Number(task.acceptedAt) > 0) {
      console.log(`  Accepted: ${new Date(Number(task.acceptedAt) * 1000).toLocaleString()}`);
    }
    if (Number(task.submittedAt) > 0) {
      console.log(`  Submitted: ${new Date(Number(task.submittedAt) * 1000).toLocaleString()}`);
    }
  }
  
  console.log("\n📋 2. 按用户统计任务");
  console.log("=====================================");
  
  for (const [name, address] of Object.entries(testAccounts)) {
    console.log(`\n${name} (${address}):`);
    
    // 统计作为Creator的任务
    const createdTasks = allTasks.filter(task => 
      task.creator.toLowerCase() === address.toLowerCase()
    );
    
    // 统计作为Helper的任务
    const helpedTasks = allTasks.filter(task => 
      task.helper.toLowerCase() === address.toLowerCase() &&
      task.helper !== ethers.ZeroAddress
    );
    
    console.log(`  作为Creator: ${createdTasks.length} 个任务`);
    createdTasks.forEach(task => {
      console.log(`    - 任务 #${task.taskId}: ${getStatusName(task.status)}, ${task.reward} ECHO`);
    });
    
    console.log(`  作为Helper: ${helpedTasks.length} 个任务`);
    helpedTasks.forEach(task => {
      console.log(`    - 任务 #${task.taskId}: ${getStatusName(task.status)}, ${task.reward} ECHO`);
    });
  }
  
  console.log("\n📋 3. 前端TaskHistory预期结果");
  console.log("=====================================");
  
  console.log("当用户切换到不同账户时，Profile页面应该显示:");
  
  for (const [name, address] of Object.entries(testAccounts)) {
    const createdCount = allTasks.filter(task => 
      task.creator.toLowerCase() === address.toLowerCase()
    ).length;
    
    const helpedCount = allTasks.filter(task => 
      task.helper.toLowerCase() === address.toLowerCase() &&
      task.helper !== ethers.ZeroAddress
    ).length;
    
    console.log(`\n${name}:`);
    console.log(`  Tasks I Created: +${createdCount}`);
    console.log(`  Tasks I Helped: +${helpedCount}`);
    
    if (createdCount === 0 && helpedCount === 0) {
      console.log(`  Task History: "No tasks created yet" / "No tasks accepted yet"`);
    } else {
      console.log(`  Task History: 应该显示具体的任务卡片`);
    }
  }
  
  console.log("\n📋 4. 问题诊断");
  console.log("=====================================");
  
  // 检查是否有任务状态异常
  const completedTasks = allTasks.filter(task => task.status === 3); // Completed
  const inProgressTasks = allTasks.filter(task => task.status === 1); // InProgress
  
  console.log(`已完成任务数量: ${completedTasks.length}`);
  console.log(`进行中任务数量: ${inProgressTasks.length}`);
  
  if (completedTasks.length > 0) {
    console.log("\n已完成的任务:");
    completedTasks.forEach(task => {
      console.log(`  任务 #${task.taskId}: Creator=${task.creator.slice(0,8)}..., Helper=${task.helper.slice(0,8)}...`);
    });
  }
  
  console.log("\n📋 5. 修复验证");
  console.log("=====================================");
  
  console.log("✅ 已修复的问题:");
  console.log("1. useTaskHistory 现在使用动态合约地址 (getContractAddresses)");
  console.log("2. useTaskStats 现在使用动态合约地址 (getContractAddresses)");
  console.log("3. Profile页面传递了chainId参数");
  
  console.log("\n🔧 测试建议:");
  console.log("1. 刷新前端页面以应用修复");
  console.log("2. 切换到Helper1账户 (0x3C44...93BC)");
  console.log("3. 查看Profile页面的Task History");
  console.log("4. 应该能看到已完成的任务");
  
  console.log("\n📊 预期结果:");
  if (completedTasks.length > 0) {
    console.log("✅ Helper1应该能看到已完成的任务");
    console.log("✅ Creator1应该能看到创建的任务");
    console.log("✅ 任务统计数字应该正确显示");
  } else {
    console.log("⚠️ 没有已完成的任务，可能需要先完成一个任务流程");
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