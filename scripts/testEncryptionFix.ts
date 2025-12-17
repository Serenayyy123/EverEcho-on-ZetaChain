#!/usr/bin/env npx tsx

/**
 * 测试加密修复：验证公钥验证是否正常工作
 */

import { validateAndNormalizePublicKey, validateEncryptionPubKey } from '../backend/src/services/encryptionService';

async function testEncryptionFix() {
  console.log('🧪 测试加密公钥验证修复');
  console.log('=' .repeat(50));

  const testCases = [
    {
      name: '有效公钥（不含0x）',
      pubKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      shouldPass: true
    },
    {
      name: '有效公钥（含0x）',
      pubKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      shouldPass: true
    },
    {
      name: '无效公钥（太短）',
      pubKey: '1234567890abcdef',
      shouldPass: false
    },
    {
      name: '无效公钥（太长）',
      pubKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
      shouldPass: false
    },
    {
      name: '无效公钥（非hex字符）',
      pubKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeG',
      shouldPass: false
    },
    {
      name: '空公钥',
      pubKey: '',
      shouldPass: false
    },
    {
      name: 'null公钥',
      pubKey: null as any,
      shouldPass: false
    }
  ];

  let passCount = 0;
  let totalCount = testCases.length;

  for (const testCase of testCases) {
    console.log(`\n测试: ${testCase.name}`);
    console.log(`公钥: ${testCase.pubKey}`);
    
    try {
      // 测试旧的验证函数
      const oldResult = validateEncryptionPubKey(testCase.pubKey);
      console.log(`旧验证结果: ${oldResult}`);
      
      // 测试新的严格验证函数
      const newResult = validateAndNormalizePublicKey(testCase.pubKey);
      console.log(`新验证结果: ${newResult}`);
      
      if (testCase.shouldPass) {
        console.log('✅ 通过 - 有效公钥被正确接受');
        passCount++;
      } else {
        console.log('❌ 失败 - 无效公钥应该被拒绝但被接受了');
      }
    } catch (error) {
      if (testCase.shouldPass) {
        console.log(`❌ 失败 - 有效公钥被错误拒绝: ${error.message}`);
      } else {
        console.log(`✅ 通过 - 无效公钥被正确拒绝: ${error.message}`);
        passCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 测试结果: ${passCount}/${totalCount} 通过`);
  
  if (passCount === totalCount) {
    console.log('🎉 所有测试通过！公钥验证修复成功。');
  } else {
    console.log('⚠️ 部分测试失败，需要进一步检查。');
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testEncryptionFix().catch(console.error);
}

export { testEncryptionFix };