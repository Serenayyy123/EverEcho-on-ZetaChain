/**
 * 调试准备跨链奖励按钮被禁用的问题
 */

console.log('🔍 调试准备跨链奖励按钮被禁用的问题\n');

// 模拟从截图观察到的状态
const observedState = {
  // 从截图可以看到的信息
  rewardAmount: '0.01',
  currentBalance: '0 ETH',
  selectedAsset: 'ETH Sepolia',
  selectedTargetChain: 'ETH Sepolia',
  
  // 推测的状态
  isExpanded: true, // 界面是展开的
  balanceDisplayed: true, // 显示了余额，说明钱包应该是连接的
};

console.log('📋 从截图观察到的状态:');
console.log(`   奖励数量: ${observedState.rewardAmount}`);
console.log(`   当前余额: ${observedState.currentBalance}`);
console.log(`   选择的资产: ${observedState.selectedAsset}`);
console.log(`   目标链: ${observedState.selectedTargetChain}`);
console.log(`   界面展开: ${observedState.isExpanded}`);
console.log(`   显示余额: ${observedState.balanceDisplayed}`);

console.log('\n🔍 按钮禁用条件分析:');
console.log('按钮禁用条件: disabled || !isConnected || !rewardPlan.amount || parseFloat(rewardPlan.amount) <= 0 || loading');

// 分析每个条件
const conditions = {
  disabled: false, // 假设组件没有被外部禁用
  isConnected: true, // 从显示余额推测钱包已连接
  hasAmount: observedState.rewardAmount !== '',
  validAmount: parseFloat(observedState.rewardAmount) > 0,
  loading: false // 假设没有在加载中
};

console.log('\n📊 条件检查:');
console.log(`   1. disabled (外部禁用): ${conditions.disabled}`);
console.log(`   2. !isConnected (钱包未连接): ${!conditions.isConnected}`);
console.log(`   3. !rewardPlan.amount (没有金额): ${!conditions.hasAmount}`);
console.log(`   4. parseFloat(rewardPlan.amount) <= 0 (金额无效): ${!conditions.validAmount}`);
console.log(`   5. loading (加载中): ${conditions.loading}`);

const shouldBeDisabled = conditions.disabled || !conditions.isConnected || !conditions.hasAmount || !conditions.validAmount || conditions.loading;

console.log(`\n🎯 按钮应该被禁用: ${shouldBeDisabled}`);
console.log(`   实际观察: 按钮被禁用 (灰色)`);

if (!shouldBeDisabled) {
  console.log('\n❌ 矛盾发现！按钮不应该被禁用，但实际被禁用了');
  console.log('\n🔍 可能的原因:');
  console.log('   1. isConnected 状态实际为 false');
  console.log('   2. 组件被外部 disabled prop 禁用');
  console.log('   3. loading 状态为 true');
  console.log('   4. 金额解析有问题');
  console.log('   5. 钱包连接检查逻辑有问题');
} else {
  console.log('\n✅ 按钮禁用是正确的');
}

console.log('\n🔧 调试建议:');
console.log('1. 检查浏览器控制台是否有钱包连接相关的错误');
console.log('2. 确认 MetaMask 是否已连接到正确的网络');
console.log('3. 检查组件的 disabled prop 是否被传入');
console.log('4. 添加调试日志来确认 isConnected 的实际值');
console.log('5. 检查钱包连接检查逻辑是否正确执行');

console.log('\n🛠️  建议的修复步骤:');
console.log('1. 在组件中添加调试日志');
console.log('2. 检查钱包连接状态');
console.log('3. 验证按钮禁用条件');
console.log('4. 确保钱包事件监听器正常工作');

// 生成调试代码
console.log('\n📝 建议添加的调试代码:');
console.log(`
// 在 CrossChainRewardSection 组件中添加:
useEffect(() => {
  console.log('🔍 Debug - Component State:', {
    isConnected,
    address,
    rewardPlan,
    loading,
    disabled,
    userBalance
  });
}, [isConnected, address, rewardPlan, loading, disabled, userBalance]);

// 在按钮渲染前添加:
const buttonDisabled = disabled || !isConnected || !rewardPlan.amount || parseFloat(rewardPlan.amount) <= 0 || loading;
console.log('🔍 Debug - Button Disabled:', {
  disabled,
  isConnected,
  hasAmount: !!rewardPlan.amount,
  validAmount: parseFloat(rewardPlan.amount) > 0,
  loading,
  finalDisabled: buttonDisabled
});
`);