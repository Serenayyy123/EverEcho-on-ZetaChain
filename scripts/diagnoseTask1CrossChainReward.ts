import { ethers } from 'ethers';

// UniversalReward 合约 ABI
const UNIVERSAL_REWARD_ABI = [
  "function getRewardByTask(uint256 taskId) external view returns (uint256)",
  "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
  "function nextRewardId() external view returns (uint256)",
  "function rewardPlans(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))"
];

// TaskEscrow 合约 ABI - 根据合约源码更新
const TASK_ESCROW_ABI = [
  "function tasks(uint256 taskId) external view returns (tuple(uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount))"
];

async function diagnoseTask1CrossChainReward() {
  console.log('🔍 诊断 Task ID 1 的跨链奖励信息...');
  
  const taskId = 1;
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
    
    // 3. 检查 UniversalReward 合约中是否有对应的奖励
    console.log('\n🎁 检查跨链奖励...');
    try {
      const rewardId = await universalRewardContract.getRewardByTask(BigInt(taskId));
      console.log('查询结果 - rewardId:', rewardId.toString());
      
      if (rewardId.toString() === '0') {
        console.log('❌ 没有找到与 Task ID 1 关联的跨链奖励');
        console.log('可能的原因:');
        console.log('1. 该任务创建时没有设置跨链奖励');
        console.log('2. 跨链奖励创建失败');
        console.log('3. 任务与奖励的关联没有正确建立');
        
        // 检查是否有其他奖励存在
        console.log('\n🔍 检查合约中是否有其他奖励...');
        try {
          const nextRewardId = await universalRewardContract.nextRewardId();
          console.log('下一个奖励 ID:', nextRewardId.toString());
          
          if (nextRewardId.toString() === '1') {
            console.log('❌ 合约中没有任何奖励记录');
          } else {
            console.log('✅ 合约中有奖励记录，检查前几个奖励...');
            
            for (let i = 1; i < Math.min(Number(nextRewardId), 6); i++) {
              try {
                const plan = await universalRewardContract.getRewardPlan(BigInt(i));
                console.log(`奖励 ${i}:`, {
                  rewardId: plan.rewardId.toString(),
                  creator: plan.creator,
                  taskId: plan.taskId.toString(),
                  asset: plan.asset,
                  amount: ethers.formatEther(plan.amount),
                  targetChainId: plan.targetChainId.toString(),
                  status: plan.status
                });
              } catch (planError: any) {
                console.log(`奖励 ${i} 查询失败:`, planError.message);
              }
            }
          }
        } catch (nextIdError: any) {
          console.log('❌ 无法查询 nextRewardId:', nextIdError.message);
        }
        
      } else {
        console.log('✅ 找到跨链奖励，ID:', rewardId.toString());
        
        // 获取奖励详情
        try {
          const plan = await universalRewardContract.getRewardPlan(rewardId);
          console.log('奖励详情:', {
            rewardId: plan.rewardId.toString(),
            creator: plan.creator,
            taskId: plan.taskId.toString(),
            asset: plan.asset,
            amount: ethers.formatEther(plan.amount),
            targetChainId: plan.targetChainId.toString(),
            targetAddress: plan.targetAddress,
            status: plan.status,
            createdAt: new Date(Number(plan.createdAt) * 1000).toISOString(),
            updatedAt: new Date(Number(plan.updatedAt) * 1000).toISOString(),
            lastTxHash: plan.lastTxHash
          });
          
          // 解释状态
          const statusMap: Record<number, string> = {
            0: 'Prepared (已准备)',
            1: 'Deposited (已存入)',
            2: 'Locked (已锁定)',
            3: 'Claimed (已领取)',
            4: 'Refunded (已退款)',
            5: 'Reverted (已回滚)'
          };
          
          console.log('奖励状态:', statusMap[plan.status] || `未知状态 (${plan.status})`);
          
        } catch (planError: any) {
          console.log('❌ 无法获取奖励详情:', planError.message);
        }
      }
      
    } catch (rewardError: any) {
      console.log('❌ 查询跨链奖励失败:', rewardError.message);
    }
    
    // 5. 分析前端显示逻辑
    console.log('\n🔍 分析前端显示逻辑...');
    console.log('前端 CrossChainRewardDisplay 组件的逻辑:');
    console.log('1. 调用 getRewardByTask(taskId) 获取 rewardId');
    console.log('2. 如果 rewardId 不为 0，调用 getRewardPlan(rewardId) 获取详情');
    console.log('3. 如果 rewardId 为 0，组件返回 null (不显示)');
    console.log('4. 组件使用环境变量 VITE_UNIVERSAL_REWARD_ADDRESS 作为合约地址');
    
    // 6. 检查可能的问题
    console.log('\n💡 可能的问题和解决方案:');
    console.log('1. 如果 Task ID 1 没有跨链奖励:');
    console.log('   - 这是正常的，该任务可能是在跨链功能实现之前创建的');
    console.log('   - 或者创建时没有选择跨链奖励选项');
    console.log('');
    console.log('2. 如果应该有跨链奖励但没有显示:');
    console.log('   - 检查前端环境变量 VITE_UNIVERSAL_REWARD_ADDRESS 是否正确');
    console.log('   - 检查用户钱包是否连接到 ZetaChain 网络');
    console.log('   - 检查合约调用是否有权限问题');
    console.log('');
    console.log('3. 如果合约中有奖励但与任务关联错误:');
    console.log('   - 检查任务创建时的 lockForTask 调用是否成功');
    console.log('   - 检查 taskRewards 映射是否正确建立');
    
  } catch (error: any) {
    console.error('❌ 诊断过程中出错:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行诊断
diagnoseTask1CrossChainReward().catch(console.error);