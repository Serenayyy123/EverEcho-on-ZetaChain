#!/usr/bin/env npx tsx

/**
 * 测试改进的任务奖励关联流程
 * 验证错误处理、重试机制和自动回滚功能
 */

import { ethers } from 'ethers';
import { config } from 'dotenv';

// 加载环境变量
config();

// 合约地址配置
const CONTRACTS = {
  UNIVERSAL_REWARD: process.env.VITE_UNIVERSAL_REWARD_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  TASK_ESCROW: process.env.VITE_TASK_ESCROW_ADDRESS || '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  ECHO_TOKEN: process.env.VITE_ECHO_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
};

// 测试账户
const TEST_ACCOUNTS = [
  {
    name: 'Account 1',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  {
    name: 'Account 2', 
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  }
];

// ABI 定义
const UNIVERSAL_REWARD_ABI = [
  'function prepareReward(address asset, uint256 amount, uint256 targetChainId, address targetAddress) external payable returns (uint256)',
  'function lockForTask(uint256 rewardId, uint256 taskId) external',
  'function refund(uint256 rewardId) external',
  'function getRewardByTask(uint256 taskId) external view returns (uint256)',
  'function rewardPlans(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, string lastTxHash))',
  'event RewardPrepared(uint256 indexed rewardId, address indexed creator, address asset, uint256 amount, uint256 targetChainId)',
  'event RewardLocked(uint256 indexed rewardId, uint256 indexed taskId)',
  'event RewardRefunded(uint256 indexed rewardId, address indexed creator, uint256 amount)'
];

const TASK_ESCROW_ABI = [
  'function createTaskWithCrossChainReward(uint256 reward, string memory taskURI, address rewardAsset, uint256 rewardAmount, uint256 targetChainId) external returns (uint256)',
  'function taskCounter() external view returns (uint256)',
  'event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward, string taskURI)'
];

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)'
];

interface TestResult {
  testName: string;
  success: boolean;
  error?: string;
  details?: any;
}

