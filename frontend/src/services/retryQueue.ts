/**
 * Retry Queue System for Failed Metadata Operations
 * 
 * Implements an in-memory retry queue with exponential backoff
 * for handling failed metadata write operations after successful
 * blockchain transactions.
 */

export interface RetryOperation {
  id: string;
  type: 'metadata_write' | 'profile_update' | 'task_sync';
  payload: any;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  createdAt: number;
  lastError?: string;
  onSuccess?: (result: any) => void;
  onFailure?: (error: Error) => void;
}

export interface RetryQueueStats {
  totalOperations: number;
  pendingOperations: number;
  failedOperations: number;
  successfulOperations: number;
  averageRetryTime: number;
}

class RetryQueueService {
  private queue: Map<string, RetryOperation> = new Map();
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private stats = {
    totalOperations: 0,
    pendingOperations: 0,
    failedOperations: 0,
    successfulOperations: 0,
    totalRetryTime: 0
  };

  constructor() {
    this.startProcessing();
  }

  /**
   * Add operation to retry queue
   */
  addOperation(operation: Omit<RetryOperation, 'id' | 'attempts' | 'nextRetryAt' | 'createdAt'>): string {
    const id = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const retryOperation: RetryOperation = {
      id,
      attempts: 0,
      nextRetryAt: now,
      createdAt: now,
      ...operation
    };

    this.queue.set(id, retryOperation);
    this.stats.totalOperations++;
    this.stats.pendingOperations++;

    console.log(`[RetryQueue] Added operation ${id} of type ${operation.type}`);
    return id;
  }

  /**
   * Remove operation from queue
   */
  removeOperation(id: string): boolean {
    const operation = this.queue.get(id);
    if (operation) {
      this.queue.delete(id);
      this.stats.pendingOperations--;
      return true;
    }
    return false;
  }

  /**
   * Get operation status
   */
  getOperationStatus(id: string): RetryOperation | null {
    return this.queue.get(id) || null;
  }

  /**
   * Get queue statistics
   */
  getStats(): RetryQueueStats {
    return {
      ...this.stats,
      averageRetryTime: this.stats.totalOperations > 0 
        ? this.stats.totalRetryTime / this.stats.totalOperations 
        : 0
    };
  }

  /**
   * Get all pending operations
   */
  getPendingOperations(): RetryOperation[] {
    return Array.from(this.queue.values()).filter(op => op.attempts < op.maxAttempts);
  }

  /**
   * Calculate next retry delay using exponential backoff
   */
  private calculateRetryDelay(attempts: number): number {
    // Base delay: 1 second, max delay: 5 minutes
    const baseDelay = 1000;
    const maxDelay = 5 * 60 * 1000;
    const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  /**
   * Process a single retry operation
   */
  private async processOperation(operation: RetryOperation): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`[RetryQueue] Processing operation ${operation.id}, attempt ${operation.attempts + 1}/${operation.maxAttempts}`);
      
      let result: any;
      
      switch (operation.type) {
        case 'metadata_write':
          result = await this.executeMetadataWrite(operation.payload);
          break;
        case 'profile_update':
          result = await this.executeProfileUpdate(operation.payload);
          break;
        case 'task_sync':
          result = await this.executeTaskSync(operation.payload);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      // Success
      this.queue.delete(operation.id);
      this.stats.pendingOperations--;
      this.stats.successfulOperations++;
      this.stats.totalRetryTime += Date.now() - startTime;

      console.log(`[RetryQueue] Operation ${operation.id} completed successfully`);
      
      if (operation.onSuccess) {
        operation.onSuccess(result);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      operation.attempts++;
      operation.lastError = errorMessage;
      
      if (operation.attempts >= operation.maxAttempts) {
        // Max attempts reached, mark as failed
        this.queue.delete(operation.id);
        this.stats.pendingOperations--;
        this.stats.failedOperations++;
        
        console.error(`[RetryQueue] Operation ${operation.id} failed permanently after ${operation.attempts} attempts:`, errorMessage);
        
        if (operation.onFailure) {
          operation.onFailure(error instanceof Error ? error : new Error(errorMessage));
        }
      } else {
        // Schedule next retry
        const delay = this.calculateRetryDelay(operation.attempts);
        operation.nextRetryAt = Date.now() + delay;
        
        console.warn(`[RetryQueue] Operation ${operation.id} failed, retrying in ${Math.round(delay / 1000)}s:`, errorMessage);
      }
    }
  }

  /**
   * Execute metadata write operation
   */
  private async executeMetadataWrite(payload: any): Promise<any> {
    const { taskId, metadata, creatorAddress } = payload;
    const API_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3001';
    
    const response = await fetch(`${API_URL}/api/tasks/${taskId}/metadata`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...metadata,
        creatorAddress
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Execute profile update operation
   */
  private async executeProfileUpdate(payload: any): Promise<any> {
    const API_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3001';
    
    const response = await fetch(`${API_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Profile update failed: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Execute task sync operation
   */
  private async executeTaskSync(payload: any): Promise<any> {
    // Placeholder for future task sync operations
    console.log('[RetryQueue] Task sync operation:', payload);
    return { success: true };
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(async () => {
      if (this.isProcessing) {
        return;
      }

      this.isProcessing = true;
      
      try {
        const now = Date.now();
        const readyOperations = Array.from(this.queue.values())
          .filter(op => op.nextRetryAt <= now && op.attempts < op.maxAttempts)
          .sort((a, b) => a.nextRetryAt - b.nextRetryAt);

        for (const operation of readyOperations) {
          await this.processOperation(operation);
        }
      } catch (error) {
        console.error('[RetryQueue] Error during queue processing:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 1000); // Check every second
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Clear all operations
   */
  clearQueue(): void {
    this.queue.clear();
    this.stats = {
      totalOperations: 0,
      pendingOperations: 0,
      failedOperations: 0,
      successfulOperations: 0,
      totalRetryTime: 0
    };
  }

  /**
   * Manually trigger retry for specific operation
   */
  async retryOperation(id: string): Promise<boolean> {
    const operation = this.queue.get(id);
    if (!operation) {
      return false;
    }

    if (operation.attempts >= operation.maxAttempts) {
      console.warn(`[RetryQueue] Cannot retry operation ${id}: max attempts reached`);
      return false;
    }

    operation.nextRetryAt = Date.now();
    console.log(`[RetryQueue] Manually triggered retry for operation ${id}`);
    return true;
  }
}

// Global retry queue instance
export const retryQueue = new RetryQueueService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    retryQueue.stopProcessing();
  });
}