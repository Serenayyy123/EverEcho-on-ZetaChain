/**
 * Beta Configuration for Stage 4.6
 * Frontend-only configuration for Beta user experience
 * 
 * 🎯 Purpose: Lower barriers for new users with smaller default values
 * ❌ Does not affect protocol logic or smart contracts
 * ✅ Only affects UI defaults, examples, and suggestions
 */

export interface BetaConfig {
  // Default reward value for new task creation
  defaultReward: number;
  
  // Quick-select reward suggestions for Beta users
  suggestedRewards: number[];
  
  // AI reward suggestion constraints [min, max]
  aiRewardRange: [number, number];
  
  // Maximum recommended reward for Beta users
  maxRecommendedReward: number;
  
  // Whether to show large examples (with proper labeling)
  showLargeExamples: boolean;
  
  // Enable Beta analytics collection
  enableAnalytics: boolean;
  
  // Beta mode labels and messaging
  labels: {
    betaRecommendation: string;
    largeExampleLabel: string;
    aiAdvancedWarning: string;
  };
}

// Beta configuration constants
export const BETA_CONFIG: BetaConfig = {
  defaultReward: 10,
  suggestedRewards: [5, 10, 20],
  aiRewardRange: [5, 20],
  maxRecommendedReward: 20,
  showLargeExamples: true,
  enableAnalytics: true,
  labels: {
    betaRecommendation: "Beta experience recommended values - freely editable",
    largeExampleLabel: "Mechanism Example (assuming reward = 100 ECHO)",
    aiAdvancedWarning: "This is advanced user amount, new users recommended 5-20 ECHO"
  }
};

// Environment-based Beta mode detection
export const isBetaMode = (): boolean => {
  // For Stage 4.6, Beta mode is always enabled
  // In future stages, this could be environment-variable controlled
  return true;
};

// Get appropriate default reward based on mode
export const getDefaultReward = (): number => {
  return isBetaMode() ? BETA_CONFIG.defaultReward : 100;
};

// Get reward suggestions based on mode
export const getRewardSuggestions = (): number[] => {
  return isBetaMode() ? BETA_CONFIG.suggestedRewards : [50, 100, 200];
};

// Validate if reward is within Beta-recommended range
export const isWithinBetaRange = (reward: number): boolean => {
  if (!isBetaMode()) return true;
  return reward >= BETA_CONFIG.aiRewardRange[0] && reward <= BETA_CONFIG.aiRewardRange[1];
};

// Get appropriate AI reward constraints
export const getAIRewardConstraints = (): [number, number] => {
  return isBetaMode() ? BETA_CONFIG.aiRewardRange : [10, 1000];
};

// Beta analytics event types
export type BetaAnalyticsEvent = 
  | 'reward_selected'
  | 'task_created' 
  | 'task_failed'
  | 'cycle_completed'
  | 'default_modified'
  | 'ai_suggestion_used';

export interface BetaAnalyticsData {
  sessionId: string;
  timestamp: number;
  event: BetaAnalyticsEvent;
  data: {
    rewardAmount?: number;
    wasDefault?: boolean;
    failureReason?: string;
    completionTime?: number;
    source?: 'default' | 'suggestion' | 'custom' | 'ai';
  };
}

// Simple analytics collection (privacy-compliant)
export const collectBetaAnalytics = (event: BetaAnalyticsEvent, data: Partial<BetaAnalyticsData['data']> = {}) => {
  if (!BETA_CONFIG.enableAnalytics || !isBetaMode()) return;
  
  const analyticsData: BetaAnalyticsData = {
    sessionId: getSessionId(),
    timestamp: Date.now(),
    event,
    data
  };
  
  // Store in localStorage for now (could be sent to analytics service later)
  const existingData = JSON.parse(localStorage.getItem('beta_analytics') || '[]');
  existingData.push(analyticsData);
  
  // Keep only last 100 events to prevent storage bloat
  if (existingData.length > 100) {
    existingData.splice(0, existingData.length - 100);
  }
  
  localStorage.setItem('beta_analytics', JSON.stringify(existingData));
};

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('beta_session_id');
  if (!sessionId) {
    sessionId = `beta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('beta_session_id', sessionId);
  }
  return sessionId;
};

// Helper function to get Beta-appropriate examples
export const getBetaExamples = () => {
  return {
    small: {
      reward: 10,
      totalCost: 20, // 10 + 10 postFee
      helperEarnings: 29.8 // 9.8 + 10 + 10
    },
    large: {
      reward: 100,
      totalCost: 110, // 100 + 10 postFee  
      helperEarnings: 208 // 98 + 100 + 10
    }
  };
};