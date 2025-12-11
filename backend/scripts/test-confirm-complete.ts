/**
 * 测试 confirmComplete 调用
 * 使用 ethers 直接调用合约，模拟前端行为
 */

import { ethers } from 'ethers';

const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/y7anxz3Urn0udDBD6u8TU';
const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS || '0xC71040C8916E145f937Da3D094323C8f136c2E2F';

// 需要 Creator 的私钥（仅用于测试）
// 注意：这里使用环境变量，不要硬编码私钥
const CREATOR_PRIVATE_KEY = process.env.CREATOR_PRIVATE_KEY || '';

const TASK_ESCROW_ABI = [
  'function confirmComplete(uint256 taskId) external',
  'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
];

async function testConfirmComplete() {
  try {
    console.log('\n🧪 Testing confirmComplete for Task 8...\n');

    if (!CREATOR_PRIVATE_KEY) {
      console.log('❌ CREATOR_PRIVATE_KEY not set in environment');
      console.log('   Please set it to test confirmComplete');
      console.log('   Example: export CREATOR_PRIVATE_KEY=0x...');
      return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(CREATOR_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, wallet);

    console.log(`Creator address: ${wallet.address}`);
    console.log(`TaskEscrow address: ${TASK_ESCROW_ADDRESS}`);

    // 1. 检查当前状态
    console.log('\n1. Checking current task state...');
    const task = await contract.tasks(8);
    console.log(`   Status: ${task[5]} (2 = Submitted)`);
    console.log(`   Creator: ${task[1]}`);
    console.log(`   Helper: ${task[2]}`);

    if (task[1].toLowerCase() !== wallet.address.toLowerCase()) {
      console.log(`\n❌ Wallet address does not match creator!`);
      console.log(`   Wallet: ${wallet.address}`);
      console.log(`   Creator: ${task[1]}`);
      return;
    }

    // 2. 估算 gas
    console.log('\n2. Estimating gas...');
    try {
      const gasEstimate = await contract.confirmComplete.estimateGas(8);
      console.log(`   ✅ Gas estimate: ${gasEstimate.toString()}`);
    } catch (err: any) {
      console.log(`   ❌ Gas estimation failed!`);
      console.log(`   Error: ${err.message}`);
      
      // 尝试调用 static call 获取更多信息
      try {
        await contract.confirmComplete.staticCall(8);
      } catch (staticErr: any) {
        console.log(`\n   Static call error: ${staticErr.message}`);
        if (staticErr.data) {
          console.log(`   Error data: ${staticErr.data}`);
        }
      }
      return;
    }

    // 3. 发送交易
    console.log('\n3. Sending transaction...');
    const tx = await contract.confirmComplete(8);
    console.log(`   ✅ Transaction sent: ${tx.hash}`);

    console.log('\n4. Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log(`   ✅ Transaction confirmed!`);
    console.log(`   Block: ${receipt?.blockNumber}`);
    console.log(`   Gas used: ${receipt?.gasUsed.toString()}`);

    console.log('\n🎉 confirmComplete succeeded!\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
  }
}

testConfirmComplete();
