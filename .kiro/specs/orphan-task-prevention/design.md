# Design Document

## Overview

The orphan task metadata prevention system addresses a critical consistency issue in the current task creation flow. The existing two-phase commit approach (backend first, then blockchain) creates a race condition where database records can exist without corresponding blockchain entries, leading to system crashes and poor user experience.

This design implements a chain-first approach where blockchain transactions must succeed before any database operations occur, ensuring atomic consistency between on-chain and off-chain data.

## Architecture

### Current Flow (Problematic)
```
1. Frontend → Backend API (creates metadata with predicted taskId)
2. Frontend → Blockchain (createTask transaction)
3. If step 2 fails → Orphan metadata remains in database
```

### New Flow (Chain-First)
```
1. Frontend → Blockchain (createTask transaction)
2. Frontend → Parse taskId from transaction receipt
3. Frontend → Backend API (write metadata with verified taskId)
4. Backend → Verify task exists on blockchain before database write
```

### Key Architectural Changes

1. **Chain-First Creation**: Blockchain transaction must succeed before any database operations
2. **Event-Based TaskId Resolution**: Parse actual taskId from TaskCreated events instead of predicting
3. **Blockchain Verification**: Backend validates task existence on-chain before metadata writes
4. **Idempotent Metadata Operations**: Support retry scenarios without data corruption
5. **Consistency Enforcement**: Task lists use blockchain as primary data source

## Components and Interfaces

### Frontend Components

#### TaskId Parser
```typescript
interface TaskIdParser {
  parseTaskIdFromReceipt(receipt: TransactionReceipt, contract: Contract): string;
}
```

Responsibilities:
- Parse TaskCreated events from transaction receipts
- Extract actual taskId from blockchain events
- Handle parsing failures with clear error messages

#### Chain-First Task Creator
```typescript
interface ChainFirstTaskCreator {
  createTask(params: CreateTaskParams): Promise<string | null>;
}
```

Responsibilities:
- Execute blockchain transaction first
- Wait for transaction confirmation
- Parse taskId from receipt
- Call metadata endpoint with verified taskId
- Handle all failure scenarios gracefully

### Backend Components

#### Blockchain Task Validator
```typescript
interface BlockchainTaskValidator {
  validateTaskExists(taskId: string): Promise<TaskValidationResult>;
  getTaskCreator(taskId: string): Promise<string>;
}
```

Responsibilities:
- Query blockchain to verify task existence
- Validate task creator matches request sender
- Return structured validation results

#### Metadata Endpoint (New)
```typescript
interface MetadataEndpoint {
  writeMetadata(taskId: string, metadata: TaskMetadata, creator: string): Promise<void>;
  updateMetadata(taskId: string, metadata: TaskMetadata, creator: string): Promise<void>;
}
```

Responsibilities:
- Accept metadata writes only after blockchain verification
- Implement idempotent operations
- Validate creator authorization
- Return appropriate error codes

#### Orphan Detection Service
```typescript
interface OrphanDetectionService {
  scanForOrphans(options: ScanOptions): Promise<OrphanReport>;
  cleanupOrphans(orphanIds: string[], dryRun: boolean): Promise<CleanupReport>;
}
```

Responsibilities:
- Scan database for tasks without blockchain counterparts
- Generate audit reports
- Perform safe cleanup operations
- Support dry-run mode

### Task List Service (Modified)
```typescript
interface TaskListService {
  getTaskList(filters: TaskFilters): Promise<TaskListItem[]>;
  getTaskDetail(taskId: string): Promise<TaskDetail>;
}
```

Responsibilities:
- Use blockchain as primary data source
- Fetch metadata from database as secondary
- Display placeholders for missing metadata
- Handle non-existent tasks gracefully

## Data Models

### Task Creation Request
```typescript
interface CreateTaskParams {
  title: string;
  description: string;
  contactsPlaintext: string;
  reward: string;
  category?: string;
  rewardAsset?: string;
  rewardAmount?: string;
}
```

### Task Metadata
```typescript
interface TaskMetadata {
  title: string;
  description: string;
  contactsEncryptedPayload: string;
  category?: string;
  createdAt: number;
}
```

### Blockchain Task Validation Result
```typescript
interface TaskValidationResult {
  exists: boolean;
  creator: string;
  status: TaskStatus;
  reward: string;
  taskURI: string;
  error?: string;
}
```

