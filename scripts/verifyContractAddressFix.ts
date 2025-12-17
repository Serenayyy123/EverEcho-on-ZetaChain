import { ethers } from 'ethers';
import { getContractAddresses, createUniversalRewardContract } from '../frontend/src/config/contracts';

async function verifyContractAddressFix() {
  console.log('🔍 Verifying contract address fix...');
  
  try {
    // 1. Check what address is being resolved
    const addresses = getContractAddresses(7001); // ZetaChain Athens
    console.log('📍 Resolved contract addresses:', addresses);
    
    // 2. Check environment variables
    console.log('🔧 Environment variables:');
    console.log('  VITE_ZETA_UNIVERSAL_REWARD_ADDRESS:', process.env.VITE_ZETA_UNIVERSAL_REWARD_ADDRESS);
    console.log('  VITE_UNIVERSAL_REWARD_ADDRESS:', process.env.VITE_UNIVERSAL_REWARD_ADDRESS);
    
    // 3. Test contract connection
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const contract = createUniversalRewardContract(provider, 7001);
    
    console.log('📋 Contract address being used:', await contract.getAddress());
    
    // 4. Test a simple contract call
    console.log('🧪 Testing contract call...');
    const nextRewardId = await contract.nextRewardId();
    console.log('✅ Contract call successful! Next reward ID:', nextRewardId.toString());
    
    // 5. Check if the old address exists (should fail)
    console.log('🚫 Testing old address (should fail)...');
    try {
      const oldContract = new ethers.Contract(
        '0x08D7B41A517Fb9E2C7810737f2c18F73F4C79BD0',
        ['function nextRewardId() view returns (uint256)'],
        provider
      );
      const oldResult = await oldContract.nextRewardId();
      console.log('⚠️ Old address still works:', oldResult.toString());
    } catch (error: any) {
      console.log('✅ Old address correctly fails:', error.message);
    }
    
    console.log('\n🎉 Contract address fix verification completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Contract address fix verification failed:', error.message);
    throw error;
  }
}

// Run the verification
verifyContractAddressFix().catch(console.error);