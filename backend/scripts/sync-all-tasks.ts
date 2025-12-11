/**
 * 手动同步所有历史任务
 * 用于补充遗漏的数据
 */

import * as dotenv from 'dotenv';
import { initEventListenerService } from '../src/services/eventListenerService';

dotenv.config();

async function main() {
  const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
  const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS;
  
  if (!TASK_ESCROW_ADDRESS) {
    throw new Error('TASK_ESCROW_ADDRESS not configured');
  }
  
  console.log('🔄 Starting historical event sync...\n');
  console.log('RPC URL:', RPC_URL);
  console.log('Contract:', TASK_ESCROW_ADDRESS);
  console.log('');
  
  const eventListener = initEventListenerService({
    rpcUrl: RPC_URL,
    taskEscrowAddress: TASK_ESCROW_ADDRESS,
  });
  
  // 从区块 0 开始同步所有历史事件
  await eventListener.syncHistoricalEvents(0);
  
  console.log('\n✅ Sync completed!');
  console.log('Check the database to verify the synced tasks.');
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});
