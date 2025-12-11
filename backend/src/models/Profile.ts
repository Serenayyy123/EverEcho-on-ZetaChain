/**
 * Profile Model
 * 冻结点 1.4-22：Profile JSON schema 必填字段
 * 冻结点 3.2：JSON 字段命名必须一致
 */

export interface ProfileInput {
  address: string;
  nickname: string;
  city: string;
  skills: string[];
  encryptionPubKey: string;
  contacts?: string; // 联系方式（可选）
}

export interface ProfileOutput {
  nickname: string;
  city: string;
  skills: string[];
  encryptionPubKey: string;
  contacts?: string; // 联系方式（可选）
}

/**
 * 校验 Profile 输入
 * @param data 输入数据
 * @returns 校验结果
 */
export function validateProfileInput(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 必填字段检查（冻结点 1.4-22）
  if (!data.address || typeof data.address !== 'string') {
    errors.push('address is required and must be a string');
  }

  if (!data.nickname || typeof data.nickname !== 'string') {
    errors.push('nickname is required and must be a string');
  }

  if (!data.city || typeof data.city !== 'string') {
    errors.push('city is required and must be a string');
  }

  if (!Array.isArray(data.skills)) {
    errors.push('skills is required and must be an array');
  } else if (data.skills.some((s: any) => typeof s !== 'string')) {
    errors.push('skills must be an array of strings');
  }

  if (!data.encryptionPubKey || typeof data.encryptionPubKey !== 'string') {
    errors.push('encryptionPubKey is required and must be a string');
  }

  // address 格式校验（以太坊地址）
  if (data.address && !/^0x[a-fA-F0-9]{40}$/.test(data.address)) {
    errors.push('address must be a valid Ethereum address');
  }

  // contacts 是可选的，如果提供则必须是字符串
  if (data.contacts !== undefined && typeof data.contacts !== 'string') {
    errors.push('contacts must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
