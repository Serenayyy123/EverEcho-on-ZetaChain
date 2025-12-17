#!/usr/bin/env tsx

/**
 * 测试后端路由是否正确注册
 */

console.log('🧪 测试后端路由注册\n');

async function testRoute(url: string, method: string = 'GET', body?: any) {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const text = await response.text();
    
    console.log(`${method} ${url}`);
    console.log(`   状态: ${response.status} ${response.statusText}`);
    console.log(`   响应: ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`);
    console.log('');
    
    return { status: response.status, text };
  } catch (error) {
    console.log(`${method} ${url}`);
    console.log(`   错误: ${error}`);
    console.log('');
    return { error };
  }
}

async function main() {
  const baseUrl = 'http://localhost:3001';
  
  // 1. 测试根路径
  await testRoute(`${baseUrl}/`);
  
  // 2. 测试健康检查
  await testRoute(`${baseUrl}/healthz`);
  
  // 3. 测试 API 路径
  await testRoute(`${baseUrl}/api/profile`, 'GET');
  await testRoute(`${baseUrl}/api/task`, 'GET');
  
  // 4. 测试 contacts 路径
  await testRoute(`${baseUrl}/api/contacts`, 'GET');
  await testRoute(`${baseUrl}/api/contacts/decrypt`, 'POST', { test: 'test' });
  
  // 5. 测试不存在的路径
  await testRoute(`${baseUrl}/api/nonexistent`, 'GET');
}

main().catch(console.error);