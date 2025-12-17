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
 * Stage 4: 新增 3 个跨链字段（echoPostFee, rewardAsset, rewardAmount）
 */
export interface OnChainTask {
  taskId: string;
  creator: string;
  helper: string;
  reward: string; // wei - 本链 ECHO（核心 2R 资金流）
  taskURI: string;
  status: TaskStatus;
  createdAt: number;
  acceptedAt: number;
  submittedAt: number;
  terminateRequestedBy: string;
  terminateRequestedAt: number;
  fixRequested: boolean;
  fixRequestedAt: number;
  // Stage 4: 新增字段（与合约 tasks() 返回的 tuple 顺序一致）
  echoPostFee: string; // wei - 发布费用（10 ECHO）
  rewardAsset: string; // address - 跨链奖励资产地址（占位）
  rewardAmount: string; // wei - 跨链奖励数量（占位）
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
 * 
 * Stage 4.1 语义边界说明：
 * - reward: 原生 ECHO，参与 2R 结算（核心资金流）
 * - rewardAsset/rewardAmount: 跨链奖励占位字段，当前不转账
 * - echoPostFee: 固定 10 ECHO 发布费（creator → helper）
 * - Gateway 当前仅记录状态，不进行真实跨链转账
 */
export interface Task extends OnChainTask {
  metadata?: TaskMetadata;
  metadataError?: boolean; // P0 Fix: 元数据加载失败标记
}
