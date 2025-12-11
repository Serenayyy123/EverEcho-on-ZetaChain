/**
 * 任务类型定义
 * 冻结点 1.3-13：状态枚举必须与合约一致
 */

export enum TaskStatus {
  Open = 0,
  InProgress = 1,
  Submitted = 2,
  Completed = 3,
  Cancelled = 4,
}

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.Open]: 'Open',
  [TaskStatus.InProgress]: 'In Progress',
  [TaskStatus.Submitted]: 'Submitted',
  [TaskStatus.Completed]: 'Completed',
  [TaskStatus.Cancelled]: 'Cancelled',
};

/**
 * 链上任务数据（从合约读取）
 */
export interface OnChainTask {
  taskId: string;
  creator: string;
  helper: string;
  reward: string; // wei
  taskURI: string;
  status: TaskStatus;
  createdAt: number;
  acceptedAt: number;
  submittedAt: number;
  terminateRequestedBy: string;
  terminateRequestedAt: number;
  fixRequested: boolean;
  fixRequestedAt: number;
}

/**
 * 链下任务元数据（从 taskURI 获取）
 */
export interface TaskMetadata {
  title: string;
  description: string;
  contactsEncryptedPayload: string;
  createdAt: number | string; // 支持 number（后端）和 string（ISO）
  category?: string; // 任务分类（可选）
}

/**
 * 完整任务数据（链上 + 链下）
 */
export interface Task extends OnChainTask {
  metadata?: TaskMetadata;
}
