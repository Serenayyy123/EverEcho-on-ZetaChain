/**
 * 链上任务同步服务
 * 定期扫描链上 taskCounter，补充缺失的任务到数据库
 */

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { syncMissingTasks } from './taskSyncCoordinator';

const prisma = new PrismaClient();

const TASK_ESCROW_ABI = [
  'function taskCounter() view returns (uint256)',
  'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
];

export class ChainSyncService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private isRunning: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(rpcUrl: string, taskEscrowAddress: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new ethers.Contract(
      taskEscrowAddress,
      TASK_ESCROW_ABI,
      this.provider
    );
  }

  /**
   * 启动定时同步（每 30 秒检查一次）
   */
  start(intervalMs: number = 30000) {
    if (this.isRunning) {
      console.log('[ChainSync] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[ChainSync] Starting chain sync service (interval: ${intervalMs}ms)...`);

    // 立即执行一次
    this.syncMissingTasks().catch(err => {
      console.error('[ChainSync] Initial sync failed:', err);
    });

    // 定时执行
    this.syncInterval = setInterval(() => {
      this.syncMissingTasks().catch(err => {
        console.error('[ChainSync] Sync failed:', err);
      });
    }, intervalMs);

    console.log('[ChainSync] Chain sync service started');
  }

  /**
   * 停止定时同步
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.isRunning = false;
    console.log('[ChainSync] Chain sync service stopped');
  }

  /**
   * 同步缺失的任务（使用统一协调器）
   */
  private async syncMissingTasks() {
    try {
      const result = await syncMissingTasks(this.contract, 'chain-sync');
      console.log(`[ChainSync] Sync result: ${result.synced} synced, ${result.failed} failed`);
    } catch (error) {
      console.error('[ChainSync] Error syncing missing tasks:', error);
    }
  }


}

// 导出单例实例
let chainSyncInstance: ChainSyncService | null = null;

export function getChainSyncService(): ChainSyncService | null {
  return chainSyncInstance;
}

export function initChainSyncService(rpcUrl: string, taskEscrowAddress: string): ChainSyncService {
  if (chainSyncInstance) {
    return chainSyncInstance;
  }

  chainSyncInstance = new ChainSyncService(rpcUrl, taskEscrowAddress);
  return chainSyncInstance;
}
