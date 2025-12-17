import { ethers } from 'ethers';

async function diagnoseCrossChainTxHashIssue() {
  console.log('🔍 诊断跨链奖励交易哈希显示问题...\n');

  try {
    // 1. 检查UniversalReward合约
    const universalRewardAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    console.log('📋 UniversalReward合约地址:', universalRewardAddress);

    // 连接到ZetaChain
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    
    const contractABI = [
      "function getRewardByTask(uint256 taskId) external view returns (uint256)",
      "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
      "function nextRewardId() external view returns (uint256)",
      "function getRewardsByCreator(address creator) external view returns (uint256[])"
    ];
    
    const contract = new ethers.Contract(universalRewardAddress, contractABI, provider);

    // 2. 获取奖励计划数量
    console.log('\n📊 获取奖励计划数量...');
    const nextRewardId = await contract.nextRewardId();
    const totalRewards = Number(nextRewardId) - 1;
    console.log(`总共有 ${totalRewards} 个奖励计划\n`);

    // 3. 检查每个奖励计划的交易哈希
    for (let i = 1; i <= totalRewards; i++) {
      try {
        console.log(`--- 奖励计划 ${i} ---`);
        const plan = await contract.getRewardPlan(BigInt(i));
        
        console.log('奖励ID:', plan.rewardId.toString());
        console.log('任务ID:', plan.taskId.toString());
        console.log('状态:', plan.status.toString());
        console.log('创建时间:', new Date(Number(plan.createdAt) * 1000).toLocaleString());
        console.log('更新时间:', new Date(Number(plan.updatedAt) * 1000).toLocaleString());
        
        // 检查交易哈希
        const txHash = plan.lastTxHash;
        const isEmptyHash = txHash === '0x0000000000000000000000000000000000000000000000000000000000000000';
        
        console.log('交易哈希 (原始):', txHash);
        console.log('交易哈希 (是否为空):', isEmptyHash ? '是' : '否');
        
        if (!isEmptyHash) {
          console.log('✅ 交易哈希有效，应该显示在UI中');
          console.log('🔗 ZetaChain浏览器链接:', `https://athens.explorer.zetachain.com/tx/${txHash}`);
        } else {
          console.log('❌ 交易哈希为空，不会在UI中显示');
          
          // 分析为什么交易哈希为空
          if (plan.status.toString() === '0') {
            console.log('💡 原因: 奖励计划刚创建，还未进行任何交易');
          } else if (plan.status.toString() === '1') {
            console.log('💡 原因: 奖励已存入，但可能交易哈希未正确记录');
          } else if (plan.status.toString() === '2') {
            console.log('💡 原因: 奖励已锁定，等待Helper领取');
          } else if (plan.status.toString() === '3') {
            console.log('💡 原因: 奖励已被领取，应该有交易哈希');
          }
        }
        console.log('');
      } catch (error) {
        console.log(`奖励计划 ${i} 查询失败:`, error.message);
      }
    }

    // 4. 检查特定任务的奖励
    console.log('\n🎯 检查特定任务的奖励...');
    const taskIds = [1, 2, 3]; // 检查前几个任务
    
    for (const taskId of taskIds) {
      try {
        const rewardId = await contract.getRewardByTask(BigInt(taskId));
        if (rewardId.toString() !== '0') {
          console.log(`任务 ${taskId} 有跨链奖励，奖励ID: ${rewardId.toString()}`);
          
          const plan = await contract.getRewardPlan(rewardId);
          const txHash = plan.lastTxHash;
          const isEmptyHash = txHash === '0x0000000000000000000000000000000000000000000000000000000000000000';
          
          console.log(`  - 状态: ${plan.status.toString()}`);
          console.log(`  - 交易哈希: ${isEmptyHash ? '空' : txHash}`);
          
          if (!isEmptyHash) {
            console.log(`  - 🔗 浏览器链接: https://athens.explorer.zetachain.com/tx/${txHash}`);
          }
        } else {
          console.log(`任务 ${taskId} 没有跨链奖励`);
        }
      } catch (error) {
        console.log(`任务 ${taskId} 查询失败:`, error.message);
      }
    }

    // 5. 检查前端显示逻辑
    console.log('\n🖥️ 前端显示逻辑分析:');
    console.log('交易哈希显示条件: reward.txHash && (...)');
    console.log('交易哈希来源1: plan.lastTxHash (从合约读取)');
    console.log('交易哈希来源2: receipt.hash (领取时生成)');
    console.log('');
    console.log('如果UI中没有显示交易哈希，可能的原因:');
    console.log('1. 合约中的 lastTxHash 为空 (0x000...)');
    console.log('2. 用户还未进行领取操作');
    console.log('3. 前端组件没有正确获取数据');
    console.log('4. CSS样式问题导致不可见');

  } catch (error: any) {
    console.error('❌ 诊断过程中出错:', error.message);
  }
}

// 运行诊断
diagnoseCrossChainTxHashIssue().catch(console.error);