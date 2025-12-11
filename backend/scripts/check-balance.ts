import { ethers } from 'ethers';

const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const TOKEN_ADDRESS = '0xe7940e81dDf4d6415f2947829938f9A24B0ad35d';
const ESCROW_ADDRESS = '0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28';
const USER_ADDRESS = '0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

  const balance = await token.balanceOf(USER_ADDRESS);
  const allowance = await token.allowance(USER_ADDRESS, ESCROW_ADDRESS);

  console.log('User:', USER_ADDRESS);
  console.log('Balance:', ethers.formatEther(balance), 'ECHO');
  console.log('Allowance:', ethers.formatEther(allowance), 'ECHO');
  console.log('');
  console.log('For a 20 ECHO task, you need:');
  console.log('- Balance: 40 ECHO (2x reward)');
  console.log('- Allowance: 40 ECHO');
}

main().catch(console.error);
