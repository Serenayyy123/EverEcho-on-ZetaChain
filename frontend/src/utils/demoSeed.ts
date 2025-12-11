/**
 * Demo Seed / 快速演示工具
 * 仅用于开发和演示，不影响生产逻辑
 */

import { ethers } from 'ethers';
import { getContractAddresses } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';

export interface TaskSummary {
  taskId: number;
  status: number;
  statusLabel: string;
  creator: string;
  helper: string;
  reward: string;
  createdAt: number;
  isCreator: boolean;
  isHelper: boolean;
  canAccept: boolean;
  canSubmit: boolean;
  canConfirm: boolean;
}

export interface DemoSeedData {
  currentAddress: string;
  chainId: number;
  chainName: string;
  taskCount: number;
  tasks: TaskSummary[];
  timestamp: number;
}

const STATUS_LABELS: Record<number, string> = {
  0: 'Open',
  1: 'InProgress',
  2: 'Submitted',
  3: 'Completed',
  4: 'Cancelled',
};

const CHAIN_NAMES: Record<number, string> = {
  11155111: 'Sepolia',
  31337: 'Hardhat Local',
  1: 'Mainnet',
  5: 'Goerli',
};

/**
 * 获取最近 N 条任务的摘要
 */
export async function getDemoSeed(
  provider: ethers.Provider,
  chainId: number,
  currentAddress: string,
  limit: number = 10
): Promise<DemoSeedData> {
  const addresses = getContractAddresses(chainId);
  const contract = new ethers.Contract(
    addresses.taskEscrow,
    TaskEscrowABI.abi,
    provider
  );

  // 获取任务总数
  const taskCounter = await contract.taskCounter();
  const totalTasks = Number(taskCounter);

  // 计算要获取的任务范围
  const startId = Math.max(1, totalTasks - limit + 1);
  const endId = totalTasks;

  // 获取任务数据
  const tasks: TaskSummary[] = [];
  for (let i = endId; i >= startId; i--) {
    try {
      const taskData = await contract.tasks(i);
      
      const creator = taskData.creator.toLowerCase();
      const helper = taskData.helper.toLowerCase();
      const current = currentAddress.toLowerCase();
      
      const isCreator = creator === current;
      const isHelper = helper === current;
      const status = Number(taskData.status);
      
      // 判断可执行的操作
      const canAccept = status === 0 && !isCreator && helper === ethers.ZeroAddress.toLowerCase();
      const canSubmit = status === 1 && isHelper;
      const canConfirm = status === 2 && isCreator;

      tasks.push({
        taskId: i,
        status,
        statusLabel: STATUS_LABELS[status] || 'Unknown',
        creator: taskData.creator,
        helper: taskData.helper,
        reward: ethers.formatEther(taskData.reward),
        createdAt: Number(taskData.createdAt),
        isCreator,
        isHelper,
        canAccept,
        canSubmit,
        canConfirm,
      });
    } catch (err) {
      console.error(`Failed to load task ${i}:`, err);
    }
  }

  return {
    currentAddress,
    chainId,
    chainName: CHAIN_NAMES[chainId] || `Chain ${chainId}`,
    taskCount: totalTasks,
    tasks,
    timestamp: Date.now(),
  };
}

/**
 * 格式化任务摘要为可读文本
 */
export function formatDemoSeed(data: DemoSeedData): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('📋 EverEcho Demo Seed');
  lines.push('='.repeat(60));
  lines.push('');
  
  // 账户信息
  lines.push('👤 Current Account:');
  lines.push(`   ${data.currentAddress}`);
  lines.push('');
  
  // 网络信息
  lines.push('🌐 Network:');
  lines.push(`   ${data.chainName} (${data.chainId})`);
  lines.push('');
  
  // 任务统计
  lines.push('📊 Task Statistics:');
  lines.push(`   Total Tasks: ${data.taskCount}`);
  lines.push(`   Showing: ${data.tasks.length} recent tasks`);
  lines.push('');
  
  // 任务列表
  if (data.tasks.length > 0) {
    lines.push('📝 Recent Tasks:');
    lines.push('');
    
    data.tasks.forEach(task => {
      const role = task.isCreator ? '👨‍💼 Creator' : task.isHelper ? '👷 Helper' : '👀 Viewer';
      const actions: string[] = [];
      if (task.canAccept) actions.push('✅ Can Accept');
      if (task.canSubmit) actions.push('📤 Can Submit');
      if (task.canConfirm) actions.push('✔️ Can Confirm');
      
      lines.push(`  Task #${task.taskId} - ${task.statusLabel} - ${task.reward} ECHO`);
      lines.push(`    Role: ${role}`);
      if (actions.length > 0) {
        lines.push(`    Actions: ${actions.join(', ')}`);
      }
      lines.push('');
    });
  } else {
    lines.push('📝 No tasks found');
    lines.push('');
  }
  
  // 测试账户提示
  lines.push('💡 Testing Tips:');
  lines.push('   • Switch accounts in MetaMask to test different roles');
  lines.push('   • Creator can: publish, confirm, request fix');
  lines.push('   • Helper can: accept, submit work');
  lines.push('   • Use different accounts to test the full workflow');
  lines.push('');
  
  lines.push('='.repeat(60));
  lines.push(`Generated at: ${new Date(data.timestamp).toLocaleString()}`);
  lines.push('='.repeat(60));
  
  return lines.join('\n');
}

