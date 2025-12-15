# Stage 4.6 Beta Trial Checklist - Design Document

## Overview

Stage 4.6 implements frontend-only UX improvements to make EverEcho more accessible to new Beta users by using smaller, less intimidating default values while maintaining all existing protocol logic. This stage focuses on psychological barriers to adoption without modifying any smart contracts or core business logic.

## Architecture

### Frontend-Only Modifications
The design maintains strict separation between display logic and protocol logic:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Layer      │    │  Business Logic  │    │  Protocol Layer │
│  (Modified)     │    │  (Unchanged)     │    │  (FROZEN)       │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Default vals  │    │ • Calculations   │    │ • TaskEscrow    │
│ • Examples      │───▶│ • Validations    │───▶│ • 2R Settlement │
│ • Labels        │    │ • API calls      │    │ • PostFee Logic │
│ • AI constraints│    │ • State mgmt     │    │ • Gateway       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Beta Mode Configuration
A configuration layer enables Beta-specific behavior:

```typescript
interface BetaConfig {
  defaultReward: number;           // 10 ECHO
  suggestedRewards: number[];      // [5, 10, 20]
  aiRewardRange: [number, number]; // [5, 20]
  showLargeExamples: boolean;      // true (with labels)
  enableAnalytics: boolean;        // true
}
```

## Components and Interfaces

### Modified Components

#### 1. PublishTask Page
- **Default Reward Input**: Pre-filled with 10 ECHO
- **Reward Suggestions**: Quick-select buttons for 5, 10, 20 ECHO
- **Beta Labels**: Clear indication of Beta-recommended values
- **Cost Calculator**: Real-time calculation for any amount

#### 2. FeeExplanationModal
- **Dual Examples**: Both 100→208 (mechanism) and 10→29.8 (Beta)
- **Example Labels**: Clear distinction between educational and actual
- **Context Switching**: Toggle between large and small examples

#### 3. HelperEarningsBreakdown
- **Small Value Examples**: Prominent display of Beta-friendly calculations
- **Mechanism Explanation**: Maintains 208 ECHO example with proper labeling
- **Dynamic Calculation**: Shows actual earnings for any reward amount

#### 4. AI Components
- **Reward Constraints**: AI suggestions limited to 5-20 ECHO range
- **Warning System**: Alerts for suggestions above Beta range
- **Suggestion Labeling**: Clear marking of all AI outputs as suggestions

### New Components

#### BetaRewardSelector
```typescript
interface BetaRewardSelectorProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: number[];
  maxRecommended: number;
}
```

#### ExampleToggle
```typescript
interface ExampleToggleProps {
  showLarge: boolean;
  onToggle: (showLarge: boolean) => void;
  largeExample: number;
  smallExample: number;
}
```

## Data Models

### Beta Analytics Data
```typescript
interface BetaAnalytics {
  sessionId: string;
  timestamp: number;
  event: 'reward_selected' | 'task_created' | 'task_failed' | 'cycle_completed';
  data: {
    rewardAmount?: number;
    wasDefault?: boolean;
    failureReason?: string;
    completionTime?: number;
  };
}
```

