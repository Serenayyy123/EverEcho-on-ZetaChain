/**
 * 比较 ECHO 代币合约地址配置
 * 检查前端配置和 TaskEscrow 合约中的地址是否一致
 */

import { ethers } from 'ethers';

async function compareEchoTokenAddresses() {
  console.log('🔍 比较 ECHO 代币合约地址...\n');

  // 前端配置中的地址
  const FRONTEND_ECHO_ADDRESS = '0xE0e8CD2F3a8bd6241B09798DEe98f1c777537b4D';
  const TASK_ESCROW_ADDRESS = '0xE442Eb737983986153E42C9ad28530676d8C1f55';

  console.log('📋 前端配置:');
  console.log('   - ECHO Token 地址:', FRONTEND_ECHO_ADDRESS);
  console.log('   - TaskEscrow 地址:', TASK_ESCROW_ADDRESS);

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);

    // TaskEscrow 合约 ABI - 只需要 echoToken 函数
    const TASK_ESCROW_ABI = [
      'function echoToken() view returns (address)'
    ];

    const taskEscrowContract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);

    console.log('\n🔧 从 TaskEscrow 合约读取 ECHO Token 地址:');
    const contractEchoAddress = await taskEscrowContract.echoToken();
    console.log('   - TaskEscrow 中的 ECHO Token 地址:', contractEchoAddress);

    console.log('\n🔍 地址比较:');
    console.log('   - 前端配置地址:', FRONTEND_ECHO_ADDRESS);
    console.log('   - 合约中的地址:', contractEchoAddress);
    
    const addressesMatch = FRONTEND_ECHO_ADDRESS.toLowerCase() === contractEchoAddress.toLowerCase();
    console.log('   - 地址匹配:', addressesMatch ? '✅' : '❌');

    if (!addressesMatch) {
      console.log('\n❌ 地址不匹配！这就是问题所在！');
      console.log('💡 解决方案:');
      console.log('   1. 更新前端配置文件中的 ECHO Token 地址');
      console.log('   2. 或者重新部署 TaskEscrow 合约使用正确的 ECHO Token 地址');
      console.log(`   3. 正确的地址应该是: ${contractEchoAddress}`);
    } else {
      console.log('\n✅ 地址匹配，问题可能在其他地方');
    }

    // 检查两个地址的合约是否都存在
    console.log('\n🔧 检查合约存在性:');
    const frontendEchoCode = await provider.getCode(FRONTEND_ECHO_ADDRESS);
    const contractEchoCode = await provider.getCode(contractEchoAddress);
    
    console.log(`   - 前端配置地址 (${FRONTEND_ECHO_ADDRESS}) 合约存在:`, frontendEchoCode !== '0x' ? '✅' : '❌');
    console.log(`   - 合约中地址 (${contractEchoAddress}) 合约存在:`, contractEchoCode !== '0x' ? '✅' : '❌');

    // 如果地址不同，检查两个合约的基本信息
    if (!addressesMatch) {
      console.log('\n📊 合约信息对比:');
      
      const ERC20_ABI = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function totalSupply() view returns (uint256)'
      ];

      try {
        if (frontendEchoCode !== '0x') {
          const frontendToken = new ethers.Contract(FRONTEND_ECHO_ADDRESS, ERC20_ABI, provider);
          const frontendName = await frontendToken.name();
          const frontendSymbol = await frontendToken.symbol();
          console.log(`   - 前端配置合约: ${frontendName} (${frontendSymbol})`);
        }
      } catch (e) {
        console.log('   - 前端配置合约: 无法读取信息');
      }

      try {
        if (contractEchoCode !== '0x') {
          const contractToken = new ethers.Contract(contractEchoAddress, ERC20_ABI, provider);
          const contractName = await contractToken.name();
          const contractSymbol = await contractToken.symbol();
          console.log(`   - 合约中的合约: ${contractName} (${contractSymbol})`);
        }
      } catch (e) {
        console.log('   - 合约中的合约: 无法读取信息');
      }
    }

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
  }
}

compareEchoTokenAddresses().catch(console.error);