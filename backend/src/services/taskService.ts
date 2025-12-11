import { PrismaClient } from '@prisma/client';
import { TaskInput, TaskOutput, normalizeCreatedAt } from '../models/Task';
import { getCurrentChainId } from '../config/chainConfig';

// 严格获取 chainId（无默认回落）
const CURRENT_CHAIN_ID = getCurrentChainId();

const prisma = new PrismaClient();

/**
 * Task 存储服务
 * 冻结点 2.2-P0-B2：流程固定 - Creator 前端先上传 task → backend 返回 taskURI
 */

/**
 * 创建或更新 Task（幂等）
 * @param input Task 输入数据
 * @param contactsPlaintext 明文联系方式（可选，用于重加密）
 * @param category 任务分类（可选）
 * @param creator Creator 地址（可选）
 * @returns 创建/更新的 Task
 */
export async function upsertTask(
  input: TaskInput, 
  contactsPlaintext?: string,
  category?: string,
  creator?: string
) {
  const { taskId, title, description, contactsEncryptedPayload, createdAt } = input;

  // 规范化 createdAt 为字符串存储
  const createdAtStr = normalizeCreatedAt(createdAt);

  // 幂等性：使用 upsert，同一 taskId 覆盖旧数据
  const task = await prisma.task.upsert({
    where: {
      chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
    },
    update: {
      title,
      description,
      contactsEncryptedPayload,
      contactsPlaintext: contactsPlaintext || undefined,
      createdAt: createdAtStr,
      category: category || undefined,
      creator: creator || undefined,
    },
    create: {
      chainId: CURRENT_CHAIN_ID,
      taskId,
      title,
      description,
      contactsEncryptedPayload,
      contactsPlaintext: contactsPlaintext || undefined,
      createdAt: createdAtStr,
      category: category || undefined,
      creator: creator || undefined,
    },
  });

  return task;
}

/**
 * 根据 taskId 获取 Task
 * @param taskId 任务 ID
 * @returns Task JSON 或 null
 */
export async function getTask(taskId: string): Promise<TaskOutput | null> {
  const task = await prisma.task.findUnique({
    where: {
      chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
    },
  });

  if (!task) {
    return null;
  }

  // 返回符合 schema 的 JSON（冻结点 3.2：字段命名一致）
  // createdAt 转换为 number（uint256 语义）
  return {
    title: task.title,
    description: task.description,
    contactsEncryptedPayload: task.contactsEncryptedPayload,
    createdAt: parseInt(task.createdAt, 10),
    category: task.category || undefined,
    creator: task.creator || undefined,
  };
}

/**
 * 生成 taskURI
 * @param taskId 任务 ID
 * @returns taskURI
 */
export function generateTaskURI(taskId: string): string {
  // 冻结点 2.2-P0-B2：URI 格式固定
  // 支持 staging/production 环境切换
  const baseUrl =
    process.env.BACKEND_PUBLIC_URL?.replace(/\/$/, '') ||
    'https://api.everecho.io';
  return `${baseUrl}/task/${taskId}.json`;
}
