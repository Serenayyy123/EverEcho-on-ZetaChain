/**
 * Pre-Staging 综合检查脚本
 * 验证所有关键配置和状态
 */

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { getCurrentChainId } from '../src/config/chainConfig';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const CURRENT_CHAIN_ID = getCurrentChainId();

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
}

const results: CheckResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string[]) {
  results.push({ name, status, message, details });
}

async function checkEnvironment() {
  console.log('🔍 Checking Environment Configuration...\n');
  
  // Check required env vars
  const requiredVars = [
    'RPC_URL',
    'TASK_ESCROW_ADDRESS',
    'CHAIN_ID',
    'DATABASE_URL',
    'PORT',
  ];
  
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    addResult('Environment Variables', 'fail', 'Missing required variables', missing);
  } else {
    addResult('Environment Variables', 'pass', 'All required variables present');
  }
  
  // Check chain ID consistency
  const envChainId = process.env.CHAIN_ID;
  const configChainId = CURRENT_CHAIN_ID.toString();
  
  if (envChainId === configChainId) {
    addResult('Chain ID Consistency', 'pass', `Chain ID: ${configChainId}`);
  } else {
    addResult('Chain ID Consistency', 'fail', 'Chain ID mismatch', [
      `ENV: ${envChainId}`,
      `Config: ${configChainId}`,
    ]);
  }
}

async function checkChainState() {
  console.log('🔍 Checking Chain State...\n');
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    
    // Check RPC connection
    try {
      const network = await provider.getNetwork();
      const actualChainId = network.chainId.toString();
      
      if (actualChainId === CURRENT_CHAIN_ID.toString()) {
        addResult('RPC Connection', 'pass', `Connected to chain ${actualChainId}`);
      } else {
        addResult('RPC Connection', 'fail', 'Chain ID mismatch', [
          `Expected: ${CURRENT_CHAIN_ID}`,
          `Actual: ${actualChainId}`,
        ]);
      }
    } catch (error: any) {
      addResult('RPC Connection', 'fail', 'Cannot connect to RPC', [error.message]);
      return;
    }
    
    // Check contract
    const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS;
    if (!TASK_ESCROW_ADDRESS) {
      addResult('Contract Check', 'fail', 'TASK_ESCROW_ADDRESS not set');
      return;
    }
    
    const code = await provider.getCode(TASK_ESCROW_ADDRESS);
    if (code === '0x') {
      addResult('Contract Check', 'fail', 'Contract not deployed at address', [TASK_ESCROW_ADDRESS]);
      return;
    }
    
    // Check taskCounter
    const TASK_ESCROW_ABI = [
      'function taskCounter() view returns (uint256)',
      'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
    ];
    
    const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);
    const taskCounter = await contract.taskCounter();
    const nextTaskId = Number(taskCounter) + 1;
    
    // Check if next task slot is empty
    try {
      const nextTask = await contract.tasks(nextTaskId);
      const [, creator] = nextTask;
      
      if (creator === ethers.ZeroAddress) {
        addResult('Task Counter', 'pass', `Counter: ${taskCounter}, Next: ${nextTaskId}`, [
          'Next task slot is empty',
          'Ready to create new tasks',
        ]);
      } else {
        addResult('Task Counter', 'warning', `Counter: ${taskCounter}, but Task ${nextTaskId} exists`, [
          'This may cause conflicts',
          'Consider investigating',
        ]);
      }
    } catch (error: any) {
      addResult('Task Counter', 'pass', `Counter: ${taskCounter}, Next: ${nextTaskId}`, [
        'Next task slot is empty',
      ]);
    }
    
  } catch (error: any) {
    addResult('Chain State', 'fail', 'Error checking chain', [error.message]);
  }
}

async function checkDatabase() {
  console.log('🔍 Checking Database State...\n');
  
  try {
    // Check connection
    await prisma.$connect();
    addResult('Database Connection', 'pass', 'Connected successfully');
    
    // Check tasks
    const tasks = await prisma.task.findMany({
      where: { chainId: CURRENT_CHAIN_ID },
      select: { taskId: true },
      orderBy: { taskId: 'asc' },
    });
    
    const taskIds = tasks.map(t => parseInt(t.taskId));
    const maxTaskId = taskIds.length > 0 ? Math.max(...taskIds) : 0;
    
    addResult('Database Tasks', 'pass', `${tasks.length} tasks found`, [
      `TaskIds: ${taskIds.join(', ')}`,
      `Max TaskId: ${maxTaskId}`,
    ]);
    
    // Check contact keys
    const contactKeys = await prisma.contactKey.findMany({
      where: { chainId: CURRENT_CHAIN_ID },
      select: { taskId: true },
    });
    
    if (contactKeys.length === tasks.length) {
      addResult('Contact Keys', 'pass', `${contactKeys.length} contact keys`, [
        'All tasks have contact keys',
      ]);
    } else {
      addResult('Contact Keys', 'warning', 'Mismatch with tasks', [
        `Tasks: ${tasks.length}`,
        `ContactKeys: ${contactKeys.length}`,
      ]);
    }
    
    // Check for orphan tasks
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      process.env.TASK_ESCROW_ADDRESS!,
      ['function taskCounter() view returns (uint256)'],
      provider
    );
    const taskCounter = await contract.taskCounter();
    
    const orphans = taskIds.filter(id => id > Number(taskCounter));
    if (orphans.length > 0) {
      addResult('Orphan Tasks', 'warning', 'Tasks exist in DB but not on chain', [
        `Orphan TaskIds: ${orphans.join(', ')}`,
        'Consider cleaning up',
      ]);
    } else {
      addResult('Orphan Tasks', 'pass', 'No orphan tasks found');
    }
    
  } catch (error: any) {
    addResult('Database Check', 'fail', 'Error checking database', [error.message]);
  } finally {
    await prisma.$disconnect();
  }
}

async function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Pre-Staging Check Results');
  console.log('='.repeat(60) + '\n');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (result.details) {
      result.details.forEach(detail => {
        console.log(`   ${detail}`);
      });
    }
    console.log();
  });
  
  console.log('='.repeat(60));
  console.log(`Summary: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  console.log('='.repeat(60) + '\n');
  
  if (failed > 0) {
    console.log('❌ CRITICAL ISSUES FOUND - Fix before staging');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  WARNINGS FOUND - Review before staging');
  } else {
    console.log('✅ ALL CHECKS PASSED - Ready for staging!');
  }
}

async function main() {
  console.log('🚀 Starting Pre-Staging Checks...\n');
  
  await checkEnvironment();
  await checkChainState();
  await checkDatabase();
  await printResults();
}

main().catch(console.error);
