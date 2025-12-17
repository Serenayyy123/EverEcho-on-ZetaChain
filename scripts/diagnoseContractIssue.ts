import { ethers } from 'ethers';
import { createUniversalRewardContract, getContractAddresses } from '../frontend/src/config/contracts';

async function diagnoseContractIssue() {
  console.log('🔍 Diagnosing contract deployment issue...\n');

  // 检查环境变量
  console.log('📋 Environment Variables:');
  console.log(`VITE_UNIVERSAL_REWARD_ADDRESS: ${process.env.VITE_UNIVERSAL_REWARD_ADDRESS || 'Not set'}`);
  console.log(`VITE_TASK_ESCROW_ADDRESS: ${process.env.VITE_TASK_ESCROW_ADDRESS || 'Not set'}\n`);

  // 检查配置的合约地址
  const zetaAddresses = getContractAddresses(7001);
  console.log('🏗️  Configured Contract Addresses (ZetaChain):');
  console.log(`Universal Reward: ${zetaAddresses.UNIVERSAL_REWARD}`);
  console.log(`Task Escrow: ${zetaAddresses.TASK_ESCROW}\n`);

  // 错误中的合约地址
  const errorContractAddress = '0x08D7B41A517Fb9E2C7810737f2c18F73F4C79BD0';
  console.log(`❌ Error Contract Address: ${errorContractAddress}`);
  console.log(`✅ Expected Address: ${zetaAddresses.UNIVERSAL_REWARD}\n`);

  // 检查合约是否存在
  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    
    console.log('🔍 Checking contract existence...\n');
    
    // 检查配置的地址
    console.log(`1. Checking configured address: ${zetaAddresses.UNIVERSAL_REWARD}`);
    try {
      const configuredCode = await provider.getCode(zetaAddresses.UNIVERSAL_REWARD);
      console.log(`   Code length: ${configuredCode.length} characters`);
      console.log(`   Is contract: ${configuredCode !== '0x' ? 'YES' : 'NO'}\n`);
    } catch (error) {
      console.log(`   Error: ${error}\n`);
    }

    // 检查错误中的地址
    console.log(`2. Checking error address: ${errorContractAddress}`);
    try {
      const errorCode = await provider.getCode(errorContractAddress);
      console.log(`   Code length: ${errorCode.length} characters`);
      console.log(`   Is contract: ${errorCode !== '0x' ? 'YES' : 'NO'}\n`);
    } catch (error) {
      console.log(`   Error: ${error}\n`);
    }

    // 尝试调用合约函数
    console.log('🧪 Testing contract function calls...\n');
    
    const contract = createUniversalRewardContract(provider, 7001);
    console.log(`Contract instance created with address: ${await contract.getAddress()}`);
    
    // 尝试调用一个只读函数
    try {
      // 假设合约有一个 owner() 或类似的函数
      console.log('Attempting to call contract functions...');
      
      // 检查合约接口
      const contractInterface = contract.interface;
      console.log('Available functions:');
      contractInterface.forEachFunction((func) => {
        console.log(`  - ${func.name}(${func.inputs.map(i => `${i.type} ${i.name}`).join(', ')})`);
      });
      
    } catch (error) {
      console.log(`Function call error: ${error}`);
    }

  } catch (error) {
    console.error('Provider connection error:', error);
  }

  // 检查部署记录
  console.log('\n📄 Checking deployment records...');
  try {
    const fs = await import('fs');
    const deploymentPath = './deployment.json';
    
    if (fs.existsSync(deploymentPath)) {
      const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      console.log('Deployment data found:');
      console.log(JSON.stringify(deploymentData, null, 2));
    } else {
      console.log('No deployment.json found');
    }
  } catch (error) {
    console.log(`Error reading deployment data: ${error}`);
  }
}

// 检查 .env 文件
async function checkEnvFiles() {
  console.log('\n🔧 Checking environment files...\n');
  
  const envFiles = ['.env', '.env.local', '.env.zeta'];
  
  for (const envFile of envFiles) {
    try {
      const fs = await import('fs');
      if (fs.existsSync(envFile)) {
        console.log(`📁 ${envFile}:`);
        const content = fs.readFileSync(envFile, 'utf8');
        const lines = content.split('\n').filter(line => 
          line.includes('UNIVERSAL_REWARD') || line.includes('TASK_ESCROW')
        );
        if (lines.length > 0) {
          lines.forEach(line => console.log(`   ${line}`));
        } else {
          console.log('   No contract addresses found');
        }
        console.log('');
      } else {
        console.log(`📁 ${envFile}: Not found`);
      }
    } catch (error) {
      console.log(`📁 ${envFile}: Error reading - ${error}`);
    }
  }
}

async function main() {
  try {
    await diagnoseContractIssue();
    await checkEnvFiles();
    
    console.log('\n💡 Recommendations:');
    console.log('1. Check if the contract is properly deployed to ZetaChain Athens testnet');
    console.log('2. Verify the contract address in environment variables');
    console.log('3. Ensure the contract ABI matches the deployed contract');
    console.log('4. Check if the user has sufficient ZETA for gas fees');
    
  } catch (error) {
    console.error('Diagnosis failed:', error);
  }
}

main().catch(console.error);