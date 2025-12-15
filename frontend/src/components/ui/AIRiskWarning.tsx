/**
 * AI Risk Warning Component
 * Stage 4.5: UX Hardening - AI Risk Mitigation
 * 
 * 🎯 Purpose: Prevent users from blindly trusting AI suggestions
 * ✅ Force manual confirmation of AI-generated content
 * ❌ Prevent one-click submission without review
 */

import { useState } from 'react';
import { Button } from './Button';

interface AIRiskWarningProps {
  aiGeneratedFields: string[];
  onConfirm: () => void;
  onCancel: () => void;
  isVisible: boolean;
}

export function AIRiskWarning({ 
  aiGeneratedFields, 
  onConfirm, 
  onCancel, 
  isVisible 
}: AIRiskWarningProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [finalConfirmation, setFinalConfirmation] = useState(false);

  if (!isVisible) return null;

  const handleItemCheck = (field: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(field)) {
      newChecked.delete(field);
    } else {
      newChecked.add(field);
    }
    setCheckedItems(newChecked);
  };

  const allItemsChecked = aiGeneratedFields.every(field => checkedItems.has(field));
  const canProceed = allItemsChecked && finalConfirmation;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.warningIcon}>⚠️</div>
          <h2 style={styles.title}>AI Content Verification Required</h2>
        </div>

        <div style={styles.content}>
          <div style={styles.warningMessage}>
            <p style={styles.warningText}>
              <strong>Important:</strong> You're about to use AI-generated content. 
              AI suggestions are helpful but may not be perfect. Please carefully 
              review each field before proceeding.
            </p>
          </div>

          <div style={styles.checklistSection}>
            <h3 style={styles.checklistTitle}>
              ✅ Please verify each AI-generated field:
            </h3>
            
            <div style={styles.checklist}>
              {aiGeneratedFields.map((field) => (
                <label key={field} style={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={checkedItems.has(field)}
                    onChange={() => handleItemCheck(field)}
                    style={styles.checkbox}
                  />
                  <span style={styles.checklistLabel}>
                    I have carefully reviewed the <strong>{field}</strong> and confirm it's accurate
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={styles.guidelines}>
            <h4 style={styles.guidelinesTitle}>💡 Review Guidelines</h4>
            <ul style={styles.guidelinesList}>
              <li>Check if the task description is specific and clear</li>
              <li>Verify the reward amount matches your budget and expectations</li>
              <li>Ensure the category and skills are appropriate</li>
              <li>Add any missing requirements or deadlines</li>
              <li>Consider if you need to provide additional context</li>
            </ul>
          </div>

          <div style={styles.finalConfirmation}>
            <label style={styles.finalConfirmationLabel}>
              <input
                type="checkbox"
                checked={finalConfirmation}
                onChange={(e) => setFinalConfirmation(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.finalConfirmationText}>
                <strong>I understand that AI suggestions are not perfect and I take 
                full responsibility for the accuracy of this task information.</strong>
              </span>
            </label>
          </div>

          <div style={styles.riskNotice}>
            <div style={styles.riskIcon}>🚨</div>
            <div style={styles.riskText}>
              <strong>Remember:</strong> Once published, this task will be visible to all users. 
              Inaccurate information may lead to misunderstandings, poor work quality, 
              or disputes. Take time to review carefully.
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <Button
            variant="ghost"
            onClick={onCancel}
            theme="light"
          >
            Cancel & Edit More
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={!canProceed}
            theme="light"
          >
            Proceed with Verified Content
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AIFieldWarningProps {
  fieldName: string;
  isAIGenerated: boolean;
  children: React.ReactNode;
}

export function AIFieldWarning({ fieldName, isAIGenerated, children }: AIFieldWarningProps) {
  if (!isAIGenerated) {
    return <>{children}</>;
  }

  return (
    <div style={styles.fieldContainer}>
      {children}
      <div style={styles.fieldWarning}>
        <span style={styles.fieldWarningIcon}>🤖</span>
        <span style={styles.fieldWarningText}>
          AI-generated {fieldName} - Please review and edit as needed
        </span>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    alignItems: 'center',
    gap: '12px',
    padding: '24px 24px 16px 24px',
    borderBottom: '1px solid #E5E7EB',
  },
  warningIcon: {
    fontSize: '32px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1A1A1A',
    margin: 0,
  },
  content: {
    padding: '24px',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  warningMessage: {
    padding: '16px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  warningText: {
    fontSize: '14px',
    color: '#92400E',
    margin: 0,
    lineHeight: '1.5',
  },
  checklistSection: {
    marginBottom: '20px',
  },
  checklistTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 12px 0',
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
  },
  checkbox: {
    marginTop: '2px',
    cursor: 'pointer',
  },
  checklistLabel: {
    fontSize: '14px',
    color: '#1A1A1A',
    lineHeight: '1.4',
    cursor: 'pointer',
  },
  guidelines: {
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  guidelinesTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  guidelinesList: {
    fontSize: '12px',
    color: '#4B5563',
    margin: 0,
    paddingLeft: '16px',
    lineHeight: '1.5',
  },
  finalConfirmation: {
    padding: '16px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  finalConfirmationLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    cursor: 'pointer',
  },
  finalConfirmationText: {
    fontSize: '13px',
    color: '#1A1A1A',
    lineHeight: '1.4',
    cursor: 'pointer',
  },
  riskNotice: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
  },
  riskIcon: {
    fontSize: '20px',
    minWidth: '24px',
  },
  riskText: {
    fontSize: '12px',
    color: '#1E40AF',
    lineHeight: '1.5',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '20px 24px',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  fieldContainer: {
    position: 'relative',
  },
  fieldWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
    padding: '6px 8px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '4px',
  },
  fieldWarningIcon: {
    fontSize: '14px',
  },
  fieldWarningText: {
    fontSize: '11px',
    color: '#92400E',
    fontWeight: 500,
  },
};