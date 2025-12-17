/**
 * 清理 CrossChainDraftStore 的持久化状态
 * 解决显示虚假跨链奖励状态的问题
 * 
 * 使用方法：
 * 1. 在浏览器控制台中运行此脚本
 * 2. 或者手动清理 localStorage
 */

console.log('🧹 清理 CrossChainDraftStore 持久化状态...');

// 清理 localStorage 中的跨链奖励状态
const STORAGE_KEY = 'everecho_crosschain_draft';

try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsedState = JSON.parse(stored);
    console.log('📋 发现存储的状态:', parsedState);
    
    // 显示状态详情
    if (parsedState.depositStatus === 'confirmed') {
      console.log('⚠️ 发现确认状态的存入记录');
      if (parsedState.lastUpdatedAt) {
        const timeSince = Date.now() - parsedState.lastUpdatedAt;
        console.log(`⏰ 距离上次更新: ${Math.round(timeSince / 1000 / 60)} 分钟前`);
      }
    }
    
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ 已清理 CrossChainDraftStore 状态');
    console.log('🔄 请刷新页面以查看效果');
  } else {
    console.log('ℹ️ 没有发现存储的状态');
  }
} catch (error) {
  console.error('❌ 清理失败:', error);
}

// 提供手动清理方法
console.log('💡 您也可以手动清理:');
console.log('localStorage.removeItem("everecho_crosschain_draft");');