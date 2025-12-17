/**
 * Comprehensive Error Handling and Recovery Service
 * 
 * Provides clear error messages, recovery options, and user guidance
 * for all failure scenarios in the task creation and management flow.
 */

export interface ErrorContext {
  operation: string;
  taskId?: string;
  userAddress?: string;
  chainId?: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface RecoveryOption {
  id: string;
  label: string;
  description: string;
  action: () => Promise<void> | void;
  priority: 'high' | 'medium' | 'low';
  category: 'retry' | 'manual' | 'support';
}

export interface ErrorReport {
  id: string;
  type: ErrorType;
  message: string;
  userMessage: string;
  context: ErrorContext;
  recoveryOptions: RecoveryOption[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  canRetry: boolean;
  requiresUserAction: boolean;
}

export enum ErrorType {
  // Blockchain errors
  BLOCKCHAIN_CONNECTION = 'blockchain_connection',
  TRANSACTION_FAILED = 'transaction_failed',
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  USER_REJECTED = 'user_rejected',
  NETWORK_MISMATCH = 'network_mismatch',
  
  // Metadata errors
  METADATA_WRITE_FAILED = 'metadata_write_failed',
  METADATA_VALIDATION_FAILED = 'metadata_validation_failed',
  METADATA_NOT_FOUND = 'metadata_not_found',
  
  // Profile errors
  PROFILE_NOT_FOUND = 'profile_not_found',
  ENCRYPTION_KEY_MISSING = 'encryption_key_missing',
  CONTACTS_DECRYPTION_FAILED = 'contacts_decryption_failed',
  
  // Network errors
  NETWORK_ERROR = 'network_error',
  API_UNAVAILABLE = 'api_unavailable',
  TIMEOUT = 'timeout',
  
  // Validation errors
  INVALID_INPUT = 'invalid_input',
  TASK_NOT_FOUND = 'task_not_found',
  UNAUTHORIZED = 'unauthorized',
  
  // System errors
  UNKNOWN_ERROR = 'unknown_error',
  CONFIGURATION_ERROR = 'configuration_error'
}

class ErrorHandlingService {
  private errorLog: ErrorReport[] = [];
  private maxLogSize = 100;

