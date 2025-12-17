#!/usr/bin/env tsx

/**
 * 检查数据库中的加密数据和密钥状态
 * 确定联系方式解密失败的根本原因
 */

async function inspectEncryptionData() {
  console.log('🔍 Inspecting Encryption Data and Keys');
  console.log('======================================');

  const BASE_URL = 'http://localhost:3001';

  // Step 1: 检查数据库连接和基本数据
  console.log('\n1. Database Connection and Basic Data');
  console.log('------------------------------------');
  
  try {
    // 尝试通过健康检查了解数据库状态
    const healthResponse = await fetch(`${BASE_URL}/healthz`);
    const healthData = await healthResponse.json();
    console.log('Database status:', healthData.checks?.database || 'unknown');
    
    if (healthData.checks?.database !== 'ok') {
      console.log('🚨 Database connection issue detected!');
      return;
    }
    
  } catch (error) {
    console.log('❌ Failed to check database status:', error.message);
    return;
  }

  // Step 2: 检查任务API是否工作
  console.log('\n2. Task API Accessibility');
  console.log('-------------------------');
  
  try {
    // 尝试获取任务列表
    const tasksResponse = await fetch(`${BASE_URL}/api/task`);
    console.log('Tasks API status:', tasksResponse.status);
    
    if (tasksResponse.status === 404) {
      console.log('🚨 Tasks API returns 404 - route not found!');
      console.log('💡 This suggests the task routes are not properly registered');
    } else if (tasksResponse.ok) {
      const tasks = await tasksResponse.json();
      console.log('✅ Tasks API working, found', Array.isArray(tasks) ? tasks.length : 'unknown', 'tasks');
    }
    
  } catch (error) {
    console.log('❌ Failed to check tasks API:', error.message);
  }

  // Step 3: 检查Profile API
  console.log('\n3. Profile API Check');
  console.log('-------------------');
  
  try {
    const profileResponse = await fetch(`${BASE_URL}/api/profile`);
    console.log('Profile API status:', profileResponse.status);
    
    if (profileResponse.status === 404) {
      console.log('🚨 Profile API returns 404 - route not found!');
    }
    
  } catch (error) {
    console.log('❌ Failed to check profile API:', error.message);
  }

  // Step 4: 检查后端路由注册
  console.log('\n4. Backend Route Registration Analysis');
  console.log('-------------------------------------');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const indexPath = path.join(process.cwd(), 'backend/src/index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    const hasTaskRoutes = indexContent.includes('app.use(\'/api/task\'');
    const hasProfileRoutes = indexContent.includes('app.use(\'/api/profile\'');
    const hasContactsRoutes = indexContent.includes('app.use(\'/api/contacts\'');
    
    console.log('Route registrations in backend/src/index.ts:');
    console.log('   - Task routes:', hasTaskRoutes ? '✅ Found' : '❌ Missing');
    console.log('   - Profile routes:', hasProfileRoutes ? '✅ Found' : '❌ Missing');
    console.log('   - Contacts routes:', hasContactsRoutes ? '✅ Found' : '❌ Missing');
    
    if (!hasTaskRoutes) {
      console.log('🚨 Task routes not registered - this explains the 404!');
    }
    
  } catch (error) {
    console.log('❌ Failed to analyze route registration:', error.message);
  }

  // Step 5: 检查数据库schema
  console.log('\n5. Database Schema Check');
  console.log('-----------------------');
  
  try {
    const schemaPath = path.join(process.cwd(), 'backend/prisma/schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      const hasProfileModel = schema.includes('model Profile');
      const hasTaskModel = schema.includes('model Task');
      const hasEncryptionPubKey = schema.includes('encryptionPubKey');
      const hasContactsEncrypted = schema.includes('contactsEncryptedPayload');
      const hasWrappedDEK = schema.includes('wrappedDEK') || schema.includes('WrappedDEK');
      
      console.log('Database schema analysis:');
      console.log('   - Profile model:', hasProfileModel ? '✅ Found' : '❌ Missing');
      console.log('   - Task model:', hasTaskModel ? '✅ Found' : '❌ Missing');
      console.log('   - encryptionPubKey field:', hasEncryptionPubKey ? '✅ Found' : '❌ Missing');
      console.log('   - contactsEncryptedPayload:', hasContactsEncrypted ? '✅ Found' : '❌ Missing');
      console.log('   - wrappedDEK related:', hasWrappedDEK ? '✅ Found' : '❌ Missing');
      
      if (!hasEncryptionPubKey) {
        console.log('🚨 Missing encryptionPubKey field - users can\'t encrypt/decrypt!');
      }
      
    } else {
      console.log('❌ Prisma schema file not found');
    }
    
  } catch (error) {
    console.log('❌ Failed to analyze database schema:', error.message);
  }

  // Step 6: 测试简化的联系方式方案
  console.log('\n6. Testing Simplified Contacts Approach');
  console.log('---------------------------------------');
  
  console.log('💡 Proposed Simplified Solution:');
  console.log('');
  console.log('Instead of complex encryption:');
  console.log('1. Store contacts in creator\'s profile (plain text)');
  console.log('2. Only show to task participants');
  console.log('3. Use blockchain status for access control');
  console.log('4. No encryption keys needed');
  console.log('');
  console.log('Benefits:');
  console.log('✅ No encryption complexity');
  console.log('✅ No key management issues');
  console.log('✅ Easy to debug and maintain');
  console.log('✅ Still secure (access controlled)');
  console.log('✅ Works with existing data');

  // Step 7: 检查现有的测试端点
  console.log('\n7. Testing Alternative Endpoints');
  console.log('--------------------------------');
  
  try {
    // 检查是否有测试端点
    const testResponse = await fetch(`${BASE_URL}/api/contacts/test-decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: '1',
        userAddress: '0x0000000000000000000000000000000000000000'
      })
    });
    
    console.log('Test decrypt endpoint status:', testResponse.status);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Test endpoint works:', testData.success ? 'Success' : 'Failed');
    }
    
  } catch (error) {
    console.log('Test endpoint not available or failed:', error.message);
  }

  // Step 8: 最终建议
  console.log('\n8. Final Recommendations');
  console.log('------------------------');
  
  console.log('🎯 Most Robust Solution:');
  console.log('');
  console.log('OPTION A: Quick Fix (Recommended)');
  console.log('1. Modify contacts route to use simple access control');
  console.log('2. Get contacts from creator profile (plain text)');
  console.log('3. Verify user is task participant via blockchain');
  console.log('4. Return contacts directly (no encryption)');
  console.log('');
  console.log('OPTION B: Fix Encryption System');
  console.log('1. Ensure all routes are properly registered');
  console.log('2. Run database migrations');
  console.log('3. Add encryption keys to all users');
  console.log('4. Re-encrypt all existing tasks');
  console.log('');
  console.log('💡 Recommendation: Start with Option A');
  console.log('   - Get basic functionality working');
  console.log('   - Add encryption later if privacy is critical');
  console.log('   - Much more reliable and maintainable');
}

// 运行检查
inspectEncryptionData().catch(console.error);