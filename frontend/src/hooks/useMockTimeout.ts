import { useState, useEffect } from 'react';
import { Task, TaskStatus, TIME_CONSTANTS } from '../mock/types';

/**
 * Mock 超时计算 Hook
 */
export function useMockTimeout(task: Task | null) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimeout, setIsTimeout] = useState(false);
  const [timeoutType, setTimeoutType] = useState<string | null>(null);

  useEffect(() => {
    if (!task) return;

    const calculateTimeout = () => {
      const now = Math.floor(Date.now() / 1000);

      switch (task.status) {
        case TaskStatus.Open:
          const openDeadline = task.createdAt + TIME_CONSTANTS.T_OPEN;
          const openTimeLeft = openDeadline - now;
          setTimeLeft(openTimeLeft);
          setIsTimeout(openTimeLeft <= 0);
          setTimeoutType(openTimeLeft <= 0 ? 'Open Timeout' : null);
          break;

        case TaskStatus.InProgress:
          const progressDeadline = task.acceptedAt + TIME_CONSTANTS.T_PROGRESS;
          const progressTimeLeft = progressDeadline - now;
          setTimeLeft(progressTimeLeft);
          setIsTimeout(progressTimeLeft <= 0);
          setTimeoutType(progressTimeLeft <= 0 ? 'InProgress Timeout' : null);
          break;

        case TaskStatus.Submitted:
          let reviewDeadline = task.submittedAt + TIME_CONSTANTS.T_REVIEW;
          if (task.fixRequested) {
            reviewDeadline += TIME_CONSTANTS.T_FIX_EXTENSION;
          }
          const reviewTimeLeft = reviewDeadline - now;
          setTimeLeft(reviewTimeLeft);
          setIsTimeout(reviewTimeLeft <= 0);
          setTimeoutType(reviewTimeLeft <= 0 ? 'Review Timeout' : null);
          break;

        default:
          setTimeLeft(0);
          setIsTimeout(false);
          setTimeoutType(null);
      }
    };

    calculateTimeout();
    const interval = setInterval(calculateTimeout, 1000);

    return () => clearInterval(interval);
  }, [task]);

  const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return 'Expired';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return {
    timeLeft,
    isTimeout,
    timeoutType,
    formatTimeLeft: () => formatTimeLeft(timeLeft),
  };
}

/**
 * Mock 协商终止超时 Hook
 */
export function useMockTerminateTimeout(task: Task | null) {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!task || task.terminateRequestedAt === 0) {
      setIsExpired(false);
      return;
    }

    const checkExpired = () => {
      const now = Math.floor(Date.now() / 1000);
      const deadline = task.terminateRequestedAt + TIME_CONSTANTS.T_TERMINATE_RESPONSE;
      setIsExpired(now > deadline);
    };

    checkExpired();
    const interval = setInterval(checkExpired, 1000);

    return () => clearInterval(interval);
  }, [task]);

  return { isExpired };
}
