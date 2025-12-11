import { Task, TaskStatus } from './types';

/**
 * Mock 任务数据
 */
const now = Math.floor(Date.now() / 1000);

export const MOCK_TASKS: Task[] = [
  {
    taskId: 1,
    creator: '0xAlice',
    helper: '0x0000000000000000000000000000000000000000',
    reward: '50',
    taskURI: 'https://api.everecho.io/task/1.json',
    status: TaskStatus.Open,
    createdAt: now - 3600, // 1 hour ago
    acceptedAt: 0,
    submittedAt: 0,
    terminateRequestedBy: '0x0000000000000000000000000000000000000000',
    terminateRequestedAt: 0,
    fixRequested: false,
    fixRequestedAt: 0,
    metadata: {
      title: 'Build a Landing Page',
      description: 'Need a modern landing page for my startup',
      category: 'Web Development',
    },
  },
  {
    taskId: 2,
    creator: '0xAlice',
    helper: '0xBob',
    reward: '30',
    taskURI: 'https://api.everecho.io/task/2.json',
    status: TaskStatus.InProgress,
    createdAt: now - 86400, // 1 day ago
    acceptedAt: now - 82800, // 23 hours ago
    submittedAt: 0,
    terminateRequestedBy: '0x0000000000000000000000000000000000000000',
    terminateRequestedAt: 0,
    fixRequested: false,
    fixRequestedAt: 0,
    metadata: {
      title: 'Logo Design',
      description: 'Create a minimalist logo for tech company',
      category: 'Design',
    },
  },
  {
    taskId: 3,
    creator: '0xBob',
    helper: '0xCharlie',
    reward: '80',
    taskURI: 'https://api.everecho.io/task/3.json',
    status: TaskStatus.Submitted,
    createdAt: now - 172800, // 2 days ago
    acceptedAt: now - 169200, // 1.9 days ago
    submittedAt: now - 7200, // 2 hours ago
    terminateRequestedBy: '0x0000000000000000000000000000000000000000',
    terminateRequestedAt: 0,
    fixRequested: false,
    fixRequestedAt: 0,
    metadata: {
      title: 'Smart Contract Audit',
      description: 'Security audit for DeFi protocol',
      category: 'Blockchain',
    },
  },
  {
    taskId: 4,
    creator: '0xCharlie',
    helper: '0xAlice',
    reward: '100',
    taskURI: 'https://api.everecho.io/task/4.json',
    status: TaskStatus.Completed,
    createdAt: now - 604800, // 7 days ago
    acceptedAt: now - 518400, // 6 days ago
    submittedAt: now - 259200, // 3 days ago
    terminateRequestedBy: '0x0000000000000000000000000000000000000000',
    terminateRequestedAt: 0,
    fixRequested: false,
    fixRequestedAt: 0,
    metadata: {
      title: 'Mobile App Development',
      description: 'iOS app for fitness tracking',
      category: 'Mobile Development',
    },
  },
  {
    taskId: 5,
    creator: '0xBob',
    helper: '0x0000000000000000000000000000000000000000',
    reward: '20',
    taskURI: 'https://api.everecho.io/task/5.json',
    status: TaskStatus.Cancelled,
    createdAt: now - 1209600, // 14 days ago
    acceptedAt: 0,
    submittedAt: 0,
    terminateRequestedBy: '0x0000000000000000000000000000000000000000',
    terminateRequestedAt: 0,
    fixRequested: false,
    fixRequestedAt: 0,
    metadata: {
      title: 'Content Writing',
      description: 'Blog posts about crypto',
      category: 'Writing',
    },
  },
];

let taskCounter = MOCK_TASKS.length;

export const getTasks = (): Task[] => {
  return [...MOCK_TASKS];
};

export const getTask = (taskId: number): Task | null => {
  return MOCK_TASKS.find((t) => t.taskId === taskId) || null;
};

export const createTask = (creator: string, reward: string, taskURI: string, metadata: any): Task => {
  taskCounter++;
  const task: Task = {
    taskId: taskCounter,
    creator,
    helper: '0x0000000000000000000000000000000000000000',
    reward,
    taskURI,
    status: TaskStatus.Open,
    createdAt: Math.floor(Date.now() / 1000),
    acceptedAt: 0,
    submittedAt: 0,
    terminateRequestedBy: '0x0000000000000000000000000000000000000000',
    terminateRequestedAt: 0,
    fixRequested: false,
    fixRequestedAt: 0,
    metadata,
  };
  MOCK_TASKS.push(task);
  return task;
};

export const updateTask = (taskId: number, updates: Partial<Task>): Task | null => {
  const task = MOCK_TASKS.find((t) => t.taskId === taskId);
  if (!task) return null;
  Object.assign(task, updates);
  return task;
};

export const acceptTask = (taskId: number, helper: string): Task | null => {
  return updateTask(taskId, {
    helper,
    status: TaskStatus.InProgress,
    acceptedAt: Math.floor(Date.now() / 1000),
  });
};

export const submitWork = (taskId: number): Task | null => {
  return updateTask(taskId, {
    status: TaskStatus.Submitted,
    submittedAt: Math.floor(Date.now() / 1000),
  });
};

export const confirmComplete = (taskId: number): Task | null => {
  return updateTask(taskId, {
    status: TaskStatus.Completed,
  });
};

export const cancelTask = (taskId: number): Task | null => {
  return updateTask(taskId, {
    status: TaskStatus.Cancelled,
  });
};

export const requestTerminate = (taskId: number, requester: string): Task | null => {
  return updateTask(taskId, {
    terminateRequestedBy: requester,
    terminateRequestedAt: Math.floor(Date.now() / 1000),
  });
};

export const agreeTerminate = (taskId: number): Task | null => {
  return updateTask(taskId, {
    status: TaskStatus.Cancelled,
    terminateRequestedBy: '0x0000000000000000000000000000000000000000',
    terminateRequestedAt: 0,
  });
};

export const requestFix = (taskId: number): Task | null => {
  return updateTask(taskId, {
    fixRequested: true,
    fixRequestedAt: Math.floor(Date.now() / 1000),
  });
};
