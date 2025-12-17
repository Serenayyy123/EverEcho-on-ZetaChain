import { ethers } from 'ethers';

// UniversalReward 合约 ABI
const UNIVERSAL_REWARD_ABI = [
  "function getRewardByTask(uint256 taskId) external view returns (uint256)",
  "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
  "function nextRewardId() external view returns (uint256)",
  "function taskRewards(uint256 taskId) external view returns (uint256)"
];

async function diagnoseTask2CrossChainReward() {
  console.log('🔍 诊断 Task ID 2 的跨链奖励显示问题...');
  
  const taskId = 2;
  console.log('📍 任务 ID:', taskId);
  
  try {
    // 1. 连接到 ZetaChain Athens 测试网
    console.log('\n🔗 连接到 ZetaChain Athens 测试网...');
    const zetaRpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const zetaProvider = new ethers.JsonRpcProvider(zetaRpcUrl, 7001);
    
    // 合约地址
    const universalRewardAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    console.log('📍 UniversalReward 合约地址:', universalRewardAddress);
    
    // 2. 创建合约实例
    const universalRewardContract = new ethers.Contract(
      universalRewardAddress,
      UNIVERSAL_REWARD_ABI,
      zetaProvider
    );
    
    // 3. 检查 Task ID 2 的跨链奖励
    console.log('\n🎁 检查 Task ID 2 的跨链奖励...');
    
    try {
      const rewardId = await universalRewardContract.getRewardByTask(BigInt(taskId));
      console.log('📋 getRewardByTask(2) 结果:', rewardId.toString());
      
      if (rewardId.toString() === '0') {
        console.log('❌ getRewardByTask 返回 0，表示没有找到关联的奖励');
        
        // 检查是否有 taskRewards 映射
        try {
          const taskRewardId = await universalRewardContract.taskRewards(BigInt(taskId));
          console.log('📋 taskRewards(2) 结果:', taskRewardId.toString());
        } catch (taskRewardsError: any) {
          console.log('⚠️ taskRewards 函数不存在或调用失败:', taskRewardsError.message);
        }
        
        // 搜索所有奖励，看是否有 taskId=2 的
        console.log('\n🔍 搜索所有奖励记录，查找 taskId=2...');
        const nextRewardId = await universalRewardContract.nextRewardId();
        console.log('总奖励数量:', Number(nextRewardId) - 1);
        
        let foundRewards: any[] = [];
        
        for (let i = 1; i < Number(nextRewardId); i++) {
          try {
            const plan = await universalRewardContract.getRewardPlan(BigInt(i));
            
            if (plan.taskId.toString() === taskId.toString()) {
              foundRewards.push({
                rewardId: i,
                creator: plan.creator,
                taskId: plan.taskId.toString(),
                asset: plan.asset,
                amount: ethers.formatEther(plan.amount),
                targetChainId: plan.targetChainId.toString(),
                status: Number(plan.status),
                createdAt: new Date(Number(plan.createdAt) * 1000).toISOString(),
                lastTxHash: plan.lastTxHash
              });
            }
          } catch (error: any) {
            // 忽略单个奖励查询失败
          }
        }
        
        if (foundRewards.length > 0) {
          console.log(`✅ 找到 ${foundRewards.length} 个 taskId=2 的奖励:`);
          foundRewards.forEach(reward => {
            console.log(`\n奖励 ${reward.rewardId}:`);
            console.log(`  创建者: ${reward.creator}`);
            console.log(`  数量: ${reward.amount} ETH`);
            console.log(`  目标链: ${reward.targetChainId}`);
            console.log(`  状态: ${reward.status} (${getStatusName(reward.status)})`);
            console.log(`  创建时间: ${reward.createdAt}`);
            console.log(`  交易哈希: ${reward.lastTxHash}`);
          });
          
          console.log('\n❓ 问题分析:');
          console.log('虽然存在 taskId=2 的奖励记录，但 getRewardByTask(2) 返回 0');
          console.log('这可能是因为:');
          console.log('1. taskRewards 映射没有正确建立');
          console.log('2. 合约的 getRewardByTask 函数实现有问题');
          console.log('3. 奖励状态不符合查询条件');
          
        } else {
          console.log('❌ 没有找到任何 taskId=2 的奖励记录');
          console.log('这意味着 Task ID 2 确实没有关联的跨链奖励');
        }
        
      } else {
        console.log('✅ 找到跨链奖励，ID:', rewardId.toString());
        
        // 获取奖励详情
        try {
          const plan = await universalRewardContract.getRewardPlan(rewardId);
          console.log('\n🎁 奖励详情:');
          console.log('  奖励 ID:', plan.rewardId.toString());
          console.log('  创建者:', plan.creator);
          console.log('  关联任务:', plan.taskId.toString());
          console.log('  资产地址:', plan.asset);
          console.log('  数量:', ethers.formatEther(plan.amount), 'ETH');
          console.log('  目标链 ID:', plan.targetChainId.toString());
          console.log('  目标地址:', plan.targetAddress);
          console.log('  状态:', Number(plan.status), `(${getStatusName(Number(plan.status))})`);
          console.log('  创建时间:', new Date(Number(plan.createdAt) * 1000).toISOString());
          console.log('  更新时间:', new Date(Number(plan.updatedAt) * 1000).toISOString());
          console.log('  最后交易:', plan.lastTxHash);
          
          // 检查前端显示逻辑
          console.log('\n🖥️ 前端显示逻辑检查:');
          console.log('CrossChainRewardDisplay 组件应该显示这个奖励');
          console.log('如果前端没有显示，可能的原因:');
          console.log('1. 前端连接的网络不是 ZetaChain');
          console.log('2. 前端使用的合约地址不正确');
          console.log('3. 前端的 VITE_UNIVERSAL_REWARD_ADDRESS 环境变量设置错误');
          console.log('4. 前端缓存问题');
          console.log('5. 组件渲染逻辑有问题');
          
        } catch (planError: any) {
          console.log('❌ 无法获取奖励详情:', planError.message);
        }
      }
      
    } catch (rewardError: any) {
      console.log('❌ 查询跨链奖励失败:', rewardError.message);
    }
    
    // 4. 检查前端环境配置
    console.log('\n⚙️ 前端配置检查建议:');
    console.log('请确认以下配置:');
    console.log('1. VITE_UNIVERSAL_REWARD_ADDRESS =', universalRewardAddress);
    console.log('2. 前端连接的网络是 ZetaChain Athens (Chain ID: 7001)');
    console.log('3. RPC URL:', zetaRpcUrl);
    
    // 5. 检查 TaskDetail 页面的逻辑
    console.log('\n📄 TaskDetail 页面检查:');
    console.log('TaskDetail 页面使用 CrossChainRewardDisplay 组件');
    console.log('该组件的逻辑:');
    console.log('1. 调用 getRewardByTask(taskId)');
    console.log('2. 如果返回非 0，调用 getRewardPlan(rewardId)');
    console.log('3. 根据奖励状态和用户角色显示相应的 UI');
    console.log('4. 如果返回 0，组件返回 null (不显示任何内容)');
    
  } catch (error: any) {
    console.error('❌ 诊断过程中出错:', error.message);
    console.error('错误详情:', error);
  }
}

function getStatusName(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'Prepared (已准备)',
    1: 'Deposited (已存入)',
    2: 'Locked (已锁定)',
    3: 'Claimed (已领取)',
    4: 'Refunded (已退款)',
    5: 'Reverted (已回滚)'
  };
  return statusMap[status] || `未知状态 (${status})`;
}

// 运行诊断
diagnoseTask2CrossChainReward().catch(console.error);