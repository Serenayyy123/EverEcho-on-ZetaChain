import { ethers } from 'ethers';

/**
 * 签名验证服务（P0-B4）
 * 冻结点 1.3：签名验证必须包含 taskId
 * 冻结点 2.2-P0-B4：验证只做身份确认，不改变链上状态
 */

/**
 * 签名验证结果
 */
export interface SignatureVerificationResult {
  success: boolean;
  recoveredAddress?: string;
  error?: string;
  details?: string;
}

/**
 * 生成签名消息（标准格式）
 * @param taskId 任务 ID
 * @param action 操作类型（可选，如 'decrypt', 'submit' 等）
 * @returns 签名消息
 */
export function generateSignMessage(taskId: string, action: string = 'decrypt'): string {
  return `EverEcho: ${action} for task ${taskId}`;
}

/**
 * 验证签名（基础版本）
 * @param message 签名消息
 * @param signature 签名
 * @param expectedAddress 期望的签名者地址
 * @returns 是否验证通过
 */
export function verifySignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    console.log('[verifySignature] Input:', {
      message,
      signature: signature.slice(0, 20) + '...',
      expectedAddress,
    });
    
    const recoveredAddress = ethers.verifyMessage(message, signature);
    console.log('[verifySignature] Recovered address:', recoveredAddress);
    console.log('[verifySignature] Expected address:', expectedAddress);
    console.log('[verifySignature] Match:', recoveredAddress.toLowerCase() === expectedAddress.toLowerCase());
    
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('[verifySignature] Error:', error);
    return false;
  }
}

/**
 * 验证签名（详细版本）
 * @param message 签名消息
 * @param signature 签名
 * @param expectedAddress 期望的签名者地址
 * @returns 验证结果对象
 */
export function verifySignatureDetailed(
  message: string,
  signature: string,
  expectedAddress: string
): SignatureVerificationResult {
  try {
    // 参数校验
    if (!message || !signature || !expectedAddress) {
      return {
        success: false,
        error: 'Missing required parameters',
        details: 'message, signature, and expectedAddress are required',
      };
    }

    // 恢复签名者地址
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    // 比对地址（不区分大小写）
    const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    
    if (!isValid) {
      return {
        success: false,
        recoveredAddress,
        error: 'Address mismatch',
        details: `Expected ${expectedAddress}, got ${recoveredAddress}`,
      };
    }

    return {
      success: true,
      recoveredAddress,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid signature',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 从签名消息中提取 taskId
 * @param message 签名消息
 * @returns taskId 或 null
 */
export function extractTaskIdFromMessage(message: string): string | null {
  // 支持多种格式：
  // 1. "EverEcho: decrypt for task 123"
  // 2. "task 123"
  // 3. "taskId: 123"
  const patterns = [
    /task (\w+)/i,
    /taskId[:\s]+(\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * 验证签名并校验 taskId
 * @param message 签名消息
 * @param signature 签名
 * @param expectedAddress 期望的签名者地址
 * @param expectedTaskId 期望的 taskId
 * @returns 验证结果对象
 */
export function verifySignatureWithTaskId(
  message: string,
  signature: string,
  expectedAddress: string,
  expectedTaskId: string
): SignatureVerificationResult {
  // 1. 先验证签名
  const signatureResult = verifySignatureDetailed(message, signature, expectedAddress);
  
  if (!signatureResult.success) {
    return signatureResult;
  }

  // 2. 提取并校验 taskId
  const extractedTaskId = extractTaskIdFromMessage(message);
  
  if (!extractedTaskId) {
    return {
      success: false,
      error: 'TaskId not found in message',
      details: 'Message must contain taskId',
    };
  }

  if (extractedTaskId !== expectedTaskId) {
    return {
      success: false,
      error: 'TaskId mismatch',
      details: `Expected taskId ${expectedTaskId}, got ${extractedTaskId}`,
    };
  }

  return {
    success: true,
    recoveredAddress: signatureResult.recoveredAddress,
  };
}

/**
 * 校验签名参数完整性
 * @param params 签名参数
 * @returns 是否完整
 */
export function validateSignatureParams(params: {
  address?: string;
  taskId?: string;
  message?: string;
  signature?: string;
}): { valid: boolean; missing?: string[] } {
  const required = ['address', 'taskId', 'message', 'signature'];
  const missing = required.filter(field => !params[field as keyof typeof params]);
  
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  
  return { valid: true };
}
