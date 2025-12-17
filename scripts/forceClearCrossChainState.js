/**
 * 强制清理跨链奖励的虚假状态
 * 在浏览器控制台中运行此脚本
 * 
 * 使用方法：
 * 1. 打开浏览器开发者工具 (F12)
 * 2. 切换到 Console 标签
 * 3. 复制粘贴此脚本并按回车执行
 * 4. 刷新页面查看效果
 */

console.log('🚨 强制清理跨链奖励虚假状态...');

// 清理所有相关的 localStorage 项
const keysToRemove = [
  'everecho_crosschain_draft',
  'pendingRewardId',
  'crosschain_reward_state',
  'crosschain_draft'
];

let clearedCount = 0;

keysToRemove.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    console.log(`📋 发现并清理: ${key} =`, JSON.parse(value));
    localStorage.removeItem(key);
    clearedCount++;
  }
});

// 清理所有以 everecho 开头的项
const allKeys = Object.keys(localStorage);
allKeys.forEach(key => {
  if (key.toLowerCase().includes('everecho') || key.toLowerCase().includes('crosschain')) {
    const value = localStorage.getItem(key);
    console.log(`🧹 清理相关项: ${key} =`, value);
    localStorage.removeItem(key);
    clearedCount++;
  }
});

if (clearedCount > 0) {
  console.log(`✅ 已清理 ${clearedCount} 个存储项`);
  console.log('🔄 请刷新页面以查看效果');
  console.log('💡 如果问题仍然存在，请尝试硬刷新 (Ctrl+F5 或 Cmd+Shift+R)');
} else {
  console.log('ℹ️ 没有发现需要清理的状态');
}

// 提供一键刷新功能
console.log('🔄 自动刷新页面...');
setTimeout(() => {
  window.location.reload();
}, 1000);