#!/usr/bin/env npx tsx

/**
 * Orphan Tasks 审计脚本
 * P0 Fix: 扫描并标记 orphan metadata
 * 
 * 使用方法:
 * npx tsx scripts/auditOrphanTasks.ts [options]
 * 
 * 选项:
 * --days-back <number>     扫描最近 N 天的任务 (默认: 全部)
 * --batch-size <number>    批处理大小 (默认: 100)
 * --dry-run               试运行模式 (默认: true)
 * --cleanup               执行清理操作 (默认: false)
 * --help                  显示帮助信息
 */

import { getOrphanDetectionService } from '../backend/src/services/orphanDetectionService';

interface CliOptions {
  daysBack?: number;
  batchSize: number;
  dryRun: boolean;
  cleanup: boolean;
  help: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    batchSize: 100,
    dryRun: true,
    cleanup: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--days-back':
        options.daysBack = parseInt(args[++i]);
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i]);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--no-dry-run':
        options.dryRun = false;
        break;
      case '--cleanup':
        options.cleanup = true;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Orphan Tasks 审计脚本
P0 Fix: 扫描并标记 orphan metadata

使用方法:
  npx tsx scripts/auditOrphanTasks.ts [options]

选项:
  --days-back <number>     扫描最近 N 天的任务 (默认: 全部)
  --batch-size <number>    批处理大小 (默认: 100)
  --dry-run               试运行模式 (默认: true)
  --no-dry-run            执行实际操作
  --cleanup               执行清理操作 (默认: false)
  --help                  显示帮助信息

示例:
  # 试运行扫描所有任务
  npx tsx scripts/auditOrphanTasks.ts

  # 扫描最近 7 天的任务
  npx tsx scripts/auditOrphanTasks.ts --days-back 7

  # 执行实际清理操作
  npx tsx scripts/auditOrphanTasks.ts --cleanup --no-dry-run

  # 小批量处理
  npx tsx scripts/auditOrphanTasks.ts --batch-size 10
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  console.log('🔍 Orphan Tasks 审计工具');
  console.log('=' .repeat(50));
  console.log('配置:', {
    daysBack: options.daysBack || '全部',
    batchSize: options.batchSize,
    dryRun: options.dryRun,
    cleanup: options.cleanup
  });
  console.log('=' .repeat(50));

  try {
    const orphanService = getOrphanDetectionService();

    if (options.cleanup) {
      // 执行扫描和清理
      console.log('🧹 执行扫描和清理...\n');
      
      const result = await orphanService.scanAndCleanup(
        {
          daysBack: options.daysBack,
          batchSize: options.batchSize,
          dryRun: options.dryRun
        },
        true
      );

      // 显示扫描结果
      console.log('\n📊 扫描结果:');
      console.log(`  总扫描任务: ${result.scanReport.totalScanned}`);
      console.log(`  发现 Orphans: ${result.scanReport.orphanCount}`);
      console.log(`  扫描耗时: ${result.scanReport.scanDuration}ms`);

      if (result.scanReport.orphanCount > 0) {
        console.log('\n🚨 发现的 Orphan 任务:');
        result.scanReport.details.forEach(orphan => {
          console.log(`  - 任务 ${orphan.taskId}: ${orphan.title}`);
          console.log(`    创建者: ${orphan.creator}`);
          console.log(`    原因: ${orphan.reason}`);
        });
      }

      // 显示清理结果
      if (result.cleanupReport) {
        console.log('\n🧹 清理结果:');
        console.log(`  处理任务: ${result.cleanupReport.processedCount}`);
        console.log(`  成功: ${result.cleanupReport.successCount}`);
        console.log(`  失败: ${result.cleanupReport.failureCount}`);
        console.log(`  试运行: ${result.cleanupReport.dryRun ? '是' : '否'}`);
        console.log(`  清理耗时: ${result.cleanupReport.cleanupDuration}ms`);

        if (result.cleanupReport.failureCount > 0) {
          console.log('\n❌ 清理失败的任务:');
          result.cleanupReport.operations
            .filter(op => !op.success)
            .forEach(op => {
              console.log(`  - 任务 ${op.taskId}: ${op.error}`);
            });
        }
      }

    } else {
      // 只执行扫描
      console.log('🔍 执行扫描...\n');
      
      const scanReport = await orphanService.scanForOrphans({
        daysBack: options.daysBack,
        batchSize: options.batchSize
      });

      // 显示扫描结果
      console.log('\n📊 扫描结果:');
      console.log(`  总扫描任务: ${scanReport.totalScanned}`);
      console.log(`  发现 Orphans: ${scanReport.orphanCount}`);
      console.log(`  扫描耗时: ${scanReport.scanDuration}ms`);

      if (scanReport.orphanCount > 0) {
        console.log('\n🚨 发现的 Orphan 任务:');
        scanReport.details.forEach(orphan => {
          console.log(`  - 任务 ${orphan.taskId}: ${orphan.title}`);
          console.log(`    创建者: ${orphan.creator}`);
          console.log(`    创建时间: ${new Date(parseInt(orphan.createdAt)).toLocaleString()}`);
          console.log(`    原因: ${orphan.reason}`);
        });

        console.log('\n💡 提示:');
        console.log('  要清理这些 orphan 任务，请使用 --cleanup 选项');
        console.log('  要执行实际清理，请添加 --no-dry-run 选项');
      } else {
        console.log('\n✅ 未发现 orphan 任务！');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 审计完成！');

  } catch (error) {
    console.error('\n❌ 审计失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

export { main as auditOrphanTasks };