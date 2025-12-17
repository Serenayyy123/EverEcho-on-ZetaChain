/**
 * 退还所有孤儿奖励脚本
 * 专门处理 taskId=0 的孤儿奖励
 */

import { ethers } from 'ethers';

// 合约地址
const UNIVERSAL_REWARD_ADDRESS = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';

// 合约 ABI
const UNIVERSAL_REWARD_ABI = [
  'function nextRewardId() external view returns (uint256)',
  'function rewardPlans(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))',
  'function refund(uint256 rewardId) external',
  'event RewardRefunded(uint256 indexed rewardId, address indexed creator)'
];

interface OrphanReward {
  rewardId: number;
  creator: string;
  amount: string;
  status: number;
}

/**
 * 扫描并退还所有孤儿奖励
 */
async function refundAllOrphanRewards() {
  console.log('💰 开始扫描和退还所有孤儿奖励...\n');

  try {
    // 连接到 ZetaChain Athens 测试网
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const contract = new ethers.Contract(UNIVERSAL_REWARD_ADDRESS, UNIVERSAL_REWARD_ABI, provider);

    // 1. 扫描所有孤儿奖励
    console.log('🔍 扫描孤儿奖励...');
    const orphanRewards = await scanOrphanRewards(contract);

    if (orphanRewards.length === 0) {
      console.log('✅ 没有发现孤儿奖励');
      return;
    }

    // 2. 显示扫描结果
    console.log(`\n📊 发现 ${orphanRewards.length} 个孤儿奖励:`);
    
    const groupedByCreator = groupRewardsByCreator(orphanRewards);
    let totalAmount = 0;

    for (const [creator, rewards] of Object.entries(groupedByCreator)) {
      const creatorTotal = rewards.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      totalAmount += creatorTotal;
      
      console.log(`\n👤 创建者: ${creator}`);
      console.log(`   奖励数量: ${rewards.length}`);
      console.log(`   总金额: ${creatorTotal.toFixed(4)} ETH`);
      
      rewards.forEach(reward => {
        console.log(`   - 奖励 ${reward.rewardId}: ${reward.amount} ETH (状态: ${getStatusName(reward.status)})`);
      });
    }

    console.log(`\n💰 总计需要退还: ${totalAmount.toFixed(4)} ETH`);

    // 3. 生成退款命令
    console.log('\n📝 退款操作指南:');
    console.log('由于需要创建者的私钥，请按以下步骤操作:\n');

    for (const [creator, rewards] of Object.entries(groupedByCreator)) {
      console.log(`👤 创建者 ${creator}:`);
      console.log('   请使用以下私钥连接并执行退款:');
      
      rewards.forEach(reward => {
        console.log(`   
   // 退款奖励 ${reward.rewardId}
   const privateKey = "YOUR_PRIVATE_KEY_FOR_${creator}";
   const wallet = new ethers.Wallet(privateKey, provider);
   const contractWithSigner = new ethers.Contract("${UNIVERSAL_REWARD_ADDRESS}", ABI, wallet);
   const tx = await contractWithSigner.refund(${reward.rewardId});
   console.log("退款交易:", tx.hash);
   await tx.wait();
   console.log("✅ 奖励 ${reward.rewardId} 退款成功");
        `);
      });
    }

    // 4. 生成批量退款脚本
    generateBatchRefundScript(groupedByCreator);

  } catch (error: any) {
    console.error('❌ 操作失败:', error.message);
    throw error;
  }
}

/**
 * 扫描所有孤儿奖励
 */
async function scanOrphanRewards(contract: ethers.Contract): Promise<OrphanReward[]> {
  const orphanRewards: OrphanReward[] = [];

  try {
    const nextRewardId = await contract.nextRewardId();
    const totalRewards = Number(nextRewardId);
    
    console.log(`📊 总奖励数量: ${totalRewards}`);

    for (let rewardId = 1; rewardId < totalRewards; rewardId++) {
      try {
        const rewardPlan = await contract.rewardPlans(rewardId);
        
        // 只处理 taskId=0 的孤儿奖励
        if (rewardPlan.taskId.toString() === '0') {
          orphanRewards.push({
            rewardId,
            creator: rewardPlan.creator,
            amount: ethers.formatEther(rewardPlan.amount),
            status: Number(rewardPlan.status)
          });
        }

        // 进度显示
        if (rewardId % 10 === 0) {
          console.log(`   已扫描: ${rewardId}/${totalRewards}`);
        }

      } catch (error) {
        // 忽略无法读取的奖励
        continue;
      }
    }

    return orphanRewards;

  } catch (error: any) {
    console.error('扫描失败:', error.message);
    throw error;
  }
}

