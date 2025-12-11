/**
 * 修复已部署的 EOCHOToken：设置 TaskEscrow 地址
 * 
 * 使用方法：
 * npx hardhat run scripts/fix-taskescrow-address.ts --network sepolia
 */

import { ethers } from "hardhat";

async function main() {
  console.log("\n🔧 Fixing EOCHOToken TaskEscrow address...\n");

  // 从 deployment.json 读取地址
  const deployment = require('../deployment.json');
  const EOCHO_TOKEN_ADDRESS = deployment.contracts.EOCHOToken;
  const TASK_ESCROW_ADDRESS = deployment.contracts.TaskEscrow;

  console.log(`EOCHOToken: ${EOCHO_TOKEN_ADDRESS}`);
  console.log(`TaskEscrow: ${TASK_ESCROW_ADDRESS}`);

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`\nDeployer: ${deployer.address}`);

  // 连接到 EOCHOToken
  const EOCHOToken = await ethers.getContractFactory("EOCHOToken");
  const echoToken = EOCHOToken.attach(EOCHO_TOKEN_ADDRESS);

  // 检查当前的 taskEscrowAddress
  const currentTaskEscrowAddress = await echoToken.taskEscrowAddress();
  console.log(`\nCurrent taskEscrowAddress: ${currentTaskEscrowAddress}`);

  if (currentTaskEscrowAddress !== ethers.ZeroAddress) {
    console.log(`\n⚠️  TaskEscrow address already set!`);
    console.log(`   Current: ${currentTaskEscrowAddress}`);
    console.log(`   Expected: ${TASK_ESCROW_ADDRESS}`);
    
    if (currentTaskEscrowAddress.toLowerCase() === TASK_ESCROW_ADDRESS.toLowerCase()) {
      console.log(`\n✅ Address is correct, no action needed.`);
      return;
    } else {
      console.log(`\n❌ Address mismatch! Cannot change (one-time setter).`);
      return;
    }
  }

  // 设置 TaskEscrow 地址
  console.log(`\n📝 Setting TaskEscrow address...`);
  const tx = await echoToken.setTaskEscrowAddress(TASK_ESCROW_ADDRESS);
  console.log(`   Transaction sent: ${tx.hash}`);

  console.log(`   Waiting for confirmation...`);
  const receipt = await tx.wait();
  console.log(`   ✅ Transaction confirmed!`);
  console.log(`   Block: ${receipt?.blockNumber}`);

  // 验证
  const newTaskEscrowAddress = await echoToken.taskEscrowAddress();
  console.log(`\n✅ TaskEscrow address set successfully!`);
  console.log(`   New address: ${newTaskEscrowAddress}`);

  console.log(`\n🎉 Fix completed!\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
