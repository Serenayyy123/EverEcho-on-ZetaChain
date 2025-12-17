/**
 * 调试钱包API调用问题
 * 
 * 分析为什么点击"准备跨链奖励"按钮后不能调用钱包API
 */

console.log('🔍 调试钱包API调用问题\n');

console.log('📋 问题描述:');
console.log('   • 按钮没有禁用（可以点击）');
console.log('   • 点击后不能调用钱包API');
console.log('   • 复选框显示 ✅（isEnabled = true）');
console.log('   • 显示余额 "0 ETH"（说明钱包可能已连接）');

console.log('\n🔍 handlePrepareReward 函数分析:');

// 模拟函数执行流程
const mockState = {
  isEnabled: true,  // 从 ✅ 推断
  disabled: false,  // 假设没有外部禁用
  isConnected: true, // 从显示余额推断
  rewardPlan: {
    amount: '0.01',
    asset: '0x0000000000000000000000000000000000000000',
    status: 'none'
  },
  loading: false
};

console.log('1️⃣ 前置条件检查:');
console.log(`   if (!isEnabled || disabled || !isConnected) return;`);
console.log(`   !isEnabled: ${!mockState.isEnabled}`);
console.log(`   disabled: ${mockState.disabled}`);
console.log(`   !isConnected: ${!mockState.isConnected}`);

const shouldReturn = !mockState.isEnabled || mockState.disabled || !mockState.isConnected;
console.log(`   结果: ${shouldReturn ? '提前返回' : '继续执行'}`);

if (shouldReturn) {
  console.log('❌ 函数在前置条件检查时提前返回，不会调用钱包API');
  
  console.log('\n🔍 可能的原因:');
  if (!mockState.isEnabled) {
    console.log('   • isEnabled 为 false');
  }
  if (mockState.disabled) {
    console.log('   • disabled 为 true');
  }
  if (!mockState.isConnected) {
    console.log('   • isConnected 为 false');
  }
} else {
  console.log('✅ 前置条件检查通过，应该会继续执行');
  
  console.log('\n2️⃣ 后续执行步骤:');
  console.log('   • setLoading(true)');
  console.log('   • setError(null)');
  console.log('   • setRewardPlan status = "preparing"');
  console.log('   • 检查 window.ethereum');
  console.log('   • 调用钱包API检查余额');
}

console.log('\n🔍 其他可能的问题:');
console.log('1. 事件处理器绑定问题');
console.log('   • onClick={handlePrepareReward} 没有正确绑定');
console.log('   • 事件冒泡被阻止');

console.log('\n2. JavaScript 错误');
console.log('   • 函数执行时抛出异常');
console.log('   • 异步函数没有正确处理');

console.log('\n3. 钱包连接状态问题');
console.log('   • isConnected 状态不准确');
console.log('   • 钱包实际未连接但显示了缓存的余额');

console.log('\n4. 组件状态问题');
console.log('   • isEnabled 状态不同步');
console.log('   • 父组件传递的 props 有问题');

console.log('\n🛠️  调试步骤建议:');

console.log('\n1. 添加调试日志:');
console.log(`
// 在 handlePrepareReward 函数开头添加:
const handlePrepareReward = async () => {
  console.log('🔍 handlePrepareReward called', {
    isEnabled,
    disabled,
    isConnected,
    rewardPlan,
    loading
  });
  
  if (!isEnabled || disabled || !isConnected) {
    console.log('❌ Early return due to conditions:', {
      isEnabled,
      disabled,
      isConnected
    });
    return;
  }
  
  console.log('✅ Proceeding with wallet API call...');
  // ... 其余代码
};
`);

console.log('\n2. 检查按钮点击事件:');
console.log(`
// 在按钮上添加调试:
<Button
  onClick={() => {
    console.log('🔍 Button clicked');
    handlePrepareReward();
  }}
  // ... 其他 props
>
  准备跨链奖励
</Button>
`);

console.log('\n3. 检查钱包连接状态:');
console.log(`
// 添加钱包状态监控:
useEffect(() => {
  console.log('🔍 Wallet state changed:', {
    isConnected,
    address,
    userBalance
  });
}, [isConnected, address, userBalance]);
`);

console.log('\n4. 检查浏览器控制台:');
console.log('   • 查看是否有 JavaScript 错误');
console.log('   • 查看是否有网络请求失败');
console.log('   • 查看是否有钱包相关的警告');

console.log('\n5. 检查 MetaMask 状态:');
console.log('   • 确认 MetaMask 已解锁');
console.log('   • 确认连接到正确的网络');
console.log('   • 确认账户已连接到网站');

console.log('\n📝 最可能的原因:');
console.log('1. isConnected 状态为 false（最可能）');
console.log('2. JavaScript 错误导致函数执行中断');
console.log('3. 事件处理器没有正确绑定');
console.log('4. 钱包连接检查逻辑有问题');

console.log('\n🎯 建议的修复方案:');
console.log('1. 添加详细的调试日志确认问题');
console.log('2. 检查钱包连接逻辑');
console.log('3. 确保事件处理器正确绑定');
console.log('4. 添加错误处理和用户反馈');