/**
 * 按创建者分组奖励
 */
function groupRewardsByCreator(rewards: OrphanReward[]): Record<string, OrphanReward[]> {
  return rewards.reduce((groups, reward) => {
    const creator = reward.creator;
    if (!groups[creator]) {
      groups[creator] = [];
    }
    groups[creator].push(reward);
    return groups;
  }, {} as Record<string, OrphanReward[]>);
}

/**
 * 获取状态名称
 */
function getStatusName(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'Prepared',
    1: 'Deposited',
    2: 'Locked', 
    3: 'Claimed',
    4: 'Refunded',
    5: 'Reverted'
  };
  return statusMap[status] || `Unknown(${status})`;
}

/**
 * 生成批量退款脚本
 */
function generateBatchRefundScript(groupedRewards: Record<string, OrphanReward[]>): void {
  console.log('\n📄 生成批量退款脚本...');

  const script = `
// 批量退款脚本
// 请替换相应的私钥后在 Node.js 环境中运行

const { ethers } = require('ethers');

const UNIVERSAL_REWARD_ADDRESS = '${UNIVERSAL_REWARD_ADDRESS}';
const ABI = ${JSON.stringify(UNIVERSAL_REWARD_ABI, null, 2)};

async function batchRefund() {
  const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
  
  // 创建者私钥映射 - 请填入实际私钥
  const creatorPrivateKeys = {
${Object.keys(groupedRewards).map(creator => `    '${creator}': 'PRIVATE_KEY_FOR_${creator}', // 请替换为实际私钥`).join('\n')}
  };
  
  // 退款数据
  const refundData = ${JSON.stringify(groupedRewards, null, 4)};
  
  for (const [creator, rewards] of Object.entries(refundData)) {
    const privateKey = creatorPrivateKeys[creator];
    if (!privateKey || privateKey.startsWith('PRIVATE_KEY_FOR_')) {
      console.log(\`⚠️ 跳过创建者 \${creator}: 未提供私钥\`);
      continue;
    }
    
    try {
      const wallet = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(UNIVERSAL_REWARD_ADDRESS, ABI, wallet);
      
      console.log(\`👤 处理创建者 \${creator} 的 \${rewards.length} 个奖励...\`);
      
      for (const reward of rewards) {
        try {
          console.log(\`🔄 退款奖励 \${reward.rewardId}...\`);
          const tx = await contract.refund(reward.rewardId);
          console.log(\`📤 交易发送: \${tx.hash}\`);
          
          const receipt = await tx.wait();
          if (receipt.status === 1) {
            console.log(\`✅ 奖励 \${reward.rewardId} 退款成功\`);
          } else {
            console.log(\`❌ 奖励 \${reward.rewardId} 退款失败\`);
          }
          
          // 延迟避免 nonce 冲突
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(\`❌ 奖励 \${reward.rewardId} 退款失败:\`, error.message);
        }
      }
      
    } catch (error) {
      console.error(\`❌ 处理创建者 \${creator} 失败:\`, error.message);
    }
  }
  
  console.log('✅ 批量退款完成');
}

batchRefund().catch(console.error);
`;

  // 保存脚本到文件
  require('fs').writeFileSync('batch-refund-script.js', script);
  console.log('💾 批量退款脚本已保存到: batch-refund-script.js');
  
  console.log('\n📋 使用说明:');
  console.log('1. 编辑 batch-refund-script.js 文件');
  console.log('2. 将 PRIVATE_KEY_FOR_xxx 替换为实际的私钥');
  console.log('3. 运行: node batch-refund-script.js');
  console.log('4. 等待所有退款交易完成');
}

// 运行脚本
if (require.main === module) {
  refundAllOrphanRewards().catch(console.error);
}

export { refundAllOrphanRewards, scanOrphanRewards };