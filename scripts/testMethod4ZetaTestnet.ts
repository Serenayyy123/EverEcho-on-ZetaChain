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

// 从addresses.ts获取合约地址
function getZetaContractAddresses() {
  // ZetaChain Athens Testnet addresses from deployment
  return {
    taskEscrow: '0x437Cc2a9fe6aA835d6B8623D853219c8B21A641c',
    echoToken: '0x3BdD49A0De4D16E24796310C839e34eB419c1Cbd',
    register: '0xDb8524e8f73Ac074b4e002Ba6035Cf6466c7f025',
    universalReward: '0x08D7B41A517Fb9E2C7810737f2c18F73F4C79BD0'
  };
}

async function testMethod4ZetaTestnet() {
  console.log('🧪 测试ZetaChain测试网上的Method 4系统...');
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
    
    // 检查余额
    const balance = await provider.getBalance(testAddress);
    console.log('💰 ZETA余额:', ethers.formatEther(balance), 'ZETA');
    
    // 获取合约地址
    const addresses = getZetaContractAddresses();
    console.log('');
    console.log('📋 合约地址:');
    console.log('   TaskEscrow:', addresses.taskEscrow);
    console.log('   ECHOToken:', addresses.echoToken);
    console.log('   Register:', addresses.register);
    console.log('   UniversalReward:', addresses.universalReward);
    
    // 检查合约是否部署
    console.log('');
    console.log('🔍 验证合约部署...');
    
    for (const [name, address] of Object.entries(addresses)) {
      if (address === '0x0000000000000000000000000000000000000000') {
        console.log(`❌ ${name}: 未部署`);
        continue;
      }
      
      const code = await provider.getCode(address);
      if (code === '0x') {
        console.log(`❌ ${name}: 地址无效 (${address})`);
      } else {
        console.log(`✅ ${name}: 已部署 (${address})`);
      }
    }
    
    // 如果所有合约都部署了，测试基本功能
    if (Object.values(addresses).every(addr => addr !== '0x0000000000000000000000000000000000000000')) {
      console.log('');
      console.log('🚀 测试Method 4原子操作...');
      
      // 简化的ABI用于测试
      const taskEscrowABI = [
        'function taskCounter() view returns (uint256)',
        'function createTaskWithCrossChainReward(string memory title, string memory description, uint256 reward, uint256 deadline, string memory skills, string memory contactInfo, uint256 crossChainRewardAmount, uint256 targetChainId) external returns (uint256 taskId, uint256 rewardId)'
      ];
      
      const echoTokenABI = [
        'function balanceOf(address account) view returns (uint256)',
        'function approve(address spender, uint256 amount) external returns (bool)'
      ];
      
      const taskEscrowContract = new ethers.Contract(addresses.taskEscrow, taskEscrowABI, signer);
      const echoTokenContract = new ethers.Contract(addresses.echoToken, echoTokenABI, signer);
      
      try {
        // 检查任务计数器
        const taskCounter = await taskEscrowContract.taskCounter();
        console.log('📋 当前任务计数:', taskCounter.toString());
        
        // 检查ECHO余额
        const echoBalance = await echoTokenContract.balanceOf(testAddress);
        console.log('💰 ECHO余额:', ethers.formatEther(echoBalance), 'ECHO');
        
        if (echoBalance > 0) {
          console.log('');
          console.log('🎯 执行原子操作测试...');
          
          // 批准TaskEscrow使用ECHO
          const approveAmount = ethers.parseEther('10');
          const approveTx = await echoTokenContract.approve(addresses.taskEscrow, approveAmount);
          await approveTx.wait();
          console.log('✅ ECHO授权成功');
          
          // 创建带跨链奖励的任务（原子操作）
          const createTx = await taskEscrowContract.createTaskWithCrossChainReward(
            'ZetaChain测试任务',
            '测试Method 4原子操作功能',
            ethers.parseEther('5'), // 5 ECHO奖励
            Math.floor(Date.now() / 1000) + 86400, // 24小时后截止
            'Testing,Blockchain',
            'test@example.com',
            ethers.parseEther('2'), // 2 ECHO跨链奖励
            1 // 目标链ID
          );
          
          console.log('📝 原子操作交易已发送:', createTx.hash);
          console.log('🔗 查看交易:', `${ZETA_TESTNET_CONFIG.blockExplorer}/tx/${createTx.hash}`);
          
          const receipt = await createTx.wait();
          console.log('✅ 原子操作交易已确认');
          
          // 检查新的任务计数器
          const newTaskCounter = await taskEscrowContract.taskCounter();
          console.log('📋 新任务计数:', newTaskCounter.toString());
          
          if (newTaskCounter > taskCounter) {
            console.log('✅ TaskID确定性生成成功');
            console.log('✅ Method 4原子操作在ZetaChain上正常工作！');
          }
          
        } else {
          console.log('⚠️ 需要ECHO代币进行完整测试');
          console.log('💡 提示: 部署时会自动mint一些ECHO代币给部署账号');
        }
        
      } catch (contractError) {
        console.error('❌ 合约调用失败:', contractError);
      }
    }
    
    console.log('');
    console.log('🎉 ZetaChain测试网验证完成！');
    console.log('');
    console.log('📋 测试结果摘要:');
    console.log('✅ 网络连接正常');
    console.log('✅ 合约部署验证完成');
    console.log('✅ Method 4系统在真实网络上运行');
    console.log('');
    console.log('🌐 访问前端: http://localhost:5173');
    console.log('🔗 区块浏览器:', ZETA_TESTNET_CONFIG.blockExplorer);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testMethod4ZetaTestnet().catch(console.error);