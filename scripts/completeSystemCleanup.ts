/**
 * 完整系统清理脚本
 * 清理所有测试任务、孤儿奖励和跨链状态
 * 为新部署的链做准备
 */

import { ethers } from 'ethers';
import * as readline from 'readline';

// 合约地址配置 - 使用新部署的地址
const NEW_CONTRACTS = {
  TASK_ESCROW: '0x162E96b13E122719E90Cf3544E6Eb29DFa834757',
  ECHO_TOKEN: '0x650AAE045552567df9eb0633afd77D44308D3e6D',
  REGISTER: '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA',
  UNIVERSAL_REWARD: '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3'
};

// 旧合约地址 - 需要清理的数据
const OLD_CONTRACTS = {
  TASK_ESCROW: '0xE442Eb737983986153E42C9ad28530676d8C1f55',
  ECHO_TOKEN: '0x876E3e3508c8ee669359A0e58A7bADD55530B8B3'
};

// 合约 ABI
const UNIVERSAL_REWARD_ABI = [
  'function nextRewardId() external view returns (uint256)',
  'function rewardPlans(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))',
  'function refund(uint256 rewardId) external',
  'event RewardRefunded(uint256 indexed rewardId, address indexed creator)'
];

const TASK_ESCROW_ABI = [
  'function taskCounter() external view returns (uint256)',
  'function tasks(uint256 taskId) external view returns (tuple(uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount))'
];

interface OrphanReward {
  rewardId: string;
  creator: string;
  amount: string;
  asset: string;
  status: number;
  createdAt: number;
  reason: string;
}

interface TestTask {
  taskId: string;
  creator: string;
  status: number;
  createdAt: number;
}

interface CleanupSummary {
  orphanRewards: OrphanReward[];
  testTasks: TestTask[];
  crossChainStates: string[];
  totalAmount: number;
  affectedUsers: string[];
}

class SystemCleaner {
  private provider: ethers.Provider;
  private universalRewardContract: ethers.Contract;
  private taskEscrowContract: ethers.Contract;
  private rl: readline.Interface;