### Orphan Report
```typescript
interface OrphanReport {
  totalScanned: number;
  orphanCount: number;
  orphanTaskIds: string[];
  scanTimestamp: number;
}
```

### Cleanup Report
```typescript
interface CleanupReport {
  processedCount: number;
  successCount: number;
  failureCount: number;
  dryRun: boolean;
  operations: CleanupOperation[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework, several can be consolidated:
- Properties 1.1, 1.2, and 1.5 all relate to chain-first ordering and can be combined
- Properties 2.1, 2.2, and 2.3 all relate to orphan detection and can be combined  
- Properties 3.1, 3.2, and 3.3 all relate to blockchain-first data sourcing and can be combined
- Properties 4.1, 4.2, and 4.5 all relate to metadata endpoint validation and can be combined

### Core Properties

**Property 1: Chain-first task creation consistency**
*For any* task creation attempt, if the blockchain transaction fails or is cancelled, then no database metadata should be created, and if the blockchain transaction succeeds, then metadata should only be written after parsing the actual taskId from transaction events.
**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

**Property 2: Orphan detection and cleanup completeness**
*For any* database scan operation, all tasks without corresponding blockchain entries should be identified as orphans, marked appropriately, and included in audit reports with accurate counts.
**Validates: Requirements 2.1, 2.2, 2.3**

**Property 3: Blockchain-first data consistency**
*For any* task list display or detail access, the system should use blockchain as the primary data source, exclude non-existent blockchain tasks from lists, and display placeholders for missing metadata.
**Validates: Requirements 3.1, 3.2, 3.3**

**Property 4: Metadata endpoint idempotency and validation**
*For any* metadata write request, the system should verify blockchain task existence and creator authorization before database operations, handle duplicate requests idempotently, and return appropriate error codes for validation failures.
**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

**Property 5: Retry and recovery robustness**
*For any* metadata operation failure after successful blockchain transaction, the system should queue retry operations, maintain transaction logs, and provide recovery guidance for network issues.
**Validates: Requirements 5.2, 5.3, 5.4**

**Property 6: Error handling clarity**
*For any* system failure (blockchain transaction, metadata operation, or task access), the system should provide clear error messages, recovery options, and appropriate HTTP status codes.
**Validates: Requirements 3.4, 3.5, 5.1**

## Error Handling

### Blockchain Transaction Failures
- **User Cancellation**: Clear message, no database pollution
- **Insufficient Balance**: Specific balance error with required amounts
- **Network Issues**: Retry guidance and transaction status checking
- **Contract Revert**: Parse revert reason and display user-friendly message

### Metadata Operation Failures
- **Network Timeout**: Automatic retry with exponential backoff
- **Database Connection**: Queue operation for later retry
- **Validation Failure**: Clear error message with specific validation issues
- **Authorization Failure**: HTTP 403 with creator mismatch explanation

### Task Access Failures
- **Non-existent Task**: HTTP 404 with recovery options
- **Orphaned Task**: Clear explanation with cleanup guidance
- **Network Issues**: Fallback to cached data where appropriate

### Recovery Mechanisms
- **Retry Queue**: Failed metadata operations queued for automatic retry
- **Manual Recovery**: Admin tools for reconciling inconsistent states
- **User Guidance**: Step-by-step recovery instructions for common issues

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests** verify specific examples, edge cases, and error conditions:
- Specific blockchain transaction failure scenarios
- Metadata endpoint authorization checks
- TaskId parsing with known transaction receipts
- Orphan cleanup operations with known datasets

**Property-Based Tests** verify universal properties across all inputs:
- Chain-first consistency across random task creation attempts
- Orphan detection accuracy across random database states
- Metadata endpoint idempotency across random request patterns
- Error handling consistency across random failure scenarios

**Property-Based Testing Framework**: fast-check (JavaScript/TypeScript)
- Minimum 100 iterations per property test
- Custom generators for blockchain states, task data, and failure scenarios
- Shrinking support to find minimal failing examples

**Integration Testing**:
- End-to-end task creation flows
- Blockchain and database consistency verification
- Cross-component error propagation
- Recovery scenario validation

**Test Environment Requirements**:
- Local blockchain node for deterministic testing
- Database isolation for parallel test execution
- Network simulation for failure scenario testing
- Transaction receipt mocking for parsing tests