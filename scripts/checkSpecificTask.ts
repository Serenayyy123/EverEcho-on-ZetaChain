import { ethers } from "hardhat";

async function main() {
  console.log("🔍 检查特定任务 ID #1");
  console.log("=====================================");
  
  const TaskEscrowAddress = "0xA7c59f010700930003b33aB25a7a0679C860f29c";
  
  try {
    const TaskEscrow = await ethers.getContractAt("TaskEscrow", TaskEscrowAddress);
    
    console.log(`📋 TaskEscrow 地址: ${TaskEscrowAddress}`);
    
    // 检查 taskCounter
    const taskCounter = await TaskEscrow.taskCounter();
    console.log(`📊 TaskCounter: ${taskCounter}`);
    
    // 尝试直接读取任务 #1
    console.log("\n🔍 尝试读取任务 #1:");
    try {
      const task = await TaskEscrow.tasks(1);
      console.log("✅ 任务 #1 存在:");
      console.log(`   Creator: ${task.creator}`);
      console.log(`   Helper: ${task.helper}`);
      console.log(`   Reward: ${ethers.formatEther(task.reward)} ECHO`);
      console.log(`   Status: ${task.status} (${getStatusName(Number(task.status))})`);
      console.log(`   TaskURI: ${task.taskURI}`);
      console.log(`   Created At: ${new Date(Number(task.createdAt) * 1000).toLocaleString()}`);
      console.log(`   PostFee: ${ethers.formatEther(task.echoPostFee)} ECHO`);
      
      // 检查是否是 Creator1 创建的
      const creator1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      if (task.creator.toLowerCase() === creator1.toLowerCase()) {
        console.log("✅ 确认是 Creator1 创建的任务");
      } else {
        console.log(`⚠️ 任务创建者不是 Creator1，而是: ${task.creator}`);
      }
      
    } catch (error) {
      console.log("❌ 任务 #1 不存在或读取失败:");
      console.log(`   错误: ${error}`);
    }
    
    // 检查任务 #0 (虽然通常不存在)
    console.log("\n🔍 尝试读取任务 #0:");
    try {
      const task0 = await TaskEscrow.tasks(0);
      console.log("⚠️ 任务 #0 存在 (不正常):");
      console.log(`   Creator: ${task0.creator}`);
      console.log(`   Status: ${task0.status}`);
    } catch (error) {
      console.log("✅ 任务 #0 不存在 (正常)");
    }
    
    // 查询更大范围的事件
    console.log("\n🔍 查询更大范围的 TaskCreated 事件...");
    const currentBlock = await ethers.provider.getBlockNumber();
    const filter = TaskEscrow.filters.TaskCreated();
    
    // 查询从区块 0 开始的所有事件
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
    
    // 检查前端可能连接的其他合约地址
    console.log("\n🔍 检查可能的其他合约地址...");
    const possibleAddresses = [
      "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // 旧的硬编码地址
      "0x5FbDB2315678afecb367f032d93F642f64180aa3", // 另一个可能的地址
    ];
    
    for (const addr of possibleAddresses) {
      try {
        const contract = await ethers.getContractAt("TaskEscrow", addr);
        const counter = await contract.taskCounter();
        console.log(`   ${addr}: taskCounter = ${counter}`);
        
        if (Number(counter) > 0) {
          console.log(`   ⚠️ 发现任务在地址 ${addr}!`);
          // 检查任务详情
          for (let i = 1; i <= Number(counter); i++) {
            try {
              const task = await contract.tasks(i);
              console.log(`     任务 #${i}: Creator=${task.creator}, Status=${task.status}`);
            } catch (e) {
              console.log(`     任务 #${i}: 读取失败`);
            }
          }
        }
      } catch (error) {
        console.log(`   ${addr}: 无法连接或不是有效合约`);
      }
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