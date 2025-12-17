/**
 * 更新ECHO代币合约中的TaskEscrow地址
 */

import { ethers } from 'hardhat';

async function updateEchoTokenTaskEscrowAddress() {
  console.log('🔧 更新ECHO代币合约中的TaskEscrow地址...\n');

  const NEW_TASK_ESCROW_ADDRESS = '0xfdDA7D1bD796FfD790d43CFE3104938A7Ed3A3eB';
  const ECHO_TOKEN_ADDRESS = '0x876E3e3508c8ee669359A0e58A7bADD55530B8B3';

  const [deployer] = await ethers.getSigners();
  console.log(`📋 操作信息:`);
  console.log(`   - 操作者地址: ${deployer.address}`);
  console.log(`   - ECHO代币地址: ${ECHO_TOKEN_ADDRESS}`);
  console.log(`   - 新TaskEscrow地址: ${NEW_TASK_ESCROW_ADDRESS}\n`);

  try {
    // 连接到ECHO代币合约
    const ECHO_TOKEN_ABI = [
      'function taskEscrowAddress() view returns (address)',
      'function setTaskEscrowAddress(address) external',
      'function owner() view returns (address)'
    ];

    const echoToken = await ethers.getContractAt('EOCHOToken', ECHO_TOKEN_ADDRESS);

    // 1. 检查当前配置
    console.log('🔍 检查当前配置:');
    const currentTaskEscrow = await echoToken.taskEscrowAddress();
    const owner = await echoToken.owner();
    
    console.log(`   - 当前TaskEscrow地址: ${currentTaskEscrow}`);
    console.log(`   - 合约所有者: ${owner}`);
    console.log(`   - 操作者地址: ${deployer.address}`);
    
    const isOwner = owner.toLowerCase() === deployer.address.toLowerCase();
    console.log(`   - 是否为所有者: ${isOwner ? '✅' : '❌'}`);

    if (!isOwner) {
      throw new Error('只有合约所有者可以更新TaskEscrow地址');
    }

    // 2. 更新TaskEscrow地址
    console.log('\n🔧 更新TaskEscrow地址...');
    const tx = await echoToken.setTaskEscrowAddress(NEW_TASK_ESCROW_ADDRESS);
    console.log(`   - 交易哈希: ${tx.hash}`);
    
    console.log('   - 等待交易确认...');
    await tx.wait();
    console.log('   ✅ 交易已确认');

    // 3. 验证更新
    console.log('\n🔍 验证更新结果:');
    const updatedTaskEscrow = await echoToken.taskEscrowAddress();
    console.log(`   - 更新后的TaskEscrow地址: ${updatedTaskEscrow}`);
    
    const updateSuccess = updatedTaskEscrow.toLowerCase() === NEW_TASK_ESCROW_ADDRESS.toLowerCase();
    console.log(`   - 更新成功: ${updateSuccess ? '✅' : '❌'}`);

    if (!updateSuccess) {
      throw new Error('TaskEscrow地址更新失败');
    }

    console.log('\n🎉 ECHO代币合约配置更新完成！');
    console.log('\n📋 更新摘要:');
    console.log(`   - 旧TaskEscrow地址: ${currentTaskEscrow}`);
    console.log(`   - 新TaskEscrow地址: ${updatedTaskEscrow}`);

    return {
      oldAddress: currentTaskEscrow,
      newAddress: updatedTaskEscrow,
      success: updateSuccess
    };

  } catch (error: any) {
    console.error('❌ 更新失败:', error.message);
    throw error;
  }
}

updateEchoTokenTaskEscrowAddress().catch(console.error);