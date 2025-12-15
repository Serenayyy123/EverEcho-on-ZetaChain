/**
 * Helper Earnings Breakdown Component
 * Stage 4.5: UX Hardening - Helper Revenue Explanation
 * Stage 4.6: Beta Trial - Dual Examples Support
 * 
 * 🎯 Purpose: Clearly show Helper how they earn from tasks
 * ✅ Use specific numbers and clear breakdown
 * ❌ Avoid confusing calculations
 * 🧪 Beta: Show both large (educational) and small (Beta) examples
 */

import { useState } from 'react';
import { Button } from './Button';
import { getBetaExamples, isBetaMode, BETA_CONFIG } from '../../config/betaConfig';

interface HelperEarningsBreakdownProps {
  rewardAmount: number;
  className?: string;
  compact?: boolean;
  showBetaExample?: boolean; // Stage 4.6: Allow toggling between Beta and large examples
}

export function HelperEarningsBreakdown({ 
  rewardAmount, 
  className = '', 
  compact = false,
  showBetaExample = isBetaMode()
}: HelperEarningsBreakdownProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [usesBetaExample, setUsesBetaExample] = useState(showBetaExample);

  // Stage 4.6: Get Beta examples for comparison
  const betaExamples = getBetaExamples();
  
  // Use Beta example if enabled, otherwise use provided amount
  const currentReward = usesBetaExample ? betaExamples.small.reward : rewardAmount;
  
  // Calculate earnings components
  const rewardPortion = Math.round(currentReward * 0.98); // 98% of reward
  const depositReturn = currentReward; // Full deposit returned
  const postingFeeBonus = 10; // Fixed posting fee
  const totalEarnings = rewardPortion + depositReturn + postingFeeBonus;
  const burnAmount = Math.round(currentReward * 0.02); // 2% burned

  if (compact) {
    return (
      <div className={`${className}`} style={styles.compactContainer}>
        <div style={styles.compactHeader}>
          <span style={styles.compactLabel}>Helper will receive:</span>
          <span style={styles.compactAmount}>{totalEarnings} ECHO</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            theme="light"
          >
            {showDetails ? '−' : '+'}
          </Button>
        </div>
        
        {showDetails && (
          <div style={styles.compactDetails}>
            <div style={styles.detailRow}>
              <span>98% of reward:</span>
              <span>{rewardPortion} ECHO</span>
            </div>
            <div style={styles.detailRow}>
              <span>Deposit return:</span>
              <span>{depositReturn} ECHO</span>
            </div>
            <div style={styles.detailRow}>
              <span>Posting fee bonus:</span>
              <span>{postingFeeBonus} ECHO</span>
            </div>
            <div style={styles.detailTotal}>
              <span>Total earnings:</span>
              <span>{totalEarnings} ECHO</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`} style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          💰 Helper Earnings Breakdown
          {usesBetaExample && isBetaMode() && (
            <span style={styles.betaLabel}> (Beta Example)</span>
          )}
          {!usesBetaExample && isBetaMode() && (
            <span style={styles.educationalLabel}> (Educational Example)</span>
          )}
        </h3>
        <div style={styles.totalBadge}>
          <span style={styles.totalLabel}>Total:</span>
          <span style={styles.totalAmount}>{totalEarnings} ECHO</span>
        </div>
      </div>

      {/* Stage 4.6: Beta Example Toggle */}
      {isBetaMode() && (
        <div style={styles.exampleToggle}>
          <span style={styles.toggleLabel}>Example size:</span>
          <div style={styles.toggleButtons}>
            <button
              style={{
                ...styles.toggleButton,
                ...(usesBetaExample ? styles.toggleButtonActive : {})
              }}
              onClick={() => setUsesBetaExample(true)}
            >
              🧪 Beta ({betaExamples.small.reward} ECHO)
            </button>
            <button
              style={{
                ...styles.toggleButton,
                ...(!usesBetaExample ? styles.toggleButtonActive : {})
              }}
              onClick={() => setUsesBetaExample(false)}
            >
              📚 Educational ({betaExamples.large.reward} ECHO)
            </button>
          </div>
          <div style={styles.toggleHint}>
            {usesBetaExample 
              ? "Showing Beta-friendly small amounts"
              : BETA_CONFIG.labels.largeExampleLabel
            }
          </div>
        </div>
      )}

      <div style={styles.breakdown}>
        <div style={styles.earningsSection}>
          <h4 style={styles.sectionTitle}>✅ Helper Receives</h4>
          
          <div style={styles.earningItem}>
            <div style={styles.itemIcon}>🎯</div>
            <div style={styles.itemContent}>
              <div style={styles.itemHeader}>
                <span style={styles.itemTitle}>Task Reward (98%)</span>
                <span style={styles.itemAmount}>{rewardPortion} ECHO</span>
              </div>
              <p style={styles.itemDesc}>
                98% of the {currentReward} ECHO reward for completing the task
              </p>
            </div>
          </div>

          <div style={styles.earningItem}>
            <div style={styles.itemIcon}>🔄</div>
            <div style={styles.itemContent}>
              <div style={styles.itemHeader}>
                <span style={styles.itemTitle}>Deposit Return</span>
                <span style={styles.itemAmount}>{depositReturn} ECHO</span>
              </div>
              <p style={styles.itemDesc}>
                Creator's original {currentReward} ECHO deposit returned to Helper
              </p>
            </div>
          </div>

          <div style={styles.earningItem}>
            <div style={styles.itemIcon}>🎁</div>
            <div style={styles.itemContent}>
              <div style={styles.itemHeader}>
                <span style={styles.itemTitle}>Posting Fee Bonus</span>
                <span style={styles.itemAmount}>{postingFeeBonus} ECHO</span>
              </div>
              <p style={styles.itemDesc}>
                Fixed bonus from the Creator's posting fee
              </p>
            </div>
          </div>
        </div>

        <div style={styles.burnSection}>
          <h4 style={styles.burnTitle}>🔥 Protocol Fee (Burned)</h4>
          <div style={styles.burnItem}>
            <span style={styles.burnLabel}>2% of reward burned:</span>
            <span style={styles.burnAmount}>{burnAmount} ECHO</span>
          </div>
          <p style={styles.burnDesc}>
            This small fee is burned to maintain network security and prevent spam
          </p>
        </div>
      </div>

      <div style={styles.explanation}>
        <div style={styles.explanationHeader}>
          <span style={styles.explanationIcon}>💡</span>
          <h4 style={styles.explanationTitle}>Why Helpers Earn More</h4>
        </div>
        <p style={styles.explanationText}>
          EverEcho uses a "2R Settlement" system where Helpers receive both the reward 
          AND the Creator's deposit back. This ensures Helpers are well-compensated 
          while keeping funds secure in escrow.
        </p>
      </div>

      <div style={styles.mathVerification}>
        <h4 style={styles.mathTitle}>🧮 Math Verification</h4>
        <div style={styles.mathContent}>
          <div style={styles.mathRow}>
            <span>Creator pays:</span>
            <span>{currentReward + 10} ECHO (reward + posting fee)</span>
          </div>
          <div style={styles.mathRow}>
            <span>Helper receives:</span>
            <span>{totalEarnings} ECHO</span>
          </div>
          <div style={styles.mathRow}>
            <span>Protocol burns:</span>
            <span>{burnAmount} ECHO</span>
          </div>
          <div style={styles.mathTotal}>
            <span>Total accounted:</span>
            <span>{totalEarnings + burnAmount} ECHO ✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  compactContainer: {
    padding: '12px 16px',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
  },
  compactHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  compactLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1A1A1A',
    flex: 1,
  },
  compactAmount: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#10B981',
  },
  compactDetails: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(16, 185, 129, 0.2)',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#4B5563',
    marginBottom: '4px',
  },
  detailTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: 600,
    color: '#10B981',
    paddingTop: '8px',
    borderTop: '1px solid rgba(16, 185, 129, 0.2)',
    marginTop: '8px',
  },
  container: {
    padding: '20px',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '12px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: 0,
  },
  totalBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#10B981',
    borderRadius: '20px',
  },
  totalLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'white',
  },
  totalAmount: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'white',
  },
  breakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '20px',
  },
  earningsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  earningItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '8px',
  },
  itemIcon: {
    fontSize: '20px',
    minWidth: '24px',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  itemAmount: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#10B981',
  },
  itemDesc: {
    fontSize: '12px',
    color: '#6B7280',
    margin: 0,
    lineHeight: '1.4',
  },
  burnSection: {
    padding: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
  },
  burnTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  burnItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  burnLabel: {
    fontSize: '12px',
    color: '#4B5563',
  },
  burnAmount: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#EF4444',
  },
  burnDesc: {
    fontSize: '11px',
    color: '#6B7280',
    margin: 0,
    fontStyle: 'italic',
  },
  explanation: {
    padding: '16px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  explanationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  explanationIcon: {
    fontSize: '16px',
  },
  explanationTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: 0,
  },
  explanationText: {
    fontSize: '12px',
    color: '#4B5563',
    margin: 0,
    lineHeight: '1.5',
  },
  mathVerification: {
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '8px',
  },
  mathTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 12px 0',
  },
  mathContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  mathRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#4B5563',
  },
  mathTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: 600,
    color: '#10B981',
    paddingTop: '8px',
    borderTop: '1px solid #E5E7EB',
    marginTop: '4px',
  },
  // Stage 4.6: Beta example toggle styles
  exampleToggle: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  toggleLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  toggleButtons: {
    display: 'flex',
    gap: '6px',
  },
  toggleButton: {
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 500,
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#2563EB',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  toggleButtonActive: {
    backgroundColor: '#2563EB',
    color: 'white',
    borderColor: '#2563EB',
  },
  toggleHint: {
    fontSize: '10px',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  betaLabel: {
    fontSize: '12px',
    color: '#059669',
    fontWeight: 500,
  },
  educationalLabel: {
    fontSize: '10px',
    color: '#6B7280',
    fontWeight: 400,
  },
};