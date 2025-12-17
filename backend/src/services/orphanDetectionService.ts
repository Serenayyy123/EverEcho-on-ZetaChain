import { PrismaClient } from '@prisma/client';
import { getBlockchainTaskValidator } from './blockchainTaskValidator';
import { getCurrentChainId } from '../config/chainConfig';

const prisma = new PrismaClient();
const CURRENT_CHAIN_ID = getCurrentChainId();

/**
 * Orphan 扫描选项
 */
export interface ScanOptions {
  daysBack?: number; // 扫描最近 N 天的任务，默认全部
  batchSize?: number; // 批处理大小，默认 100
  dryRun?: boolean; // 是否为试运行，默认 false
}

/**
 * Orphan 报告
 */
export interface OrphanReport {
  totalScanned: number;
  orphanCount: number;
  orphanTaskIds: string[];
  scanTimestamp: number;
  scanDuration: number;
  details: OrphanDetail[];
}

/**
 * Orphan 详情
 */
export interface OrphanDetail {
  taskId: string;
  title: string;
  creator: string;
  createdAt: string;
  reason: string;
}

/**
 * 清理报告
 */
export interface CleanupReport {
  processedCount: number;
  successCount: number;
  failureCount: number;
  dryRun: boolean;
  operations: CleanupOperation[];
  cleanupTimestamp: number;
  cleanupDuration: number;
}

/**
 * 清理操作
 */
export interface CleanupOperation {
  taskId: string;
  action: 'marked_orphan' | 'deleted' | 'failed';
  success: boolean;
  error?: string;
}

/**
 * Orphan 检测和清理服务
 * P0 Fix: 扫描并标记/清理 orphan metadata
 */
export class OrphanDetectionService {
  private validator = getBlockchainTaskValidator();

  /**
   * 扫描 orphan metadata
   */
  async scanForOrphans(options: ScanOptions = {}): Promise<OrphanReport> {
    const startTime = Date.now();
    const { daysBack, batchSize = 100, dryRun = false } = options;

    console.log(`[OrphanDetection] Starting orphan scan...`, {
      daysBack,
      batchSize,
      dryRun,
      chainId: CURRENT_CHAIN_ID
    });

    try {
      // 1. 构建查询条件
      const whereClause: any = {
        chainId: CURRENT_CHAIN_ID
      };

      if (daysBack) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        whereClause.createdAt = {
          gte: cutoffDate.getTime().toString()
        };
      }

      // 2. 获取所有任务
      const tasks = await prisma.task.findMany({
        where: whereClause,
        select: {
          taskId: true,
          title: true,
          creator: true,
          createdAt: true
        },
        orderBy: {
          taskId: 'asc'
        }
      });

      console.log(`[OrphanDetection] Found ${tasks.length} tasks to scan`);

      // 3. 批量验证任务
      const orphans: OrphanDetail[] = [];
      let processedCount = 0;

      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        console.log(`[OrphanDetection] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tasks.length / batchSize)}`);

        // 并行验证批次中的任务
        const batchResults = await Promise.allSettled(
          batch.map(async (task) => {
            const validation = await this.validator.validateTaskExists(task.taskId);
            return {
              task,
              validation
            };
          })
        );

        // 处理批次结果
        for (const result of batchResults) {
          processedCount++;
          
          if (result.status === 'fulfilled') {
            const { task, validation } = result.value;
            
            if (!validation.exists) {
              orphans.push({
                taskId: task.taskId,
                title: task.title,
                creator: task.creator || 'unknown',
                createdAt: task.createdAt,
                reason: validation.error || 'Task not found on blockchain'
              });
              
              console.log(`[OrphanDetection] 🚨 Found orphan task ${task.taskId}: ${validation.error}`);
            }
          } else {
            console.error(`[OrphanDetection] ❌ Failed to validate task:`, result.reason);
          }
        }

        // 短暂延迟避免 RPC 过载
        if (i + batchSize < tasks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const scanDuration = Date.now() - startTime;
      
      const report: OrphanReport = {
        totalScanned: processedCount,
        orphanCount: orphans.length,
        orphanTaskIds: orphans.map(o => o.taskId),
        scanTimestamp: startTime,
        scanDuration,
        details: orphans
      };

      console.log(`[OrphanDetection] ✅ Scan completed:`, {
        totalScanned: report.totalScanned,
        orphanCount: report.orphanCount,
        duration: `${scanDuration}ms`
      });

      return report;

    } catch (error) {
      console.error(`[OrphanDetection] ❌ Scan failed:`, error);
      throw error;
    }
  }

