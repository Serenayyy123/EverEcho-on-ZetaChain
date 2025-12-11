/**
 * Task Model
 * 冻结点 1.4-22：Task JSON schema 必填字段
 * 冻结点 3.2：JSON 字段命名必须一致
 */

export interface TaskInput {
  taskId: string;
  title: string;
  description: string;
  contactsEncryptedPayload: string;
  createdAt: string | number; // uint256 语义
}

export interface TaskOutput {
  title: string;
  description: string;
  contactsEncryptedPayload: string;
  createdAt: number; // uint256 as number
  category?: string;
  creator?: string;
}

/**
 * 校验 Task 输入
 * @param data 输入数据
 * @returns 校验结果
 */
export function validateTaskInput(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 必填字段检查（冻结点 1.4-22）
  if (!data.taskId || typeof data.taskId !== 'string') {
    errors.push('taskId is required and must be a string');
  }

  if (!data.title || typeof data.title !== 'string') {
    errors.push('title is required and must be a string');
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('description is required and must be a string');
  }

  if (!data.contactsEncryptedPayload || typeof data.contactsEncryptedPayload !== 'string') {
    errors.push('contactsEncryptedPayload is required and must be a string');
  }

  // createdAt 必须存在且可转换为数字（uint256 语义）
  if (data.createdAt === undefined || data.createdAt === null) {
    errors.push('createdAt is required');
  } else {
    const createdAtNum = typeof data.createdAt === 'string' 
      ? parseInt(data.createdAt, 10) 
      : data.createdAt;
    
    if (isNaN(createdAtNum) || createdAtNum < 0) {
      errors.push('createdAt must be a valid uint256 (non-negative number)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 规范化 createdAt 为字符串（用于存储）
 * @param createdAt 输入的 createdAt
 * @returns 字符串形式的 createdAt
 */
export function normalizeCreatedAt(createdAt: string | number): string {
  if (typeof createdAt === 'string') {
    return createdAt;
  }
  return createdAt.toString();
}
