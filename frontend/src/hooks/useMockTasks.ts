import { useState, useEffect } from 'react';
import { Task } from '../mock/types';
import * as TasksAPI from '../mock/tasks';

/**
 * Mock 任务列表 Hook
 */
export function useMockTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      // 模拟加载延迟
      await new Promise((resolve) => setTimeout(resolve, 300));
      const allTasks = TasksAPI.getTasks();
      setTasks(allTasks);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const refresh = () => {
    loadTasks();
  };

  return {
    tasks,
    loading,
    error,
    refresh,
  };
}

/**
 * Mock 单个任务 Hook
 */
export function useMockTask(taskId: number) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTask = async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const foundTask = TasksAPI.getTask(taskId);
      if (!foundTask) {
        throw new Error('Task not found');
      }
      setTask(foundTask);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const refresh = () => {
    loadTask();
  };

  return {
    task,
    loading,
    error,
    refresh,
  };
}

/**
 * Mock 创建任务 Hook
 */
export function useMockCreateTask() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = async (
    creator: string,
    reward: string,
    title: string,
    description: string,
    category?: string
  ) => {
    setIsCreating(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (!title || !description) {
        throw new Error('Title and description are required');
      }

      const rewardNum = parseFloat(reward);
      if (isNaN(rewardNum) || rewardNum <= 0) {
        throw new Error('Invalid reward amount');
      }

      const taskURI = `https://api.everecho.io/task/${Date.now()}.json`;
      const metadata = { title, description, category };

      const task = TasksAPI.createTask(creator, reward, taskURI, metadata);
      setIsCreating(false);
      return task;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      setIsCreating(false);
      return null;
    }
  };

  return {
    createTask,
    isCreating,
    error,
  };
}