  /**
   * 清理 orphan metadata
   */
  async cleanupOrphans(orphanIds: string[], dryRun: boolean = true): Promise<CleanupReport> {
    const startTime = Date.now();
    
    console.log(`[OrphanDetection] Starting cleanup...`, {
      orphanCount: orphanIds.length,
      dryRun,
      chainId: CURRENT_CHAIN_ID
    });

    const operations: CleanupOperation[] = [];

    try {
      for (const taskId of orphanIds) {
        try {
          if (dryRun) {
            // 试运行：只记录操作
            operations.push({
              taskId,
              action: 'marked_orphan',
              success: true
            });
            console.log(`[OrphanDetection] [DRY-RUN] Would mark task ${taskId} as orphan`);
          } else {
            // 实际操作：标记为 orphan（更安全的方式）
            await prisma.task.update({
              where: {
                chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
              },
              data: {
                // 添加 orphan 标记字段（如果数据库 schema 支持）
                // 或者可以使用 category 字段临时标记
                category: 'ORPHAN_METADATA'
              }
            });

            operations.push({
              taskId,
              action: 'marked_orphan',
              success: true
            });
            
            console.log(`[OrphanDetection] ✅ Marked task ${taskId} as orphan`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          operations.push({
            taskId,
            action: 'failed',
            success: false,
            error: errorMessage
          });
          
          console.error(`[OrphanDetection] ❌ Failed to process task ${taskId}:`, errorMessage);
        }
      }

      const cleanupDuration = Date.now() - startTime;
      const successCount = operations.filter(op => op.success).length;
      const failureCount = operations.filter(op => !op.success).length;

      const report: CleanupReport = {
        processedCount: operations.length,
        successCount,
        failureCount,
        dryRun,
        operations,
        cleanupTimestamp: startTime,
        cleanupDuration
      };

      console.log(`[OrphanDetection] ✅ Cleanup completed:`, {
        processed: report.processedCount,
        success: report.successCount,
        failed: report.failureCount,
        dryRun: report.dryRun,
        duration: `${cleanupDuration}ms`
      });

      return report;

    } catch (error) {
      console.error(`[OrphanDetection] ❌ Cleanup failed:`, error);
      throw error;
    }
  }

  /**
   * 完整的扫描和清理流程
   */
  async scanAndCleanup(scanOptions: ScanOptions = {}, cleanup: boolean = false): Promise<{
    scanReport: OrphanReport;
    cleanupReport?: CleanupReport;
  }> {
    console.log(`[OrphanDetection] Starting scan and cleanup process...`);

    // 1. 扫描 orphans
    const scanReport = await this.scanForOrphans(scanOptions);

    let cleanupReport: CleanupReport | undefined;

    // 2. 如果发现 orphans 且需要清理
    if (scanReport.orphanCount > 0 && cleanup) {
      cleanupReport = await this.cleanupOrphans(scanReport.orphanTaskIds, scanOptions.dryRun);
    }

    return {
      scanReport,
      cleanupReport
    };
  }
}

// 单例实例
let orphanDetectionInstance: OrphanDetectionService | null = null;

/**
 * 获取 orphan 检测服务实例
 */
export function getOrphanDetectionService(): OrphanDetectionService {
  if (!orphanDetectionInstance) {
    orphanDetectionInstance = new OrphanDetectionService();
  }
  return orphanDetectionInstance;
}