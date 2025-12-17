import { ethers } from 'ethers';
import * as readline from 'readline';

// UniversalReward 合约 ABI
const UNIVERSAL_REWARD_ABI = [
  "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
  "function nextRewardId() external view returns (uint256)",
  "function refund(uint256 rewardId) external",
  "event RewardRefunded(uint256 indexed rewardId, address indexed creator)"
];

interface OrphanReward {
  rewardId: number;
  creator: string;
  asset: string;
  amount: string;
  targetChainId: string;
  status: number;
  createdAt: number;
}

interface RefundResult {
  rewardId: number;
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
}

/**
 * 安全的孤儿奖励退款执行脚本
 * 需要用户确认和私钥输入
 */
async function executeOrphanRefunds() {
  console.log('💰 孤儿奖励退款执行器');
  console.log('⚠️  此脚本将执行实际的区块链交易');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  try {
    // 1. 连接到网络
    console.log('\n🔗 连接到 ZetaChain Athens 测试网...');
    const zetaRpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const zetaProvider = new ethers.JsonRpcProvider(zetaRpcUrl, 7001);
    
    const universalRewardAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    
    // 2. 检测孤儿奖励
    const readOnlyContract = new ethers.Contract(
      universalRewardAddress,
      UNIVERSAL_REWARD_ABI,
      zetaProvider
    );
    
    console.log('\n🔍 检测孤儿奖励...');
    const orphanRewards = await detectOrphanRewards(readOnlyContract);
    
    if (orphanRewards.length === 0) {
      console.log('✅ 没有发现孤儿奖励');
      rl.close();
      return;
    }
    
    // 3. 显示检测结果
    console.log(`\n📊 发现 ${orphanRewards.length} 个孤儿奖励:`);
    const groupedByCreator = groupRewardsByCreator(orphanRewards);
    
    let totalAmount = 0;
    for (const [creator, rewards] of Object.entries(groupedByCreator)) {
      console.log(`\n👤 创建者 ${creator}:`);
      let creatorTotal = 0;
      rewards.forEach(reward => {
        const amount = parseFloat(reward.amount);
        creatorTotal += amount;
        totalAmount += amount;
        console.log(`  - 奖励 ${reward.rewardId}: ${reward.amount} ETH`);
      });
      console.log(`  📊 小计: ${creatorTotal.toFixed(4)} ETH`);
    }
    console.log(`\n💰 总计退款金额: ${totalAmount.toFixed(4)} ETH`);
    
    // 4. 用户确认
    const confirmed = await askConfirmation(rl, '\n❓ 确认执行退款操作吗？这将消耗Gas费用 (y/N): ');
    if (!confirmed) {
      console.log('❌ 操作已取消');
      rl.close();
      return;
    }
    
    // 5. 获取私钥（安全方式）
    console.log('\n🔑 需要创建者的私钥来执行退款');
    console.log('⚠️  私钥将仅在内存中使用，不会被存储');
    
    const results: RefundResult[] = [];
    
    for (const [creator, rewards] of Object.entries(groupedByCreator)) {
      console.log(`\n👤 处理创建者 ${creator} 的 ${rewards.length} 个奖励...`);
      
      // 获取此创建者的私钥
      const privateKey = await askPrivateKey(rl, `请输入创建者 ${creator} 的私钥: `);
      
      if (!privateKey) {
        console.log(`⏭️  跳过创建者 ${creator}`);
        continue;
      }
      
      try {
        // 验证私钥对应的地址
        const wallet = new ethers.Wallet(privateKey);
        if (wallet.address.toLowerCase() !== creator.toLowerCase()) {
          console.log(`❌ 私钥不匹配创建者地址 ${creator}`);
          continue;
        }
        
        // 连接到网络
        const signer = wallet.connect(zetaProvider);
        const contract = new ethers.Contract(universalRewardAddress, UNIVERSAL_REWARD_ABI, signer);
        
        // 检查余额
        const balance = await zetaProvider.getBalance(creator);
        console.log(`💰 创建者余额: ${ethers.formatEther(balance)} ZETA`);
        
        if (balance < ethers.parseEther('0.01')) {
          console.log('⚠️  余额可能不足以支付Gas费用');
          const proceed = await askConfirmation(rl, '继续执行吗？ (y/N): ');
          if (!proceed) {
            continue;
          }
        }
        
        // 执行退款
        for (const reward of rewards) {
          try {
            console.log(`🔄 退款奖励 ${reward.rewardId}...`);
            
            // 估算Gas
            const gasEstimate = await contract.refund.estimateGas(reward.rewardId);
            console.log(`⛽ 预估Gas: ${gasEstimate.toString()}`);
            
            // 执行退款
            const tx = await contract.refund(reward.rewardId, {
              gasLimit: gasEstimate * BigInt(120) / BigInt(100) // 增加20%缓冲
            });
            
            console.log(`📤 交易已发送: ${tx.hash}`);
            console.log('⏳ 等待确认...');
            
            const receipt = await tx.wait();
            
            if (receipt?.status === 1) {
              console.log(`✅ 奖励 ${reward.rewardId} 退款成功`);
              console.log(`⛽ Gas使用: ${receipt.gasUsed.toString()}`);
              
              results.push({
                rewardId: reward.rewardId,
                success: true,
                txHash: tx.hash,
                gasUsed: receipt.gasUsed.toString()
              });
            } else {
              throw new Error('交易失败');
            }
            
            // 短暂延迟避免nonce冲突
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (error: any) {
            console.error(`❌ 奖励 ${reward.rewardId} 退款失败:`, error.message);
            
            results.push({
              rewardId: reward.rewardId,
              success: false,
              error: error.message
            });
          }
        }
        
      } catch (error: any) {
        console.error(`❌ 处理创建者 ${creator} 时出错:`, error.message);
      }
    }
    
    // 6. 显示最终结果
    console.log('\n📊 退款操作完成');
    console.log('==================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ 成功退款: ${successful.length} 个`);
    console.log(`❌ 失败退款: ${failed.length} 个`);
    
    if (successful.length > 0) {
      console.log('\n✅ 成功的退款:');
      successful.forEach(result => {
        console.log(`  - 奖励 ${result.rewardId}: ${result.txHash} (Gas: ${result.gasUsed})`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ 失败的退款:');
      failed.forEach(result => {
        console.log(`  - 奖励 ${result.rewardId}: ${result.error}`);
      });
    }
    
    // 计算总Gas费用
    const totalGasUsed = successful.reduce((sum, result) => {
      return sum + BigInt(result.gasUsed || '0');
    }, BigInt(0));
    
    console.log(`\n⛽ 总Gas使用: ${totalGasUsed.toString()}`);
    console.log('✅ 所有操作完成');
    
  } catch (error: any) {
    console.error('❌ 执行过程中出错:', error.message);
  } finally {
    rl.close();
  }
}

/**
 * 检测孤儿奖励
 */
async function detectOrphanRewards(contract: ethers.Contract): Promise<OrphanReward[]> {
  const orphanRewards: OrphanReward[] = [];
  
  const nextRewardId = await contract.nextRewardId();
  const totalRewards = Number(nextRewardId) - 1;
  
  for (let i = 1; i <= totalRewards; i++) {
    try {
      const plan = await contract.getRewardPlan(BigInt(i));
      
      // 只处理孤儿奖励且状态为Deposited的记录
      if (plan.taskId.toString() === '0' && Number(plan.status) === 1) {
        orphanRewards.push({
          rewardId: i,
          creator: plan.creator,
          asset: plan.asset,
          amount: ethers.formatEther(plan.amount),
          targetChainId: plan.targetChainId.toString(),
          status: Number(plan.status),
          createdAt: Number(plan.createdAt)
        });
      }
    } catch (error) {
      // 忽略无法读取的奖励
      continue;
    }
  }
  
  return orphanRewards;
}

/**
 * 按创建者分组
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
 * 询问用户确认
 */
function askConfirmation(rl: readline.Interface, question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * 安全地获取私钥
 */
function askPrivateKey(rl: readline.Interface, question: string): Promise<string | null> {
  return new Promise((resolve) => {
    // 隐藏输入（在实际实现中可能需要使用专门的库）
    console.log('⚠️  注意: 私钥输入将在终端中可见，请确保环境安全');
    rl.question(question, (answer) => {
      const privateKey = answer.trim();
      
      if (!privateKey) {
        resolve(null);
        return;
      }
      
      // 验证私钥格式
      if (!privateKey.startsWith('0x')) {
        resolve('0x' + privateKey);
      } else {
        resolve(privateKey);
      }
    });
  });
}

// 运行脚本
if (require.main === module) {
  executeOrphanRefunds().catch(console.error);
}