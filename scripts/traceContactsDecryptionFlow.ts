#!/usr/bin/env tsx

/**
 * 追踪联系方式解密的完整逻辑链路
 * 分析加密公钥获取和解密流程中的每个环节
 */

async function traceContactsDecryptionFlow() {
  console.log('🔍 Tracing Complete Contacts Decryption Flow');
  console.log('==============================================');

  const BASE_URL = 'http://localhost:3001';

  // Step 1: 分析联系方式解密的完整流程
  console.log('\n1. Contacts Decryption Flow Analysis');
  console.log('------------------------------------');
  
  console.log('📋 Expected Flow:');
  console.log('   1. User clicks "View Contacts"');
  console.log('   2. Frontend generates signature message');
  console.log('   3. User signs with MetaMask');
  console.log('   4. Frontend calls POST /api/contacts/decrypt');
  console.log('   5. Backend validates signature');
  console.log('   6. Backend checks task status on chain');
  console.log('   7. Backend verifies user is participant');
  console.log('   8. Backend gets wrappedDEK for user');
  console.log('   9. Backend returns decrypted contacts');

  // Step 2: 检查数据库中的加密数据
  console.log('\n2. Database Encryption Data Check');
  console.log('---------------------------------');
  
  try {
    // 检查是否有测试任务
    const tasksResponse = await fetch(`${BASE_URL}/api/task`);
    if (tasksResponse.ok) {
      console.log('✅ Tasks API accessible');
    } else {
      console.log('❌ Tasks API not accessible:', tasksResponse.status);
    }
  } catch (error) {
    console.log('❌ Failed to check tasks API:', error.message);
  }

  // Step 3: 检查Profile中的加密公钥
  console.log('\n3. Profile Encryption Keys Check');
  console.log('--------------------------------');
  
  console.log('🔍 Key Questions:');
  console.log('   - Do users have encryptionPubKey in their profiles?');
  console.log('   - Are tasks properly encrypted with both creator and helper keys?');
  console.log('   - Are wrappedDEKs stored in the database?');

  // Step 4: 检查加密服务
  console.log('\n4. Encryption Service Analysis');
  console.log('------------------------------');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const encryptionServicePath = path.join(process.cwd(), 'backend/src/services/encryptionService.ts');
    const encryptionService = fs.readFileSync(encryptionServicePath, 'utf8');
    
    const hasGetWrappedDEK = encryptionService.includes('getWrappedDEK');
    const hasValidateEncryptionPubKey = encryptionService.includes('validateEncryptionPubKey');
    const hasEncryptAndStoreContacts = encryptionService.includes('encryptAndStoreContacts');
    
    console.log('✅ Encryption service functions:');
    console.log('   - getWrappedDEK:', hasGetWrappedDEK ? 'Found' : 'Missing');
    console.log('   - validateEncryptionPubKey:', hasValidateEncryptionPubKey ? 'Found' : 'Missing');
    console.log('   - encryptAndStoreContacts:', hasEncryptAndStoreContacts ? 'Found' : 'Missing');
    
  } catch (error) {
    console.log('❌ Failed to analyze encryption service:', error.message);
  }

  // Step 5: 检查联系方式路由的具体实现
  console.log('\n5. Contacts Route Implementation Check');
  console.log('-------------------------------------');
  
  try {
    const contactsRoutePath = path.join(process.cwd(), 'backend/src/routes/contacts.ts');
    const contactsRoute = fs.readFileSync(contactsRoutePath, 'utf8');
    
    const hasDecryptRoute = contactsRoute.includes('router.post(\'/decrypt\'');
    const hasSignatureVerification = contactsRoute.includes('verifySignature');
    const hasChainStatusCheck = contactsRoute.includes('getTaskOnChainStatus');
    const hasParticipantCheck = contactsRoute.includes('checkTaskParticipant');
    const hasWrappedDEKRetrieval = contactsRoute.includes('getWrappedDEK');
    
    console.log('✅ Contacts route implementation:');
    console.log('   - Decrypt endpoint:', hasDecryptRoute ? 'Found' : 'Missing');
    console.log('   - Signature verification:', hasSignatureVerification ? 'Found' : 'Missing');
    console.log('   - Chain status check:', hasChainStatusCheck ? 'Found' : 'Missing');
    console.log('   - Participant check:', hasParticipantCheck ? 'Found' : 'Missing');
    console.log('   - WrappedDEK retrieval:', hasWrappedDEKRetrieval ? 'Found' : 'Missing');
    
  } catch (error) {
    console.log('❌ Failed to analyze contacts route:', error.message);
  }

  // Step 6: 测试具体的解密端点
  console.log('\n6. Decrypt Endpoint Detailed Test');
  console.log('---------------------------------');
  
  try {
    // 测试不同的错误情况
    console.log('Testing with empty payload...');
    const emptyResponse = await fetch(`${BASE_URL}/api/contacts/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.log('Empty payload response:', emptyResponse.status);
    
    console.log('Testing with minimal payload...');
    const minimalResponse = await fetch(`${BASE_URL}/api/contacts/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: '1',
        address: '0x0000000000000000000000000000000000000000',
        signature: 'test',
        message: 'test'
      })
    });
    console.log('Minimal payload response:', minimalResponse.status);
    
    if (minimalResponse.status !== 404) {
      const responseText = await minimalResponse.text();
      console.log('Response body:', responseText.substring(0, 200));
    }
    
  } catch (error) {
    console.log('❌ Failed to test decrypt endpoint:', error.message);
  }

  // Step 7: 分析可能的根本原因
  console.log('\n7. Root Cause Analysis');
  console.log('----------------------');
  
  console.log('🚨 Possible Issues:');
  console.log('');
  console.log('A. Missing Encryption Keys:');
  console.log('   - Users don\'t have encryptionPubKey in profiles');
  console.log('   - Tasks were created without proper encryption');
  console.log('   - WrappedDEKs not stored during task creation');
  console.log('');
  console.log('B. Database Schema Issues:');
  console.log('   - Missing encryption-related tables/columns');
  console.log('   - Prisma schema not up to date');
  console.log('   - Database migration not run');
  console.log('');
  console.log('C. Service Integration Issues:');
  console.log('   - Encryption service not properly integrated');
  console.log('   - Chain service not working correctly');
  console.log('   - Auth service signature verification failing');
  console.log('');
  console.log('D. Data Consistency Issues:');
  console.log('   - Tasks exist on chain but not in database');
  console.log('   - Profiles exist but without encryption keys');
  console.log('   - Contacts encrypted but keys lost');

  // Step 8: 推荐的稳健解决方案
  console.log('\n8. Robust Solution Recommendations');
  console.log('----------------------------------');
  
  console.log('🎯 Most Robust Approaches:');
  console.log('');
  console.log('Option 1: Simplified Contacts (Recommended)');
  console.log('   - Store contacts in plain text in creator profile');
  console.log('   - Only show to task participants after task starts');
  console.log('   - No encryption complexity, just access control');
  console.log('   - Pros: Simple, reliable, easy to debug');
  console.log('   - Cons: Less privacy (but still access-controlled)');
  console.log('');
  console.log('Option 2: Fix Current Encryption System');
  console.log('   - Ensure all users have encryption keys');
  console.log('   - Re-encrypt existing tasks with proper keys');
  console.log('   - Add comprehensive key management');
  console.log('   - Pros: Full privacy, secure');
  console.log('   - Cons: Complex, many failure points');
  console.log('');
  console.log('Option 3: Hybrid Approach');
  console.log('   - Use simple contacts for existing tasks');
  console.log('   - Implement encryption for new tasks only');
  console.log('   - Gradual migration to encrypted system');
  console.log('   - Pros: Backward compatible, progressive');
  console.log('   - Cons: Two systems to maintain');

  console.log('\n9. Immediate Action Items');
  console.log('------------------------');
  
  console.log('🚀 Next Steps:');
  console.log('1. Run database inspection script');
  console.log('2. Check if users have encryption keys');
  console.log('3. Verify task encryption status');
  console.log('4. Choose and implement robust solution');
  console.log('');
  console.log('💡 Quick Fix for Testing:');
  console.log('   - Temporarily disable encryption');
  console.log('   - Use plain text contacts with access control');
  console.log('   - Get basic functionality working first');
  console.log('   - Add encryption back later if needed');
}

// 运行分析
traceContactsDecryptionFlow().catch(console.error);