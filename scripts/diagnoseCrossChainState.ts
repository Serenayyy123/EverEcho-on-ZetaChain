/**
 * 诊断跨链奖励状态脚本
 * 帮助用户了解当前的跨链奖励状态并提供解决方案
 */

console.log('🔍 诊断跨链奖励状态...\n');

// 检查 localStorage 中的状态
const STORAGE_KEY = 'everecho_crosschain_draft';
const PENDING_REWARD_KEY = 'pendingRewardId';

interface DiagnosticResult {
  hasStoredState: boolean;
  stateDetails?: any;
  timeSinceUpdate?: number;
  isExpired?: boolean;
  hasPendingReward?: boolean;
  recommendations: string[];
}

function diagnoseCrossChainState(): DiagnosticResult {
  const result: DiagnosticResult = {
    hasStoredState: false,
    recommendations: []
  };

  try {
    // 检查主要状态
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (storedState) {
      result.hasStoredState = true;
      result.stateDetails = JSON.parse(storedState);
      
      console.log('📋 发现存储的跨链奖励状态:');
      console.log('   - 启用状态:', result.stateDetails.enabled);
      console.log('   - 存入状态:', result.stateDetails.depositStatus);
      console.log('   - 资产信息:', result.stateDetails.asset?.displayName || '未设置');
      console.log('   - 金额:', result.stateDetails.amount || '未设置');
      
      if (result.stateDetails.lastUpdatedAt) {
        result.timeSinceUpdate = Date.now() - result.stateDetails.lastUpdatedAt;
        const minutesAgo = Math.round(result.timeSinceUpdate / 1000 / 60);
        console.log('   - 最后更新:', `${minutesAgo} 分钟前`);
        
        // 检查是否过期（3分钟）
        result.isExpired = result.timeSinceUpdate > 3 * 60 * 1000;
        if (result.isExpired) {
          console.log('   ⚠️ 状态已过期（超过3分钟）');
          result.recommendations.push('状态已过期，建议清理');
        }
      }
      
      // 检查是否为确认状态但可能是虚假的
      if (result.stateDetails.depositStatus === 'confirmed') {
        console.log('   🚨 检测到确认状态 - 可能是虚假状态');
        result.recommendations.push('如果您没有实际存入资金，这是虚假状态，需要清理');
      }
    } else {
      console.log('ℹ️ 没有发现存储的跨链奖励状态');
    }

    // 检查待处理的奖励ID
    const pendingReward = localStorage.getItem(PENDING_REWARD_KEY);
    if (pendingReward) {
      result.hasPendingReward = true;
      console.log('📋 发现待处理的奖励ID:', pendingReward);
      result.recommendations.push('发现待处理的奖励ID，可能需要清理');
    }

    // 生成建议
    if (!result.hasStoredState && !result.hasPendingReward) {
      result.recommendations.push('状态正常，没有发现问题');
    }

  } catch (error) {
    console.error('❌ 诊断过程中出错:', error);
    result.recommendations.push('诊断过程中出错，建议手动清理所有状态');
  }

  return result;
}

// 提供清理方案
function provideSolutions(result: DiagnosticResult) {
  console.log('\n💡 解决方案:');
  
  if (result.recommendations.includes('状态正常，没有发现问题')) {
    console.log('✅ 您的状态正常，无需任何操作');
    return;
  }

  console.log('1. 🧹 清理所有相关状态:');
  console.log('   localStorage.removeItem("everecho_crosschain_draft");');
  console.log('   localStorage.removeItem("pendingRewardId");');
  console.log('   window.location.reload();');
  
  console.log('\n2. 🔄 或者使用一键清理:');
  console.log('   // 复制以下代码到控制台执行');
  console.log('   ["everecho_crosschain_draft", "pendingRewardId"].forEach(key => localStorage.removeItem(key));');
  console.log('   console.log("✅ 已清理所有状态"); window.location.reload();');
  
  if (result.stateDetails?.depositStatus === 'confirmed') {
    console.log('\n3. 🚨 如果您确实存入了资金:');
    console.log('   - 请检查您的钱包交易记录');
    console.log('   - 确认是否有实际的资金转出');
    console.log('   - 如果没有实际转出，请立即清理状态');
  }
}

// 执行诊断
const diagnosticResult = diagnoseCrossChainState();

console.log('\n📊 诊断摘要:');
diagnosticResult.recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec}`);
});

provideSolutions(diagnosticResult);

console.log('\n🔧 如需帮助，请联系技术支持并提供以上诊断信息');

// 导出结果供其他脚本使用
if (typeof window !== 'undefined') {
  (window as any).crossChainDiagnostic = diagnosticResult;
}