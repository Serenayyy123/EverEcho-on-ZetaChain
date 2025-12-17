#!/usr/bin/env tsx

/**
 * 部署增强版TaskEscrow - Method 4实现
 * 完全消除TaskID解析问题的原子化操作
 */

import { ethers } from 'hardhat';
import fs from 'fs';

async function deployEnhancedTaskEscrow() {
  console.log('🚀 Deploying Enhanced TaskEscrow (Method 4)...');

  const [deployer] = await ethers.getSigners();
  console.log('📋 Deploying with account:', deployer.address);

  // 获取现有合约地址
  const addresses = {
    echoToken: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // 更新为正确的ECHOToken地址
    register: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', // 更新为正确的Register地址
    universalReward: '0x5FbDB2315678afecb367f032d93F642f64180aa3' // 使用新部署的UniversalRewardInterface
  };

  try {
    // 1. 部署增强版TaskEscrow
    console.log('📦 Deploying Enhanced TaskEscrow...');
    const TaskEscrowFactory = await ethers.getContractFactory('TaskEscrow');
    const taskEscrow = await TaskEscrowFactory.deploy(
      addresses.echoToken,
      addresses.register
    );
    await taskEscrow.waitForDeployment();
    const taskEscrowAddress = await taskEscrow.getAddress();
    console.log('✅ Enhanced TaskEscrow deployed at:', taskEscrowAddress);

    // 2. 配置UniversalReward地址
    console.log('🔧 Configuring UniversalReward address...');
    const setUniversalRewardTx = await taskEscrow.setUniversalRewardAddress(addresses.universalReward);
    await setUniversalRewardTx.wait();
    console.log('✅ UniversalReward address configured');

    // 3. 验证配置
    const configuredAddress = await taskEscrow.getUniversalRewardAddress();
    console.log('📋 Configured UniversalReward address:', configuredAddress);

    // 4. 更新环境配置
    const envPath = '.env.local';
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // 更新或添加TaskEscrow地址
    const taskEscrowLine = `VITE_TASK_ESCROW_ADDRESS=${taskEscrowAddress}`;
    if (envContent.includes('VITE_TASK_ESCROW_ADDRESS=')) {
      envContent = envContent.replace(/VITE_TASK_ESCROW_ADDRESS=.*/g, taskEscrowLine);
    } else {
      envContent += `\n${taskEscrowLine}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env.local with new TaskEscrow address');

    // 5. 生成合约ABI文件
    console.log('📝 Generating contract ABI...');
    const artifact = await ethers.getContractFactory('TaskEscrow');
    const abi = artifact.interface.formatJson();
    
    const frontendContractsDir = 'frontend/src/contracts';
    if (!fs.existsSync(frontendContractsDir)) {
      fs.mkdirSync(frontendContractsDir, { recursive: true });
    }
    
    fs.writeFileSync(`${frontendContractsDir}/TaskEscrow.json`, JSON.stringify({
      abi: JSON.parse(abi)
    }, null, 2));
    console.log('✅ Generated TaskEscrow.json ABI file');

    console.log('\n🎉 Enhanced TaskEscrow Deployment Summary:');
    console.log('📋 TaskEscrow (Enhanced):', taskEscrowAddress);
    console.log('📋 UniversalReward:', addresses.universalReward);
    console.log('📋 ECHOToken:', addresses.echoToken);
    console.log('📋 Register:', addresses.register);
    console.log('\n✅ Method 4 implementation ready!');
    console.log('✅ TaskID parsing problem COMPLETELY ELIMINATED!');
    console.log('✅ Single transaction atomic operations enabled!');

    return {
      taskEscrow: taskEscrowAddress,
      universalReward: addresses.universalReward,
      echoToken: addresses.echoToken,
      register: addresses.register
    };

  } catch (error) {
    console.error('❌ Enhanced TaskEscrow deployment failed:', error);
    throw error;
  }
}

if (require.main === module) {
  deployEnhancedTaskEscrow()
    .then((addresses) => {
      console.log('\n🎉 Deployment completed successfully!');
      console.log('Addresses:', addresses);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deployEnhancedTaskEscrow };