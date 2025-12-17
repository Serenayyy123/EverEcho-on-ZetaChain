import { ethers } from "hardhat";

async function main() {
  console.log("🔧 创建任务2");
  console.log("=====================================");
  
  const fs = require('fs');
  const deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
  
  const TaskEscrowAddress = deploymentData.localhost.contracts.TaskEscrow.address;
  
  // 获取Creator1账户
  const [deployer, creator1] = await ethers.getSigners();
  console.log(`Creator1 地址: ${creator1.address}`);
  
  // 连接合约
  const TaskEscrow = await ethers.getContractAt("TaskEscrow", TaskEscrowAddress);
  
  // 检查当前taskCounter
  const taskCounter = await TaskEscrow.taskCounter();
  console.log(`当前 TaskCounter: ${taskCounter}`);
  
  // 创建任务2
  console.log("\n🔧 创建任务2...");
  try {
    const reward = ethers.parseEther("10"); // 10 ECHO奖励
    const taskURI = "2"; // taskURI对应后端API的任务2
    
    const createTx = await TaskEscrow.connect(creator1).createTask(reward, taskURI);
    console.log(`交易哈希: ${createTx.hash}`);
    
    const receipt = await createTx.wait();
    console.log("✅ 任务2创建成功");
    
    // 从事件中获取taskId
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = TaskEscrow.interface.parseLog(log);
        return parsed?.name === 'TaskCreated';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = TaskEscrow.interface.parseLog(event);
      const taskId = Number(parsed?.args[0]);
      console.log(`任务ID: ${taskId}`);
    }
    
  } catch (error) {
    console.error("❌ 创建任务2失败:", error);
  }
  
  // 检查最终状态
  console.log("\n📊 检查最终状态:");
  const finalTaskCounter = await TaskEscrow.taskCounter();
  console.log(`TaskCounter: ${finalTaskCounter}`);
  
  for (let i = 1; i <= Number(finalTaskCounter); i++) {
    const task = await TaskEscrow.tasks(i);
    console.log(`任务${i}数据:`);
    console.log(`  Creator: ${task.creator}`);
    console.log(`  Reward: ${ethers.formatEther(task.reward)} ECHO`);
    console.log(`  TaskURI: ${task.taskURI}`);
    console.log(`  Status: ${task.status}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});