### UI State Extensions
```typescript
interface TaskCreationState {
  // Existing fields...
  betaMode: boolean;
  selectedRewardSource: 'default' | 'suggestion' | 'custom' | 'ai';
  showBetaExamples: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Default Value Consistency
*For any* task creation page load in Beta mode, the reward input field should contain "10" as the default value
**Validates: Requirements 1.1**

### Property 2: Reward Field Editability
*For any* reward input field, users should be able to enter and modify any valid numeric value regardless of defaults or suggestions
**Validates: Requirements 1.4**

### Property 3: Cost Calculation Accuracy
*For any* user-entered reward amount R, the displayed total cost should equal R + 10 (reward + postFee)
**Validates: Requirements 1.5**

### Property 4: Large Number Contextualization
*For any* display of numbers ≥100 ECHO, the system should provide contextual labeling indicating these are educational examples
**Validates: Requirements 2.5**

### Property 5: Beta Balance Sufficiency
*For any* new user starting with 100 ECHO, the system should enable creation of at least one complete task using Beta default values (10 ECHO reward = 20 ECHO total cost)
**Validates: Requirements 3.1**

### Property 6: Small Value Calculation Accuracy
*For any* Beta-range reward amount (5-20 ECHO), all displayed calculations should show mathematically correct results using the 2R settlement formula
**Validates: Requirements 3.4**

### Property 7: 2R Mechanism Demonstration
*For any* completed task cycle using small values, the system should correctly demonstrate the 2R settlement (helper receives 0.98R + R + 10)
**Validates: Requirements 3.5**

### Property 8: AI Reward Range Constraint
*For any* AI-generated reward suggestion in Beta mode, the suggested amount should be within the range [5, 20] ECHO
**Validates: Requirements 4.1**

### Property 9: AI Suggestion Labeling
*For any* AI-generated content display, the system should clearly mark outputs as "suggestions" rather than requirements or commands
**Validates: Requirements 4.3**

### Property 10: User Agency Preservation
*For any* AI suggestion interface, users should retain full control over final decisions without forced acceptance of AI recommendations
**Validates: Requirements 4.5**

### Property 11: Analytics Data Collection
*For any* user interaction with reward settings, the system should record anonymized usage patterns without storing personal information
**Validates: Requirements 5.1**

### Property 12: Failure Reason Logging
*For any* task creation failure, the system should log the failure reason (especially "insufficient balance") for analysis
**Validates: Requirements 5.3**

## Error Handling

### Insufficient Balance Scenarios
- **Detection**: Check user balance before task creation
- **Prevention**: Default values ensure 100 ECHO users can create tasks
- **Recovery**: Clear messaging about minimum requirements
- **Logging**: Track insufficient balance failures for analysis

### AI Suggestion Errors
- **Range Validation**: Constrain AI outputs to Beta-appropriate ranges
- **Fallback Values**: Use default 10 ECHO if AI fails
- **User Override**: Always allow manual input regardless of AI state
- **Warning Display**: Show alerts for out-of-range suggestions

### Calculation Display Errors
- **Input Validation**: Ensure numeric inputs for calculations
- **Precision Handling**: Handle decimal calculations correctly
- **Overflow Protection**: Prevent display of unrealistic large numbers
- **Consistency Checks**: Verify calculation accuracy across components

## Testing Strategy

### Unit Testing Approach
- **Component Testing**: Verify default values, suggestion displays, calculation accuracy
- **Integration Testing**: Test AI constraint system, analytics collection, user flows
- **Error Scenario Testing**: Insufficient balance, invalid inputs, AI failures

### Property-Based Testing Requirements
- Use React Testing Library and Jest for frontend property testing
- Configure each property-based test to run minimum 100 iterations
- Tag each test with format: **Feature: stage-4.6-beta-trial-checklist, Property {number}: {property_text}**
- Each correctness property must be implemented by a single property-based test

### User Acceptance Testing
- **New User Flow**: Complete task creation → acceptance → completion cycle with 100 ECHO starting balance
- **Value Modification**: Test editing default rewards and seeing accurate calculations
- **AI Interaction**: Verify AI suggestions stay within Beta ranges and maintain user control
- **Cross-Component Consistency**: Ensure examples and calculations match across all UI components

### Analytics Validation
- **Data Collection**: Verify anonymized analytics capture user interactions correctly
- **Privacy Compliance**: Ensure no personal information is stored
- **Failure Tracking**: Confirm error logging captures relevant failure scenarios

## Implementation Notes

### CODE FREEZE Compliance
- **No Contract Changes**: All modifications are frontend/backend only
- **Protocol Preservation**: 2R settlement logic remains unchanged
- **ABI Compatibility**: No changes to smart contract interfaces
- **Fund Flow Integrity**: All calculations use existing protocol math

### Beta Configuration Management
- **Environment Variables**: Configure Beta mode through environment settings
- **Feature Flags**: Enable/disable Beta features without code changes
- **A/B Testing Ready**: Support for testing different default values
- **Analytics Integration**: Built-in tracking for optimization decisions

### Performance Considerations
- **Calculation Caching**: Cache complex calculations for repeated displays
- **Component Optimization**: Use React.memo for calculation-heavy components
- **Analytics Batching**: Batch analytics events to reduce network overhead
- **Lazy Loading**: Load analytics and advanced features only when needed

### Accessibility Requirements
- **Screen Reader Support**: Proper labeling for all Beta-specific UI elements
- **Keyboard Navigation**: Full keyboard access to reward selection and modification
- **Color Contrast**: Ensure Beta labels and warnings meet accessibility standards
- **Focus Management**: Proper focus handling in modal dialogs and suggestion interfaces