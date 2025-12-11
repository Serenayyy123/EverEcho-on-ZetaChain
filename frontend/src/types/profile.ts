/**
 * Profile 类型定义
 * 冻结点 2.3-P0-F3：Profile 数据来源
 */

export interface Profile {
  address: string;
  nickname: string;
  city: string;
  skills: string[];
  encryptionPubKey: string;
  contacts?: string; // 联系方式（可选）
}

/**
 * 用户统计信息
 */
export interface UserStats {
  echoBalance: string; // wei
  tasksCreated: number;
  tasksHelped: number;
  tasksCompleted: number;
}
