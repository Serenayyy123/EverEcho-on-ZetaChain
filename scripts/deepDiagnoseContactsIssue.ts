#!/usr/bin/env tsx

/**
 * 深度诊断联系方式解密问题
 * 分析真正的根本原因
 */

async function deepDiagnose() {
  console.log('🔍 Deep Diagnosis of Contacts Decryption Issue');
  console.log('==============================================');

  const BASE_URL = 'http://localhost:3001';

  // 1. 检查后端服务状态
  console.log('\n1. Backend Service Status Check');
  console.log('-------------------------------');
  
  try {
    // 检查后端是否运行
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is running:', healthData);
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status, healthResponse.statusText);
      console.log('🚨 ROOT CAUSE: Backend service is not running properly');
      console.log('💡 SOLUTION: Start backend with: npm run dev:backend');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend:', error.message);
    console.log('🚨 ROOT CAUSE: Backend service is not accessible');
    console.log('💡 SOLUTION: Start backend with: npm run dev:backend');
    return;
  }

  // 2. 检查联系方式解密端点
  console.log('\n2. Contacts Decrypt Endpoint Check');
  console.log('----------------------------------');
  
  try {
    // 测试端点是否存在（用空数据，应该返回400而不是404）
    const testResponse = await fetch(`${BASE_URL}/api/contacts/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    console.log('Response status:', testResponse.status);
    console.log('Response headers:', Object.fromEntries(testResponse.headers.entries()));
    
    if (testResponse.status === 404) {
      console.log('🚨 ROOT CAUSE: /api/contacts/decrypt endpoint returns 404');
      console.log('💡 This means the route is not properly registered in the backend');
      
      // 检查路由文件是否存在
      const fs = require('fs');
      const path = require('path');
      
      const contactsRoutePath = path.join(process.cwd(), 'backend/src/routes/contacts.ts');
      const indexPath = path.join(process.cwd(), 'backend/src/index.ts');
      
      if (fs.existsSync(contactsRoutePath)) {
        console.log('✅ contacts.ts route file exists');
        
        // 检查是否在 index.ts 中注册
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        if (indexContent.includes('contacts')) {
          console.log('✅ contacts route appears to be registered in index.ts');
          console.log('🔍 The issue might be in route registration or backend compilation');
        } else {
          console.log('❌ contacts route is NOT registered in index.ts');
          console.log('💡 SOLUTION: Add contacts route registration to backend/src/index.ts');
        }
      } else {
        console.log('❌ contacts.ts route file does not exist');
        console.log('💡 SOLUTION: Create backend/src/routes/contacts.ts');
      }
      
    } else if (testResponse.status === 400) {
      console.log('✅ Endpoint exists and validates input (returns 400 for empty data)');
    } else {
      console.log(`ℹ️ Endpoint returned: ${testResponse.status}`);
      const responseText = await testResponse.text();
      console.log('Response body:', responseText);
    }
    
  } catch (error) {
    console.log('❌ Failed to test contacts endpoint:', error.message);
  }

  // 3. 检查前端网络配置
  console.log('\n3. Frontend Network Configuration');
  console.log('---------------------------------');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // 检查 vite.config.ts
    const viteConfigPath = path.join(process.cwd(), 'frontend/vite.config.ts');
    if (fs.existsSync(viteConfigPath)) {
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
      console.log('✅ vite.config.ts exists');
      
      if (viteConfig.includes('proxy')) {
        console.log('✅ Proxy configuration found in vite.config.ts');
        
        // 检查代理配置
        if (viteConfig.includes('/api')) {
          console.log('✅ /api proxy rule exists');
        } else {
          console.log('❌ /api proxy rule missing');
          console.log('💡 SOLUTION: Add /api proxy configuration to vite.config.ts');
        }
      } else {
        console.log('❌ No proxy configuration in vite.config.ts');
        console.log('💡 SOLUTION: Add proxy configuration for /api routes');
      }
    } else {
      console.log('❌ vite.config.ts not found');
    }
    
    // 检查环境变量
    console.log('\\nEnvironment variables:');
    console.log('VITE_BACKEND_BASE_URL:', process.env.VITE_BACKEND_BASE_URL || 'not set (using default)');
    
  } catch (error) {
    console.log('❌ Failed to check frontend config:', error.message);
  }

  // 4. 测试直接 API 调用
  console.log('\n4. Direct API Call Test');
  console.log('-----------------------');
  
  try {
    // 尝试直接调用后端，绕过前端代理
    const directResponse = await fetch('http://localhost:3001/api/contacts/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: 'test',
        address: '0x0000000000000000000000000000000000000000',
        signature: 'test',
        message: 'test'
      })
    });
    
    console.log('Direct call status:', directResponse.status);
    
    if (directResponse.status === 404) {
      console.log('🚨 ROOT CAUSE: Backend route is not working even with direct calls');
      console.log('💡 SOLUTION: Check backend route registration and restart backend');
    } else {
      console.log('✅ Direct backend call works, issue might be in frontend proxy');
      
      // 测试通过前端代理
      const proxyResponse = await fetch('http://localhost:5173/api/contacts/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'test',
          address: '0x0000000000000000000000000000000000000000',
          signature: 'test',
          message: 'test'
        })
      });
      
      console.log('Proxy call status:', proxyResponse.status);
      
      if (proxyResponse.status === 404) {
        console.log('🚨 ROOT CAUSE: Frontend proxy is not working correctly');
        console.log('💡 SOLUTION: Check vite.config.ts proxy settings and restart frontend');
      } else {
        console.log('✅ Proxy call also works');
        console.log('🤔 The issue might be intermittent or browser-specific');
      }
    }
    
  } catch (error) {
    console.log('❌ API call test failed:', error.message);
  }

  // 5. 总结和建议
  console.log('\n5. Summary and Recommendations');
  console.log('==============================');
  
  console.log('🔍 Possible root causes:');
  console.log('1. Backend service not running or not accessible');
  console.log('2. Contacts route not properly registered in backend');
  console.log('3. Frontend proxy configuration issues');
  console.log('4. Browser cache or network issues');
  console.log('5. Port conflicts or firewall issues');
  
  console.log('\\n💡 Recommended solutions:');
  console.log('1. Restart both backend and frontend services');
  console.log('2. Check backend route registration');
  console.log('3. Clear browser cache and try incognito mode');
  console.log('4. Check vite.config.ts proxy settings');
  console.log('5. Verify no port conflicts (3001 for backend, 5173 for frontend)');
  
  console.log('\\n🚀 Next steps:');
  console.log('1. Run: npm run dev:backend (in one terminal)');
  console.log('2. Run: npm run dev:frontend (in another terminal)');
  console.log('3. Test in browser incognito mode');
  console.log('4. Check browser network tab for actual request/response');
}

// 运行诊断
deepDiagnose().catch(console.error);