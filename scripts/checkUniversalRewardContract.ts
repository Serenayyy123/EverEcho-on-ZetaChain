import { ethers } from 'ethers';

async function checkUniversalRewardContract() {
  console.log('🔍 Checking EverEchoUniversalReward contract deployment...\n');

  const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
  
  // 检查 .env.local 中的地址
  const envAddress = '0x08D7B41A517Fb9E2C7810737f2c18F73F4C79BD0';
  console.log(`📍 Checking address from .env.local: ${envAddress}`);
  
  try {
    const code = await provider.getCode(envAddress);
    console.log(`   Code length: ${code.length} characters`);
    console.log(`   Is contract: ${code !== '0x' ? 'YES ✅' : 'NO ❌'}`);
    
    if (code !== '0x') {
      console.log(`   Code preview: ${code.substring(0, 100)}...`);
      
      // 尝试创建合约实例并调用函数
      try {
        const EverEchoUniversalRewardABI = await import('../frontend/src/contracts/EverEchoUniversalReward.json');
        const contract = new ethers.Contract(envAddress, EverEchoUniversalRewardABI.abi, provider);
        
        console.log('\n🧪 Testing contract functions...');
        
        // 列出所有函数
        const contractInterface = contract.interface;
        console.log('Available functions:');
        contractInterface.forEachFunction((func) => {
          console.log(`  - ${func.name}(${func.inputs.map(i => `${i.type} ${i.name}`).join(', ')})`);
        });
        
        // 尝试调用 preparePlan 函数（模拟调用，不实际执行）
        console.log('\n🔧 Testing preparePlan function signature...');
        const preparePlanFunc = contractInterface.getFunction('preparePlan');
        if (preparePlanFunc) {
          console.log(`✅ preparePlan function found:`);
          console.log(`   Signature: ${preparePlanFunc.format()}`);
          console.log(`   Inputs: ${preparePlanFunc.inputs.map(i => `${i.type} ${i.name}`).join(', ')}`);
        } else {
          console.log('❌ preparePlan function not found');
        }
        
      } catch (contractError) {
        console.log(`❌ Contract interaction error: ${contractError}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error checking contract: ${error}`);
  }
  
  // 检查 deployment.json 中的 EverEchoGateway 地址
  const gatewayAddress = '0x0AF4DB65C3DfEE92a910661367A10CF2420aC137';
  console.log(`\n📍 Checking EverEchoGateway address: ${gatewayAddress}`);
  
  try {
    const code = await provider.getCode(gatewayAddress);
    console.log(`   Code length: ${code.length} characters`);
    console.log(`   Is contract: ${code !== '0x' ? 'YES ✅' : 'NO ❌'}`);
    
    if (code !== '0x') {
      console.log(`   Code preview: ${code.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.log(`❌ Error checking gateway: ${error}`);
  }
  
  // 检查最新的部署记录
  console.log('\n📋 Deployment Summary:');
  console.log('From deployment.json:');
  console.log(`  - EverEchoGateway: 0x0AF4DB65C3DfEE92a910661367A10CF2420aC137`);
  console.log(`  - TaskEscrow: 0x9ee8255e1D566Fa085DFFcE26ee1B8587cB47FD0`);
  console.log('From .env.local:');
  console.log(`  - VITE_ZETA_UNIVERSAL_REWARD_ADDRESS: 0x08D7B41A517Fb9E2C7810737f2c18F73F4C79BD0`);
  console.log(`  - VITE_ZETA_TASK_ESCROW_ADDRESS: 0x437Cc2a9fe6aA835d6B8623D853219c8B21A641c`);
  
  console.log('\n💡 Analysis:');
  console.log('1. Check if EverEchoUniversalReward was actually deployed');
  console.log('2. Verify the correct contract address');
  console.log('3. Update environment variables with correct addresses');
  console.log('4. Ensure the contract ABI matches the deployed contract');
}

checkUniversalRewardContract().catch(console.error);