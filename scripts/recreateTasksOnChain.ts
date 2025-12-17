import { ethers } from "hardhat";

async function main() {
  console.log("🔧 重新在链上创建任务");
  console.log("=====================================");
  
  const fs = require('fs');
  const deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
  
  const TaskEscrowAddress = deploymentData.localhost.contracts.TaskEscrow.address;
  const EOCHOTokenAddress = deploymentData.localhost.contracts.EOCHOToken.address;
  
  // 获取Creator1账户
  const [deployer, creator1] = await ethers.getSigners();
  console.log(`Creator1 地址: ${creator1.address}`);
  
  // 连接合约
  const TaskEscrow = await ethers.getContractAt("TaskEscrow", TaskEscrowAddress);
  const EOCHOToken = await ethers.getContractAt("EOCHOToken", EOCHOTokenAddress);
  
  // 检查Creator1的ECHO余额
  const balance = await EOCHOToken.balanceOf(creator1.address);
  console.log(`Creator1 ECHO余额: ${ethers.formatEther(balance)} ECHO`);
  
  if (balance < ethers.parseEther("50")) {
    console.log("❌ Creator1 ECHO余额不足，先转账...");
    const transferTx = await EOCHOToken.connect(deployer).transfer(
      creator1.address, 
      ethers.parseEther("100")
    );
    await transferTx.wait();
    console.log("✅ 已转账100 ECHO给Creator1");
  }
  
  // 检查授权
  const allowance = await EOCHOToken.allowance(creator1.address, TaskEscrowAddress);
  console.log(`Creator1对TaskEscrow的授权: ${ethers.formatEther(allowance)} ECHO`);
  
  if (allowance < ethers.parseEther("50")) {
    console.log("❌ 授权不足，先授权...");
    const approveTx = await EOCHOToken.connect(creator1).approve(
      TaskEscrowAddress,
      ethers.parseEther("1000")
    );
    await approveTx.wait();
    console.log("✅ 已授权1000 ECHO给TaskEscrow");
  }
  
  // 创建任务1
  console.log("\n🔧 创建任务1...");
  try {
    const reward = ethers.parseEther("10"); // 10 ECHO奖励
    const taskURI = "1"; // 简单的taskURI，对应后端API的任务1
    
    const createTx = await TaskEscrow.connect(creator1).createTask(reward, taskURI);
    console.log(`交易哈希: ${createTx.hash}`);
    
    const receipt = await createTx.wait();
    console.log("✅ 任务1创建成功");
    
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
    console.error("❌ 创建任务1失败:", error);
  }
  
  // 检查最终状态
  console.log("\n📊 检查最终状态:");
  const taskCounter = await TaskEscrow.taskCounter();
  console.log(`TaskCounter: ${taskCounter}`);
  
  if (Number(taskCounter) > 0) {
    const task1 = await TaskEscrow.tasks(1);
    console.log("任务1数据:");
    console.log(`  Creator: ${task1.creator}`);
    console.log(`  Reward: ${ethers.formatEther(task1.reward)} ECHO`);
    console.log(`  TaskURI: ${task1.taskURI}`);
    console.log(`  Status: ${task1.status}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});