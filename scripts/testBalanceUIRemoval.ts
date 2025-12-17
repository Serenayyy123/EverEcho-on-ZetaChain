import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 测试余额显示UI移除是否成功
 * 验证：
 * 1. 余额显示UI已移除
 * 2. 余额检查功能保留
 * 3. 钱包连接功能保留
 * 4. updateBalance函数保留
 */

async function testBalanceUIRemoval() {
  console.log('🔍 测试余额显示UI移除...\n');

  try {
    const filePath = join(process.cwd(), 'frontend/src/components/ui/CrossChainRewardSection.tsx');
    const fileContent = readFileSync(filePath, 'utf-8');

    // 1. 检查余额显示UI是否已移除 (但保留错误消息中的"当前余额")
    const hasBalanceDisplayUI = fileContent.includes('<span style={styles.balanceLabel}>当前余额:</span>') || 
                               fileContent.includes('balanceInfo') ||
                               fileContent.includes('balanceLabel') ||
                               fileContent.includes('balanceValue');
    
    if (hasBalanceDisplayUI) {
      console.log('❌ 余额显示UI未完全移除');
      return false;
    } else {
      console.log('✅ 余额显示UI已成功移除');
    }

    // 2. 检查余额检查功能是否保留
    const hasBalanceCheck = fileContent.includes('const balance = parseFloat(userBalance)') &&
                           fileContent.includes('balance < amount') &&
                           fileContent.includes('余额不足');
    
    if (!hasBalanceCheck) {
      console.log('❌ 余额检查功能丢失');
      return false;
    } else {
      console.log('✅ 余额检查功能已保留');
    }

    // 3. 检查updateBalance函数是否保留
    const hasUpdateBalance = fileContent.includes('const updateBalance = async') &&
                            fileContent.includes('provider.getBalance') &&
                            fileContent.includes('ethers.formatEther');
    
    if (!hasUpdateBalance) {
      console.log('❌ updateBalance函数丢失');
      return false;
    } else {
      console.log('✅ updateBalance函数已保留');
    }

    // 4. 检查钱包连接功能是否保留
    const hasWalletConnection = fileContent.includes('const connectWallet = async') &&
                               fileContent.includes('eth_requestAccounts') &&
                               fileContent.includes('await updateBalance(accounts[0])');
    
    if (!hasWalletConnection) {
      console.log('❌ 钱包连接功能丢失');
      return false;
    } else {
      console.log('✅ 钱包连接功能已保留');
    }

    // 5. 检查userBalance状态是否保留
    const hasUserBalanceState = fileContent.includes('const [userBalance, setUserBalance] = useState<string>') &&
                               fileContent.includes('setUserBalance(ethers.formatEther(balance))');
    
    if (!hasUserBalanceState) {
      console.log('❌ userBalance状态管理丢失');
      return false;
    } else {
      console.log('✅ userBalance状态管理已保留');
    }

    // 6. 检查账户变化监听是否保留
    const hasAccountListener = fileContent.includes('accountsChanged') &&
                              fileContent.includes('updateBalance(accounts[0])');
    
    if (!hasAccountListener) {
      console.log('❌ 账户变化监听丢失');
      return false;
    } else {
      console.log('✅ 账户变化监听已保留');
    }

    console.log('\n🎉 所有测试通过！余额显示UI已成功移除，所有功能逻辑完整保留。');
    
    console.log('\n📋 修改摘要:');
    console.log('• ✅ 移除了余额显示UI (当前余额: X.XXXX ETH)');
    console.log('• ✅ 保留了余额检查逻辑 (防止余额不足)');
    console.log('• ✅ 保留了钱包连接功能');
    console.log('• ✅ 保留了updateBalance函数');
    console.log('• ✅ 保留了userBalance状态管理');
    console.log('• ✅ 保留了账户变化监听');
    console.log('• ✅ 移除了相关的CSS样式定义');

    return true;

  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  }
}

// 运行测试
testBalanceUIRemoval().then(success => {
  process.exit(success ? 0 : 1);
});