import { ethers } from 'ethers';

// UniversalReward 合约 ABI
const UNIVERSAL_REWARD_ABI = [
  "function getRewardByTask(uint256 taskId) external view returns (uint256)",
  "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
  "function nextRewardId() external view returns (uint256)",
  "function refund(uint256 rewardId) external",
  "event RewardRefunded(uint256 indexed rewardId, address indexed creator)"
];

async function testRefundOrphanReward() {
  console.log('🧪 测试 refund 孤儿奖励...');
  
  try {
    // 检查环境变量
    if (!process.env.PRIVATE_KEY) {
      console.log('❌ 请设置 PRIVATE_KEY 环境变量');
      console.log('例如: PRIVATE_KEY=your_private_key npx tsx scripts/testRefundOrphanReward.ts');
      return;
    }
    
    // 1. 连接到 ZetaChain Athens 测试网
    console.log('\n🔗 连接到 ZetaChain Athens 测试网...');
    const zetaRpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const provider = new ethers.JsonRpcProvider(zetaRpcUrl, 7001);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('📍 操作账户:', wallet.address);
    
    // 检查账户余额
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 账户余额:', ethers.formatEther(balance), 'ZETA');
    
    if (balance < ethers.parseEther('0.01')) {
      console.log('⚠️ 账户余额不足，可能无法支付 gas 费用');
    }
    
    // 合约地址
    const universalRewardAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    console.log('📍 UniversalReward 合约地址:', universalRewardAddress);
    
    // 2. 创建合约实例
    const contract = new ethers.Contract(
      universalRewardAddress,
      UNIVERSAL_REWARD_ABI,
      wallet
    );
    
    // 3. 找到一个属于当前账户的孤儿奖励
    console.log('\n🔍 查找属于当前账户的孤儿奖励...');
    const nextRewardId = await contract.nextRewardId();
    console.log('总奖励数量:', Number(nextRewardId) - 1);
    
    let targetReward: any = null;
    
    for (let i = 1; i < Math.min(Number(nextRewardId), 10); i++) {
      try {
        const plan = await contract.getRewardPlan(BigInt(i));
        
        // 检查是否是孤儿奖励且属于当前账户
        if (plan.taskId.toString() === '0' && 
            plan.creator.toLowerCase() === wallet.address.toLowerCase() &&
            Number(plan.status) === 1) { // Deposited 状态
          
          targetReward = {
            rewardId: i,
            creator: plan.creator,
            taskId: plan.taskId.toString(),
            asset: plan.asset,
            amount: ethers.formatEther(plan.amount),
            status: Number(plan.status)
          };
          
          console.log(`✅ 找到目标奖励 ${i}:`, {
            amount: targetReward.amount,
            status: targetReward.status
          });
          break;
        }
      } catch (error: any) {
        console.log(`❌ 查询奖励 ${i} 失败:`, error.message);
      }
    }
    
    if (!targetReward) {
      console.log('❌ 没有找到属于当前账户的孤儿奖励');
      console.log('请确保:');
      console.log('1. 当前账户创建过跨链奖励');
      console.log('2. 存在 taskId=0 且状态为 Deposited 的奖励');
      return;
    }
    
    // 4. 尝试 refund
    console.log(`\n🔄 尝试 refund 奖励 ${targetReward.rewardId}...`);
    console.log('奖励详情:', targetReward);
    
    try {
      // 估算 gas
      const gasEstimate = await contract.refund.estimateGas(BigInt(targetReward.rewardId));
      console.log('📊 预估 Gas:', gasEstimate.toString());
      
      // 执行 refund
      const tx = await contract.refund(BigInt(targetReward.rewardId));
      console.log('📝 交易已发送:', tx.hash);
      console.log('⏳ 等待确认...');
      
      const receipt = await tx.wait();
      console.log('✅ Refund 成功!');
      console.log('📊 实际 Gas 使用:', receipt.gasUsed.toString());
      console.log('💰 Gas 费用:', ethers.formatEther(receipt.gasUsed * receipt.gasPrice), 'ZETA');
      
      // 验证状态变化
      console.log('\n🔍 验证奖励状态...');
      const updatedPlan = await contract.getRewardPlan(BigInt(targetReward.rewardId));
      console.log('更新后状态:', Number(updatedPlan.status));
      
      const statusMap: Record<number, string> = {
        0: 'Prepared',
        1: 'Deposited', 
        2: 'Locked',
        3: 'Claimed',
        4: 'Refunded',
        5: 'Reverted'
      };
      
      console.log('状态含义:', statusMap[Number(updatedPlan.status)] || '未知');
      
    } catch (error: any) {
      console.error('❌ Refund 失败:', error.message);
      
      if (error.message.includes('revert')) {
        console.log('\n💡 可能的原因:');
        console.log('1. 奖励状态不允许 refund（可能需要先 lock）');
        console.log('2. 权限不足（不是创建者）');
        console.log('3. 合约逻辑限制');
      }
      
      if (error.message.includes('gas')) {
        console.log('4. Gas 相关问题');
      }
    }
    
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testRefundOrphanReward().catch(console.error);