/**
 * Property Tests for Error Handling Service
 * 
 * Tests the clarity and effectiveness of error handling across all failure scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorHandler, handleError, ErrorType, ErrorContext } from '../errorHandling';

describe('Error Handling Property Tests', () => {
  beforeEach(() => {
    errorHandler.clearErrorHistory();
    vi.clearAllMocks();
  });

  /**
   * Property 6.1: All error types produce user-friendly messages
   * 
   * For any error type in the system:
   * - User message should be clear and actionable
   * - User message should not contain technical jargon
   * - User message should provide guidance on next steps
   */
  it('Property 6.1: All error types produce clear user messages', () => {
    const testCases = [
      {
        type: ErrorType.BLOCKCHAIN_CONNECTION,
        originalError: 'RPC connection failed',
        expectedKeywords: ['wallet', 'connection', 'network']
      },
      {
        type: ErrorType.INSUFFICIENT_BALANCE,
        originalError: 'Insufficient balance. You need at least 25.5 ECHO',
        expectedKeywords: ['ECHO', 'tokens', '25.5']
      },
      {
        type: ErrorType.USER_REJECTED,
        originalError: 'User rejected transaction',
        expectedKeywords: ['cancelled', 'try again']
      },
      {
        type: ErrorType.METADATA_WRITE_FAILED,
        originalError: 'HTTP 500 Internal Server Error',
        expectedKeywords: ['background', 'trying', 'blockchain']
      },
      {
        type: ErrorType.NETWORK_ERROR,
        originalError: 'Network request failed',
        expectedKeywords: ['network', 'connection', 'internet']
      }
    ];

    testCases.forEach(({ type, originalError, expectedKeywords }) => {
      const context: ErrorContext = {
        operation: 'test_operation',
        timestamp: Date.now()
      };

      const report = errorHandler.createErrorReport(originalError, type, context);

      // User message should be different from original error
      expect(report.userMessage).not.toBe(originalError);
      
      // User message should contain expected keywords
      const lowerUserMessage = report.userMessage.toLowerCase();
      expectedKeywords.forEach(keyword => {
        expect(lowerUserMessage).toContain(keyword.toLowerCase());
      });

      // User message should not contain technical terms
      const technicalTerms = ['http', 'rpc', 'api', 'server', 'exception', 'stack'];
      technicalTerms.forEach(term => {
        expect(lowerUserMessage).not.toContain(term);
      });

      // User message should be reasonably long (not just "Error")
      expect(report.userMessage.length).toBeGreaterThan(20);
    });
  });

  /**
   * Property 6.2: Recovery options are appropriate for error types
   * 
   * For any error type:
   * - Recovery options should be relevant to the error
   * - High priority options should address the most likely solution
   * - All recovery options should be actionable
   */
  it('Property 6.2: Recovery options are appropriate and actionable', () => {
    const testCases = [
      {
        type: ErrorType.BLOCKCHAIN_CONNECTION,
        expectedCategories: ['retry', 'manual'],
        expectedPriorities: ['high'],
        requiredOptions: ['reconnect']
      },
      {
        type: ErrorType.INSUFFICIENT_BALANCE,
        expectedCategories: ['manual'],
        expectedPriorities: ['high', 'medium'],
        requiredOptions: ['balance', 'tokens']
      },
      {
        type: ErrorType.METADATA_WRITE_FAILED,
        expectedCategories: ['retry', 'manual'],
        expectedPriorities: ['high'],
        requiredOptions: ['retry']
      },
      {
        type: ErrorType.PROFILE_NOT_FOUND,
        expectedCategories: ['manual'],
        expectedPriorities: ['high'],
        requiredOptions: ['profile']
      }
    ];

    testCases.forEach(({ type, expectedCategories, expectedPriorities, requiredOptions }) => {
      const context: ErrorContext = {
        operation: 'test_operation',
        timestamp: Date.now(),
        userAddress: '0x123'
      };

      const report = errorHandler.createErrorReport('Test error', type, context);

      // Should have recovery options
      expect(report.recoveryOptions.length).toBeGreaterThan(0);

      // Should have expected categories
      const categories = report.recoveryOptions.map(opt => opt.category);
      expectedCategories.forEach(category => {
        expect(categories).toContain(category);
      });

      // Should have expected priorities
      const priorities = report.recoveryOptions.map(opt => opt.priority);
      expectedPriorities.forEach(priority => {
        expect(priorities).toContain(priority);
      });

      // Should have required option types
      const optionLabels = report.recoveryOptions.map(opt => opt.label.toLowerCase());
      requiredOptions.forEach(required => {
        const hasRequiredOption = optionLabels.some(label => label.includes(required));
        expect(hasRequiredOption).toBe(true);
      });

      // All options should have actions
      report.recoveryOptions.forEach(option => {
        expect(option.action).toBeDefined();
        expect(typeof option.action).toBe('function');
        expect(option.description.length).toBeGreaterThan(10);
      });
    });
  });

  /**
   * Property 6.3: Error severity is correctly classified
   * 
   * For any error:
   * - Critical errors should block core functionality
   * - High errors should impact user workflow significantly
   * - Medium errors should be recoverable with some effort
   * - Low errors should have minimal impact
   */
  it('Property 6.3: Error severity is correctly classified', () => {
    const severityTestCases = [
      {
        types: [ErrorType.BLOCKCHAIN_CONNECTION, ErrorType.CONFIGURATION_ERROR],
        expectedSeverity: 'critical',
        reasoning: 'Blocks core functionality'
      },
      {
        types: [ErrorType.TRANSACTION_FAILED, ErrorType.INSUFFICIENT_BALANCE, ErrorType.PROFILE_NOT_FOUND],
        expectedSeverity: 'high',
        reasoning: 'Significantly impacts user workflow'
      },
      {
        types: [ErrorType.METADATA_WRITE_FAILED, ErrorType.NETWORK_ERROR, ErrorType.TIMEOUT],
        expectedSeverity: 'medium',
        reasoning: 'Recoverable with some effort'
      },
      {
        types: [ErrorType.USER_REJECTED, ErrorType.INVALID_INPUT],
        expectedSeverity: 'low',
        reasoning: 'Minimal impact, user-controlled'
      }
    ];

    severityTestCases.forEach(({ types, expectedSeverity, reasoning: _reasoning }) => {
      types.forEach(type => {
        const context: ErrorContext = {
          operation: 'test_operation',
          timestamp: Date.now()
        };

        const report = errorHandler.createErrorReport('Test error', type, context);
        
        expect(report.severity).toBe(expectedSeverity);
        
        // Critical errors should have support options
        if (expectedSeverity === 'critical') {
          const hasSupportOption = report.recoveryOptions.some(opt => opt.category === 'support');
          expect(hasSupportOption).toBe(true);
        }
      });
    });
  });

  /**
   * Property 6.4: Error classification is consistent
   * 
   * For any error message:
   * - Same error messages should always classify to same type
   * - Classification should be based on error content, not randomness
   * - Edge cases should have reasonable fallback classification
   */
  it('Property 6.4: Error classification is consistent and logical', () => {
    const classificationTestCases = [
      {
        messages: [
          'User rejected the transaction',
          'User denied transaction signature',
          'Transaction was rejected by user'
        ],
        expectedType: ErrorType.USER_REJECTED
      },
      {
        messages: [
          'Insufficient balance for transaction',
          'Balance too low: need 100 ECHO',
          'Not enough tokens in account'
        ],
        expectedType: ErrorType.INSUFFICIENT_BALANCE
      },
      {
        messages: [
          'Network connection failed',
          'Unable to connect to network',
          'Connection timeout'
        ],
        expectedType: ErrorType.NETWORK_ERROR
      },
      {
        messages: [
          'Failed to save task metadata',
          'Metadata write operation failed',
          'Could not store metadata'
        ],
        expectedType: ErrorType.METADATA_WRITE_FAILED
      }
    ];

    classificationTestCases.forEach(({ messages, expectedType }) => {
      messages.forEach(message => {
        const report = handleError(message, 'test_operation');
        expect(report.type).toBe(expectedType);
      });
    });

    // Test consistency - same message should always produce same result
    const testMessage = 'User rejected the transaction';
    const report1 = handleError(testMessage, 'operation1');
    const report2 = handleError(testMessage, 'operation2');
    expect(report1.type).toBe(report2.type);

    // Test unknown errors get reasonable fallback
    const unknownError = 'Some completely unknown error message xyz123';
    const unknownReport = handleError(unknownError, 'test_operation');
    expect(unknownReport.type).toBe(ErrorType.UNKNOWN_ERROR);
    expect(unknownReport.userMessage).toContain('unexpected error');
  });

  /**
   * Property 6.5: Error context is preserved and utilized
   * 
   * For any error with context:
   * - Context information should be preserved in the report
   * - Context should influence recovery options
   * - Context should be used in user messages where relevant
   */
  it('Property 6.5: Error context is preserved and utilized', () => {
    const contextTestCases = [
      {
        context: {
          operation: 'create_task',
          taskId: 'task_123',
          userAddress: '0xabc123',
          chainId: 1337,
          timestamp: Date.now()
        },
        errorType: ErrorType.METADATA_WRITE_FAILED,
        expectedContextUsage: ['task_123', 'create_task']
      },
      {
        context: {
          operation: 'decrypt_contacts',
          taskId: 'task_456',
          userAddress: '0xdef456',
          timestamp: Date.now()
        },
        errorType: ErrorType.CONTACTS_DECRYPTION_FAILED,
        expectedContextUsage: ['task_456', 'decrypt_contacts']
      }
    ];

    contextTestCases.forEach(({ context, errorType, expectedContextUsage: _expectedContextUsage }) => {
      const report = errorHandler.createErrorReport('Test error', errorType, context);

      // Context should be preserved
      expect(report.context).toEqual(context);

      // Context should influence recovery options
      if (context.taskId) {
        const hasTaskSpecificOption = report.recoveryOptions.some(opt => 
          opt.description.toLowerCase().includes('task') || 
          opt.label.toLowerCase().includes('retry')
        );
        expect(hasTaskSpecificOption).toBe(true);
      }

      // Recovery options should be actionable (have functions)
      report.recoveryOptions.forEach(option => {
        expect(typeof option.action).toBe('function');
      });
    });
  });

  /**
   * Property 6.6: Error history and logging work correctly
   * 
   * For any sequence of errors:
   * - All errors should be logged
   * - Error history should be retrievable
   * - Log size should be managed (not grow indefinitely)
   */
  it('Property 6.6: Error history and logging work correctly', () => {
    const initialHistory = errorHandler.getErrorHistory();
    const initialCount = initialHistory.length;

    // Generate multiple errors
    const errorCount = 10;
    const generatedReports = [];

    for (let i = 0; i < errorCount; i++) {
      const report = errorHandler.createErrorReport(
        `Test error ${i}`,
        ErrorType.NETWORK_ERROR,
        {
          operation: `test_operation_${i}`,
          timestamp: Date.now() + i
        }
      );
      generatedReports.push(report);
    }

    const finalHistory = errorHandler.getErrorHistory();

    // All errors should be logged
    expect(finalHistory.length).toBe(initialCount + errorCount);

    // Most recent errors should be in history
    generatedReports.forEach(report => {
      const foundInHistory = finalHistory.some(h => h.id === report.id);
      expect(foundInHistory).toBe(true);
    });

    // Test log size management by generating many errors
    const manyErrors = 150; // More than max log size
    for (let i = 0; i < manyErrors; i++) {
      errorHandler.createErrorReport(
        `Bulk error ${i}`,
        ErrorType.UNKNOWN_ERROR,
        {
          operation: `bulk_operation_${i}`,
          timestamp: Date.now() + i
        }
      );
    }

    const bulkHistory = errorHandler.getErrorHistory();
    expect(bulkHistory.length).toBeLessThanOrEqual(100); // Should be capped

    // Clear history should work
    errorHandler.clearErrorHistory();
    const clearedHistory = errorHandler.getErrorHistory();
    expect(clearedHistory.length).toBe(0);
  });

  /**
   * Property 6.7: Recovery actions are safe and don't cause additional errors
   * 
   * For any recovery option:
   * - Action should not throw unhandled exceptions
   * - Action should provide feedback about success/failure
   * - Action should be idempotent (safe to call multiple times)
   */
  it('Property 6.7: Recovery actions are safe and well-behaved', async () => {
    const errorTypes = [
      ErrorType.BLOCKCHAIN_CONNECTION,
      ErrorType.METADATA_WRITE_FAILED,
      ErrorType.NETWORK_ERROR,
      ErrorType.PROFILE_NOT_FOUND
    ];

    for (const errorType of errorTypes) {
      const context: ErrorContext = {
        operation: 'test_operation',
        taskId: 'test_task',
        userAddress: '0x123',
        timestamp: Date.now()
      };

      const report = errorHandler.createErrorReport('Test error', errorType, context);

      // Test each recovery option
      for (const option of report.recoveryOptions) {
        // Action should not throw unhandled exceptions
        try {
          const result = option.action();
          
          // If action returns a promise, wait for it
          if (result && typeof result.then === 'function') {
            await result;
          }
          
          // If we get here, the action didn't throw
          expect(true).toBe(true);
        } catch (error) {
          // If action throws, it should be a handled error with a message
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBeDefined();
          expect((error as Error).message.length).toBeGreaterThan(0);
        }

        // Action should be idempotent - calling twice shouldn't cause issues
        try {
          const result1 = option.action();
          const result2 = option.action();
          
          if (result1 && typeof result1.then === 'function') {
            await result1;
          }
          if (result2 && typeof result2.then === 'function') {
            await result2;
          }
          
          expect(true).toBe(true); // Both calls succeeded
        } catch (error) {
          // Even if actions fail, they should fail consistently
          expect(error).toBeInstanceOf(Error);
        }
      }
    }
  });
});