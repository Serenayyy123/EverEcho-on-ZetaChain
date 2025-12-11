import { useState } from 'react';
import * as TasksAPI from '../mock/tasks';

/**
 * Mock 任务操作 Hook
 */
export function useMockTaskActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async (action: () => any) => {
    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const result = action();
      if (!result) {
        throw new Error('Action failed');
      }
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
      setLoading(false);
      return null;
    }
  };

  const acceptTask = async (taskId: number, helper: string) => {
    return executeAction(() => TasksAPI.acceptTask(taskId, helper));
  };

  const submitWork = async (taskId: number) => {
    return executeAction(() => TasksAPI.submitWork(taskId));
  };

  const confirmComplete = async (taskId: number) => {
    return executeAction(() => TasksAPI.confirmComplete(taskId));
  };

  const cancelTask = async (taskId: number) => {
    return executeAction(() => TasksAPI.cancelTask(taskId));
  };

  const requestTerminate = async (taskId: number, requester: string) => {
    return executeAction(() => TasksAPI.requestTerminate(taskId, requester));
  };

  const agreeTerminate = async (taskId: number) => {
    return executeAction(() => TasksAPI.agreeTerminate(taskId));
  };

  const requestFix = async (taskId: number) => {
    return executeAction(() => TasksAPI.requestFix(taskId));
  };

  return {
    acceptTask,
    submitWork,
    confirmComplete,
    cancelTask,
    requestTerminate,
    agreeTerminate,
    requestFix,
    loading,
    error,
  };
}
