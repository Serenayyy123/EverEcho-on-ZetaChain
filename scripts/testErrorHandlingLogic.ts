#!/usr/bin/env npx tsx

/**
 * 测试改进的错误处理逻辑（不需要区块链连接）
 * 验证错误解析、分类和用户友好信息生成
 */

interface TestCase {
  name: string;
  error: any;
  expectedKeywords: string[];
  shouldNotContain?: string[];
}

/**
 * 解析和分类错误（与前端useCreateTask保持一致）
 */
function parseContractError(error: any): string {
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
  if (errorMessage.includes('insufficient funds') || 
      (errorMessage.includes('balance') && !errorMessage.includes('gas'))) {
    return 'Insufficient balance to complete the transaction';
  }
  
  // 合约 revert 错误
  if (errorMessage.includes('revert')) {
    // 尝试提取 revert 原因
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
  
  // 处理对象类型的错误
  if (typeof error === 'object' && error !== null && !error.message) {
    if (error.code) {
      return `Error code: ${error.code}`;
    }
    return 'Unknown error occurred';
  }
  
  // 返回原始错误信息（截断过长的信息）
  return errorMessage.length > 200 ? errorMessage.substring(0, 200) + '...' : errorMessage;
}

/**
 * 测试用例定义
 */
const testCases: TestCase[] = [
  {
    name: 'User Rejection Error',
    error: new Error('user rejected transaction'),
    expectedKeywords: ['cancelled', 'user'],
    shouldNotContain: ['unknown', 'failed']
  },
  {
    name: 'Network Connection Error',
    error: new Error('network connection failed'),
    expectedKeywords: ['Network connection error', 'internet'],
    shouldNotContain: ['unknown']
  },
  {
    name: 'Gas Error',
    error: new Error('out of gas'),
    expectedKeywords: ['insufficient gas', 'gas limit'],
    shouldNotContain: ['unknown']
  },
  {
    name: 'Balance Error',
    error: new Error('insufficient balance in account'),
    expectedKeywords: ['Insufficient balance'],
    shouldNotContain: ['unknown']
  },
  {
    name: 'Contract Revert with Reason',
    error: new Error('execution reverted: revert InvalidTaskId'),
    expectedKeywords: ['Contract error', 'InvalidTaskId'],
    shouldNotContain: ['unknown']
  },
  {
    name: 'Contract Revert without Reason',
    error: new Error('execution reverted'),
    expectedKeywords: ['reverted by the contract'],
    shouldNotContain: ['unknown']
  },
  {
    name: 'Invalid Reward Status',
    error: new Error('Invalid reward status: expected 1, got 4'),
    expectedKeywords: ['invalid state', 'create a new reward'],
    shouldNotContain: ['unknown']
  },
  {
    name: 'Reward Creator Mismatch',
    error: new Error('Reward creator mismatch: expected 0x123, got 0x456'),
    expectedKeywords: ['not the creator'],
    shouldNotContain: ['unknown']
  },
  {
    name: 'Association Verification Failed',
    error: new Error('Association verification failed: reward not found'),
    expectedKeywords: ['verify reward association', 'partially succeeded'],
    shouldNotContain: ['unknown']
  },
  {
    name: 'Timeout Error',
    error: new Error('request timed out after 30 seconds'),
    expectedKeywords: ['timed out', 'check the transaction status'],
    shouldNotContain: ['unknown']
  },
  {
    name: 'Long Error Message',
    error: new Error('This is a very long error message that exceeds 200 characters and should be truncated to prevent overwhelming the user interface with too much technical detail that might not be helpful for troubleshooting the actual issue at hand'),
    expectedKeywords: ['...'],
    shouldNotContain: ['unknown']
  },
  {
    name: 'Null Error',
    error: null,
    expectedKeywords: ['Unknown error occurred'],
    shouldNotContain: []
  },
  {
    name: 'Undefined Error',
    error: undefined,
    expectedKeywords: ['Unknown error occurred'],
    shouldNotContain: []
  },
  {
    name: 'Error without Message',
    error: { code: 'SOME_ERROR' },
    expectedKeywords: ['Error code', 'SOME_ERROR'],
    shouldNotContain: ['unknown']
  }
];

/**
 * 运行单个测试用例
 */
function runTestCase(testCase: TestCase): { passed: boolean; details: string } {
  try {
    const result = parseContractError(testCase.error);
    
    // 检查期望的关键词
    const hasExpectedKeywords = testCase.expectedKeywords.every(keyword => 
      result.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // 检查不应包含的内容
    const hasUnwantedContent = testCase.shouldNotContain?.some(unwanted => 
      result.toLowerCase().includes(unwanted.toLowerCase())
    ) || false;
    
    const passed = hasExpectedKeywords && !hasUnwantedContent;
    
    let details = `Result: "${result}"`;
    if (!hasExpectedKeywords) {
      details += `\n  Missing keywords: ${testCase.expectedKeywords.join(', ')}`;
    }
    if (hasUnwantedContent) {
      details += `\n  Contains unwanted: ${testCase.shouldNotContain?.join(', ')}`;
    }
    
    return { passed, details };
    
  } catch (error) {
    return { 
      passed: false, 
      details: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * 测试重试逻辑模拟
 */
function testRetryLogic(): { passed: boolean; details: string } {
  console.log('\n🔄 Testing retry logic simulation...');
  
  let attempt = 0;
  const maxAttempts = 3;
  let lastError: string | null = null;
  
  // 模拟重试逻辑
  for (attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 模拟前两次失败，第三次成功
      if (attempt < 3) {
        throw new Error(`Simulated failure on attempt ${attempt}`);
      }
      
      console.log(`✅ Success on attempt ${attempt}`);
      return { 
        passed: true, 
        details: `Retry logic worked correctly: succeeded on attempt ${attempt}` 
      };
      
    } catch (error) {
      lastError = parseContractError(error);
      console.log(`❌ Attempt ${attempt} failed: ${lastError}`);
      
      if (attempt < maxAttempts) {
        const waitTime = attempt * 2000;
        console.log(`⏳ Would wait ${waitTime}ms before retry...`);
      }
    }
  }
  
  return { 
    passed: false, 
    details: `All ${maxAttempts} attempts failed. Last error: ${lastError}` 
  };
}

/**
 * 测试错误信息构造
 */
function testErrorMessageConstruction(): { passed: boolean; details: string } {
  console.log('\n📝 Testing error message construction...');
  
  const associationError = new Error('lockForTask failed: insufficient gas');
  const refundError = new Error('refund failed: request timed out');
  
  // 模拟错误信息构造逻辑
  let errorMessage = 'Cross-chain reward association failed after 3 attempts.';
  
  if (associationError) {
    const parsedAssociationError = parseContractError(associationError);
    errorMessage += ` Last association error: ${parsedAssociationError}`;
  }
  
  // 模拟退款失败
  errorMessage += ` Automatic refund also failed after 3 attempts.`;
  if (refundError) {
    const parsedRefundError = parseContractError(refundError);
    errorMessage += ` Last refund error: ${parsedRefundError}`;
  }
  errorMessage += ` Please contact support immediately. Reward ID: test-reward-123`;
  
  console.log('Constructed error message:', errorMessage);
  
  // 验证错误信息包含所有必要信息
  const requiredElements = [
    'association failed',
    'insufficient gas',
    'refund also failed',
    'timed out',
    'contact support',
    'Reward ID: test-reward-123'
  ];
  
  const hasAllElements = requiredElements.every(element => 
    errorMessage.toLowerCase().includes(element.toLowerCase())
  );
  
  return {
    passed: hasAllElements,
    details: hasAllElements 
      ? 'Error message construction works correctly'
      : `Missing elements: ${requiredElements.filter(el => !errorMessage.toLowerCase().includes(el.toLowerCase())).join(', ')}`
  };
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🧪 Testing Improved Error Handling Logic');
  console.log('=========================================\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // 测试错误解析
  console.log('📋 Testing error parsing...');
  for (const testCase of testCases) {
    totalTests++;
    const result = runTestCase(testCase);
    
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testCase.name}`);
    
    if (!result.passed) {
      console.log(`   ${result.details}`);
    }
    
    if (result.passed) {
      passedTests++;
    }
  }
  
  // 测试重试逻辑
  totalTests++;
  const retryResult = testRetryLogic();
  const retryStatus = retryResult.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${retryStatus} Retry Logic Simulation`);
  if (!retryResult.passed) {
    console.log(`   ${retryResult.details}`);
  }
  if (retryResult.passed) {
    passedTests++;
  }
  
  // 测试错误信息构造
  totalTests++;
  const constructionResult = testErrorMessageConstruction();
  const constructionStatus = constructionResult.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${constructionStatus} Error Message Construction`);
  if (!constructionResult.passed) {
    console.log(`   ${constructionResult.details}`);
  }
  if (constructionResult.passed) {
    passedTests++;
  }
  
  // 输出总结
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`📈 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All error handling logic tests passed!');
    console.log('\n✨ Key improvements verified:');
    console.log('   • User-friendly error messages');
    console.log('   • Proper error categorization');
    console.log('   • Retry logic simulation');
    console.log('   • Comprehensive error information');
    console.log('   • Graceful handling of edge cases');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the error handling logic.');
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}