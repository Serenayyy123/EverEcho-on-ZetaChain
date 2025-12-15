/**
 * AI Reward Suggestion Component
 * Stage 4.3-C: AI Reward Suggestion
 * Stage 4.6: Beta Trial - AI Reward Constraints
 * 
 * 🔒 CODE FREEZE: This component is completely off-chain
 * ❌ Does NOT access contracts, private keys, or trigger transactions
 * ✅ Only provides AI suggestions for reward amounts
 * 🧪 Beta: Shows warnings for out-of-range suggestions
 */

import { useState, useEffect } from 'react';
import { useAIService, AIRewardSuggestion } from '../../hooks/useAIService';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

interface AIRewardSuggestionProps {
  description: string;
  currentReward: string;
  onRewardSuggested: (reward: string) => void;
  disabled?: boolean;
}

export function AIRewardSuggestionComponent({ 
  description, 
  currentReward, 
  onRewardSuggested, 
  disabled 
}: AIRewardSuggestionProps) {
  const { suggestReward, loading, error } = useAIService();
  const [suggestion, setSuggestion] = useState<AIRewardSuggestion | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Auto-suggest when description changes (debounced)
  useEffect(() => {
    if (!description.trim() || description.length < 20) {
      setSuggestion(null);
      setShowSuggestion(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSuggest();
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timer);
  }, [description]);

  const handleSuggest = async () => {
    if (!description.trim()) return;

    const result = await suggestReward(description);
    if (result) {
      setSuggestion(result);
      setShowSuggestion(true);
    }
  };

  const handleUseSuggestion = () => {
    if (suggestion) {
      onRewardSuggested(suggestion.rewardEcho.toString());
      setShowSuggestion(false);
    }
  };

  const handleDismiss = () => {
    setShowSuggestion(false);
  };

  // Don't show if no description or suggestion
  if (!description.trim() || !suggestion || !showSuggestion) {
    return null;
  }

  // Don't show if current reward matches suggestion (within 10%)
  const currentRewardNum = parseFloat(currentReward) || 0;
  const suggestionNum = suggestion.rewardEcho;
  const difference = Math.abs(currentRewardNum - suggestionNum) / Math.max(suggestionNum, 1);
  if (difference < 0.1) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <span style={styles.icon}>🤖</span>
          <span style={styles.title}>AI Reward Suggestion</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          disabled={loading || disabled}
          theme="light"
        >
          ✕
        </Button>
      </div>

      <div style={styles.content}>
        <div style={styles.suggestionBox}>
          <div style={styles.rewardAmount}>
            <span style={styles.rewardValue}>{suggestion.rewardEcho} ECHO</span>
            <span style={styles.difficulty}>({suggestion.difficulty} task)</span>
          </div>
          
          <div style={styles.breakdown}>
            <div style={styles.breakdownItem}>
              <span style={styles.breakdownLabel}>Reward:</span>
              <span style={styles.breakdownValue}>{suggestion.rewardEcho} ECHO</span>
            </div>
            <div style={styles.breakdownItem}>
              <span style={styles.breakdownLabel}>Post Fee:</span>
              <span style={styles.breakdownValue}>{suggestion.postFeeEcho} ECHO</span>
            </div>
            <div style={styles.breakdownItem}>
              <span style={styles.breakdownLabel}>Total Cost:</span>
              <span style={styles.breakdownValueTotal}>{suggestion.totalCostEcho} ECHO</span>
            </div>
          </div>

          <p style={styles.reason}>
            {suggestion.reason}
          </p>

          {/* Stage 4.6: Beta warning for out-of-range suggestions */}
          {suggestion.betaWarning && (
            <div style={styles.betaWarning}>
              <span style={styles.warningIcon}>⚠️</span>
              <span style={styles.warningText}>{suggestion.betaWarning}</span>
            </div>
          )}
        </div>

        <div style={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUseSuggestion}
            disabled={loading || disabled}
            theme="light"
          >
            Use This Amount
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSuggest}
            loading={loading}
            disabled={loading || disabled}
            theme="light"
          >
            Refresh
          </Button>
        </div>

        <div style={styles.disclaimer}>
          <p style={styles.disclaimerText}>
            ⚠️ {suggestion.disclaimer}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '10px',
    marginTop: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    fontSize: '16px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  suggestionBox: {
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
  },
  rewardAmount: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  rewardValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#10B981',
  },
  difficulty: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6B7280',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  breakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  breakdownValueTotal: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#10B981',
  },
  reason: {
    fontSize: '12px',
    color: '#4B5563',
    margin: 0,
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  disclaimer: {
    padding: '8px 12px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '6px',
  },
  disclaimerText: {
    fontSize: '11px',
    color: '#92400E',
    margin: 0,
    fontWeight: 500,
  },
  // Stage 4.6: Beta warning styles
  betaWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 10px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '6px',
    marginTop: '8px',
  },
  warningIcon: {
    fontSize: '12px',
  },
  warningText: {
    fontSize: '11px',
    color: '#92400E',
    fontWeight: 500,
    lineHeight: '1.4',
  },
};