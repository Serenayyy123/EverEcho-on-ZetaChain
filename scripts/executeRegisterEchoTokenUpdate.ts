/**
 * 执行Register合约中ECHO Token地址的更新
 * 需要合约所有者的私钥来执行此操作
 */

import { ethers } from 'ethers';

const REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';
const NEW_ECHO_TOKEN = '0x650AAE045552567df9eb0633afd77D44308D3e6D';

// Register合约ABI
const REGISTER_ABI = [
  'function echoToken() view returns (address)',
  'function setEchoToken(address _echoToken) external',
  'function owner() view returns (address)'
];

async function executeRegisterEchoTokenUpdate() {
  console.log('🔄 执行Register合约ECHO Token地址更新...\n');

  console.log(`📋 Register合约地址: ${REGISTER_ADDRESS}`);
  console.log(`📋 新的ECHO Token地址: ${NEW_ECHO_TOKEN}\n`);

  try {
    // 连接到ZetaChain
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    
    // 1. 检查当前地址
    console.log('1. 📡 检查当前ECHO Token地址...');
    const registerContract = new ethers.Contract(REGISTER_ADDRESS, REGISTER_ABI, provider);
    const currentEchoToken = await registerContract.echoToken();
    console.log(`   当前地址: ${currentEchoToken}`);

    if (currentEchoToken.toLowerCase() === NEW_ECHO_TOKEN.toLowerCase()) {
      console.log('   ✅ 地址已经是最新的，无需更新');
      return;
    }

    // 2. 检查环境变量中的私钥
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.log('❌ 错误: 未找到PRIVATE_KEY环境变量');
      console.log('请设置环境变量: PRIVATE_KEY=your_private_key');
      console.log('或者使用: npx ts-node scripts/executeRegisterEchoTokenUpdate.ts');
      return;
    }

    // 3. 创建钱包
    console.log('\n2. 👤 创建钱包连接...');
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`   钱包地址: ${wallet.address}`);

    // 4. 检查是否是合约所有者
    console.log('\n3. 🔐 验证权限...');
    try {
      const owner = await registerContract.owner();
      console.log(`   合约所有者: ${owner}`);
      
      if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
        console.log('❌ 错误: 当前钱包不是合约所有者');
        console.log(`   需要使用所有者地址: ${owner}`);
        return;
      }
      console.log('   ✅ 权限验证通过');
    } catch (error) {
      console.log('   ⚠️  无法验证合约所有者，继续尝试更新...');
    }

    // 5. 连接到合约并执行更新
    console.log('\n4. 🔄 执行更新...');
    const registerContractWithSigner = new ethers.Contract(REGISTER_ADDRESS, REGISTER_ABI, wallet);
    
    // 估算gas
    console.log('   📊 估算gas费用...');
    const gasEstimate = await registerContractWithSigner.setEchoToken.estimateGas(NEW_ECHO_TOKEN);
    console.log(`   预估gas: ${gasEstimate.toString()}`);

    // 执行交易
    console.log('   📤 发送交易...');
    const tx = await registerContractWithSigner.setEchoToken(NEW_ECHO_TOKEN, {
      gasLimit: gasEstimate * 120n / 100n // 增加20%的gas缓冲
    });
    
    console.log(`   交易哈希: ${tx.hash}`);
    console.log('   ⏳ 等待交易确认...');

    // 等待确认
    const receipt = await tx.wait();
    console.log(`   ✅ 交易确认! Gas使用: ${receipt?.gasUsed?.toString()}`);

    // 6. 验证更新结果
    console.log('\n5. ✅ 验证更新结果...');
    const updatedEchoToken = await registerContract.echoToken();
    console.log(`   更新后的ECHO Token地址: ${updatedEchoToken}`);
    
    if (updatedEchoToken.toLowerCase() === NEW_ECHO_TOKEN.toLowerCase()) {
      console.log('   🎉 更新成功！Register合约现在指向正确的ECHO Token地址');
    } else {
      console.log('   ❌ 更新失败，地址仍然不正确');
    }

  } catch (error: any) {
    console.error('❌ 更新失败:', error.message);
    
    if (error.code === 'CALL_EXCEPTION') {
      console.log('\n💡 可能的原因:');
      console.log('1. 当前钱包不是合约所有者');
      console.log('2. 合约可能有其他权限限制');
      console.log('3. 网络连接问题');
    }
    
    throw error;
  }
}

// 运行更新
if (require.main === module) {
  executeRegisterEchoTokenUpdate().catch(console.error);
}

export { executeRegisterEchoTokenUpdate };