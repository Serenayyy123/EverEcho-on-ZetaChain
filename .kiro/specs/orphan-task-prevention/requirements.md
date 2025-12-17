# Requirements Document

## Introduction

This specification addresses a critical issue in the current task creation system where orphan metadata can be created in the database when blockchain transactions fail. The current two-phase commit approach (backend first, then blockchain) creates inconsistencies where tasks appear in lists but fail to load in detail views, causing system crashes and poor user experience.

## Glossary

- **Task_System**: The EverEcho task management system including frontend, backend, and smart contracts
- **Orphan_Metadata**: Database records for tasks that don't exist on the blockchain
- **Chain_First_Creation**: Task creation flow that prioritizes blockchain transaction success before database writes
- **TaskEscrow_Contract**: The smart contract managing task lifecycle and payments
- **Task_Receipt**: Blockchain transaction receipt containing task creation events
- **Metadata_Endpoint**: Backend API endpoint for storing task metadata after blockchain confirmation

## Requirements

### Requirement 1

**User Story:** As a task creator, I want my task creation to be atomic and consistent, so that tasks only exist when both blockchain and database operations succeed.

#### Acceptance Criteria

1. WHEN a user initiates task creation, THE Task_System SHALL execute blockchain transaction before any database writes
2. WHEN blockchain transaction fails or is cancelled, THE Task_System SHALL prevent any database metadata creation
3. WHEN blockchain transaction succeeds, THE Task_System SHALL parse the actual taskId from transaction events
4. WHEN metadata writing fails after successful blockchain transaction, THE Task_System SHALL retry metadata creation with the parsed taskId
5. THE Task_System SHALL ensure no task appears in lists unless it exists on the blockchain

### Requirement 2

**User Story:** As a system administrator, I want to identify and clean up orphan metadata, so that data consistency is maintained across environments.

#### Acceptance Criteria

1. WHEN scanning the database, THE Task_System SHALL verify each task's existence on the blockchain
2. WHEN orphan metadata is detected, THE Task_System SHALL mark records as orphaned or remove them safely
3. THE Task_System SHALL provide audit reports showing orphan counts and cleanup actions
4. WHEN cleanup operations run, THE Task_System SHALL support dry-run mode for safe verification
5. THE Task_System SHALL log all cleanup operations for audit trails

### Requirement 3

**User Story:** As a user browsing tasks, I want consistent task visibility, so that I never encounter tasks in lists that fail to load in detail views.

#### Acceptance Criteria

1. WHEN displaying task lists, THE Task_System SHALL use blockchain as the primary data source
2. WHEN a task exists on blockchain but lacks metadata, THE Task_System SHALL display placeholder information
3. WHEN a task doesn't exist on blockchain, THE Task_System SHALL exclude it from all user-facing lists
4. WHEN accessing task details for non-existent blockchain tasks, THE Task_System SHALL display clear error messages
5. THE Task_System SHALL provide recovery options for users encountering orphaned tasks

### Requirement 4

**User Story:** As a developer, I want idempotent metadata operations, so that network issues and retries don't create duplicate or inconsistent data.

#### Acceptance Criteria

1. WHEN metadata endpoint receives duplicate requests for the same taskId, THE Task_System SHALL handle them idempotently
2. WHEN writing metadata, THE Task_System SHALL verify blockchain task existence before database operations
3. WHEN blockchain verification fails, THE Task_System SHALL return appropriate error codes indicating the cause
4. THE Task_System SHALL support metadata updates for existing valid tasks
5. WHEN processing metadata requests, THE Task_System SHALL validate the requesting user matches the blockchain task creator

### Requirement 5

**User Story:** As a system operator, I want robust error handling and recovery, so that partial failures don't leave the system in inconsistent states.

#### Acceptance Criteria

1. WHEN blockchain transactions fail, THE Task_System SHALL provide clear error messages to users
2. WHEN metadata operations fail after successful blockchain transactions, THE Task_System SHALL queue retry operations
3. WHEN network issues occur during task creation, THE Task_System SHALL guide users through recovery steps
4. THE Task_System SHALL maintain transaction logs for debugging failed operations
5. WHEN system recovery is needed, THE Task_System SHALL provide tools to reconcile blockchain and database states

### Requirement 6

**User Story:** As a quality assurance engineer, I want comprehensive testing scenarios, so that the fix prevents orphan metadata creation under all failure conditions.

#### Acceptance Criteria

1. WHEN simulating blockchain transaction failures, THE Task_System SHALL demonstrate no orphan metadata creation
2. WHEN testing network interruptions during metadata writing, THE Task_System SHALL show proper retry behavior
3. WHEN validating user cancellation scenarios, THE Task_System SHALL confirm no database pollution occurs
4. THE Task_System SHALL provide test scripts demonstrating successful task creation end-to-end
5. WHEN running integration tests, THE Task_System SHALL verify consistency between blockchain and database states