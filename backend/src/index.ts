import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { validateChainId, getCurrentChainId, getChainName } from './config/chainConfig';
import profileRoutes from './routes/profile';
import taskRoutes from './routes/task';
import contactsRoutes from './routes/contacts';
import healthzRoutes from './routes/healthz';
import { initEventListenerService } from './services/eventListenerService';
import { initChainSyncService } from './services/chainSyncService';
import { getTask } from './services/taskService';

/**
 * 启动前验证 - 确保链配置正确
 * 冻结点保持：不改变业务逻辑，只是启动流程
 */
async function validateEnvironment() {
  console.log('='.repeat(60));
  console.log('🔍 Validating Environment Configuration');
  console.log('='.repeat(60));
  
  try {
    // 1. 验证 chainId 配置
    const chainId = getCurrentChainId();
    console.log(`📋 Configured Chain ID: ${chainId} (${getChainName(chainId)})`);
    
    // 2. 验证 RPC 连接
    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
      throw new Error('RPC_URL not configured');
    }
    console.log(`📡 RPC URL: ${rpcUrl}`);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // 3. 验证 chainId 与 RPC 一致
    await validateChainId(provider);
    
    // 4. 打印 taskURI 基础 URL（用于确认 staging/production 配置）
    const backendPublicUrl = process.env.BACKEND_PUBLIC_URL || 'https://api.everecho.io';
    console.log(`🌐 Task URI Base: ${backendPublicUrl}`);
    
    console.log('✅ Environment validation passed');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ENVIRONMENT VALIDATION FAILED');
    console.error('='.repeat(60));
    console.error(error.message);
    console.error('='.repeat(60));
    console.error('\n⚠️  Server startup aborted. Please fix configuration.\n');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// 初始化事件监听服务（可选，通过环境变量控制）
const ENABLE_EVENT_LISTENER = process.env.ENABLE_EVENT_LISTENER === 'true';
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS;

if (ENABLE_EVENT_LISTENER && TASK_ESCROW_ADDRESS) {
  console.log('[EventListener] Initializing event listener service...');
  const eventListener = initEventListenerService({
    rpcUrl: RPC_URL,
    taskEscrowAddress: TASK_ESCROW_ADDRESS,
  });
  
  // 启动监听
  eventListener.start().catch(err => {
    console.error('[EventListener] Failed to start:', err);
  });
  
  // 可选：同步历史事件（从指定区块开始）
  const SYNC_FROM_BLOCK = parseInt(process.env.SYNC_FROM_BLOCK || '0');
  if (SYNC_FROM_BLOCK >= 0) {
    setTimeout(() => {
      eventListener.syncHistoricalEvents(SYNC_FROM_BLOCK).catch(err => {
        console.error('[EventListener] Failed to sync historical events:', err);
      });
    }, 5000); // 延迟 5 秒启动，避免启动时阻塞
  }
} else if (!ENABLE_EVENT_LISTENER) {
  console.log('[EventListener] Event listener disabled (set ENABLE_EVENT_LISTENER=true to enable)');
} else {
  console.warn('[EventListener] TASK_ESCROW_ADDRESS not configured, event listener disabled');
}

// 初始化链上同步服务（补偿机制，定期扫描缺失任务）
const ENABLE_CHAIN_SYNC = process.env.ENABLE_CHAIN_SYNC !== 'false'; // 默认启用
if (ENABLE_CHAIN_SYNC && TASK_ESCROW_ADDRESS) {
  console.log('[ChainSync] Initializing chain sync service...');
  const chainSync = initChainSyncService(RPC_URL, TASK_ESCROW_ADDRESS);
  
  // 启动定时同步（每 30 秒）
  const SYNC_INTERVAL_MS = parseInt(process.env.CHAIN_SYNC_INTERVAL_MS || '30000');
  chainSync.start(SYNC_INTERVAL_MS);
} else if (!ENABLE_CHAIN_SYNC) {
  console.log('[ChainSync] Chain sync disabled (set ENABLE_CHAIN_SYNC=true to enable)');
} else {
  console.warn('[ChainSync] TASK_ESCROW_ADDRESS not configured, chain sync disabled');
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/profile', profileRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/healthz', healthzRoutes);

// 兼容链上 taskURI: /task/{id}.json
app.get('/task/:taskId.json', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId || taskId.trim() === '') {
      return res.status(400).json({ error: 'Invalid taskId' });
    }

    const task = await getTask(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(200).json(task);
  } catch (err) {
    console.error('[AliasRoute] Failed to serve /task/:taskId.json', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'EverEcho Backend API',
    version: '1.0.0',
    endpoints: {
      profile: '/api/profile',
      task: '/api/task',
      contacts: '/api/contacts',
      health: '/healthz',
    },
  });
});

// Legacy health check (redirect to /healthz)
app.get('/health', (req, res) => {
  res.redirect('/healthz');
});

// Start server (with validation)
async function startServer() {
  // 启动前验证环境
  await validateEnvironment();
  
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch(error => {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  });
}

export default app;