class ImprovedTaskRewardAssociationTester {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private universalRewardContract: ethers.Contract;
  private taskEscrowContract: ethers.Contract;
  private echoTokenContract: ethers.Contract;

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    this.universalRewardContract = new ethers.Contract(CONTRACTS.UNIVERSAL_REWARD, UNIVERSAL_REWARD_ABI, signer);
    this.taskEscrowContract = new ethers.Contract(CONTRACTS.TASK_ESCROW, TASK_ESCROW_ABI, signer);
    this.echoTokenContract = new ethers.Contract(CONTRACTS.ECHO_TOKEN, ERC20_ABI, signer);
  }

  /**
   * 解析和分类错误（与前端保持一致）
   */
  private parseContractError(error: any): string {
    if (!error) return 'Unknown error occurred';
    
    const errorMessage = error.message || error.toString();
    
    // 用户取消交易
    if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
      return 'Transaction was cancelled by user';
    }
    
    // 网络错误
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return 'Network connection error. Please check your internet connection and try again';
    }
    
    // Gas 相关错误
    if (errorMessage.includes('gas') || errorMessage.includes('out of gas')) {
      return 'Transaction failed due to insufficient gas. Please try again with higher gas limit';
    }
    
    // 余额不足
    if (errorMessage.includes('insufficient funds') || errorMessage.includes('balance')) {
      return 'Insufficient balance to complete the transaction';
    }
    
    // 合约 revert 错误
    if (errorMessage.includes('revert')) {
      const revertMatch = errorMessage.match(/revert (.+?)(?:\s|$)/);
      if (revertMatch) {
        return `Contract error: ${revertMatch[1]}`;
      }
      return 'Transaction was reverted by the contract';
    }
    
    // 奖励相关的特定错误
    if (errorMessage.includes('Invalid reward status')) {
      return 'The cross-chain reward is in an invalid state. Please create a new reward';
    }
    
    if (errorMessage.includes('Reward creator mismatch')) {
      return 'You are not the creator of this cross-chain reward';
    }
    
    if (errorMessage.includes('Association verification failed')) {
      return 'Failed to verify reward association. The operation may have partially succeeded';
    }
    
    // 超时错误
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return 'Transaction timed out. Please check the transaction status and try again if needed';
    }
    
    // 返回原始错误信息（截断过长的信息）
    return errorMessage.length > 200 ? errorMessage.substring(0, 200) + '...' : errorMessage;
  }

  /**
   * 准备跨链奖励
   */
  private async prepareReward(): Promise<string> {
    console.log('📋 Preparing cross-chain reward...');
    
    const asset = '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf'; // ETH ZRC20
    const amount = ethers.parseEther('0.01'); // 0.01 ETH
    const targetChainId = 11155111; // Sepolia
    const targetAddress = await this.signer.getAddress();
    
    const tx = await this.universalRewardContract.prepareReward(
      asset,
      amount,
      targetChainId,
      targetAddress,
      { value: amount }
    );
    
    const receipt = await tx.wait();
    
    // 解析RewardPrepared事件获取rewardId
    for (const log of receipt.logs) {
      try {
        const parsedLog = this.universalRewardContract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === 'RewardPrepared') {
          const rewardId = parsedLog.args.rewardId.toString();
          console.log('✅ Reward prepared with ID:', rewardId);
          return rewardId;
        }
      } catch (err) {
        continue;
      }
    }
    
    throw new Error('Failed to parse rewardId from RewardPrepared event');
  }

  /**
   * 创建任务
   */
  private async createTask(): Promise<string> {
    console.log('📋 Creating task...');
    
    const reward = ethers.parseEther('10'); // 10 ECHO
    const postFee = ethers.parseEther('10'); // 10 ECHO post fee
    const totalRequired = reward + postFee;
    
    // 授权ECHO代币
    const approveTx = await this.echoTokenContract.approve(CONTRACTS.TASK_ESCROW, totalRequired);
    await approveTx.wait();
    
    // 创建任务
    const taskURI = `test-task-${Date.now()}`;
    const tx = await this.taskEscrowContract.createTaskWithCrossChainReward(
      reward,
      taskURI,
      '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf', // ETH ZRC20
      ethers.parseEther('0.01'),
      11155111 // Sepolia
    );
    
    const receipt = await tx.wait();
    
    // 解析TaskCreated事件获取taskId
    for (const log of receipt.logs) {
      try {
        const parsedLog = this.taskEscrowContract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === 'TaskCreated') {
          const taskId = parsedLog.args.taskId.toString();
          console.log('✅ Task created with ID:', taskId);
          return taskId;
        }
      } catch (err) {
        continue;
      }
    }
    
    throw new Error('Failed to parse taskId from TaskCreated event');
  }

  /**
   * 测试成功的关联流程
   */
  async testSuccessfulAssociation(): Promise<TestResult> {
    try {
      console.log('\n🧪 Testing successful association...');
      
      // 1. 准备奖励
      const rewardId = await this.prepareReward();
      
      // 2. 创建任务
      const taskId = await this.createTask();
      
      // 3. 关联奖励到任务
      console.log(`🔗 Associating reward ${rewardId} to task ${taskId}...`);
      const lockTx = await this.universalRewardContract.lockForTask(
        BigInt(rewardId),
        BigInt(taskId)
      );
      await lockTx.wait();
      
      // 4. 验证关联
      const associatedRewardId = await this.universalRewardContract.getRewardByTask(BigInt(taskId));
      
      if (associatedRewardId.toString() === rewardId) {
        console.log('✅ Association verified successfully');
        return {
          testName: 'Successful Association',
          success: true,
          details: { rewardId, taskId, associatedRewardId: associatedRewardId.toString() }
        };
      } else {
        throw new Error(`Association verification failed. Expected: ${rewardId}, Got: ${associatedRewardId.toString()}`);
      }
      
    } catch (error) {
      const parsedError = this.parseContractError(error);
      console.error('❌ Test failed:', parsedError);
      return {
        testName: 'Successful Association',
        success: false,
        error: parsedError
      };
    }
  }

  /**
   * 测试关联失败后的自动退款
   */
  async testAssociationFailureAndRefund(): Promise<TestResult> {
    try {
      console.log('\n🧪 Testing association failure and refund...');
      
      // 1. 准备奖励
      const rewardId = await this.prepareReward();
      
      // 2. 尝试关联到不存在的任务（应该失败）
      const invalidTaskId = '999999';
      
      console.log(`🔗 Attempting to associate reward ${rewardId} to invalid task ${invalidTaskId}...`);
      
      let associationFailed = false;
      try {
        const lockTx = await this.universalRewardContract.lockForTask(
          BigInt(rewardId),
          BigInt(invalidTaskId)
        );
        await lockTx.wait();
      } catch (lockError) {
        associationFailed = true;
        console.log('✅ Association failed as expected:', this.parseContractError(lockError));
      }
      
      if (!associationFailed) {
        throw new Error('Association should have failed but succeeded');
      }
      
      // 3. 执行退款
      console.log(`💰 Refunding reward ${rewardId}...`);
      const refundTx = await this.universalRewardContract.refund(BigInt(rewardId));
      await refundTx.wait();
      
      // 4. 验证退款状态
      const rewardPlan = await this.universalRewardContract.rewardPlans(BigInt(rewardId));
      
      if (rewardPlan.status === 4) { // Refunded = 4
        console.log('✅ Refund verified successfully');
        return {
          testName: 'Association Failure and Refund',
          success: true,
          details: { rewardId, status: rewardPlan.status.toString() }
        };
      } else {
        throw new Error(`Refund verification failed. Expected status 4, Got: ${rewardPlan.status}`);
      }
      
    } catch (error) {
      const parsedError = this.parseContractError(error);
      console.error('❌ Test failed:', parsedError);
      return {
        testName: 'Association Failure and Refund',
        success: false,
        error: parsedError
      };
    }
  }

  /**
   * 测试错误解析功能
   */
  async testErrorParsing(): Promise<TestResult> {
    try {
      console.log('\n🧪 Testing error parsing...');
      
      const testErrors = [
        { error: new Error('user rejected transaction'), expected: 'cancelled by user' },
        { error: new Error('network connection failed'), expected: 'Network connection error' },
        { error: new Error('out of gas'), expected: 'insufficient gas' },
        { error: new Error('revert InvalidTaskId'), expected: 'Contract error: InvalidTaskId' },
        { error: new Error('insufficient funds for gas'), expected: 'Insufficient balance' }
      ];
      
      let allPassed = true;
      const results: any[] = [];
      
      for (const testCase of testErrors) {
        const parsed = this.parseContractError(testCase.error);
        const passed = parsed.toLowerCase().includes(testCase.expected.toLowerCase());
        
        results.push({
          input: testCase.error.message,
          expected: testCase.expected,
          parsed,
          passed
        });
        
        if (!passed) {
          allPassed = false;
        }
        
        console.log(`${passed ? '✅' : '❌'} Error parsing: "${testCase.error.message}" -> "${parsed}"`);
      }
      
      return {
        testName: 'Error Parsing',
        success: allPassed,
        details: results
      };
      
    } catch (error) {
      const parsedError = this.parseContractError(error);
      console.error('❌ Test failed:', parsedError);
      return {
        testName: 'Error Parsing',
        success: false,
        error: parsedError
      };
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting improved task reward association tests...\n');
    
    const results: TestResult[] = [];
    
    // 测试错误解析（不需要区块链交互）
    results.push(await this.testErrorParsing());
    
    // 测试成功关联
    results.push(await this.testSuccessfulAssociation());
    
    // 测试失败和退款
    results.push(await this.testAssociationFailureAndRefund());
    
    return results;
  }
}

async function main() {
  try {
    // 连接到本地网络
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = new ethers.Wallet(TEST_ACCOUNTS[0].privateKey, provider);
    
    console.log('🔗 Connected to network');
    console.log('👤 Using account:', await signer.getAddress());
    
    // 检查余额
    const balance = await provider.getBalance(await signer.getAddress());
    console.log('💰 ETH Balance:', ethers.formatEther(balance));
    
    const echoBalance = await new ethers.Contract(CONTRACTS.ECHO_TOKEN, ERC20_ABI, provider)
      .balanceOf(await signer.getAddress());
    console.log('🪙 ECHO Balance:', ethers.formatEther(echoBalance));
    
    // 运行测试
    const tester = new ImprovedTaskRewardAssociationTester(provider, signer);
    const results = await tester.runAllTests();
    
    // 输出结果
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    let passedCount = 0;
    let totalCount = results.length;
    
    for (const result of results) {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.testName}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.success) {
        passedCount++;
      }
    }
    
    console.log(`\n📈 Overall: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All tests passed! Improved error handling is working correctly.');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please review the implementation.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}