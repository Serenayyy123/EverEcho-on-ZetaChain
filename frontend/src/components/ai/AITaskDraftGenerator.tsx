/**
 * AI Task Draft Generator Component
 * Stage 4.3-B: AI Task Draft Generation
 * 
 * 🔒 CODE FREEZE: This component is completely off-chain
 * ❌ Does NOT access contracts, private keys, or trigger transactions
 * ✅ Only provides AI suggestions for task creation
 */

import { useState } from 'react';
import { useAIService, AITaskDraft } from '../../hooks/useAIService';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/Input';
import { Alert } from '../ui/Alert';

interface AITaskDraftGeneratorProps {
  onDraftGenerated: (draft: AITaskDraft) => void;
  disabled?: boolean;
}

export function AITaskDraftGenerator({ onDraftGenerated, disabled }: AITaskDraftGeneratorProps) {
  const { generateTaskDraft, loading, error } = useAIService();
  const [prompt, setPrompt] = useState('');
  const [lastDraft, setLastDraft] = useState<AITaskDraft | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const draft = await generateTaskDraft(prompt);
    if (draft) {
      setLastDraft(draft);
      onDraftGenerated(draft);
    }
  };

  const handleUseDraft = () => {
    if (lastDraft) {
      onDraftGenerated(lastDraft);
      setShowGenerator(false);
    }
  };

  if (!showGenerator) {
    return (
      <div style={styles.container}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowGenerator(true)}
          disabled={disabled}
          theme="light"
        >
          ✨ AI Task Generator
        </Button>
        <p style={styles.hint}>
          Let AI help you create a task draft from a simple description
        </p>
      </div>
    );
  }

  return (
    <div style={styles.expandedContainer}>
      <div style={styles.header}>
        <h3 style={styles.title}>✨ AI Task Generator</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowGenerator(false)}
          disabled={loading}
          theme="light"
        >
          ✕
        </Button>
      </div>

      <div style={styles.content}>
        <TextArea
          label="Describe your task idea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a React component for user authentication with login and signup forms"
          rows={3}
          disabled={loading || disabled}
        />

        <div style={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerate}
            loading={loading}
            disabled={!prompt.trim() || loading || disabled}
            theme="light"
          >
            Generate Draft
          </Button>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {lastDraft && (
          <div style={styles.draftPreview}>
            <div style={styles.draftHeader}>
              <h4 style={styles.draftTitle}>Generated Draft</h4>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUseDraft}
                disabled={disabled}
                theme="light"
              >
                Use This Draft
              </Button>
            </div>

            <div style={styles.draftContent}>
              <div style={styles.draftField}>
                <label style={styles.draftLabel}>Title:</label>
                <p style={styles.draftValue}>{lastDraft.title}</p>
              </div>

              <div style={styles.draftField}>
                <label style={styles.draftLabel}>Description:</label>
                <p style={styles.draftValue}>{lastDraft.description}</p>
              </div>

              <div style={styles.draftMeta}>
                <div style={styles.draftMetaItem}>
                  <span style={styles.draftMetaLabel}>Suggested Reward:</span>
                  <span style={styles.draftMetaValue}>{lastDraft.suggestedRewardEcho} ECHO</span>
                </div>
                {lastDraft.category && (
                  <div style={styles.draftMetaItem}>
                    <span style={styles.draftMetaLabel}>Category:</span>
                    <span style={styles.draftMetaValue}>{lastDraft.category}</span>
                  </div>
                )}
                {lastDraft.skills && lastDraft.skills.length > 0 && (
                  <div style={styles.draftMetaItem}>
                    <span style={styles.draftMetaLabel}>Skills:</span>
                    <span style={styles.draftMetaValue}>{lastDraft.skills.join(', ')}</span>
                  </div>
                )}
              </div>

              <div style={styles.disclaimer}>
                <p style={styles.disclaimerText}>
                  ⚠️ {lastDraft.disclaimer}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '10px',
  },
  hint: {
    fontSize: '12px',
    color: '#6B7280',
    margin: 0,
    fontWeight: 500,
  },
  expandedContainer: {
    padding: '20px',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '12px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: 0,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  draftPreview: {
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '10px',
  },
  draftHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  draftTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: 0,
  },
  draftContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  draftField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  draftLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6B7280',
  },
  draftValue: {
    fontSize: '14px',
    color: '#1A1A1A',
    margin: 0,
    lineHeight: '1.5',
  },
  draftMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '12px',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: '8px',
  },
  draftMetaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  draftMetaLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6B7280',
  },
  draftMetaValue: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8B5CF6',
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
};