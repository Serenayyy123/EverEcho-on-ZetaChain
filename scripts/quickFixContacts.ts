#!/usr/bin/env tsx

/**
 * 联系方式解密问题快速修复脚本
 */

console.log('🔧 联系方式解密问题快速修复\n');

async function testBackendConnection() {
  console.log('1️⃣ 测试后端连接...');
  
  try {
    // 测试健康检查
    const healthResponse = await fetch('http://localhost:3001/healthz');
    if (healthResponse.ok) {
      console.log('   ✅ 后端服务正常运行');
    } else {
      console.log('   ❌ 后端健康检查失败');
      return false;
    }
    
    // 测试 contacts 端点
    const contactsResponse = await fetch('http://localhost:3001/api/contacts/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'test' })
    });
    
    if (contactsResponse.status === 400) {
      console.log('   ✅ /api/contacts/decrypt 端点正常 (返回 400 参数错误)');
      return true;
    } else if (contactsResponse.status === 404) {
      console.log('   ❌ /api/contacts/decrypt 端点返回 404 - 后端路由问题');
      return false;
    } else {
      console.log(`   ⚠️ /api/contacts/decrypt 返回意外状态: ${contactsResponse.status}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ 无法连接到后端服务:', error);
    return false;
  }
}

async function checkFrontendConfig() {
  console.log('\n2️⃣ 检查前端配置...');
  
  try {
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    
    // 检查 .env 文件
    const envPath = join(process.cwd(), 'frontend/.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    const backendUrl = envContent.match(/VITE_BACKEND_BASE_URL=(.+)/)?.[1];
    console.log(`   ✅ VITE_BACKEND_BASE_URL: ${backendUrl || '未配置'}`);
    
    if (!backendUrl || backendUrl.trim() === '') {
      console.log('   ⚠️ VITE_BACKEND_BASE_URL 未配置，将使用默认值');
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ 无法读取前端配置:', error);
    return false;
  }
}

function provideSolutions(backendOk: boolean, frontendOk: boolean) {
  console.log('\n🔧 修复建议:');
  
  if (!backendOk) {
    console.log('\n❌ 后端问题:');
    console.log('   1. 重启后端服务: cd backend && npm run dev');
    console.log('   2. 检查后端控制台是否有编译错误');
    console.log('   3. 确保端口 3001 没有被其他服务占用');
  }
  
  if (backendOk && !frontendOk) {
    console.log('\n❌ 前端配置问题:');
    console.log('   1. 检查 frontend/.env 文件中的 VITE_BACKEND_BASE_URL');
    console.log('   2. 确保值为: http://localhost:3001');
  }
  
  if (backendOk) {
    console.log('\n✅ 后端正常，前端网络问题:');
    console.log('   1. 清除浏览器缓存 (Ctrl+Shift+R)');
    console.log('   2. 重启前端开发服务器: cd frontend && npm run dev');
    console.log('   3. 检查浏览器网络面板中的实际请求 URL');
    console.log('   4. 尝试在浏览器中直接访问: http://localhost:3001/healthz');
  }
  
  console.log('\n🧪 验证修复:');
  console.log('   修复后，在浏览器中测试联系方式解密功能');
  console.log('   如果仍有问题，检查浏览器控制台的网络请求详情');
}

async function main() {
  const backendOk = await testBackendConnection();
  const frontendOk = await checkFrontendConfig();
  
  console.log('\n📊 诊断结果:');
  console.log(`   后端服务: ${backendOk ? '✅ 正常' : '❌ 异常'}`);
  console.log(`   前端配置: ${frontendOk ? '✅ 正常' : '❌ 异常'}`);
  
  provideSolutions(backendOk, frontendOk);
  
  if (backendOk) {
    console.log('\n🎯 最可能的解决方案:');
    console.log('   这是前端缓存或网络配置问题');
    console.log('   1. 按 Ctrl+Shift+R 强制刷新浏览器');
    console.log('   2. 重启前端开发服务器');
    console.log('   3. 如果问题持续，重启整个开发环境');
  }
}

main().catch(console.error);