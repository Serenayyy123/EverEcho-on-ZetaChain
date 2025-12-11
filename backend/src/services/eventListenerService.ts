/**
 * 链上事件监听服务
 * 监听 TaskEscrow 合约事件，自动同步数据到数据库
 */

import { ethers, EventLog } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { generateDEK, wrapDEK, encryptContacts } from './encryptionService';
import { syncTaskWithLock } from './taskSyncCoordinator';

const prisma = new PrismaClient();

// TaskEscrow ABI（完整 struct 定义，与合约一致）
const TASK_ESCROW_ABI = [
  'event TaskCreated(uint256 indexed taskId, address indexed creator, string taskURI)',
  'event TaskAccepted(uint256 indexed taskId, address indexed helper)',
  // 完整 Task struct（13 字段）
  'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
];

interface EventListenerConfig {
  rpcUrl: string;
  taskEscrowAddress: string;
  startBlock?: number;
}

export class EventListenerService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private isRunning: boolean = false;

  constructor(config: EventListenerConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.contract = new ethers.Contract(
      config.taskEscrowAddress,
      TASK_ESCROW_ABI,
      this.provider
    );
  }

  /**
   * 启动事件监听
   */
  async start() {
    if (this.isRunning) {
      console.log('[EventListener] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[EventListener] Starting event listener service...');

    // 监听 TaskCreated 事件
    this.contract.on('TaskCreated', async (taskId, creator, taskURI, event) => {
      console.log(`[EventListener] TaskCreated event: taskId=${taskId}, creator=${creator}`);
      await this.handleTaskCreated(taskId.toString(), creator, taskURI);
    });

    // 监听 TaskAccepted 事件
    this.contract.on('TaskAccepted', async (taskId, helper, event) => {
      console.log(`[EventListener] TaskAccepted event: taskId=${taskId}, helper=${helper}`);
      await this.handleTaskAccepted(taskId.toString(), helper);
    });

    console.log('[EventListener] Event listener started successfully');
  }

  /**
   * 停止事件监听
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.contract.removeAllListeners();
    this.isRunning = false;
    console.log('[EventListener] Event listener stopped');
  }

  /**
   * 处理 TaskCreated 事件（使用统一协调器）
   */
  private async handleTaskCreated(taskId: string, creator: string, taskURI: string) {
    try {
      await syncTaskWithLock({
        taskId,
        creator,
        taskURI,
        source: 'event',
      });
    } catch (error) {
      console.error(`[EventListener] Error handling TaskCreated for ${taskId}:`, error);
    }
  }

  /**
   * 处理 TaskAccepted 事件（使用统一协调器）
   */
  private async handleTaskAccepted(taskId: string, helper: string) {
    try {
      // 从链上读取完整任务信息
      const taskOnChain = await this.contract.tasks(taskId);
      const creator = taskOnChain[1]; // address creator
      const taskURI = taskOnChain[4]; // string taskURI
      
      // 使用统一协调器同步（会自动处理 helper 的 wrappedDEK）
      await syncTaskWithLock({
        taskId,
        creator,
        helper,
        taskURI,
        source: 'event',
      });
    } catch (error) {
      console.error(`[EventListener] Error handling TaskAccepted for ${taskId}:`, error);
    }
  }

  /**
   * 同步历史事件（补充遗漏的数据）
   */
  async syncHistoricalEvents(fromBlock: number = 0) {
    console.log(`[EventListener] Syncing historical events from block ${fromBlock}...`);

    try {
      // 获取 TaskCreated 事件
      const taskCreatedFilter = this.contract.filters.TaskCreated();
      const taskCreatedEvents = await this.contract.queryFilter(
        taskCreatedFilter,
        fromBlock,
        'latest'
      );

      console.log(`[EventListener] Found ${taskCreatedEvents.length} TaskCreated events`);

      for (const event of taskCreatedEvents) {
        if (!('args' in event)) continue; // 收窄到 EventLog
        const args = (event as EventLog).args;
        await this.handleTaskCreated(
          args.taskId.toString(),
          args.creator,
          args.taskURI
        );
      }

      // 获取 TaskAccepted 事件
      const taskAcceptedFilter = this.contract.filters.TaskAccepted();
      const taskAcceptedEvents = await this.contract.queryFilter(
        taskAcceptedFilter,
        fromBlock,
        'latest'
      );

      console.log(`[EventListener] Found ${taskAcceptedEvents.length} TaskAccepted events`);

      for (const event of taskAcceptedEvents) {
        if (!('args' in event)) continue; // 收窄到 EventLog
        const args = (event as EventLog).args;
        await this.handleTaskAccepted(
          args.taskId.toString(),
          args.helper
        );
      }

      console.log('[EventListener] ✅ Historical events synced successfully');
    } catch (error) {
      console.error('[EventListener] Error syncing historical events:', error);
    }
  }
}

// 导出单例实例
let eventListenerInstance: EventListenerService | null = null;

export function getEventListenerService(): EventListenerService | null {
  return eventListenerInstance;
}

export function initEventListenerService(config: EventListenerConfig): EventListenerService {
  if (eventListenerInstance) {
    return eventListenerInstance;
  }

  eventListenerInstance = new EventListenerService(config);
  return eventListenerInstance;
}
