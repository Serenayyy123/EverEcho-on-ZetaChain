/**
 * 手动同步所有缺失的任务
 * 用于立即补充历史数据
 */

import 'dotenv/config';
import { initChainSyncService } from '../src/services/chainSyncService';

const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/y7anxz3Urn0udDBD6u8TU';
const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS || '0xC71040C8916E145f937Da3D094323C8f136c2E2F';

async function main() {
  console.log('\n🔄 Manual sync: Checking for missing tasks...\n');

  const chainSync = initChainSyncService(RPC_URL, TASK_ESCROW_ADDRESS);
  
  // 手动触发一次同步
  await (chainSync as any).syncMissingTasks();

  console.log('\n✅ Manual sync completed\n');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
