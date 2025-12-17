/**
 * 使用Hardhat部署新的Register合约
 */

import { ethers } from 'hardhat';

const CORRECT_ECHO_TOKEN = '0x650AAE045552567df9eb0633afd77D44308D3e6D';
const OLD_REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';

async function deployNewRegisterContract() {
  console.log('🚀 使用Hardhat重新部署Register合约...\n');

  console.log(`📋 使用ECHO Token地址: ${CORRECT_ECHO_TOKEN}`);
  console.log(`📋 旧Register合约地址: ${OLD_REGISTER_ADDRESS}\n`);

  try {
    // 获取部署者账户
    const [deployer] = await ethers.getSigners();
    console.log(`👤 部署者地址: ${deployer.address}`);

    // 检查余额
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`💰 账户余额: ${ethers.formatEther(balance)} ZETA`);

    if (balance < ethers.parseEther('0.01')) {
      throw new Error('账户余额不足，需要至少0.01 ZETA用于部署');
    }

    // 1. 验证ECHO Token地址
    console.log('\n1. 📡 验证ECHO Token合约...');
    try {
      // 尝试调用一个简单的函数来验证合约存在
      const code = await deployer.provider.getCode(CORRECT_ECHO_TOKEN);
      if (code === '0x') {
        throw new Error('ECHO Token合约不存在');
      }
      console.log(`   ✅ ECHO Token合约验证成功`);
    } catch (error) {
      throw new Error(`ECHO Token合约验证失败: ${error}`);
    }

    // 2. 部署新的Register合约
    console.log('\n2. 🚀 部署新的Register合约...');
    
    const RegisterFactory = await ethers.getContractFactory('Register');
    
    console.log('   📤 发送部署交易...');
    const registerContract = await RegisterFactory.deploy(CORRECT_ECHO_TOKEN);
    
    console.log(`   交易哈希: ${registerContract.deploymentTransaction()?.hash}`);
    console.log('   ⏳ 等待部署确认...');

    // 等待部署完成
    await registerContract.waitForDeployment();
    const newRegisterAddress = await registerContract.getAddress();
    
    console.log(`   ✅ Register合约部署成功!`);
    console.log(`   📍 新合约地址: ${newRegisterAddress}`);

    // 3. 验证部署结果
    console.log('\n3. ✅ 验证部署结果...');
    const deployedEchoToken = await registerContract.echoToken();
    console.log(`   Register.echoToken(): ${deployedEchoToken}`);
    
    if (deployedEchoToken.toLowerCase() === CORRECT_ECHO_TOKEN.toLowerCase()) {
      console.log('   ✅ ECHO Token地址配置正确!');
    } else {
      console.log('   ❌ ECHO Token地址配置错误!');
      throw new Error('ECHO Token地址配置不正确');
    }

    // 4. 测试基本功能
    console.log('\n4. 🧪 测试基本功能...');
    try {
      const isRegistered = await registerContract.isRegistered(deployer.address);
      console.log(`   部署者注册状态: ${isRegistered ? '已注册' : '未注册'}`);
      console.log('   ✅ 基本功能测试通过');
    } catch (error) {
      console.log(`   ⚠️  基本功能测试失败: ${error}`);
    }

    // 5. 生成配置更新指令
    console.log('\n5. 📝 需要更新的配置...');
    console.log('');
    console.log('=== frontend/src/contracts/addresses.ts ===');
    console.log(`将Register地址从 '${OLD_REGISTER_ADDRESS}' 更新为:`);
    console.log(`register: '${newRegisterAddress}',`);
    console.log('');
    console.log('=== backend/.env ===');
    console.log('添加或更新:');
    console.log(`REGISTER_CONTRACT_ADDRESS=${newRegisterAddress}`);
    console.log('');
    console.log('=== TaskEscrow合约配置 ===');
    console.log('如果TaskEscrow合约引用Register地址，也需要更新');

    // 6. 数据迁移建议
    console.log('\n6. 📋 数据迁移建议...');
    console.log('⚠️  重要提醒:');
    console.log('1. 新Register合约是全新的，没有历史数据');
    console.log('2. 现有用户需要重新注册');
    console.log('3. 或者创建数据迁移脚本从旧合约复制数据');
    console.log('4. 建议在更新前通知所有用户');

    // 7. 下一步操作
    console.log('\n7. 🎯 下一步操作...');
    console.log('1. 更新前端配置文件');
    console.log('2. 更新后端配置文件');
    console.log('3. 重新启动前端和后端服务');
    console.log('4. 测试用户注册功能');
    console.log('5. 验证ECHO Token mint功能正常');

    return {
      oldRegisterAddress: OLD_REGISTER_ADDRESS,
      newRegisterAddress,
      echoTokenAddress: CORRECT_ECHO_TOKEN,
      deploymentHash: registerContract.deploymentTransaction()?.hash
    };

  } catch (error: any) {
    console.error('❌ 部署失败:', error.message);
    throw error;
  }
}

// 运行部署
if (require.main === module) {
  deployNewRegisterContract().catch(console.error);
}

export { deployNewRegisterContract };