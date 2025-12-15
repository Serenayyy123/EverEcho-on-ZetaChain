# Stage 4.6 Beta Trial Checklist - Requirements Document

## Introduction

Stage 4.6 focuses on preparing EverEcho for real new user Beta trials by addressing psychological barriers around large ECHO values while maintaining all existing protocol logic and CODE FREEZE constraints.

## Glossary

- **Beta Mode**: Frontend-only configuration for new user onboarding with smaller default values
- **Default Reward**: Pre-filled reward amount in task creation form (frontend only)
- **Mechanism Example**: Educational display showing how the 2R settlement works
- **Teaching Values**: Small ECHO amounts (5-20) used for demonstration purposes
- **CODE FREEZE**: Absolute prohibition on modifying any .sol contract files

## Requirements

### Requirement 1

**User Story:** As a new user with limited ECHO tokens, I want to create my first task without feeling overwhelmed by large numbers, so that I can learn the platform gradually.

#### Acceptance Criteria

1. WHEN a user visits the task creation page THEN the system SHALL pre-fill reward with 10 ECHO as default
2. WHEN displaying reward options THEN the system SHALL show 5, 10, and 20 ECHO as suggested Beta values
3. WHEN a user sees the default values THEN the system SHALL clearly label them as "Beta experience recommended values"
4. WHERE users want different amounts THEN the system SHALL allow free editing of all reward fields
5. WHEN calculating total cost THEN the system SHALL show accurate math for any user-entered amount

### Requirement 2

**User Story:** As a new user learning the platform, I want to understand the 2R settlement mechanism without being intimidated by large example numbers, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN displaying the 208 ECHO example THEN the system SHALL label it as "Mechanism Example (assuming reward = 100 ECHO)"
2. WHEN showing helper earnings breakdown THEN the system SHALL display both large example (208) and small Beta example (29.8 for 10 ECHO reward)
3. WHEN users see earnings calculations THEN the system SHALL clearly distinguish between examples and actual calculations
4. WHERE fee explanation modals appear THEN the system SHALL include Beta-friendly examples alongside mechanism explanations
5. WHEN displaying any large numbers THEN the system SHALL provide context that these are educational examples

### Requirement 3

**User Story:** As a Beta user, I want to complete a full task lifecycle with small amounts, so that I can understand the platform without significant financial commitment.

#### Acceptance Criteria

1. WHEN a new user receives 100 ECHO THEN the system SHALL enable completion of at least one full task cycle
2. WHEN creating a task with 10 ECHO reward THEN the system SHALL show total cost as 20 ECHO (10 reward + 10 postFee)
3. WHEN a helper completes a 10 ECHO task THEN the system SHALL show helper receives 29.8 ECHO (9.8 + 10 + 10)
4. WHEN displaying fund flows THEN the system SHALL show accurate small-number examples
5. WHEN users complete the cycle THEN the system SHALL demonstrate the 2R mechanism with actual small values

### Requirement 4

**User Story:** As a user interacting with AI suggestions, I want reward recommendations appropriate for Beta testing, so that I'm not encouraged to use amounts beyond my comfort level.

#### Acceptance Criteria

1. WHEN AI suggests reward amounts THEN the system SHALL constrain suggestions to 5-20 ECHO range in Beta mode
2. WHEN AI outputs exceed 20 ECHO THEN the system SHALL display warning "This is advanced user amount, new users recommended 5-20 ECHO"
3. WHEN displaying AI suggestions THEN the system SHALL clearly mark all outputs as "suggestions" not requirements
4. WHERE AI generates task drafts THEN the system SHALL use Beta-appropriate reward ranges
5. WHEN users see AI recommendations THEN the system SHALL maintain user agency over final decisions

### Requirement 5

**User Story:** As a product team, I want to collect Beta usage data to inform future improvements, so that we can optimize the user experience based on real behavior.

#### Acceptance Criteria

1. WHEN users interact with reward settings THEN the system SHALL record reward distribution patterns (anonymized)
2. WHEN users modify default rewards THEN the system SHALL track modification frequency and amounts
3. WHEN task creation fails THEN the system SHALL log failure reasons (especially "insufficient balance")
4. WHEN users complete task cycles THEN the system SHALL measure success rates and completion times
5. WHERE data collection occurs THEN the system SHALL respect privacy and avoid storing personal information
