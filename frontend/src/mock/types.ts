/**
 * Mock 数据类型定义
 * 与真实合约/后端接口保持一致
 */

export enum TaskStatus {
  Open = 0,
  InProgress = 1,
  Submitted = 2,
  Completed = 3,
  Cancelled = 4,
}

export interface Profile {
  address: string;
  profileURI: string;
  isRegistered: boolean;
  balance: string; // ECHO balance
}

export interface Task {
  taskId: number;
  creator: string;
  helper: string;
  reward: string;
  taskURI: string;
  status: TaskStatus;
  createdAt: number;
  acceptedAt: number;
  submittedAt: number;
  terminateRequestedBy: string;
  terminateRequestedAt: number;
  fixRequested: boolean;
  fixRequestedAt: number;
  metadata?: {
    title: string;
    description: string;
    category?: string;
  };
}

export interface Contacts {
  taskId: number;
  creatorContacts: string;
  helperContacts: string;
  encrypted: boolean;
}

// 时间常量（秒）
export const TIME_CONSTANTS = {
  T_OPEN: 7 * 24 * 60 * 60, // 7 days
  T_PROGRESS: 14 * 24 * 60 * 60, // 14 days
  T_REVIEW: 3 * 24 * 60 * 60, // 3 days
  T_TERMINATE_RESPONSE: 48 * 60 * 60, // 48 hours
  T_FIX_EXTENSION: 3 * 24 * 60 * 60, // 3 days
};

export const FEE_BPS = 200; // 2%
export const MAX_REWARD = "1000"; // 1000 ECHO