/**
 * 打印 Demo Seed 到控制台
 */
export async function printDemoSeed(
  provider: ethers.Provider,
  chainId: number,
  currentAddress: string,
  limit: number = 10
): Promise<void> {
  console.log('Loading demo seed...');
  
  try {
    const data = await getDemoSeed(provider, chainId, currentAddress, limit);
    const formatted = formatDemoSeed(data);
    
    console.log('\n' + formatted + '\n');
    
    // 返回数据供进一步使用
    return data as any;
  } catch (err) {
    console.error('Failed to load demo seed:', err);
    throw err;
  }
}

/**
 * 获取测试账户建议
 */
export function getTestAccountSuggestions(data: DemoSeedData): string[] {
  const suggestions: string[] = [];
  
  // 分析任务状态，给出建议
  const openTasks = data.tasks.filter(t => t.status === 0);
  const inProgressTasks = data.tasks.filter(t => t.status === 1);
  const submittedTasks = data.tasks.filter(t => t.status === 2);
  
  if (openTasks.length > 0 && !openTasks.some(t => t.isCreator)) {
    suggestions.push('💡 Switch to a different account to accept open tasks');
  }
  
  if (inProgressTasks.length > 0 && inProgressTasks.some(t => t.isHelper)) {
    suggestions.push('📤 You have tasks in progress. Submit your work!');
  }
  
  if (submittedTasks.length > 0 && submittedTasks.some(t => t.isCreator)) {
    suggestions.push('✔️ You have submitted tasks to review. Confirm or request fix!');
  }
  
  if (data.tasks.length === 0) {
    suggestions.push('🎯 No tasks yet. Create your first task to get started!');
  }
  
  return suggestions;
}

/**
 * 演示任务模板（仅供参考，不自动发布）
 * 用于快速填充发布任务表单或演示说明
 */
export interface DemoTaskTemplate {
  title: string;
  description: string;
  reward: string;
  contacts: string;
  category?: string;
}

export const DEMO_TASK_TEMPLATES: DemoTaskTemplate[] = [
  {
    title: 'Build a Landing Page',
    description: 'Need a modern landing page for my startup. Must be responsive and include contact form. Tech stack: React + Tailwind CSS.',
    reward: '50',
    contacts: 'Email: creator@example.com, WeChat: creator123',
    category: 'Web Development',
  },
  {
    title: 'Design Logo and Brand Identity',
    description: 'Looking for a creative designer to create a logo and brand identity for my new business. Need vector files and brand guidelines.',
    reward: '100',
    contacts: 'Email: design@example.com, Telegram: @designer',
    category: 'Design',
  },
  {
    title: 'Write Technical Article',
    description: 'Need a technical writer to create a 2000-word article about blockchain technology. Must be SEO-optimized and well-researched.',
    reward: '30',
    contacts: 'Email: writer@example.com',
    category: 'Content Writing',
  },
  {
    title: 'Translate Documentation',
    description: 'Translate product documentation from English to Chinese. About 5000 words. Native Chinese speaker preferred.',
    reward: '80',
    contacts: 'Email: translate@example.com, WeChat: trans456',
    category: 'Translation',
  },
  {
    title: 'Data Entry and Analysis',
    description: 'Need help with data entry and basic analysis. Excel proficiency required. About 500 entries.',
    reward: '20',
    contacts: 'Email: data@example.com',
    category: 'Data Entry',
  },
];

/**
 * 获取演示任务模板
 * 用于 UI 快速填充或演示说明
 */
export function getDemoTaskTemplates(): DemoTaskTemplate[] {
  return DEMO_TASK_TEMPLATES;
}

/**
 * 获取随机演示任务模板
 */
export function getRandomDemoTask(): DemoTaskTemplate {
  const index = Math.floor(Math.random() * DEMO_TASK_TEMPLATES.length);
  return DEMO_TASK_TEMPLATES[index];
}

/**
 * 格式化演示任务模板为可读文本
 */
export function formatDemoTaskTemplates(): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('📝 Demo Task Templates');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push('Use these templates to quickly fill the publish task form:');
  lines.push('');
  
  DEMO_TASK_TEMPLATES.forEach((task, index) => {
    lines.push(`${index + 1}. ${task.title} - ${task.reward} ECHO`);
    lines.push(`   Category: ${task.category || 'General'}`);
    lines.push(`   Description: ${task.description.slice(0, 60)}...`);
    lines.push('');
  });
  
  lines.push('💡 Tip: Copy and paste these into the publish task form');
  lines.push('='.repeat(60));
  
  return lines.join('\n');
}

/**
 * 生成简短的任务摘要（用于 UI 显示）
 */
export function getQuickSummary(data: DemoSeedData): {
  total: number;
  open: number;
  inProgress: number;
  submitted: number;
  completed: number;
  myCreated: number;
  myHelping: number;
} {
  return {
    total: data.taskCount,
    open: data.tasks.filter(t => t.status === 0).length,
    inProgress: data.tasks.filter(t => t.status === 1).length,
    submitted: data.tasks.filter(t => t.status === 2).length,
    completed: data.tasks.filter(t => t.status === 3).length,
    myCreated: data.tasks.filter(t => t.isCreator).length,
    myHelping: data.tasks.filter(t => t.isHelper).length,
  };
}
