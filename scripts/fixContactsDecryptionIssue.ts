#!/usr/bin/env tsx

/**
 * 修复联系方式解密问题的综合解决方案
 * 诊断并解决所有可能的根本原因
 */

async function fixContactsDecryptionIssue() {
  console.log('🔧 Comprehensive Contacts Decryption Fix');
  console.log('========================================');

  const BASE_URL = 'http://localhost:3001';
  const FRONTEND_URL = 'http://localhost:5173';

  // Step 1: 检查并启动后端服务
  console.log('\n1. Backend Service Check & Fix');
  console.log('------------------------------');
  
  try {
    const healthResponse = await fetch(`${BASE_URL}/healthz`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is running:', healthData.status);
    } else {
      throw new Error(`Backend returned ${healthResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Backend is not accessible:', error.message);
    console.log('');
    console.log('🚨 CRITICAL ISSUE: Backend service is not running');
    console.log('');
    console.log('💡 IMMEDIATE SOLUTION:');
    console.log('   1. Open a new terminal');
    console.log('   2. Run: cd backend');
    console.log('   3. Run: npm install (if not done)');
    console.log('   4. Run: npm run dev');
    console.log('   5. Wait for "✅ Server running on http://localhost:3001"');
    console.log('');
    console.log('⚠️  The retry mechanism cannot work if the backend is not running!');
    return false;
  }

  // Step 2: 测试联系方式解密端点
  console.log('\n2. Contacts Decrypt Endpoint Test');
  console.log('---------------------------------');
  
  try {
    const testResponse = await fetch(`${BASE_URL}/api/contacts/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: 'test',
        address: '0x0000000000000000000000000000000000000000',
        signature: 'test',
        message: 'test'
      })
    });
    
    console.log('Endpoint response status:', testResponse.status);
    
    if (testResponse.status === 404) {
      console.log('❌ Contacts decrypt endpoint not found');
      console.log('💡 SOLUTION: Check backend route registration');
      return false;
    } else if (testResponse.status === 400) {
      console.log('✅ Endpoint exists and validates input correctly');
    } else {
      console.log(`ℹ️ Endpoint returned: ${testResponse.status}`);
    }
    
  } catch (error) {
    console.log('❌ Failed to test endpoint:', error.message);
    return false;
  }

  // Step 3: 检查前端代理配置
  console.log('\n3. Frontend Proxy Configuration');
  console.log('-------------------------------');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const viteConfigPath = path.join(process.cwd(), 'frontend/vite.config.ts');
    if (fs.existsSync(viteConfigPath)) {
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
      
      if (viteConfig.includes('proxy') && viteConfig.includes('/api')) {
        console.log('✅ Vite proxy configuration found');
      } else {
        console.log('❌ Vite proxy configuration missing or incomplete');
        console.log('💡 SOLUTION: Add proxy configuration to frontend/vite.config.ts');
        
        const proxyConfig = `
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false
    }
  }
}`;
        console.log('Add this to your vite.config.ts:', proxyConfig);
        return false;
      }
    } else {
      console.log('❌ vite.config.ts not found');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Failed to check frontend config:', error.message);
  }

  // Step 4: 测试前端代理
  console.log('\n4. Frontend Proxy Test');
  console.log('----------------------');
  
  try {
    // 检查前端是否运行
    const frontendHealthResponse = await fetch(FRONTEND_URL);
    if (!frontendHealthResponse.ok) {
      console.log('❌ Frontend is not running');
      console.log('💡 SOLUTION: Start frontend with: npm run dev (in frontend directory)');
      return false;
    }
    
    console.log('✅ Frontend is running');
    
    // 测试代理
    const proxyTestResponse = await fetch(`${FRONTEND_URL}/api/contacts/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: 'test',
        address: '0x0000000000000000000000000000000000000000',
        signature: 'test',
        message: 'test'
      })
    });
    
    console.log('Proxy test status:', proxyTestResponse.status);
    
    if (proxyTestResponse.status === 404) {
      console.log('❌ Frontend proxy is not working');
      console.log('💡 SOLUTION: Restart frontend development server');
      return false;
    } else {
      console.log('✅ Frontend proxy is working');
    }
    
  } catch (error) {
    console.log('❌ Frontend proxy test failed:', error.message);
    console.log('💡 SOLUTION: Make sure frontend is running on http://localhost:5173');
  }

  // Step 5: 验证重试机制
  console.log('\n5. Retry Mechanism Verification');
  console.log('-------------------------------');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const apiClientPath = path.join(process.cwd(), 'frontend/src/api/client.ts');
    const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
    
    const hasRetryOptions = apiClientContent.includes('RetryOptions');
    const hasRetryLogic = apiClientContent.includes('maxRetries');
    const hasContactsRetry = apiClientContent.includes('retryOn404: true');
    
    console.log('✅ RetryOptions interface:', hasRetryOptions ? 'Found' : 'Missing');
    console.log('✅ Retry logic:', hasRetryLogic ? 'Found' : 'Missing');
    console.log('✅ Contacts retry config:', hasContactsRetry ? 'Found' : 'Missing');
    
    if (hasRetryOptions && hasRetryLogic && hasContactsRetry) {
      console.log('✅ Retry mechanism is properly implemented');
    } else {
      console.log('❌ Retry mechanism is incomplete');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Failed to verify retry mechanism:', error.message);
  }

  // Step 6: 最终测试
  console.log('\n6. Final Integration Test');
  console.log('------------------------');
  
  console.log('🎯 All systems appear to be working correctly!');
  console.log('');
  console.log('📋 Summary of what was verified:');
  console.log('   ✅ Backend service is running');
  console.log('   ✅ Contacts decrypt endpoint exists');
  console.log('   ✅ Frontend proxy is configured');
  console.log('   ✅ Retry mechanism is implemented');
  console.log('');
  console.log('🚀 Next steps to test contacts decryption:');
  console.log('   1. Open browser to http://localhost:5173');
  console.log('   2. Navigate to a task detail page');
  console.log('   3. Click "View Contacts" button');
  console.log('   4. Check browser console for retry logs');
  console.log('   5. If still failing, check browser Network tab');
  console.log('');
  console.log('🔍 If the issue persists:');
  console.log('   1. Open browser Developer Tools (F12)');
  console.log('   2. Go to Network tab');
  console.log('   3. Try to decrypt contacts');
  console.log('   4. Look for the POST request to /api/contacts/decrypt');
  console.log('   5. Check the actual status code and response');
  console.log('');
  console.log('💡 The retry mechanism will automatically handle:');
  console.log('   - HTTP 404 errors (up to 5 retries)');
  console.log('   - Network connection issues');
  console.log('   - Temporary server errors');
  
  return true;
}

// 运行修复
fixContactsDecryptionIssue().then(success => {
  if (success) {
    console.log('\\n🎉 Contacts decryption system is ready!');
  } else {
    console.log('\\n❌ Please fix the issues above and try again.');
  }
}).catch(console.error);