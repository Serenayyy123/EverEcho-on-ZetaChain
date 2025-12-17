import { ethers } from 'ethers';

async function debugContractDeployment() {
  console.log('🔍 Debugging Contract Deployment...');
  
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  
  // Check current block number
  const blockNumber = await provider.getBlockNumber();
  console.log('📋 Current block number:', blockNumber);
  
  // Check if we have any transactions
  if (blockNumber > 0) {
    const latestBlock = await provider.getBlock(blockNumber);
    console.log('📋 Latest block transactions:', latestBlock?.transactions.length || 0);
  }
  
  // Check specific addresses
  const addresses = [
    '0x5FbDB2315678afecb367f032d93F642f64180aa3', // ECHOToken
    '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Register
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', // UniversalReward
    '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'  // TaskEscrow
  ];
  
  console.log('');
  console.log('📋 Contract Code Check:');
  
  for (const address of addresses) {
    try {
      const code = await provider.getCode(address);
      const balance = await provider.getBalance(address);
      console.log(`Address: ${address}`);
      console.log(`  Code length: ${code.length} bytes`);
      console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
      console.log(`  Has code: ${code !== '0x' ? 'YES' : 'NO'}`);
      console.log('');
    } catch (error) {
      console.log(`❌ Error checking ${address}:`, error);
    }
  }
}

debugContractDeployment();