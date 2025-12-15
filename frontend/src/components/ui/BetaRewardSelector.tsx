/**
 * Beta Reward Selector Component
 * Stage 4.6: Beta Trial Checklist - Frontend UX Improvements
 * 
 * 🎯 Purpose: Provide Beta-friendly reward selection with clear labeling
 * ✅ Quick-select buttons for 5, 10, 20 ECHO
 * ✅ Clear Beta labeling and user agency preservation
 * ❌ Does not affect protocol logic or calculations
 */

import { useState } from 'react';
import { BETA_CONFIG, collectBetaAnalytics, isBetaMode } from '../../config/betaConfig';

interface BetaRewardSelectorProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: number[];
  disabled?: boolean;
  onSourceChange?: (source: 'default' | 'suggestion' | 'custom') => void;
}

export function BetaRewardSelector({ 
  value, 
  onChange, 
  suggestions = BETA_CONFIG.suggestedRewards,
  disabled = false,
  onSourceChange
}: BetaRewardSelectorProps) {
  const [, setLastSelectedSource] = useState<'default' | 'suggestion' | 'custom'>('default');

  // Only show Beta selector in Beta mode
  if (!isBetaMode()) {
    return null;
  }

  const handleSuggestionClick = (suggestedValue: number) => {
    const newValue = suggestedValue.toString();
    onChange(newValue);
    setLastSelectedSource('suggestion');
    onSourceChange?.('suggestion');
    
    // Track Beta analytics
    collectBetaAnalytics('reward_selected', {
      rewardAmount: suggestedValue,
      wasDefault: suggestedValue === BETA_CONFIG.defaultReward,
      source: 'suggestion'
    });
  };



  const isValueInSuggestions = suggestions.includes(parseFloat(value) || 0);
  const currentValue = parseFloat(value) || 0;
  const isAboveBetaRange = currentValue > BETA_CONFIG.maxRecommendedReward;

  return (
    <div style={styles.container}>
      {/* Beta Label */}
      <div style={styles.betaLabel}>
        <span style={styles.betaIcon}>🧪</span>
        <span style={styles.betaText}>{BETA_CONFIG.labels.betaRecommendation}</span>
      </div>

      {/* Quick Select Buttons */}
      <div style={styles.suggestionsContainer}>
        <span style={styles.suggestionsLabel}>Quick select:</span>
        <div style={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={disabled}
              style={{
                ...styles.suggestionButton,
                ...(parseFloat(value) === suggestion ? styles.suggestionButtonActive : {}),
                ...(disabled ? styles.suggestionButtonDisabled : {})
              }}
            >
              {suggestion} ECHO
            </button>
          ))}
        </div>
      </div>

      {/* Advanced User Warning */}
      {isAboveBetaRange && (
        <div style={styles.advancedWarning}>
          <span style={styles.warningIcon}>⚠️</span>
          <span style={styles.warningText}>
            {BETA_CONFIG.labels.aiAdvancedWarning}
          </span>
        </div>
      )}

      {/* Usage Hint */}
      <div style={styles.hint}>
        <span style={styles.hintIcon}>💡</span>
        <span style={styles.hintText}>
          {isValueInSuggestions 
            ? `Using Beta recommended value (${currentValue} ECHO)`
            : currentValue > 0 
              ? `Custom amount (${currentValue} ECHO) - you can always edit`
              : 'Enter any amount or use quick select buttons above'
          }
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '8px',
  },
  betaLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '6px',
  },
  betaIcon: {
    fontSize: '14px',
  },
  betaText: {
    fontSize: '12px',
    color: '#1E40AF',
    fontWeight: 500,
  },
  suggestionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  suggestionsLabel: {
    fontSize: '12px',
    color: '#4B5563',
    fontWeight: 500,
  },
  suggestions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  suggestionButton: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '6px',
    backgroundColor: 'white',
    color: '#2563EB',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  suggestionButtonActive: {
    backgroundColor: '#2563EB',
    color: 'white',
    borderColor: '#2563EB',
  },
  suggestionButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  advancedWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '6px',
  },
  warningIcon: {
    fontSize: '14px',
  },
  warningText: {
    fontSize: '11px',
    color: '#92400E',
    fontWeight: 500,
    lineHeight: '1.4',
  },
  hint: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 8px',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: '4px',
  },
  hintIcon: {
    fontSize: '12px',
  },
  hintText: {
    fontSize: '11px',
    color: '#059669',
    fontWeight: 500,
  },
};