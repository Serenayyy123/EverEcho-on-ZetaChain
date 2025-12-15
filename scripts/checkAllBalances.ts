import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("检查所有账户余额...");
  
  const deploymentJson = fs.readFileSync('deployment.json', 'utf8');
  const deploymentData = JSON.parse(deploymentJson);
  const deployment = deploymentData.localhost;
  
  const getContractAddress = (contractName: string) => {
    const contract = deployment.contracts[contractName];
    return typeof contract === 'string' ? contract : contract.address;
  };
  
  const echoToken = await ethers.getContractAt("EOCHOToken", getContractAddress('EOCHOToken'));
  const taskEscrow = await ethers.getContractAt("TaskEscrow", getContractAddress('TaskEscrow'));
  
  const [deployer, helper, creator2, helper2, creator3] = await ethers.getSigners();
  
  console.log("\n所有账户余额:");
  console.log("-".repeat(50));
  
  const accounts = [
    { name: "Deployer (A)", signer: deployer },
    { name: "Helper (B)", signer: helper },
    { name: "Creator2 (C)", signer: creator2 },
    { name: "Helper2 (D)", signer: helper2 },
    { name: "Creator3 (E)", signer: creator3 },
  ];
  
  let totalBalance = 0n;
  
  for (const account of accounts) {
    const balance = await echoToken.balanceOf(account.signer.address);
    console.log(`${account.name}: ${ethers.formatUnits(balance, 18)} ECHO (${account.signer.address})`);
    totalBalance += balance;
  }
  
  const contractBalance = await echoToken.balanceOf(getContractAddress('TaskEscrow'));
  console.log(`TaskEscrow: ${ethers.formatUnits(contractBalance, 18)} ECHO`);
  totalBalance += contractBalance;
  
  console.log("-".repeat(50));
  console.log(`总供应量: ${ethers.formatUnits(totalBalance, 18)} ECHO`);
  
  // 检查任务状态
  const taskCounter = await taskEscrow.taskCounter();
  console.log(`\n任务计数器: ${taskCounter}`);
  
  if (Number(taskCounter) > 0) {
    console.log("\n现有任务状态:");
    for (let i = 1; i <= Number(taskCounter); i++) {
      try {
        const task = await taskEscrow.tasks(i);
        console.log(`Task ${i}: status=${task.status}, creator=${task.creator.slice(0,8)}..., helper=${task.helper.slice(0,8)}..., reward=${ethers.formatUnits(task.reward, 18)} ECHO`);
      } catch (e) {
        console.log(`Task ${i}: 读取失败`);
      }
    }
  }
}

main().catch(console.error);