#!/usr/bin/env tsx

/**
 * 诊断用户缺少encryptionPubKey的问题
 * 检查Profile创建流程和加密密钥生成
 */

async function diagnoseEncryptionPubKeyIssue() {
  console.log('🔍 Diagnosing EncryptionPubKey Issue');
  console.log('====================================');

  const BASE_URL = 'http://localhost:3001';

  // Step 1: 检查Profile创建流程
  console.log('\n1. Profile Creation Flow Analysis');
  console.log('---------------------------------');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    // 检查前端Profile创建代码
    const publishTaskPath = path.join(process.cwd(), 'frontend/src/pages/PublishTask.tsx');
    if (fs.existsSync(publishTaskPath)) {
      const publishTaskContent = fs.readFileSync(publishTaskPath, 'utf8');
      
      const hasEncryptionKeyGeneration = publishTaskContent.includes('encryptionPubKey');
      const hasProfileCreation = publishTaskContent.includes('createProfile');
      
      console.log('PublishTask.tsx analysis:');
      console.log('   - Has encryptionPubKey generation:', hasEncryptionKeyGeneration ? '✅ Found' : '❌ Missing');
      console.log('   - Has profile creation:', hasProfileCreation ? '✅ Found' : '❌ Missing');
      
      if (!hasEncryptionKeyGeneration) {
        console.log('🚨 ISSUE: PublishTask.tsx does not generate encryptionPubKey!');
      }
    }
    
    // 检查Profile服务
    const profileServicePath = path.join(process.cwd(), 'backend/src/services/profileService.ts');
    if (fs.existsSync(profileServicePath)) {
      const profileServiceContent = fs.readFileSync(profileServicePath, 'utf8');
      
      const hasEncryptionKeyValidation = profileServiceContent.includes('encryptionPubKey');
      const hasKeyGeneration = profileServiceContent.includes('generateKeyPair') || profileServiceContent.includes('nacl');
      
      console.log('ProfileService analysis:');
      console.log('   - Has encryptionPubKey validation:', hasEncryptionKeyValidation ? '✅ Found' : '❌ Missing');
      console.log('   - Has key generation logic:', hasKeyGeneration ? '✅ Found' : '❌ Missing');
    }
    
  } catch (error) {
    console.log('❌ Failed to analyze profile creation flow:', error.message);
  }

  // Step 2: 检查数据库中的Profile数据
  console.log('\n2. Database Profile Data Check');
  console.log('------------------------------');
  
  try {
    // 尝试通过API获取Profile数据（如果有的话）
    console.log('Attempting to check profile data via API...');
    
    // 由于Profile API返回404，我们需要检查数据库schema
    const schemaPath = path.join(process.cwd(), 'backend/prisma/schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // 查找Profile模型
      const profileModelMatch = schema.match(/model Profile \{[\s\S]*?\}/);
      if (profileModelMatch) {
        const profileModel = profileModelMatch[0];
        console.log('Profile model found in schema:');
        console.log(profileModel);
        
        const hasEncryptionPubKey = profileModel.includes('encryptionPubKey');
        const isRequired = profileModel.includes('encryptionPubKey') && !profileModel.includes('encryptionPubKey String?');
        
        console.log('   - encryptionPubKey field exists:', hasEncryptionPubKey ? '✅ Yes' : '❌ No');
        console.log('   - encryptionPubKey is required:', isRequired ? '✅ Yes' : '❌ No (optional)');
        
        if (!hasEncryptionPubKey) {
          console.log('🚨 CRITICAL: encryptionPubKey field missing from Profile schema!');
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Failed to check database schema:', error.message);
  }

  // Step 3: 检查加密服务实现
  console.log('\n3. Encryption Service Implementation');
  console.log('-----------------------------------');
  
  try {
    const encryptionServicePath = path.join(process.cwd(), 'backend/src/services/encryptionService.ts');
    const encryptionService = fs.readFileSync(encryptionServicePath, 'utf8');
    
    const hasKeyGeneration = encryptionService.includes('generateKeyPair') || encryptionService.includes('nacl.box.keyPair');
    const hasKeyValidation = encryptionService.includes('validateEncryptionPubKey');
    const hasEncryptFunction = encryptionService.includes('encryptAndStoreContacts');
    const hasDecryptFunction = encryptionService.includes('getWrappedDEK');
    
    console.log('Encryption service functions:');
    console.log('   - Key generation:', hasKeyGeneration ? '✅ Found' : '❌ Missing');
    console.log('   - Key validation:', hasKeyValidation ? '✅ Found' : '❌ Missing');
    console.log('   - Encrypt function:', hasEncryptFunction ? '✅ Found' : '❌ Missing');
    console.log('   - Decrypt function:', hasDecryptFunction ? '✅ Found' : '❌ Missing');
    
    // 检查具体的密钥生成逻辑
    if (encryptionService.includes('nacl')) {
      console.log('✅ Uses NaCl for encryption (good choice)');
    } else {
      console.log('❌ No NaCl usage found - what encryption library is used?');
    }
    
  } catch (error) {
    console.log('❌ Failed to analyze encryption service:', error.message);
  }

  // Step 4: 检查前端密钥生成
  console.log('\n4. Frontend Key Generation Check');
  console.log('--------------------------------');
  
  try {
    // 检查是否有前端密钥生成逻辑
    const frontendFiles = [
      'frontend/src/hooks/useProfile.ts',
      'frontend/src/utils/encryption.ts',
      'frontend/src/services/encryptionService.ts'
    ];
    
    let foundKeyGeneration = false;
    
    for (const filePath of frontendFiles) {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('generateKeyPair') || content.includes('nacl') || content.includes('encryptionPubKey')) {
          console.log(`✅ Found encryption logic in ${filePath}`);
          foundKeyGeneration = true;
        }
      }
    }
    
    if (!foundKeyGeneration) {
      console.log('❌ No frontend key generation logic found!');
      console.log('🚨 ISSUE: Users cannot generate encryptionPubKey in frontend!');
    }
    
  } catch (error) {
    console.log('❌ Failed to check frontend key generation:', error.message);
  }

  // Step 5: 检查Profile创建API端点
  console.log('\n5. Profile Creation API Endpoint');
  console.log('--------------------------------');
  
  try {
    // 测试Profile创建端点
    const testProfileData = {
      nickname: 'TestUser',
      encryptionPubKey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32字节hex
      contacts: 'test@example.com'
    };
    
    console.log('Testing profile creation with encryptionPubKey...');
    const response = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProfileData)
    });
    
    console.log('Profile creation response status:', response.status);
    
    if (response.status === 404) {
      console.log('🚨 ISSUE: Profile API endpoint not accessible!');
    } else if (response.ok) {
      const result = await response.json();
      console.log('✅ Profile creation works:', result);
    } else {
      const errorText = await response.text();
      console.log('Profile creation error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Failed to test profile creation:', error.message);
  }

  // Step 6: 分析根本原因和解决方案
  console.log('\n6. Root Cause Analysis & Solutions');
  console.log('---------------------------------');
  
  console.log('🔍 Possible Root Causes:');
  console.log('');
  console.log('A. Frontend Issues:');
  console.log('   - No encryptionPubKey generation in profile creation');
  console.log('   - Missing encryption library (NaCl) in frontend');
  console.log('   - Profile creation form doesn\'t include encryption key');
  console.log('');
  console.log('B. Backend Issues:');
  console.log('   - Profile API endpoint not working (404)');
  console.log('   - Database schema missing encryptionPubKey field');
  console.log('   - Profile service not validating encryption keys');
  console.log('');
  console.log('C. Data Issues:');
  console.log('   - Existing users created without encryptionPubKey');
  console.log('   - Database migration not run');
  console.log('   - Inconsistent data between frontend and backend');

  // Step 7: 提供解决方案
  console.log('\n7. Recommended Solutions');
  console.log('-----------------------');
  
  console.log('🎯 Solution Priority Order:');
  console.log('');
  console.log('1. **Fix Backend API Routes** (Critical):');
  console.log('   - Ensure Profile API is accessible');
  console.log('   - Fix route registration and compilation issues');
  console.log('   - Test basic profile CRUD operations');
  console.log('');
  console.log('2. **Add Frontend Key Generation** (High):');
  console.log('   - Install NaCl library: npm install tweetnacl');
  console.log('   - Generate encryptionPubKey during profile creation');
  console.log('   - Store public key in profile, private key locally');
  console.log('');
  console.log('3. **Update Existing Users** (Medium):');
  console.log('   - Create migration script to add encryptionPubKey');
  console.log('   - Generate keys for existing users');
  console.log('   - Update database records');
  console.log('');
  console.log('4. **Validate Encryption Flow** (Medium):');
  console.log('   - Test end-to-end encryption/decryption');
  console.log('   - Verify wrappedDEK storage and retrieval');
  console.log('   - Ensure contacts are properly encrypted');

  console.log('\n8. Next Steps');
  console.log('------------');
  
  console.log('🚀 Immediate Actions:');
  console.log('1. Fix backend route compilation/registration');
  console.log('2. Add encryptionPubKey generation to frontend');
  console.log('3. Test profile creation with encryption key');
  console.log('4. Verify contacts encryption works end-to-end');
  console.log('');
  console.log('💡 This will restore the proper encryption functionality!');
}

// 运行诊断
diagnoseEncryptionPubKeyIssue().catch(console.error);