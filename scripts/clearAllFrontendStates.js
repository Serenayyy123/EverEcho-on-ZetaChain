/**
 * 清理所有前端状态脚本
 * 在浏览器控制台中运行此脚本来清理所有跨链和测试状态
 */

console.log('🧹 开始清理所有前端状态...');

// 需要清理的 localStorage 键
const keysToRemove = [
  // 跨链奖励相关
  'everecho_crosschain_draft',
  'pendingRewardId',
  'crosschain_reward_state', 
  'crosschain_draft',
  
  // 任务相关
  'task_draft',
  'publish_task_draft',
  
  // 用户状态相关
  'user_preferences',
  'wallet_connection_state',
  
  // 测试数据相关
  'test_data',
  'debug_mode'
];

// 清理指定的键
let clearedCount = 0;
let foundStates = [];

keysToRemove.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      const parsedValue = JSON.parse(value);
      foundStates.push({ key, value: parsedValue });
      console.log(`📋 发现并清理: ${key}`, parsedValue);
    } catch (e) {
      foundStates.push({ key, value });
      console.log(`📋 发现并清理: ${key} = ${value}`);
    }
    localStorage.removeItem(key);
    clearedCount++;
  }
});

// 清理所有包含 everecho 或 crosschain 的键
const allKeys = Object.keys(localStorage);
allKeys.forEach(key => {
  const lowerKey = key.toLowerCase();
  if ((lowerKey.includes('everecho') || lowerKey.includes('crosschain') || lowerKey.includes('test')) 
      && !keysToRemove.includes(key)) {
    const value = localStorage.getItem(key);
    console.log(`🧹 清理相关项: ${key} = ${value}`);
    localStorage.removeItem(key);
    clearedCount++;
  }
});

// 显示清理结果
console.log('\n📊 清理结果:');
if (clearedCount > 0) {
  console.log(`✅ 已清理 ${clearedCount} 个存储项`);
  
  if (foundStates.length > 0) {
    console.log('\n📋 清理的状态详情:');
    foundStates.forEach(({ key, value }) => {
      console.log(`   ${key}:`, value);
    });
  }
  
  console.log('\n🔄 即将刷新页面以应用更改...');
  
  // 延迟刷新，让用户看到结果
  setTimeout(() => {
    console.log('🔄 刷新页面...');
    window.location.reload();
  }, 2000);
  
} else {
  console.log('ℹ️ 没有发现需要清理的状态');
}

// 提供手动清理函数
window.clearEverEchoStates = function() {
  console.log('🧹 手动清理所有 EverEcho 相关状态...');
  
  const allKeys = Object.keys(localStorage);
  let manualClearedCount = 0;
  
  allKeys.forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('everecho') || lowerKey.includes('crosschain') || lowerKey.includes('task')) {
      localStorage.removeItem(key);
      manualClearedCount++;
      console.log(`🗑️ 已删除: ${key}`);
    }
  });
  
  console.log(`✅ 手动清理完成，删除了 ${manualClearedCount} 个项目`);
  window.location.reload();
};

console.log('\n💡 提示:');
console.log('- 如果问题仍然存在，请尝试硬刷新 (Ctrl+F5 或 Cmd+Shift+R)');
console.log('- 或者运行 clearEverEchoStates() 进行更彻底的清理');
console.log('- 如果使用了多个浏览器标签，请在每个标签中都运行此脚本');

// 检查是否还有相关状态
setTimeout(() => {
  const remainingKeys = Object.keys(localStorage).filter(key => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('everecho') || lowerKey.includes('crosschain');
  });
  
  if (remainingKeys.length > 0) {
    console.log('\n⚠️ 仍有相关状态未清理:');
    remainingKeys.forEach(key => {
      console.log(`   ${key}: ${localStorage.getItem(key)}`);
    });
  } else {
    console.log('\n✅ 所有相关状态已清理完成');
  }
}, 500);