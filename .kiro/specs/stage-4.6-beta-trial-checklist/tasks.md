# Stage 4.6 Beta Trial Checklist - Implementation Plan

## 🧩 4.6-A: Beta Reward UX 调整（Frontend Only）

- [x] 1. Implement Beta configuration system


  - Create Beta configuration interface and constants
  - Set up environment-based Beta mode detection
  - Define default reward values (5, 10, 20 ECHO)
  - _Requirements: 1.1, 1.2_


- [ ] 1.1 Create BetaRewardSelector component
  - Build quick-select buttons for 5, 10, 20 ECHO
  - Implement clear Beta labeling ("Beta experience recommended values")
  - Ensure reward input remains fully editable
  - _Requirements: 1.2, 1.3, 1.4_

- [ ]* 1.2 Write property test for default reward behavior
  - **Property 1: Default Value Consistency**
  - **Validates: Requirements 1.1**


- [ ] 1.3 Update PublishTask page with Beta defaults
  - Set default reward to 10 ECHO in Beta mode
  - Integrate BetaRewardSelector component
  - Remove any hardcoded 100 ECHO defaults
  - Add Beta mode indicators and labels
  - _Requirements: 1.1, 1.3_

- [ ]* 1.4 Write property test for cost calculation accuracy
  - **Property 3: Cost Calculation Accuracy**

  - **Validates: Requirements 1.5**

- [ ] 1.5 Verify balance sufficiency for Beta users
  - Ensure 100 ECHO starting balance covers Beta task creation
  - Test complete task cycle with 10 ECHO reward (20 ECHO total cost)
  - Validate no "insufficient balance" errors for Beta defaults
  - _Requirements: 3.1_

- [ ]* 1.6 Write property test for Beta balance sufficiency
  - **Property 5: Beta Balance Sufficiency**


  - **Validates: Requirements 3.1**

## 🧩 4.6-B: 208 ECHO 示例语义重构（解释层）

- [ ] 2. Update FeeExplanationModal with dual examples
  - Add Beta-friendly example (10 ECHO → 29.8 ECHO)


  - Label 208 ECHO as "Mechanism Example (assuming reward = 100 ECHO)"
  - Create toggle between large and small examples
  - Ensure both examples use correct 2R math
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 2.1 Update HelperEarningsBreakdown component
  - Add small value calculation display (10 → 29.8)
  - Maintain large example with proper labeling
  - Implement dynamic calculation for any reward amount


  - Clear distinction between examples and actual calculations
  - _Requirements: 2.2, 2.3_

- [ ]* 2.2 Write property test for large number contextualization
  - **Property 4: Large Number Contextualization**
  - **Validates: Requirements 2.5**

- [ ] 2.3 Update all components displaying large ECHO amounts
  - Add contextual labels to 208 ECHO displays
  - Implement consistent example labeling across UI
  - Ensure educational context is clear
  - _Requirements: 2.5_

- [ ]* 2.4 Write property test for small value calculation accuracy
  - **Property 6: Small Value Calculation Accuracy**
  - **Validates: Requirements 3.4**

## 🧩 4.6-C: 新用户 Beta 完整流程验证（Real User Flow）

- [ ] 3. Implement end-to-end Beta user flow testing
  - Create test scenario: 100 ECHO → create 10 ECHO task → complete cycle
  - Verify accurate cost display (20 ECHO total)
  - Validate helper earnings calculation (29.8 ECHO)
  - Test fund flow consistency throughout cycle
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 3.1 Write property test for 2R mechanism demonstration
  - **Property 7: 2R Mechanism Demonstration**
  - **Validates: Requirements 3.5**

- [ ] 3.2 Create Beta user onboarding flow
  - Design clear explanation of Beta amounts
  - Show cost breakdown for Beta defaults
  - Demonstrate helper earnings with small numbers


  - _Requirements: 3.4, 3.5_

- [ ] 3.3 Validate mathematical consistency across all displays
  - Ensure all components show same calculations for same inputs
  - Test edge cases with Beta-range values (5-20 ECHO)
  - Verify 2R settlement math accuracy with small numbers
  - _Requirements: 3.4, 3.5_

## 🧩 4.6-D: AI 输出数值约束（非协议）


- [ ] 4. Implement AI reward range constraints
  - Update AI service to limit suggestions to 5-20 ECHO in Beta mode
  - Add validation for AI-generated reward amounts
  - Implement fallback to 10 ECHO if AI fails or exceeds range
  - _Requirements: 4.1, 4.4_

