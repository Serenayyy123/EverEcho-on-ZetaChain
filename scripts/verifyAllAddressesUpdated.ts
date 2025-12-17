/**
 * 验证所有配置文件中的合约地址都已更新
 */

import { readFileSync } from 'fs';
import { join } from 'path';

async function verifyAllAddressesUpdated() {
  console.log('🔍 验证所有配置文件中的合约地址...\n');

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
    '.env.zeta',
    '.env.local',
    'frontend/src/contracts/addresses.ts',
    'frontend/src/config/contracts.ts'
  ];

  let allCorrect = true;

  for (const filePath of filesToCheck) {
    console.log(`📋 检查文件: ${filePath}`);
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // 检查是否包含新地址
      const hasNewTaskEscrow = content.includes(NEW_ADDRESSES.taskEscrow);
      const hasNewEchoToken = content.includes(NEW_ADDRESSES.echoToken);
      
      // 检查是否还包含旧地址
      const hasOldTaskEscrow = content.includes(OLD_ADDRESSES.taskEscrow);
      const hasOldEchoToken = content.includes(OLD_ADDRESSES.echoToken);

      // 对于 contracts.ts 文件，只检查 TaskEscrow 地址
      if (filePath.includes('contracts.ts')) {
        console.log(`   - 新 TaskEscrow 地址: ${hasNewTaskEscrow ? '✅' : '❌'}`);
        console.log(`   - 旧 TaskEscrow 地址: ${hasOldTaskEscrow ? '❌ 仍存在' : '✅ 已清除'}`);
        
        if (!hasNewTaskEscrow || hasOldTaskEscrow) {
          allCorrect = false;
          console.log(`   ⚠️ 文件 ${filePath} 需要更新`);
        } else {
          console.log(`   ✅ 文件 ${filePath} 地址正确`);
        }
      } else {
        // 其他文件检查所有地址
        console.log(`   - 新 TaskEscrow 地址: ${hasNewTaskEscrow ? '✅' : '❌'}`);
        console.log(`   - 新 ECHO Token 地址: ${hasNewEchoToken ? '✅' : '❌'}`);
        console.log(`   - 旧 TaskEscrow 地址: ${hasOldTaskEscrow ? '❌ 仍存在' : '✅ 已清除'}`);
        console.log(`   - 旧 ECHO Token 地址: ${hasOldEchoToken ? '❌ 仍存在' : '✅ 已清除'}`);

        if (!hasNewTaskEscrow || !hasNewEchoToken || hasOldTaskEscrow || hasOldEchoToken) {
          allCorrect = false;
          console.log(`   ⚠️ 文件 ${filePath} 需要更新`);
        } else {
          console.log(`   ✅ 文件 ${filePath} 地址正确`);
        }
      }

    } catch (error) {
      console.log(`   ❌ 无法读取文件: ${error}`);
      allCorrect = false;
    }
    
    console.log('');
  }

  // 验证 addresses.ts 中的具体配置
  console.log('🔍 验证 addresses.ts 中的具体配置...');
  try {
    const addressesPath = 'frontend/src/contracts/addresses.ts';
    const addressesContent = readFileSync(addressesPath, 'utf-8');
    
    // 检查 ZetaChain 配置
    const zetaConfigMatch = addressesContent.match(/if \(chainId === 7001\) \{[\s\S]*?\}/);
    if (zetaConfigMatch) {
      const zetaConfig = zetaConfigMatch[0];
      console.log('   ZetaChain 配置:');
      console.log(`   - TaskEscrow: ${zetaConfig.includes(NEW_ADDRESSES.taskEscrow) ? '✅' : '❌'}`);
      console.log(`   - ECHO Token: ${zetaConfig.includes(NEW_ADDRESSES.echoToken) ? '✅' : '❌'}`);
      console.log(`   - Register: ${zetaConfig.includes(NEW_ADDRESSES.register) ? '✅' : '❌'}`);
      console.log(`   - UniversalReward: ${zetaConfig.includes(NEW_ADDRESSES.universalReward) ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.log(`   ❌ 无法验证 addresses.ts: ${error}`);
    allCorrect = false;
  }

  console.log('\n📊 验证结果:');
  if (allCorrect) {
    console.log('✅ 所有配置文件中的地址都已正确更新！');
    console.log('\n🚀 可以安全地重启前端应用了');
    console.log('\n💡 下一步操作:');
    console.log('   1. 重启前端: npm run dev');
    console.log('   2. 测试 confirm complete 功能');
  } else {
    console.log('❌ 部分配置文件需要手动更新');
    console.log('\n🔧 需要更新的地址:');
    console.log(`   - 新 TaskEscrow: ${NEW_ADDRESSES.taskEscrow}`);
    console.log(`   - 新 ECHO Token: ${NEW_ADDRESSES.echoToken}`);
  }

  return allCorrect;
}

// 如果直接运行此脚本
if (require.main === module) {
  verifyAllAddressesUpdated()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { verifyAllAddressesUpdated };