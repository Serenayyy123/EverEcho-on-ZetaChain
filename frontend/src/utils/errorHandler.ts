/**
 * 错误处理工具
 * 统一处理前端错误，提供用户友好的错误信息
 */

export interface ErrorDetails {
  message: string;
  code?: string;
  details?: string;
  action?: string;
  copyable?: string;
}

/**
 * 解析 ethers.js 错误
 */
export function parseEthersError(error: any): ErrorDetails {
  // 用户拒绝交易
  if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
    return {
      message: 'Transaction rejected',
      details: 'You rejected the transaction in your wallet.',
      action: 'Please try again and confirm the transaction.',
    };
  }

  // 余额不足
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return {
      message: 'Insufficient funds',
      details: 'You don\'t have enough ETH to pay for gas fees.',
      action: 'Please add more ETH to your wallet.',
    };
  }

  // 网络错误
  if (error.code === 'NETWORK_ERROR') {
    return {
      message: 'Network error',
      details: 'Failed to connect to the blockchain network.',
      action: 'Please check your internet connection and try again.',
    };
  }

  // 合约执行失败
  if (error.code === 'CALL_EXCEPTION') {
    return {
      message: 'Transaction failed',
      details: error.reason || 'The contract rejected the transaction.',
      action: 'Please check the transaction requirements and try again.',
      copyable: error.reason,
    };
  }

  // Nonce 错误
  if (error.code === 'NONCE_EXPIRED' || error.code === 'REPLACEMENT_UNDERPRICED') {
    return {
      message: 'Transaction nonce error',
      details: 'There was a problem with the transaction order.',
      action: 'Please reset your MetaMask account or wait a moment and try again.',
    };
  }

  // Gas 估算失败
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    return {
      message: 'Gas estimation failed',
      details: 'Unable to estimate gas for this transaction.',
      action: 'The transaction may fail. Please check the requirements.',
      copyable: error.error?.message,
    };
  }

  // 默认错误
  return {
    message: 'Transaction error',
    details: error.message || 'An unexpected error occurred.',
    action: 'Please try again or contact support if the problem persists.',
    copyable: error.message,
  };
}

/**
 * 解析 API 错误
 */
export function parseApiError(error: any): ErrorDetails {
  // 网络错误
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      message: 'Network error',
      details: 'Failed to connect to the backend server.',
      action: 'Please check your internet connection and ensure the backend is running.',
    };
  }

  // HTTP 错误
  if (error.status) {
    switch (error.status) {
      case 400:
        return {
          message: 'Invalid request',
          details: error.message || 'The request data is invalid.',
          action: 'Please check your input and try again.',
        };
      case 404:
        return {
          message: 'Not found',
          details: error.message || 'The requested resource was not found.',
          action: 'Please check the URL and try again.',
        };
      case 500:
        return {
          message: 'Server error',
          details: error.message || 'The server encountered an error.',
          action: 'Please try again later or contact support.',
        };
      default:
        return {
          message: `HTTP ${error.status}`,
          details: error.message || 'An HTTP error occurred.',
          action: 'Please try again or contact support.',
        };
    }
  }

  // 默认错误
  return {
    message: 'API error',
    details: error.message || 'An unexpected error occurred.',
    action: 'Please try again or contact support if the problem persists.',
    copyable: error.message,
  };
}

/**
 * 解析元数据加载错误
 */
export function parseMetadataError(error: any): ErrorDetails {
  return {
    message: 'Failed to load metadata',
    details: 'Unable to fetch task or profile metadata from the server.',
    action: 'The data may be temporarily unavailable. Please refresh the page.',
    copyable: error.message,
  };
}

/**
 * 格式化错误详情为可复制文本
 */
export function formatErrorForCopy(error: ErrorDetails): string {
  const lines: string[] = [];
  
  lines.push('=== Error Details ===');
  lines.push(`Message: ${error.message}`);
  
  if (error.code) {
    lines.push(`Code: ${error.code}`);
  }
  
  if (error.details) {
    lines.push(`Details: ${error.details}`);
  }
  
  if (error.copyable) {
    lines.push(`Technical: ${error.copyable}`);
  }
  
  lines.push(`Timestamp: ${new Date().toISOString()}`);
  lines.push('====================');
  
  return lines.join('\n');
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * 通用错误处理器
 */
export function handleError(error: any, context: 'ethers' | 'api' | 'metadata' = 'ethers'): ErrorDetails {
  console.error(`[${context}] Error:`, error);
  
  switch (context) {
    case 'ethers':
      return parseEthersError(error);
    case 'api':
      return parseApiError(error);
    case 'metadata':
      return parseMetadataError(error);
    default:
      return {
        message: 'Unknown error',
        details: error.message || 'An unexpected error occurred.',
        action: 'Please try again or contact support.',
      };
  }
}
