import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function testContractAddressDirectly() {
  console.log('🔍 Testing contract address directly...');
  
  try {
    // 1. Read the ABI file
    const abiPath = path.join(__dirname, '../frontend/src/contracts/EverEchoUniversalReward.json');
    const abiContent = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    
    // 2. Test the correct address from .env.local
    const correctAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    console.log('📍 Testing correct address:', correctAddress);
    
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const contract = new ethers.Contract(correctAddress, abiContent.abi, provider);
    
    // 3. Test a simple contract call
    console.log('🧪 Testing contract call...');
    const nextRewardId = await contract.nextRewardId();
    console.log('✅ Contract call successful! Next reward ID:', nextRewardId.toString());
    
    // 4. Test preparePlan function signature
    console.log('🔧 Testing preparePlan function...');
    const preparePlanFragment = contract.interface.getFunction('preparePlan');
    if (preparePlanFragment) {
      console.log('✅ preparePlan function found:', preparePlanFragment.format());
    } else {
      console.log('❌ preparePlan function not found');
    }
    
    // 5. Test the old address (should fail)
    console.log('🚫 Testing old address (should fail)...');
    try {
      const oldAddress = '0x08D7B41A517Fb9E2C7810737f2c18F73F4C79BD0';
      const oldContract = new ethers.Contract(oldAddress, abiContent.abi, provider);
      const oldResult = await oldContract.nextRewardId();
      console.log('⚠️ Old address still works:', oldResult.toString());
    } catch (error: any) {
      console.log('✅ Old address correctly fails:', error.message);
    }
    
    console.log('\n🎉 Contract address test completed successfully!');
    console.log('📋 The frontend should now use the correct address:', correctAddress);
    
  } catch (error: any) {
    console.error('❌ Contract address test failed:', error.message);
    throw error;
  }
}

// Run the test
testContractAddressDirectly().catch(console.error);