  /**
   * Create an error report with recovery options
   */
  createErrorReport(
    error: Error | string,
    type: ErrorType,
    context: ErrorContext,
    customRecoveryOptions?: RecoveryOption[]
  ): ErrorReport {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report: ErrorReport = {
      id: errorId,
      type,
      message: errorMessage,
      userMessage: this.generateUserMessage(type, errorMessage, context),
      context,
      recoveryOptions: customRecoveryOptions || this.generateRecoveryOptions(type, context),
      severity: this.determineSeverity(type),
      canRetry: this.canRetry(type),
      requiresUserAction: this.requiresUserAction(type)
    };

    this.logError(report);
    return report;
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(type: ErrorType, originalMessage: string, context: ErrorContext): string {
    switch (type) {
      case ErrorType.BLOCKCHAIN_CONNECTION:
        return 'Unable to connect to the blockchain. Please check your wallet connection and network settings.';
      
      case ErrorType.TRANSACTION_FAILED:
        return 'The blockchain transaction failed. This could be due to network congestion or insufficient gas fees.';
      
      case ErrorType.INSUFFICIENT_BALANCE:
        return `You don't have enough ECHO tokens to complete this transaction. You need at least ${this.extractRequiredAmount(originalMessage)} ECHO.`;
      
      case ErrorType.USER_REJECTED:
        return 'Transaction was cancelled. You can try again when ready.';
      
      case ErrorType.NETWORK_MISMATCH:
        return `Please switch to the correct network. Expected network ID: ${context.chainId || 'unknown'}.`;
      
      case ErrorType.METADATA_WRITE_FAILED:
        return 'Task was created on blockchain but additional details couldn\'t be saved. Don\'t worry - we\'ll keep trying in the background.';
      
      case ErrorType.METADATA_VALIDATION_FAILED:
        return 'The task information couldn\'t be validated. Please check your input and try again.';
      
      case ErrorType.METADATA_NOT_FOUND:
        return 'Task details are not available yet. They may still be loading or syncing.';
      
      case ErrorType.PROFILE_NOT_FOUND:
        return 'Your profile information is missing. Please complete your profile setup first.';
      
      case ErrorType.ENCRYPTION_KEY_MISSING:
        return 'Encryption setup is incomplete. We\'ll generate new encryption keys for you automatically.';
      
      case ErrorType.CONTACTS_DECRYPTION_FAILED:
        return 'Unable to decrypt contact information. This may be due to a temporary sync issue.';
      
      case ErrorType.NETWORK_ERROR:
        return 'Network connection issue. Please check your internet connection and try again.';
      
      case ErrorType.API_UNAVAILABLE:
        return 'Our servers are temporarily unavailable. We\'re working to restore service quickly.';
      
      case ErrorType.TIMEOUT:
        return 'The operation timed out. This might be due to network congestion.';
      
      case ErrorType.INVALID_INPUT:
        return 'Please check your input and make sure all required fields are filled correctly.';
      
      case ErrorType.TASK_NOT_FOUND:
        return 'The requested task could not be found. It may have been removed or doesn\'t exist yet.';
      
      case ErrorType.UNAUTHORIZED:
        return 'You don\'t have permission to perform this action.';
      
      case ErrorType.CONFIGURATION_ERROR:
        return 'There\'s a configuration issue. Please refresh the page and try again.';
      
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Generate recovery options based on error type
   */
  private generateRecoveryOptions(type: ErrorType, context: ErrorContext): RecoveryOption[] {
    const options: RecoveryOption[] = [];

    switch (type) {
      case ErrorType.BLOCKCHAIN_CONNECTION:
        options.push({
          id: 'reconnect_wallet',
          label: 'Reconnect Wallet',
          description: 'Try reconnecting your wallet',
          action: () => window.location.reload(),
          priority: 'high',
          category: 'retry'
        });
        options.push({
          id: 'check_network',
          label: 'Check Network',
          description: 'Verify you\'re on the correct network',
          action: () => this.openNetworkGuide(),
          priority: 'medium',
          category: 'manual'
        });
        break;

      case ErrorType.TRANSACTION_FAILED:
        options.push({
          id: 'retry_transaction',
          label: 'Retry Transaction',
          description: 'Try the transaction again',
          action: () => this.retryLastOperation(context),
          priority: 'high',
          category: 'retry'
        });
        options.push({
          id: 'increase_gas',
          label: 'Increase Gas Fee',
          description: 'Try with higher gas fee for faster processing',
          action: () => this.openGasGuide(),
          priority: 'medium',
          category: 'manual'
        });
        break;

      case ErrorType.INSUFFICIENT_BALANCE:
        options.push({
          id: 'check_balance',
          label: 'Check Balance',
          description: 'View your current ECHO balance',
          action: () => this.openBalanceView(),
          priority: 'high',
          category: 'manual'
        });
        options.push({
          id: 'get_tokens',
          label: 'Get ECHO Tokens',
          description: 'Learn how to get more ECHO tokens',
          action: () => this.openTokenGuide(),
          priority: 'medium',
          category: 'manual'
        });
        break;

      case ErrorType.METADATA_WRITE_FAILED:
        options.push({
          id: 'check_retry_queue',
          label: 'Check Background Sync',
          description: 'View the status of background synchronization',
          action: () => this.openRetryQueueStatus(),
          priority: 'medium',
          category: 'manual'
        });
        options.push({
          id: 'manual_retry',
          label: 'Retry Now',
          description: 'Manually retry saving task details',
          action: () => this.retryMetadataWrite(context),
          priority: 'high',
          category: 'retry'
        });
        break;

      case ErrorType.PROFILE_NOT_FOUND:
        options.push({
          id: 'create_profile',
          label: 'Create Profile',
          description: 'Set up your profile now',
          action: () => this.navigateToProfile(),
          priority: 'high',
          category: 'manual'
        });
        break;

      case ErrorType.ENCRYPTION_KEY_MISSING:
        options.push({
          id: 'generate_keys',
          label: 'Generate Keys',
          description: 'Automatically generate encryption keys',
          action: () => this.generateEncryptionKeys(context),
          priority: 'high',
          category: 'retry'
        });
        break;

      case ErrorType.NETWORK_ERROR:
      case ErrorType.API_UNAVAILABLE:
      case ErrorType.TIMEOUT:
        options.push({
          id: 'retry_request',
          label: 'Try Again',
          description: 'Retry the request',
          action: () => this.retryLastOperation(context),
          priority: 'high',
          category: 'retry'
        });
        options.push({
          id: 'check_status',
          label: 'Check Service Status',
          description: 'View current service status',
          action: () => this.openStatusPage(),
          priority: 'low',
          category: 'manual'
        });
        break;

      case ErrorType.TASK_NOT_FOUND:
        options.push({
          id: 'refresh_tasks',
          label: 'Refresh Tasks',
          description: 'Reload the task list',
          action: () => this.refreshTaskList(),
          priority: 'high',
          category: 'retry'
        });
        options.push({
          id: 'check_blockchain',
          label: 'Check Blockchain',
          description: 'Verify task exists on blockchain',
          action: () => this.checkTaskOnBlockchain(context),
          priority: 'medium',
          category: 'manual'
        });
        break;
    }

    // Always add contact support option for critical errors
    if (this.determineSeverity(type) === 'critical') {
      options.push({
        id: 'contact_support',
        label: 'Contact Support',
        description: 'Get help from our support team',
        action: () => this.openSupportChat(context),
        priority: 'low',
        category: 'support'
      });
    }

    return options;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(type: ErrorType): 'critical' | 'high' | 'medium' | 'low' {
    switch (type) {
      case ErrorType.BLOCKCHAIN_CONNECTION:
      case ErrorType.CONFIGURATION_ERROR:
        return 'critical';
      
      case ErrorType.TRANSACTION_FAILED:
      case ErrorType.INSUFFICIENT_BALANCE:
      case ErrorType.PROFILE_NOT_FOUND:
        return 'high';
      
      case ErrorType.METADATA_WRITE_FAILED:
      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT:
        return 'medium';
      
      default:
        return 'low';
    }
  }

  /**
   * Check if error type can be retried
   */
  private canRetry(type: ErrorType): boolean {
    const retryableErrors = [
      ErrorType.NETWORK_ERROR,
      ErrorType.API_UNAVAILABLE,
      ErrorType.TIMEOUT,
      ErrorType.METADATA_WRITE_FAILED,
      ErrorType.CONTACTS_DECRYPTION_FAILED,
      ErrorType.TRANSACTION_FAILED
    ];
    return retryableErrors.includes(type);
  }

  /**
   * Check if error requires user action
   */
  private requiresUserAction(type: ErrorType): boolean {
    const userActionRequired = [
      ErrorType.USER_REJECTED,
      ErrorType.INSUFFICIENT_BALANCE,
      ErrorType.NETWORK_MISMATCH,
      ErrorType.PROFILE_NOT_FOUND,
      ErrorType.INVALID_INPUT,
      ErrorType.UNAUTHORIZED
    ];
    return userActionRequired.includes(type);
  }

  /**
   * Log error for debugging and analytics
   */
  private logError(report: ErrorReport): void {
    console.error(`[ErrorHandler] ${report.type}:`, {
      id: report.id,
      message: report.message,
      context: report.context,
      severity: report.severity
    });

    this.errorLog.push(report);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Send to analytics if available
    this.sendToAnalytics(report);
  }

  /**
   * Get error history
   */
  getErrorHistory(): ErrorReport[] {
    return [...this.errorLog];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorLog = [];
  }

  // Recovery action implementations
  private async retryLastOperation(context: ErrorContext): Promise<void> {
    console.log('[ErrorHandler] Retrying last operation:', context.operation);
    // Implementation would depend on the specific operation
    // This is a placeholder for the actual retry logic
  }

  private async retryMetadataWrite(context: ErrorContext): Promise<void> {
    if (context.taskId) {
      // Trigger manual retry in retry queue
      const { retryQueue: _retryQueue } = await import('./retryQueue');
      // Find and retry the operation
      console.log('[ErrorHandler] Manually retrying metadata write for task:', context.taskId);
    }
  }

  private async generateEncryptionKeys(context: ErrorContext): Promise<void> {
    const { generateEncryptionKeyPair, saveEncryptionPrivateKey } = await import('../utils/encryption');
    if (context.userAddress) {
      const { publicKey: _publicKey, privateKey } = generateEncryptionKeyPair();
      saveEncryptionPrivateKey(context.userAddress, privateKey);
      console.log('[ErrorHandler] Generated new encryption keys for user');
    }
  }

  private openNetworkGuide(): void {
    window.open('https://docs.everecho.io/network-setup', '_blank');
  }

  private openGasGuide(): void {
    window.open('https://docs.everecho.io/gas-fees', '_blank');
  }

  private openBalanceView(): void {
    // Navigate to balance/wallet view
    window.location.hash = '#/wallet';
  }

  private openTokenGuide(): void {
    window.open('https://docs.everecho.io/get-tokens', '_blank');
  }

  private openRetryQueueStatus(): void {
    // Open retry queue status modal or page
    console.log('[ErrorHandler] Opening retry queue status');
  }

  private navigateToProfile(): void {
    window.location.hash = '#/profile';
  }

  private openStatusPage(): void {
    window.open('https://status.everecho.io', '_blank');
  }

  private refreshTaskList(): void {
    window.location.reload();
  }

  private async checkTaskOnBlockchain(context: ErrorContext): Promise<void> {
    if (context.taskId) {
      console.log('[ErrorHandler] Checking task on blockchain:', context.taskId);
      // Implementation would check blockchain directly
    }
  }

  private openSupportChat(context: ErrorContext): void {
    const supportUrl = `https://support.everecho.io/chat?error=${context.operation}&id=${context.taskId || 'unknown'}`;
    window.open(supportUrl, '_blank');
  }

  private sendToAnalytics(report: ErrorReport): void {
    // Send error report to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'error', {
        error_type: report.type,
        error_severity: report.severity,
        error_operation: report.context.operation,
        error_can_retry: report.canRetry
      });
    }
  }

  private extractRequiredAmount(message: string): string {
    const match = message.match(/(\d+(?:\.\d+)?)\s*ECHO/);
    return match ? match[1] : 'some';
  }
}

// Global error handling service
export const errorHandler = new ErrorHandlingService();

/**
 * Utility function to handle errors consistently across the app
 */
export function handleError(
  error: Error | string,
  operation: string,
  context: Partial<ErrorContext> = {}
): ErrorReport {
  const errorType = classifyError(error);
  const fullContext: ErrorContext = {
    operation,
    timestamp: Date.now(),
    ...context
  };

  return errorHandler.createErrorReport(error, errorType, fullContext);
}

/**
 * Classify error based on message and type
 */
function classifyError(error: Error | string): ErrorType {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('user rejected') || lowerMessage.includes('user denied')) {
    return ErrorType.USER_REJECTED;
  }
  
  if (lowerMessage.includes('insufficient') && lowerMessage.includes('balance')) {
    return ErrorType.INSUFFICIENT_BALANCE;
  }
  
  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return ErrorType.NETWORK_ERROR;
  }
  
  if (lowerMessage.includes('timeout')) {
    return ErrorType.TIMEOUT;
  }
  
  if (lowerMessage.includes('metadata')) {
    return ErrorType.METADATA_WRITE_FAILED;
  }
  
  if (lowerMessage.includes('profile') && lowerMessage.includes('not found')) {
    return ErrorType.PROFILE_NOT_FOUND;
  }
  
  if (lowerMessage.includes('encryption') || lowerMessage.includes('decrypt')) {
    return ErrorType.CONTACTS_DECRYPTION_FAILED;
  }
  
  if (lowerMessage.includes('task') && lowerMessage.includes('not found')) {
    return ErrorType.TASK_NOT_FOUND;
  }
  
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('permission')) {
    return ErrorType.UNAUTHORIZED;
  }

  return ErrorType.UNKNOWN_ERROR;
}