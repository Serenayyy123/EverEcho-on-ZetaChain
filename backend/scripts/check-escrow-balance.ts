/**
 * 检查 TaskEscrow 合约的 EOCHO 余额
 */

import { ethers } from 'ethers';

const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/y7anxz3Urn0udDBD6u8TU';
const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS || '0xC71040C8916E145f937Da3D094323C8f136c2E2F';
const EOCHO_TOKEN_ADDRESS = process.env.EOCHO_TOKEN_ADDRESS || '0xEF20110CeD8A061c9CA8aD1a9888C573C3D30da1';

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
];

async function checkBalance() {
  try {
    console.log('\n💰 Checking TaskEscrow EOCHO balance...\n');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const tokenContract = new ethers.Contract(EOCHO_TOKEN_ADDRESS, ERC20_ABI, provider);

    const balance = await tokenContract.balanceOf(TASK_ESCROW_ADDRESS);

    console.log(`TaskEscrow address: ${TASK_ESCROW_ADDRESS}`);
    console.log(`EOCHO Token address: ${EOCHO_TOKEN_ADDRESS}`);
    console.log(`Balance: ${ethers.formatEther(balance)} EOCHO`);

    // Task 8 需要 2R = 40 EOCHO
    const task8Required = ethers.parseEther('40');
    const hasEnough = balance >= task8Required;

    console.log(`\nTask 8 requires: 40 EOCHO (2R)`);
    console.log(`Has enough: ${hasEnough ? '✅' : '❌'}`);

    if (!hasEnough) {
      console.log(`\n❌ Insufficient balance!`);
      console.log(`   Need: 40 EOCHO`);
      console.log(`   Have: ${ethers.formatEther(balance)} EOCHO`);
      console.log(`   Short: ${ethers.formatEther(task8Required - balance)} EOCHO`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBalance();