- [ ]* 4.1 Write property test for AI reward range constraint
  - **Property 8: AI Reward Range Constraint**

  - **Validates: Requirements 4.1**

- [ ] 4.2 Add AI suggestion warning system
  - Display warning for suggestions >20 ECHO: "This is advanced user amount, new users recommended 5-20 ECHO"
  - Implement clear "suggestion" labeling for all AI outputs
  - Ensure user agency is preserved in all AI interactions
  - _Requirements: 4.2, 4.3, 4.5_

- [ ]* 4.3 Write property test for AI suggestion labeling
  - **Property 9: AI Suggestion Labeling**


  - **Validates: Requirements 4.3**

- [ ] 4.3 Update AI components with Beta constraints
  - Modify AIRewardSuggestion to use Beta ranges
  - Update AITaskDraftGenerator to use appropriate defaults
  - Ensure all AI components respect Beta mode settings
  - _Requirements: 4.1, 4.4_

- [ ]* 4.4 Write property test for user agency preservation
  - **Property 10: User Agency Preservation**

  - **Validates: Requirements 4.5**

## 🧩 4.6-E: Beta 数据观察点（非链上）

- [ ] 5. Implement Beta analytics system
  - Create anonymized analytics data collection
  - Track reward distribution patterns and user modifications
  - Log task creation success/failure rates
  - Record completion times and user behavior
  - _Requirements: 5.1, 5.2, 5.4_


- [ ]* 5.1 Write property test for analytics data collection
  - **Property 11: Analytics Data Collection**
  - **Validates: Requirements 5.1**

- [ ] 5.1 Set up failure reason logging
  - Implement comprehensive error tracking


  - Special focus on "insufficient balance" scenarios
  - Create structured logging for analysis
  - Ensure privacy compliance in all data collection
  - _Requirements: 5.3, 5.5_

- [x]* 5.2 Write property test for failure reason logging

  - **Property 12: Failure Reason Logging**
  - **Validates: Requirements 5.3**

- [ ] 5.2 Create Beta analytics dashboard (optional)
  - Build simple dashboard for viewing Beta usage patterns
  - Display reward distribution and modification rates

  - Show success/failure metrics
  - Provide insights for Stage 5 optimization
  - _Requirements: 5.1, 5.2, 5.4_

## 📊 Final Validation and Testing



- [ ] 6. Comprehensive Beta mode testing
  - Execute complete new user flow with 100 ECHO starting balance
  - Verify all default values are Beta-appropriate (≤20 ECHO)
  - Test all calculation displays for accuracy and consistency
  - Validate AI constraints and warning systems
  - _Requirements: All_

- [ ] 6.1 CODE FREEZE compliance verification
  - Confirm no .sol files modified (hash verification)
  - Verify ABI files unchanged
  - Ensure no new chain interactions introduced
  - Validate all changes are frontend/backend only
  - _Technical Requirements_

- [ ] 6.2 User experience validation
  - Test "no balance anxiety" user experience
  - Verify clear understanding of helper earnings (29.8 vs 208)
  - Confirm Beta experience is clearly communicated
  - Validate smooth task creation and completion flow
  - _UX Requirements_

- [ ] 7. Checkpoint - Ensure all tests pass and Beta experience is ready
  - Ensure all tests pass, ask the user if questions arise.

## Implementation Notes

### Beta Configuration
```typescript
const BETA_CONFIG = {
  defaultReward: 10,
  suggestedRewards: [5, 10, 20],
  aiRewardRange: [5, 20],
  maxRecommendedReward: 20,
  showLargeExamples: true, // with proper labeling
  enableAnalytics: true
};
```

### Key Principles
- **Frontend Only**: All changes are UI/UX layer modifications
- **Protocol Preservation**: 2R settlement logic remains unchanged
- **User Agency**: All defaults can be overridden by users
- **Educational Focus**: Large examples are teaching tools, not recommendations
- **Privacy First**: Analytics collect behavior patterns, not personal data

### Success Metrics
- New users can complete full task cycle with 100 ECHO starting balance
- Default reward ≤ 20 ECHO in all contexts
- 208 ECHO clearly labeled as educational example
- AI suggestions constrained to Beta-appropriate ranges
- No "insufficient balance" errors for Beta defaults
- Clear user understanding of helper earnings logic