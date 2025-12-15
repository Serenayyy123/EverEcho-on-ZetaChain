import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("取消所有 Open 状态的任务...");
  
  const deploymentJson = fs.readFileSync('deployment.json', 'utf8');
  const deploymentData = JSON.parse(deploymentJson);
  const deployment = deploymentData.localhost;
  
  const getContractAddress = (contractName: string) => {
    const contract = deployment.contracts[contractName];
    return typeof contract === 'string' ? contract : contract.address;
  };
  
  const taskEscrow = await ethers.getContractAt("TaskEscrow", getContractAddress('TaskEscrow'));
  
  const [deployer] = await ethers.getSigners();
  
  const taskCounter = await taskEscrow.taskCounter();
  console.log(`任务计数器: ${taskCounter}`);
  
  for (let i = 1; i <= Number(taskCounter); i++) {
    try {
      const task = await taskEscrow.tasks(i);
      console.log(`Task ${i}: status=${task.status}, creator=${task.creator.slice(0,8)}...`);
      
      // 如果是 Open 状态 (0) 且 creator 是 deployer，则取消
      if (Number(task.status) === 0 && task.creator.toLowerCase() === deployer.address.toLowerCase()) {
        console.log(`取消 Task ${i}...`);
        const cancelTx = await taskEscrow.connect(deployer).cancelTask(i);
        await cancelTx.wait();
        console.log(`✅ Task ${i} 已取消`);
      }
    } catch (e) {
      console.log(`Task ${i}: 处理失败 -`, e.message);
    }
  }
  
  console.log("完成！");
}

main().catch(console.error);