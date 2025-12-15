/**
 * Fee Explanation Modal Component
 * Stage 4.5: UX Hardening - Fee Structure Transparency
 * Stage 4.6: Beta Trial - Dual Examples (Large + Small)
 * 
 * 🎯 Purpose: Eliminate confusion about EverEcho's fee structure
 * ❌ Avoid vague terms like "platform fee"
 * ✅ Use clear, specific explanations with examples
 * 🧪 Beta: Show both large (educational) and small (Beta) examples
 */

import { useState } from 'react';
import { Button } from './Button';
import { getBetaExamples, isBetaMode, BETA_CONFIG } from '../../config/betaConfig';

interface FeeExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardAmount?: number;
}

export function FeeExplanationModal({ isOpen, onClose, rewardAmount = 100 }: FeeExplanationModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'example' | 'helper'>('overview');
  const [showBetaExample, setShowBetaExample] = useState(isBetaMode());

  if (!isOpen) return null;

  const betaExamples = getBetaExamples();
  
  // Use Beta example if in Beta mode and showing Beta example, otherwise use provided amount
  const currentExample = showBetaExample ? betaExamples.small : { 
    reward: rewardAmount, 
    totalCost: rewardAmount + 10, 
    helperEarnings: (rewardAmount * 0.98) + rewardAmount + 10 
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>💰 EverEcho Fee Structure Explained</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            theme="light"
          >
            ✕
          </Button>
        </div>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'overview' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'example' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('example')}
          >
            Example
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'helper' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('helper')}
          >
            Helper Earnings
          </button>
        </div>

        <div style={styles.content}>
          {/* Stage 4.6: Beta Example Toggle */}
          {(activeTab === 'example' || activeTab === 'helper') && isBetaMode() && (
            <div style={styles.exampleToggle}>
              <span style={styles.toggleLabel}>Example size:</span>
              <div style={styles.toggleButtons}>
                <button
                  style={{
                    ...styles.toggleButton,
                    ...(showBetaExample ? styles.toggleButtonActive : {})
                  }}
                  onClick={() => setShowBetaExample(true)}
                >
                  🧪 Beta (10 ECHO)
                </button>
                <button
                  style={{
                    ...styles.toggleButton,
                    ...(!showBetaExample ? styles.toggleButtonActive : {})
                  }}
                  onClick={() => setShowBetaExample(false)}
                >
                  📚 Educational (100 ECHO)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div style={styles.tabContent}>
              <h3 style={styles.sectionTitle}>How EverEcho Fees Work</h3>
              
              <div style={styles.feeBreakdown}>
                <div style={styles.feeItem}>
                  <div style={styles.feeIcon}>🎯</div>
                  <div style={styles.feeDetails}>
                    <h4 style={styles.feeTitle}>Task Reward</h4>
                    <p style={styles.feeDesc}>
                      The amount you set as payment for completing the task. 
                      This goes to the Helper (minus 2% protocol fee).
                    </p>
                  </div>
                </div>

                <div style={styles.feeItem}>
                  <div style={styles.feeIcon}>📝</div>
                  <div style={styles.feeDetails}>
                    <h4 style={styles.feeTitle}>Task Posting Fee: 10 ECHO</h4>
                    <p style={styles.feeDesc}>
                      Fixed fee for publishing your task. This goes directly to 
                      the Helper when they complete the work (bonus payment).
                    </p>
                  </div>
                </div>

                <div style={styles.feeItem}>
                  <div style={styles.feeIcon}>🔥</div>
                  <div style={styles.feeDetails}>
                    <h4 style={styles.feeTitle}>Protocol Fee: 2% of Reward</h4>
                    <p style={styles.feeDesc}>
                      Small fee burned to maintain the network. This ensures 
                      sustainable operation and prevents spam.
                    </p>
                  </div>
                </div>
              </div>

              <div style={styles.keyPoint}>
                <h4 style={styles.keyPointTitle}>🔑 Key Point</h4>
                <p style={styles.keyPointText}>
                  You pay: <strong>Reward + 10 ECHO</strong><br/>
                  Helper receives: <strong>98% of Reward + Original Reward + 10 ECHO</strong>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'example' && (
            <div style={styles.tabContent}>
              <h3 style={styles.sectionTitle}>
                Example: {currentExample.reward} ECHO Task
                {showBetaExample && isBetaMode() && (
                  <span style={styles.betaLabel}> (Beta Friendly)</span>
                )}
                {!showBetaExample && isBetaMode() && (
                  <span style={styles.educationalLabel}> ({BETA_CONFIG.labels.largeExampleLabel})</span>
                )}
              </h3>
              
              <div style={styles.exampleFlow}>
                <div style={styles.flowStep}>
                  <div style={styles.stepNumber}>1</div>
                  <div style={styles.stepContent}>
                    <h4 style={styles.stepTitle}>You Create Task</h4>
                    <div style={styles.calculation}>
                      <div style={styles.calcRow}>
                        <span>Task Reward:</span>
                        <span className="amount">{currentExample.reward} ECHO</span>
                      </div>
                      <div style={styles.calcRow}>
                        <span>Posting Fee:</span>
                        <span className="amount">+ 10 ECHO</span>
                      </div>
                      <div style={styles.calcTotal}>
                        <span>You Pay Total:</span>
                        <span className="total">{currentExample.totalCost} ECHO</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.flowArrow}>↓</div>

                <div style={styles.flowStep}>
                  <div style={styles.stepNumber}>2</div>
                  <div style={styles.stepContent}>
                    <h4 style={styles.stepTitle}>Task Completed</h4>
                    <div style={styles.calculation}>
                      <div style={styles.calcRow}>
                        <span>Helper gets 98% reward:</span>
                        <span className="amount">{(currentExample.reward * 0.98).toFixed(1)} ECHO</span>
                      </div>
                      <div style={styles.calcRow}>
                        <span>Your deposit returned:</span>
                        <span className="amount">+ {currentExample.reward} ECHO</span>
                      </div>
                      <div style={styles.calcRow}>
                        <span>Posting fee bonus:</span>
                        <span className="amount">+ 10 ECHO</span>
                      </div>
                      <div style={styles.calcRow}>
                        <span>Protocol fee burned:</span>
                        <span className="burned">- {(currentExample.reward * 0.02).toFixed(1)} ECHO</span>
                      </div>
                      <div style={styles.calcTotal}>
                        <span>Helper Receives:</span>
                        <span className="total">{currentExample.helperEarnings.toFixed(1)} ECHO</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.mathCheck}>
                <h4 style={styles.mathTitle}>✅ Math Check</h4>
                <p style={styles.mathText}>
                  Your {currentExample.totalCost} ECHO = Helper's {currentExample.helperEarnings.toFixed(1)} ECHO + {(currentExample.reward * 0.02).toFixed(1)} ECHO burned ✓<br/>
                  <small>Helper gets more because they receive your original deposit back</small>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'helper' && (
            <div style={styles.tabContent}>
              <h3 style={styles.sectionTitle}>Why Helpers Earn More Than You Pay</h3>
              
              <div style={styles.helperExplanation}>
                <div style={styles.helperPoint}>
                  <div style={styles.pointIcon}>💡</div>
                  <div style={styles.pointText}>
                    <h4>The "2R Settlement" System</h4>
                    <p>
                      EverEcho uses a unique "2R" (double reward) system where 
                      Helpers receive both the reward AND get your original deposit back.
                    </p>
                  </div>
                </div>

                <div style={styles.helperPoint}>
                  <div style={styles.pointIcon}>🎁</div>
                  <div style={styles.pointText}>
                    <h4>Posting Fee Bonus</h4>
                    <p>
                      The 10 ECHO posting fee goes directly to the Helper as a 
                      bonus for completing quality work.
                    </p>
                  </div>
                </div>

                <div style={styles.helperPoint}>
                  <div style={styles.pointIcon}>🔒</div>
                  <div style={styles.pointText}>
                    <h4>Security & Incentives</h4>
                    <p>
                      This system ensures Helpers are well-compensated while 
                      keeping your funds secure in escrow until work is completed.
                    </p>
                  </div>
                </div>
              </div>

              <div style={styles.helperCalculator}>
                <h4 style={styles.calculatorTitle}>Helper Earnings Calculator</h4>
                <div style={styles.calculatorContent}>
                  <div style={styles.calcInput}>
                    <span>If task reward is:</span>
                    <span style={styles.inputAmount}>
                      {currentExample.reward} ECHO
                      {showBetaExample && isBetaMode() && <span style={styles.betaTag}> (Beta)</span>}
                      {!showBetaExample && isBetaMode() && <span style={styles.educationalTag}> (Educational)</span>}
                    </span>
                  </div>
                  <div style={styles.calcBreakdown}>
                    <div style={styles.breakdownItem}>
                      <span>98% of reward:</span>
                      <span>{(currentExample.reward * 0.98).toFixed(1)} ECHO</span>
                    </div>
                    <div style={styles.breakdownItem}>
                      <span>Deposit return:</span>
                      <span>{currentExample.reward} ECHO</span>
                    </div>
                    <div style={styles.breakdownItem}>
                      <span>Posting fee bonus:</span>
                      <span>10 ECHO</span>
                    </div>
                    <div style={styles.breakdownTotal}>
                      <span>Helper receives:</span>
                      <span>{currentExample.helperEarnings.toFixed(1)} ECHO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <div style={styles.footerNote}>
            <span style={styles.noteIcon}>ℹ️</span>
            <span style={styles.noteText}>
              This fee structure ensures fair compensation for Helpers while maintaining network security.
            </span>
          </div>
          <Button
            variant="primary"
            onClick={onClose}
            theme="light"
          >
            Got It!
          </Button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E5E7EB',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1A1A1A',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #E5E7EB',
  },
  tab: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: '#2563EB',
    borderBottom: '2px solid #2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  content: {
    padding: '24px',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: 0,
  },
  feeBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  feeItem: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
  },
  feeIcon: {
    fontSize: '24px',
    minWidth: '32px',
  },
  feeDetails: {
    flex: 1,
  },
  feeTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 4px 0',
  },
  feeDesc: {
    fontSize: '14px',
    color: '#4B5563',
    margin: 0,
    lineHeight: '1.5',
  },
  keyPoint: {
    padding: '16px',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    border: '1px solid rgba(37, 99, 235, 0.3)',
    borderRadius: '10px',
  },
  keyPointTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  keyPointText: {
    fontSize: '14px',
    color: '#1A1A1A',
    margin: 0,
    lineHeight: '1.6',
  },
  exampleFlow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  flowStep: {
    display: 'flex',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
  },
  stepNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 700,
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 12px 0',
  },
  calculation: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#4B5563',
  },
  calcTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: 700,
    color: '#1A1A1A',
    paddingTop: '8px',
    borderTop: '1px solid #D1D5DB',
    marginTop: '4px',
  },
  flowArrow: {
    textAlign: 'center',
    fontSize: '24px',
    color: '#6B7280',
  },
  mathCheck: {
    padding: '16px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '10px',
  },
  mathTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  mathText: {
    fontSize: '14px',
    color: '#1A1A1A',
    margin: 0,
    lineHeight: '1.6',
  },
  helperExplanation: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  helperPoint: {
    display: 'flex',
    gap: '12px',
  },
  pointIcon: {
    fontSize: '24px',
    minWidth: '32px',
  },
  pointText: {
    flex: 1,
  },
  helperCalculator: {
    padding: '20px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
  },
  calculatorTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 16px 0',
  },
  calculatorContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  calcInput: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  inputAmount: {
    color: '#2563EB',
  },
  calcBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#4B5563',
  },
  breakdownTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: 700,
    color: '#10B981',
    paddingTop: '8px',
    borderTop: '1px solid #D1D5DB',
    marginTop: '4px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  noteIcon: {
    fontSize: '16px',
  },
  noteText: {
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: 500,
  },
  // Stage 4.6: Beta example toggle styles
  exampleToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  toggleLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  toggleButtons: {
    display: 'flex',
    gap: '6px',
  },
  toggleButton: {
    padding: '4px 8px',
    fontSize: '12px',
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
  betaLabel: {
    fontSize: '14px',
    color: '#059669',
    fontWeight: 500,
  },
  educationalLabel: {
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: 400,
  },
  betaTag: {
    fontSize: '10px',
    color: '#059669',
    fontWeight: 600,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '4px',
  },
  educationalTag: {
    fontSize: '10px',
    color: '#6B7280',
    fontWeight: 500,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '4px',
  },
};