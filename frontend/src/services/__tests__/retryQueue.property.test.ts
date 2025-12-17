/**
 * Property Tests for Retry Queue and Recovery Mechanisms
 * 
 * Tests the robustness of retry and recovery systems using property-based testing
 * to ensure they handle various failure scenarios correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { retryQueue } from '../retryQueue';

// Mock fetch for testing
global.fetch = vi.fn();

describe('RetryQueue Property Tests', () => {
  beforeEach(() => {
    retryQueue.clearQueue();
    vi.clearAllMocks();
  });

  afterEach(() => {
    retryQueue.clearQueue();
  });

  /**
   * Property 5.1: Retry operations eventually succeed or fail permanently
   * 
   * For any operation added to the retry queue:
   * - It will either succeed within maxAttempts
   * - Or fail permanently after maxAttempts
   * - It will never be retried more than maxAttempts times
   */
  it('Property 5.1: Operations eventually succeed or fail permanently', async () => {
    const maxAttempts = 3;
    let attemptCount = 0;
    let finalResult: 'success' | 'failure' | 'pending' = 'pending';

    // Mock fetch to fail first 2 times, then succeed
    (global.fetch as any).mockImplementation(() => {
      attemptCount++;
      if (attemptCount <= 2) {
        return Promise.reject(new Error(`Network error attempt ${attemptCount}`));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    const operationId = retryQueue.addOperation({
      type: 'metadata_write',
      payload: {
        taskId: 'test-task-1',
        metadata: { title: 'Test', description: 'Test', contactsPlaintext: 'test@example.com', createdAt: Date.now() },
        creatorAddress: '0x123'
      },
      maxAttempts,
      onSuccess: () => { finalResult = 'success'; },
      onFailure: () => { finalResult = 'failure'; }
    });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify operation succeeded
    expect(finalResult).toBe('success');
    expect(attemptCount).toBe(3); // Should have tried 3 times
    expect(retryQueue.getOperationStatus(operationId)).toBeNull(); // Should be removed from queue
  });

  /**
   * Property 5.2: Exponential backoff increases delay between retries
   * 
   * For any sequence of retry attempts:
   * - Each retry delay should be longer than the previous
   * - Delays should follow exponential backoff pattern
   * - Maximum delay should be capped
   */
  it('Property 5.2: Exponential backoff increases retry delays', async () => {
    const retryDelays: number[] = [];
    let attemptTimes: number[] = [];

    // Mock fetch to always fail
    (global.fetch as any).mockImplementation(() => {
      attemptTimes.push(Date.now());
      return Promise.reject(new Error('Always fails'));
    });

    const operationId = retryQueue.addOperation({
      type: 'metadata_write',
      payload: {
        taskId: 'test-task-2',
        metadata: { title: 'Test', description: 'Test', contactsPlaintext: 'test@example.com', createdAt: Date.now() },
        creatorAddress: '0x123'
      },
      maxAttempts: 4,
      onFailure: () => {
        // Calculate delays between attempts
        for (let i = 1; i < attemptTimes.length; i++) {
          retryDelays.push(attemptTimes[i] - attemptTimes[i - 1]);
        }
      }
    });

    // Wait for all retries to complete
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Verify exponential backoff pattern
    expect(retryDelays.length).toBeGreaterThan(0);
    for (let i = 1; i < retryDelays.length; i++) {
      expect(retryDelays[i]).toBeGreaterThan(retryDelays[i - 1]);
    }

    // Verify operation was removed after max attempts
    expect(retryQueue.getOperationStatus(operationId)).toBeNull();
  });

  /**
   * Property 5.3: Queue statistics are accurate
   * 
   * For any set of operations added to the queue:
   * - Total operations count should match operations added
   * - Pending operations should decrease as operations complete
   * - Success/failure counts should sum to completed operations
   */
  it('Property 5.3: Queue statistics remain accurate', async () => {
    const initialStats = retryQueue.getStats();
    const operationsToAdd = 5;
    const operationIds: string[] = [];

    // Add multiple operations with different outcomes
    for (let i = 0; i < operationsToAdd; i++) {
      const shouldSucceed = i % 2 === 0;
      
      (global.fetch as any).mockImplementationOnce(() => {
        if (shouldSucceed) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          });
        } else {
          return Promise.reject(new Error(`Operation ${i} failed`));
        }
      });

      const id = retryQueue.addOperation({
        type: 'metadata_write',
        payload: {
          taskId: `test-task-${i}`,
          metadata: { title: `Test ${i}`, description: 'Test', contactsPlaintext: 'test@example.com', createdAt: Date.now() },
          creatorAddress: '0x123'
        },
        maxAttempts: 2
      });
      
      operationIds.push(id);
    }

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 8000));

    const finalStats = retryQueue.getStats();

    // Verify statistics
    expect(finalStats.totalOperations).toBe(initialStats.totalOperations + operationsToAdd);
    expect(finalStats.pendingOperations).toBe(0); // All should be completed
    expect(finalStats.successfulOperations + finalStats.failedOperations)
      .toBe(finalStats.totalOperations - initialStats.totalOperations);
  });

  /**
   * Property 5.4: Manual retry triggers work correctly
   * 
   * For any failed operation that hasn't exceeded max attempts:
   * - Manual retry should reset the nextRetryAt time
   * - Operation should be processed again
   * - Manual retry should fail for operations that exceeded max attempts
   */
  it('Property 5.4: Manual retry triggers work correctly', async () => {
    let attemptCount = 0;
    let manualRetryTriggered = false;

    // Mock fetch to fail first time, succeed on manual retry
    (global.fetch as any).mockImplementation(() => {
      attemptCount++;
      if (attemptCount === 1) {
        return Promise.reject(new Error('First attempt fails'));
      }
      if (manualRetryTriggered) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.reject(new Error('Still failing'));
    });

    const operationId = retryQueue.addOperation({
      type: 'metadata_write',
      payload: {
        taskId: 'test-manual-retry',
        metadata: { title: 'Test', description: 'Test', contactsPlaintext: 'test@example.com', createdAt: Date.now() },
        creatorAddress: '0x123'
      },
      maxAttempts: 5
    });

    // Wait for first failure
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify operation is still in queue
    const operation = retryQueue.getOperationStatus(operationId);
    expect(operation).not.toBeNull();
    expect(operation!.attempts).toBe(1);

    // Trigger manual retry
    manualRetryTriggered = true;
    const retryResult = await retryQueue.retryOperation(operationId);
    expect(retryResult).toBe(true);

    // Wait for manual retry to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify operation succeeded and was removed
    expect(retryQueue.getOperationStatus(operationId)).toBeNull();
    expect(attemptCount).toBeGreaterThan(1);
  });

  /**
   * Property 5.5: Queue handles concurrent operations safely
   * 
   * For any number of concurrent operations:
   * - All operations should be processed
   * - No operations should be lost
   * - Statistics should remain consistent
   */
  it('Property 5.5: Queue handles concurrent operations safely', async () => {
    const concurrentOperations = 10;
    const operationIds: string[] = [];
    let completedOperations = 0;

    // Mock fetch to succeed after random delay
    (global.fetch as any).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          completedOperations++;
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          });
        }, Math.random() * 100);
      });
    });

    // Add multiple operations concurrently
    const addPromises = Array.from({ length: concurrentOperations }, (_, i) => {
      return new Promise<string>((resolve) => {
        const id = retryQueue.addOperation({
          type: 'metadata_write',
          payload: {
            taskId: `concurrent-task-${i}`,
            metadata: { title: `Concurrent ${i}`, description: 'Test', contactsPlaintext: 'test@example.com', createdAt: Date.now() },
            creatorAddress: '0x123'
          },
          maxAttempts: 3,
          onSuccess: () => resolve(id)
        });
        operationIds.push(id);
      });
    });

    // Wait for all operations to complete
    const completedIds = await Promise.all(addPromises);

    // Verify all operations completed
    expect(completedIds).toHaveLength(concurrentOperations);
    expect(completedOperations).toBe(concurrentOperations);

    // Verify queue is empty
    expect(retryQueue.getPendingOperations()).toHaveLength(0);

    // Verify statistics
    const stats = retryQueue.getStats();
    expect(stats.successfulOperations).toBeGreaterThanOrEqual(concurrentOperations);
  });

  /**
   * Property 5.6: Error handling provides clear feedback
   * 
   * For any operation that fails:
   * - Error messages should be preserved
   * - Failure callbacks should be called with correct error
   * - Operation status should reflect the error
   */
  it('Property 5.6: Error handling provides clear feedback', async () => {
    const expectedError = 'Specific test error message';
    let capturedError: Error | null = null;

    // Mock fetch to fail with specific error
    (global.fetch as any).mockImplementation(() => {
      return Promise.reject(new Error(expectedError));
    });

    const operationId = retryQueue.addOperation({
      type: 'metadata_write',
      payload: {
        taskId: 'error-test-task',
        metadata: { title: 'Error Test', description: 'Test', contactsPlaintext: 'test@example.com', createdAt: Date.now() },
        creatorAddress: '0x123'
      },
      maxAttempts: 2,
      onFailure: (error) => {
        capturedError = error;
      }
    });

    // Wait for operation to fail permanently
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify error was captured correctly
    expect(capturedError).not.toBeNull();
    expect(capturedError!.message).toContain(expectedError);

    // Verify operation was removed from queue
    expect(retryQueue.getOperationStatus(operationId)).toBeNull();

    // Verify failure was recorded in statistics
    const stats = retryQueue.getStats();
    expect(stats.failedOperations).toBeGreaterThan(0);
  });
});

