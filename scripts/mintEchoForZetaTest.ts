import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ZetaChain Athens Testnet配置
const ZETA_TESTNET_CONFIG = {
  chainId: 7001,
  rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
  blockExplorer: 'https://athens.explorer.zetachain.com'
};

// 正确的合约地址
const ECHO_TOKEN_ADDRESS = '0x3BdD49A0De4D16E24796310C839e34eB419c1Cbd';
const REGISTER_ADDRESS = '0xDb8524e8f73Ac074b4e002Ba6035Cf6466c7f025';

async function mintEchoForZetaTest() {
  console.log('🪙 为ZetaChain测试账号mint ECHO代币...');
  console.log('');

  const privateKey = process.env.ZETA_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ 请设置环境变量 ZETA_PRIVATE_KEY');
    return;
  }

  try {
    // 连接到ZetaChain测试网
    const provider = new ethers.JsonRpcProvider(ZETA_TESTNET_CONFIG.rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    
    const testAddress = await signer.getAddress();
    console.log('📋 测试账号:', testAddress);
    
    // 检查ZETA余额
    const zetaBalance = await provider.getBalance(testAddress);
    console.log('💰 ZETA余额:', ethers.formatEther(zetaBalance), 'ZETA');
    
    if (parseFloat(ethers.formatEther(zetaBalance)) < 0.01) {
      console.warn('⚠️ ZETA余额不足，请先获取测试代币');
      console.log('🔗 获取测试代币: https://labs.zetachain.com/get-zeta');
      return;
    }
    
    // Register合约ABI（用于注册用户以获得初始ECHO）
    const registerABI = [
      'function register(string memory username, string memory bio, string memory avatar, bytes memory publicKey) external',
      'function isRegistered(address account) view returns (bool)'
    ];
    
    // ECHOToken合约ABI
    const echoTokenABI = [
      'function balanceOf(address account) view returns (uint256)',
      'function hasReceivedInitialMint(address account) view returns (bool)',
      'function name() view returns (string)',
      'function symbol() view returns (string)'
    ];
    
    const registerContract = new ethers.Contract(REGISTER_ADDRESS, registerABI, signer);
    const echoTokenContract = new ethers.Contract(ECHO_TOKEN_ADDRESS, echoTokenABI, signer);
    
    // 检查代币信息
    const tokenName = await echoTokenContract.name();
    const tokenSymbol = await echoTokenContract.symbol();
    console.log('');
    console.log('📋 代币信息:');
    console.log('   名称:', tokenName);
    console.log('   符号:', tokenSymbol);
    console.log('   地址:', ECHO_TOKEN_ADDRESS);
    
    // 检查当前ECHO余额
    const currentBalance = await echoTokenContract.balanceOf(testAddress);
    console.log('   当前余额:', ethers.formatEther(currentBalance), tokenSymbol);
    
    // 检查是否已注册
    const isRegistered = await registerContract.isRegistered(testAddress);
    console.log('   注册状态:', isRegistered ? '已注册' : '未注册');
    
    // 检查是否已获得初始mint
    const hasReceivedMint = await echoTokenContract.hasReceivedInitialMint(testAddress);
    console.log('   初始mint状态:', hasReceivedMint ? '已获得' : '未获得');
    
    if (!isRegistered) {
      console.log('');
      console.log('🔄 注册用户以获得初始ECHO代币...');
      
      // 生成一个简单的公钥（用于测试）
      const testPublicKey = ethers.randomBytes(32);
      
      try {
        const registerTx = await registerContract.register(
          'ZetaTestUser',
          'ZetaChain测试用户',
          'https://example.com/avatar.png',
          testPublicKey
        );
        
        console.log('📝 注册交易已发送:', registerTx.hash);
        console.log('🔗 查看交易:', `${ZETA_TESTNET_CONFIG.blockExplorer}/tx/${registerTx.hash}`);
        
        const receipt = await registerTx.wait();
        console.log('✅ 注册交易已确认');
        
        // 检查新的ECHO余额
        const newBalance = await echoTokenContract.balanceOf(testAddress);
        console.log('💰 新的ECHO余额:', ethers.formatEther(newBalance), tokenSymbol);
        
        if (newBalance > currentBalance) {
          console.log('🎉 成功获得初始ECHO代币！');
        }
        
      } catch (error) {
        console.error('❌ 注册失败:', error);
      }
    } else if (currentBalance > 0) {
      console.log('');
      console.log('✅ 账号已有ECHO代币，可以开始测试！');
    } else {
      console.log('');
      console.log('⚠️ 账号已注册但没有ECHO余额，可能需要手动mint');
    }
    
    console.log('');
    console.log('📱 MetaMask导入指南:');
    console.log('1. 确保连接到ZetaChain Athens测试网');
    console.log('2. 导入自定义代币:');
    console.log('   - 代币地址:', ECHO_TOKEN_ADDRESS);
    console.log('   - 代币符号: ECHO');
    console.log('   - 小数位数: 18');
    console.log('');
    console.log('🔗 区块浏览器链接:');
    console.log('   代币合约:', `${ZETA_TESTNET_CONFIG.blockExplorer}/address/${ECHO_TOKEN_ADDRESS}`);
    console.log('   你的账号:', `${ZETA_TESTNET_CONFIG.blockExplorer}/address/${testAddress}`);
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

mintEchoForZetaTest().catch(console.error);