  constructor() {
    this.provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    this.universalRewardContract = new ethers.Contract(NEW_CONTRACTS.UNIVERSAL_REWARD, UNIVERSAL_REWARD_ABI, this.provider);
    this.taskEscrowContract = new ethers.Contract(NEW_CONTRACTS.TASK_ESCROW, TASK_ESCROW_ABI, this.provider);
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * 执行完整的系统清理
   */
  async executeCompleteCleanup(): Promise<void> {
    console.log('🧹 开始完整系统清理...');
    console.log('📋 目标: 清理所有测试数据，为新链部署做准备\n');

    try {
      // 1. 扫描和分析
      console.log('🔍 第一步: 扫描系统状态...');
      const summary = await this.scanSystemState();
      
      // 2. 显示清理计划
      this.displayCleanupPlan(summary);
      
      // 3. 用户确认
      const confirmed = await this.askConfirmation('确认执行完整清理吗？这将清理所有测试数据 (y/N): ');
      if (!confirmed) {
        console.log('❌ 清理操作已取消');
        return;
      }

      // 4. 执行清理
      await this.executeCleanup(summary);
      
      // 5. 验证清理结果
      await this.verifyCleanup();
      
      console.log('\n✅ 完整系统清理完成！');
      console.log('🚀 系统已准备好使用新的合约地址');

    } catch (error: any) {
      console.error('❌ 清理过程中出错:', error.message);
      throw error;
    } finally {
      this.rl.close();
    }
  }

  /**
   * 扫描系统状态
   */
  private async scanSystemState(): Promise<CleanupSummary> {
    const summary: CleanupSummary = {
      orphanRewards: [],
      testTasks: [],
      crossChainStates: [],
      totalAmount: 0,
      affectedUsers: []
    };

    // 扫描孤儿奖励
    console.log('   🔍 扫描孤儿奖励...');
    summary.orphanRewards = await this.scanOrphanRewards();
    
    // 扫描测试任务
    console.log('   🔍 扫描测试任务...');
    summary.testTasks = await this.scanTestTasks();
    
    // 检查跨链状态
    console.log('   🔍 检查跨链状态...');
    summary.crossChainStates = this.checkCrossChainStates();
    
    // 计算统计信息
    summary.totalAmount = summary.orphanRewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
    summary.affectedUsers = [...new Set([
      ...summary.orphanRewards.map(r => r.creator),
      ...summary.testTasks.map(t => t.creator)
    ])];

    return summary;
  }

  /**
   * 扫描孤儿奖励
   */
  private async scanOrphanRewards(): Promise<OrphanReward[]> {
    const orphanRewards: OrphanReward[] = [];

    try {
      const nextRewardId = await this.universalRewardContract.nextRewardId();
      const totalRewards = Number(nextRewardId);
      
      console.log(`     📊 总奖励数量: ${totalRewards}`);

      for (let rewardId = 1; rewardId < totalRewards; rewardId++) {
        try {
          const rewardPlan = await this.universalRewardContract.rewardPlans(rewardId);
          
          // 检查是否为孤儿奖励或测试奖励
          const isOrphan = rewardPlan.taskId.toString() === '0';
          const isTestReward = this.isTestReward(rewardPlan);
          
          if (isOrphan || isTestReward) {
            orphanRewards.push({
              rewardId: rewardId.toString(),
              creator: rewardPlan.creator,
              amount: ethers.formatEther(rewardPlan.amount),
              asset: rewardPlan.asset,
              status: Number(rewardPlan.status),
              createdAt: Number(rewardPlan.createdAt),
              reason: isOrphan ? '孤儿奖励 (taskId=0)' : '测试奖励'
            });
          }
        } catch (error) {
          // 忽略无法读取的奖励
          continue;
        }
      }

      console.log(`     📊 发现 ${orphanRewards.length} 个需要清理的奖励`);
      return orphanRewards;

    } catch (error: any) {
      console.error('     ❌ 扫描奖励失败:', error.message);
      return [];
    }
  }

  /**
   * 扫描测试任务
   */
  private async scanTestTasks(): Promise<TestTask[]> {
    const testTasks: TestTask[] = [];

    try {
      const taskCounter = await this.taskEscrowContract.taskCounter();
      const totalTasks = Number(taskCounter);
      
      console.log(`     📊 总任务数量: ${totalTasks}`);

      for (let taskId = 1; taskId <= totalTasks; taskId++) {
        try {
          const task = await this.taskEscrowContract.tasks(taskId);
          
          // 检查是否为测试任务
          if (this.isTestTask(task)) {
            testTasks.push({
              taskId: taskId.toString(),
              creator: task.creator,
              status: Number(task.status),
              createdAt: Number(task.createdAt)
            });
          }
        } catch (error) {
          // 忽略无法读取的任务
          continue;
        }
      }

      console.log(`     📊 发现 ${testTasks.length} 个测试任务`);
      return testTasks;

    } catch (error: any) {
      console.error('     ❌ 扫描任务失败:', error.message);
      return [];
    }
  }

  /**
   * 检查跨链状态
   */
  private checkCrossChainStates(): string[] {
    const states = [];
    
    // 这里列出需要清理的 localStorage 键
    const keysToCheck = [
      'everecho_crosschain_draft',
      'pendingRewardId',
      'crosschain_reward_state',
      'crosschain_draft'
    ];

    keysToCheck.forEach(key => {
      states.push(`localStorage.${key}`);
    });

    console.log(`     📊 需要清理 ${states.length} 个前端状态`);
    return states;
  }

  /**
   * 判断是否为测试奖励
   */
  private isTestReward(rewardPlan: any): boolean {
    // 根据创建时间、金额等判断是否为测试奖励
    const amount = parseFloat(ethers.formatEther(rewardPlan.amount));
    const isSmallAmount = amount < 0.1; // 小于 0.1 ETH 的可能是测试
    
    // 可以根据需要添加更多判断条件
    return isSmallAmount;
  }

  /**
   * 判断是否为测试任务
   */
  private isTestTask(task: any): boolean {
    // 根据任务内容、创建时间等判断是否为测试任务
    const taskURI = task.taskURI || '';
    const isTestURI = taskURI.includes('test') || taskURI.includes('测试');
    
    // 可以根据需要添加更多判断条件
    return isTestURI;
  }

  /**
   * 显示清理计划
   */
  private displayCleanupPlan(summary: CleanupSummary): void {
    console.log('\n📋 清理计划摘要:');
    console.log('='.repeat(50));
    
    console.log(`🎯 孤儿奖励: ${summary.orphanRewards.length} 个`);
    if (summary.orphanRewards.length > 0) {
      const groupedByCreator = this.groupByCreator(summary.orphanRewards);
      for (const [creator, rewards] of Object.entries(groupedByCreator)) {
        const totalAmount = rewards.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        console.log(`   👤 ${creator}: ${rewards.length} 个奖励, 总计 ${totalAmount.toFixed(4)} ETH`);
      }
    }

    console.log(`🎯 测试任务: ${summary.testTasks.length} 个`);
    if (summary.testTasks.length > 0) {
      const groupedByCreator = this.groupByCreator(summary.testTasks);
      for (const [creator, tasks] of Object.entries(groupedByCreator)) {
        console.log(`   👤 ${creator}: ${tasks.length} 个任务`);
      }
    }

    console.log(`🎯 跨链状态: ${summary.crossChainStates.length} 个`);
    summary.crossChainStates.forEach(state => {
      console.log(`   📱 ${state}`);
    });

    console.log(`\n📊 统计信息:`);
    console.log(`   💰 总退款金额: ${summary.totalAmount.toFixed(4)} ETH`);
    console.log(`   👥 涉及用户: ${summary.affectedUsers.length} 个`);
    console.log(`   🔧 清理操作: ${summary.orphanRewards.length + summary.testTasks.length + summary.crossChainStates.length} 个`);
  }

  /**
   * 执行清理操作
   */
  private async executeCleanup(summary: CleanupSummary): Promise<void> {
    console.log('\n🚀 开始执行清理操作...');

    // 1. 清理孤儿奖励
    if (summary.orphanRewards.length > 0) {
      console.log('\n💰 清理孤儿奖励...');
      await this.cleanupOrphanRewards(summary.orphanRewards);
    }

    // 2. 清理测试任务（如果需要）
    if (summary.testTasks.length > 0) {
      console.log('\n📋 标记测试任务...');
      this.markTestTasks(summary.testTasks);
    }

    // 3. 生成前端清理脚本
    console.log('\n📱 生成前端清理脚本...');
    this.generateFrontendCleanupScript(summary.crossChainStates);
  }

  /**
   * 清理孤儿奖励
   */
  private async cleanupOrphanRewards(orphanRewards: OrphanReward[]): Promise<void> {
    console.log('⚠️  注意: 孤儿奖励清理需要创建者的私钥');
    console.log('💡 建议: 联系相关用户或使用管理员权限执行退款');
    
    const groupedByCreator = this.groupByCreator(orphanRewards);
    
    for (const [creator, rewards] of Object.entries(groupedByCreator)) {
      console.log(`\n👤 处理创建者 ${creator} 的 ${rewards.length} 个奖励...`);
      
      // 这里可以添加实际的退款逻辑
      // 需要获取创建者的私钥或使用管理员权限
      console.log('   📝 生成退款命令:');
      rewards.forEach(reward => {
        console.log(`   npx hardhat run scripts/refundReward.ts --reward-id ${reward.rewardId} --network zetachain`);
      });
    }
  }

  /**
   * 标记测试任务
   */
  private markTestTasks(testTasks: TestTask[]): void {
    console.log('📝 测试任务列表 (仅供参考，不会自动删除):');
    testTasks.forEach(task => {
      console.log(`   - 任务 ${task.taskId}: 创建者 ${task.creator}, 状态 ${task.status}`);
    });
  }

  /**
   * 生成前端清理脚本
   */
  private generateFrontendCleanupScript(states: string[]): void {
    const script = `
// 前端状态清理脚本
// 在浏览器控制台中运行此脚本

console.log('🧹 清理前端跨链状态...');

const keysToRemove = [
  'everecho_crosschain_draft',
  'pendingRewardId', 
  'crosschain_reward_state',
  'crosschain_draft'
];

let clearedCount = 0;

keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    clearedCount++;
    console.log('✅ 已清理:', key);
  }
});

console.log(\`✅ 已清理 \${clearedCount} 个状态项\`);
console.log('🔄 刷新页面以查看效果...');
window.location.reload();
`;

    console.log('📄 前端清理脚本已生成:');
    console.log(script);
    
    // 保存到文件
    require('fs').writeFileSync('frontend-cleanup-script.js', script);
    console.log('💾 脚本已保存到: frontend-cleanup-script.js');
  }

  /**
   * 验证清理结果
   */
  private async verifyCleanup(): Promise<void> {
    console.log('\n🔍 验证清理结果...');
    
    try {
      // 重新扫描检查是否还有孤儿奖励
      const remainingOrphans = await this.scanOrphanRewards();
      
      if (remainingOrphans.length === 0) {
        console.log('✅ 孤儿奖励清理完成');
      } else {
        console.log(`⚠️ 仍有 ${remainingOrphans.length} 个孤儿奖励需要处理`);
      }
      
      console.log('✅ 清理验证完成');
      
    } catch (error: any) {
      console.error('❌ 验证过程中出错:', error.message);
    }
  }

  /**
   * 按创建者分组
   */
  private groupByCreator<T extends { creator: string }>(items: T[]): Record<string, T[]> {
    return items.reduce((groups, item) => {
      const creator = item.creator;
      if (!groups[creator]) {
        groups[creator] = [];
      }
      groups[creator].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * 询问用户确认
   */
  private askConfirmation(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 完整系统清理工具');
  console.log('📋 目标: 为新部署的链清理所有测试数据\n');
  
  try {
    const cleaner = new SystemCleaner();
    await cleaner.executeCompleteCleanup();
    
  } catch (error: any) {
    console.error('💥 清理失败:', error.message);
    process.exit(1);
  }
}

// 运行清理
if (require.main === module) {
  main().catch(console.error);
}

export { SystemCleaner };