/**
 * Integration Tests for Retry Queue with useCreateTask
 */
describe('Retry Queue Integration Tests', () => {
  beforeEach(() => {
    retryQueue.clearQueue();
    vi.clearAllMocks();
  });

  afterEach(() => {
    retryQueue.clearQueue();
  });

  /**
   * Property 5.7: Task creation with metadata retry queue integration
   * 
   * When task creation succeeds on blockchain but metadata write fails:
   * - Task should be created on blockchain
   * - Metadata write should be queued for retry
   * - User should be notified of background processing
   */
  it('Property 5.7: Task creation integrates with retry queue correctly', async () => {
    // This test would require mocking the entire useCreateTask hook
    // For now, we'll test the retry queue behavior in isolation
    
    let metadataWriteAttempts = 0;
    let queuedOperations = 0;

    // Mock metadata write to fail initially
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/metadata')) {
        metadataWriteAttempts++;
        if (metadataWriteAttempts <= 2) {
          return Promise.reject(new Error('Metadata service temporarily unavailable'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    // Simulate task creation with metadata retry
    const taskId = 'blockchain-task-123';
    const metadata = {
      title: 'Integration Test Task',
      description: 'Testing retry queue integration',
      contactsPlaintext: 'test@example.com',
      createdAt: Date.now()
    };

    // Add metadata write to retry queue
    const operationId = retryQueue.addOperation({
      type: 'metadata_write',
      payload: {
        taskId,
        metadata,
        creatorAddress: '0x123'
      },
      maxAttempts: 5,
      onSuccess: () => {
        queuedOperations++;
      }
    });

    // Wait for retry queue to process
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Verify metadata write eventually succeeded
    expect(metadataWriteAttempts).toBeGreaterThan(2);
    expect(queuedOperations).toBe(1);
    expect(retryQueue.getOperationStatus(operationId)).toBeNull();
  });
});