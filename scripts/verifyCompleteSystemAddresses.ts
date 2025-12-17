/**
 * 验证整个系统（前端+后端）的合约地址配置
 */

import { readFileSync } from 'fs';

async function verifyCompleteSystemAddresses() {
  console.log('🔍 验证完整系统的合约地址配置...\n');

  // 新的合约地址
  const NEW_ADDRESSES = {
    taskEscrow: '0x162E96b13E122719E90Cf3544E6Eb29DFa834757',
    echoToken: '0x650AAE045552567df9eb0633afd77D44308D3e6D',
    register: '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA',
    universalReward: '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3'
  };

  // 旧的地址（应该不再出现）
  const OLD_ADDRESSES = {
    taskEscrow: '0xE442Eb737983986153E42C9ad28530676d8C1f55',
    echoToken: '0x876E3e3508c8ee669359A0e58A7bADD55530B8B3'
  };

  const filesToCheck = [
    // 前端配置文件
    { path: '.env.zeta', type: 'frontend-env' },
    { path: '.env.local', type: 'frontend-env' },
    { path: 'frontend/src/contracts/addresses.ts', type: 'frontend-config' },
    { path: 'frontend/src/config/contracts.ts', type: 'frontend-config' },
    // 后端配置文件
    { path: 'backend/.env', type: 'backend-env' },
    { path: 'backend/.env.zeta', type: 'backend-env' }
  ];

  let allCorrect = true;

  for (const file of filesToCheck) {
    console.log(`📋 检查 ${file.type}: ${file.path}`);
    
    try {
      const content = readFileSync(file.path, 'utf-8');
      
      // 检查是否包含新地址
      const hasNewTaskEscrow = content.includes(NEW_ADDRESSES.taskEscrow);
      const hasNewEchoToken = content.includes(NEW_ADDRESSES.echoToken);
      
      // 检查是否还包含旧地址
      const hasOldTaskEscrow = content.includes(OLD_ADDRESSES.taskEscrow);
      const hasOldEchoToken = content.includes(OLD_ADDRESSES.echoToken);

      if (file.type === 'frontend-config' && file.path.includes('contracts.ts')) {
        // contracts.ts 只检查 TaskEscrow 地址
        console.log(`   - 新 TaskEscrow 地址: ${hasNewTaskEscrow ? '✅' : '❌'}`);
        console.log(`   - 旧 TaskEscrow 地址: ${hasOldTaskEscrow ? '❌ 仍存在' : '✅ 已清除'}`);
        
        if (!hasNewTaskEscrow || hasOldTaskEscrow) {
          allCorrect = false;
        }
      } else {
        // 其他文件检查所有地址
        console.log(`   - 新 TaskEscrow 地址: ${hasNewTaskEscrow ? '✅' : '❌'}`);
        console.log(`   - 新 ECHO Token 地址: ${hasNewEchoToken ? '✅' : '❌'}`);
        console.log(`   - 旧 TaskEscrow 地址: ${hasOldTaskEscrow ? '❌ 仍存在' : '✅ 已清除'}`);
        console.log(`   - 旧 ECHO Token 地址: ${hasOldEchoToken ? '❌ 仍存在' : '✅ 已清除'}`);

        if (!hasNewTaskEscrow || !hasNewEchoToken || hasOldTaskEscrow || hasOldEchoToken) {
          allCorrect = false;
        }
      }

      if (allCorrect) {
        console.log(`   ✅ ${file.path} 配置正确`);
      } else {
        console.log(`   ⚠️ ${file.path} 需要检查`);
      }

    } catch (error) {
      console.log(`   ❌ 无法读取文件: ${error}`);
      allCorrect = false;
    }
    
    console.log('');
  }

  console.log('📊 验证结果:');
  if (allCorrect) {
    console.log('✅ 所有配置文件中的地址都已正确更新！');
    console.log('\n🚀 系统准备就绪，可以启动前端和后端');
    console.log('\n📋 新的合约地址总结:');
    console.log(`   - TaskEscrow: ${NEW_ADDRESSES.taskEscrow}`);
    console.log(`   - ECHO Token: ${NEW_ADDRESSES.echoToken}`);
    console.log(`   - Register: ${NEW_ADDRESSES.register}`);
    console.log(`   - UniversalReward: ${NEW_ADDRESSES.universalReward}`);
  } else {
    console.log('❌ 部分配置文件需要手动更新');
  }

  return allCorrect;
}

// 如果直接运行此脚本
if (require.main === module) {
  verifyCompleteSystemAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { verifyCompleteSystemAddresses };