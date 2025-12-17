import { ethers } from "hardhat";

async function main() {
  console.log("🔍 调试任务状态不一致问题");
  console.log("=====================================");
  
  // 合约地址
  const addresses = {
    TaskEscrow: "0xA7c59f010700930003b33aB25a7a0679C860f29c",
  };

  console.log(`📋 TaskEscrow 地址: ${addresses.TaskEscrow}`);
  console.log("");

  try {
    // 获取合约实例
    const TaskEscrow = await ethers.getContractAt("TaskEscrow", addresses.TaskEscrow);
    
    // 获取任务计数器
    const taskCounter = await TaskEscrow.taskCounter();
    console.log(`📊 总任务数: ${taskCounter}`);
    console.log("");

    // 检查每个任务的状态
    for (let i = 1; i <= Number(taskCounter); i++) {
      console.log(`🔍 检查任务 #${i}:`);
      
      try {
        const task = await TaskEscrow.tasks(i);
        
        console.log(`   Creator: ${task.creator}`);
        console.log(`   Helper: ${task.helper}`);
        console.log(`   Reward: ${ethers.formatEther(task.reward)} ECHO`);
        console.log(`   Status: ${task.status} (${getStatusName(Number(task.status))})`);
        console.log(`   Created At: ${new Date(Number(task.createdAt) * 1000).toLocaleString()}`);
        console.log(`   Accepted At: ${Number(task.acceptedAt) === 0 ? 'Not accepted' : new Date(Number(task.acceptedAt) * 1000).toLocaleString()}`);
        console.log(`   Submitted At: ${Number(task.submittedAt) === 0 ? 'Not submitted' : new Date(Number(task.submittedAt) * 1000).toLocaleString()}`);
        console.log(`   TaskURI: ${task.taskURI}`);
        console.log(`   PostFee: ${ethers.formatEther(task.echoPostFee)} ECHO`);
        
        // 检查是否有跨链奖励
        if (task.rewardAsset !== ethers.ZeroAddress) {
          console.log(`   跨链奖励资产: ${task.rewardAsset}`);
          console.log(`   跨链奖励数量: ${ethers.formatEther(task.rewardAmount)}`);
        }
        
      } catch (error) {
        console.log(`   ❌ 读取任务 ${i} 失败: ${error}`);
      }
      
      console.log("");
    }

    // 检查后端 API 返回的任务数据
    console.log("🌐 检查后端 API 任务数据:");
    console.log("=====================================");
    
    try {
      const response = await fetch('http://localhost:3001/api/task');
      if (response.ok) {
        const tasks = await response.json();
        console.log(`📊 后端返回任务数: ${tasks.length}`);
        
        tasks.forEach((task: any, index: number) => {
          console.log(`\n📋 后端任务 #${index + 1}:`);
          console.log(`   ID: ${task.id}`);
          console.log(`   Title: ${task.title}`);
          console.log(`   Status: ${task.status || 'Unknown'}`);
          console.log(`   Created: ${task.createdAt}`);
        });
      } else {
        console.log(`❌ 后端 API 请求失败: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ 后端 API 连接失败: ${error}`);
    }

  } catch (error) {
    console.error("❌ 调试失败:", error);
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