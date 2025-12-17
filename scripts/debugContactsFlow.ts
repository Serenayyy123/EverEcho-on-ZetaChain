#!/usr/bin/env tsx

/**
 * 调试联系方式加载完整流程
 */

console.log('🔍 调试联系方式加载流程\n');

async function simulateContactsFlow() {
  console.log('1️⃣ 模拟前端 API 调用...');
  
  const testPayload = {
    taskId: "1",
    address: "0x1234567890123456789012345678901234567890",
    signature: "0xabcdef...",
    message: "Request contacts for task 1"
  };
  
  try {
    console.log('   📤 发送请求到:', 'http://localhost:3001/api/contacts/decrypt');
    console.log('   📋 请求数据:', testPayload);
    
    const response = await fetch('http://localhost:3001/api/contacts/decrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('   📥 响应状态:', response.status, response.statusText);
    
    if (response.status === 404) {
      console.log('   ❌ HTTP 404 - 这解释了为什么 contacts 是 null');
      console.log('   💡 前端 useContacts hook 会进入 catch 块');
      console.log('   💡 setError() 被调用，但 contacts 保持 null');
      console.log('   💡 ContactsDisplay 显示 "Parsed contacts: null"');
      return false;
    } else if (response.status === 400) {
      console.log('   ✅ HTTP 400 - 端点存在，参数错误（正常）');
      const errorData = await response.json();
      console.log('   📋 错误详情:', errorData);
      return true;
    } else {
      console.log('   ⚠️ 意外状态码:', response.status);
      const data = await response.text();
      console.log('   📋 响应内容:', data.slice(0, 200));
      return false;
    }
  } catch (error) {
    console.log('   ❌ 网络错误:', error);
    console.log('   💡 这也会导致 contacts 保持 null');
    return false;
  }
}

function explainContactsNull(backendWorking: boolean) {
  console.log('\n📊 ContactsDisplay.tsx 显示 null 的原因分析:');
  
  if (!backendWorking) {
    console.log('\n❌ 根本原因: API 请求失败');
    console.log('   1. 用户点击 "View Contacts" 按钮');
    console.log('   2. useContacts.loadContacts() 被调用');
    console.log('   3. apiClient.decryptContacts() 发送 POST 请求');
    console.log('   4. 请求返回 HTTP 404 (或网络错误)');
    console.log('   5. JavaScript throw new Error() 被执行');
    console.log('   6. catch 块执行: setError(errorMessage)');
    console.log('   7. contacts 状态保持初始值: null');
    console.log('   8. ContactsDisplay 渲染: parseContacts(null) → null');
    console.log('   9. 控制台输出: "Parsed contacts: null"');
    
    console.log('\n🔧 修复方案:');
    console.log('   解决 HTTP 404 问题 → contacts 将获得实际数据 → 不再显示 null');
  } else {
    console.log('\n✅ 后端正常，问题在前端网络层');
    console.log('   后端端点工作正常，但前端请求没有到达后端');
    console.log('   这通常是缓存、代理或网络配置问题');
  }
}

function provideSolution() {
  console.log('\n🎯 解决方案 (按优先级):');
  console.log('\n1. 立即修复 (清除缓存):');
  console.log('   - 浏览器: Ctrl+Shift+R 强制刷新');
  console.log('   - 前端服务: 重启 npm run dev');
  
  console.log('\n2. 验证修复:');
  console.log('   - 点击 "View Contacts" 按钮');
  console.log('   - 检查浏览器网络面板');
  console.log('   - 确认请求状态从 404 变为 400');
  console.log('   - contacts 应该不再是 null');
  
  console.log('\n3. 长期预防:');
  console.log('   - 添加重试机制');
  console.log('   - 改进错误处理');
  console.log('   - 添加连接健康检查');
}

async function main() {
  const backendWorking = await simulateContactsFlow();
  explainContactsNull(backendWorking);
  provideSolution();
  
  console.log('\n📝 总结:');
  console.log('   ContactsDisplay.tsx 显示 null 是因为:');
  console.log('   HTTP 404 → API 调用失败 → contacts 状态保持 null');
  console.log('   这不是 ContactsDisplay 组件的问题，而是网络连接问题');
}

main().catch(console.error);