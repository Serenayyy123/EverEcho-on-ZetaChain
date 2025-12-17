import { ethers } from 'ethers';
import { getContractAddresses } from '../frontend/src/contracts/addresses';

// ECHO Token ABI - 只需要 balanceOf 函数
const ECHO_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

async function diagnoseEchoBalanceIssue() {
  console.log('🔍 诊断 ECHO 代币余额显示问题...');
  
  const userAddress = '0x099Fb550F7Dc5842621344c5a1678F943eEF3488';
  console.log('📍 用户地址:', userAddress);
  
  try {
    // 1. 检查 ZetaChain Athens 测试网 (7001)
    console.log('\n🔗 检查 ZetaChain Athens 测试网 (Chain ID: 7001)...');
    const zetaRpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const zetaProvider = new ethers.JsonRpcProvider(zetaRpcUrl, 7001);
    
    const zetaAddresses = getContractAddresses(7001);
    console.log('📍 ZetaChain ECHO Token 地址:', zetaAddresses.echoToken);
    
    const zetaTokenContract = new ethers.Contract(
      zetaAddresses.echoToken,
      ECHO_TOKEN_ABI,
      zetaProvider
    );
    
    // 获取代币信息
    const [name, symbol, decimals] = await Promise.all([
      zetaTokenContract.name(),
      zetaTokenContract.symbol(),
      zetaTokenContract.decimals()
    ]);
    
    console.log('📍 代币信息:', { name, symbol, decimals });
    
    // 获取用户余额
    const zetaBalance = await zetaTokenContract.balanceOf(userAddress);
    const zetaBalanceFormatted = ethers.formatUnits(zetaBalance, decimals);
    
    console.log('💰 ZetaChain 余额:', zetaBalanceFormatted, symbol);
    console.log('💰 ZetaChain 余额 (wei):', zetaBalance.toString());
    
    // 2. 检查本地网络 (31337) - 如果可用
    console.log('\n🔗 检查本地网络 (Chain ID: 31337)...');
    try {
      const localRpcUrl = 'http://localhost:8545';
      const localProvider = new ethers.JsonRpcProvider(localRpcUrl, 31337);
      
      // 测试连接
      await localProvider.getBlockNumber();
      
      const localAddresses = getContractAddresses(31337);
      console.log('📍 本地 ECHO Token 地址:', localAddresses.echoToken);
      
      const localTokenContract = new ethers.Contract(
        localAddresses.echoToken,
        ECHO_TOKEN_ABI,
        localProvider
      );
      
      const localBalance = await localTokenContract.balanceOf(userAddress);
      const localBalanceFormatted = ethers.formatUnits(localBalance, 18); // 假设18位小数
      
      console.log('💰 本地网络余额:', localBalanceFormatted, 'ECHO');
      console.log('💰 本地网络余额 (wei):', localBalance.toString());
      
    } catch (localError: any) {
      console.log('⚠️ 本地网络不可用:', localError.message);
    }
    
    // 3. 分析前端逻辑
    console.log('\n🔍 分析前端余额显示逻辑...');
    console.log('前端使用的逻辑:');
    console.log('1. useWallet hook 从 addresses.echoToken 获取合约地址');
    console.log('2. 调用 tokenContract.balanceOf(address) 获取余额');
    console.log('3. 使用 ethers.formatEther(balance) 格式化显示');
    console.log('4. Profile 页面通过 useProfile hook 显示余额');
    
    // 4. 检查可能的问题
    console.log('\n🔍 可能的问题分析:');
    
    if (zetaBalance.toString() === '0') {
      console.log('❌ 问题1: ZetaChain 上用户确实没有 ECHO 代币余额');
      console.log('   - 用户可能在其他网络有余额，但不在 ZetaChain 上');
      console.log('   - 前端只检查当前连接的网络');
    } else {
      console.log('✅ ZetaChain 上用户有 ECHO 代币余额');
      console.log('❓ 问题可能在于:');
      console.log('   1. 前端连接的网络不是 ZetaChain');
      console.log('   2. 前端使用的合约地址不正确');
      console.log('   3. RPC 连接问题');
      console.log('   4. 前端缓存问题');
    }
    
    // 5. 检查用户当前可能连接的网络
    console.log('\n🔍 检查其他可能的网络...');
    
    // 检查 Sepolia (11155111)
    try {
      console.log('🔗 检查 Sepolia 测试网...');
      const sepoliaProvider = new ethers.JsonRpcProvider('https://sepolia.gateway.tenderly.co', 11155111);
      const sepoliaBalance = await sepoliaProvider.getBalance(userAddress);
      console.log('💰 Sepolia ETH 余额:', ethers.formatEther(sepoliaBalance), 'ETH');
    } catch (sepoliaError: any) {
      console.log('⚠️ Sepolia 检查失败:', sepoliaError.message);
    }
    
    // 6. 提供解决方案
    console.log('\n💡 解决方案建议:');
    console.log('1. 确认用户钱包连接的是 ZetaChain Athens 测试网 (Chain ID: 7001)');
    console.log('2. 检查前端是否正确读取了 ZetaChain 上的 ECHO 代币合约');
    console.log('3. 如果用户在其他网络有 ECHO 代币，需要桥接到 ZetaChain');
    console.log('4. 检查前端的网络切换逻辑是否正常工作');
    console.log('5. 清除浏览器缓存并重新连接钱包');
    
  } catch (error: any) {
    console.error('❌ 诊断过程中出错:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行诊断
diagnoseEchoBalanceIssue().catch(console.error);