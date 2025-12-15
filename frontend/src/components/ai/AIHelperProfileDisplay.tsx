/**
 * AI Helper Profile Display Component
 * Stage 4.3-D: AI Helper Matching (Display Only)
 * 
 * 🔒 CODE FREEZE: This component is completely off-chain
 * ❌ Does NOT access contracts, private keys, or trigger transactions
 * ✅ Only displays AI-suggested helper profiles for reference
 */

import { useState, useEffect } from 'react';
import { useAIService, AIHelperProfile } from '../../hooks/useAIService';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Task, TaskStatus } from '../../types/task';

interface AIHelperProfileDisplayProps {
  task: Task;
  disabled?: boolean;
}

export function AIHelperProfileDisplay({ task, disabled }: AIHelperProfileDisplayProps) {
  const { suggestHelperProfile, loading, error } = useAIService();
  const [profile, setProfile] = useState<AIHelperProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Only show for Open tasks (not yet accepted)
  const shouldShow = task.status === TaskStatus.Open && task.metadata?.description && task.metadata.description.length > 20;

  // Auto-load profile when component mounts (for Open tasks)
  useEffect(() => {
    if (shouldShow && !hasLoaded && !disabled) {
      loadProfile();
    }
  }, [task.metadata?.description, shouldShow, hasLoaded, disabled]);

  const loadProfile = async () => {
    if (!task.metadata?.description?.trim()) return;

    setHasLoaded(true);
    const result = await suggestHelperProfile(task.metadata.description);
    if (result) {
      setProfile(result);
      setShowProfile(true);
    }
  };

  const handleRefresh = async () => {
    await loadProfile();
  };

  const handleToggle = () => {
    if (!showProfile && !profile) {
      loadProfile();
    } else {
      setShowProfile(!showProfile);
    }
  };

  // Don't render if task is not Open or description is too short
  if (!shouldShow) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <span style={styles.icon}>🎯</span>
          <span style={styles.title}>AI Helper Profile Suggestion</span>
        </div>
        <div style={styles.actions}>
          {profile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              loading={loading}
              disabled={loading || disabled}
              theme="light"
            >
              🔄
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={loading || disabled}
            theme="light"
          >
            {showProfile ? '−' : '+'}
          </Button>
        </div>
      </div>

      {showProfile && (
        <div style={styles.content}>
          {loading && (
            <div style={styles.loadingState}>
              <p style={styles.loadingText}>Analyzing task requirements...</p>
            </div>
          )}

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          {profile && !loading && (
            <div style={styles.profileContent}>
              <div style={styles.profileHeader}>
                <h4 style={styles.profileTitle}>Recommended Helper Profile</h4>
              </div>

              <div style={styles.profileGrid}>
                <div style={styles.profileSection}>
                  <label style={styles.sectionLabel}>Required Skills</label>
                  <div style={styles.skillsContainer}>
                    {profile.suggestedSkills.map((skill, index) => (
                      <span key={index} style={styles.skillTag}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={styles.profileSection}>
                  <label style={styles.sectionLabel}>Task Difficulty</label>
                  <div style={styles.difficultyContainer}>
                    <span style={{
                      ...styles.difficultyBadge,
                      backgroundColor: getDifficultyColor(profile.difficulty),
                    }}>
                      {profile.difficulty.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={styles.profileSection}>
                  <label style={styles.sectionLabel}>Estimated Time</label>
                  <div style={styles.timeContainer}>
                    <span style={styles.timeValue}>
                      {profile.estimatedTimeHours} hours
                    </span>
                    <span style={styles.timeNote}>
                      ({Math.ceil(profile.estimatedTimeHours / 8)} working days)
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.helperTips}>
                <h5 style={styles.tipsTitle}>💡 For Potential Helpers</h5>
                <ul style={styles.tipsList}>
                  <li>Ensure you have experience with the listed skills</li>
                  <li>Consider the estimated time commitment before accepting</li>
                  <li>Review the task description carefully for specific requirements</li>
                  <li>Communicate with the creator if you need clarification</li>
                </ul>
              </div>

              <div style={styles.disclaimer}>
                <p style={styles.disclaimerText}>
                  ⚠️ {profile.disclaimer}
                </p>
              </div>
            </div>
          )}

          {!profile && !loading && !error && (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>
                Click the + button to get AI suggestions for this task
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return 'rgba(34, 197, 94, 0.2)'; // Green
    case 'medium':
      return 'rgba(245, 158, 11, 0.2)'; // Yellow
    case 'hard':
      return 'rgba(239, 68, 68, 0.2)'; // Red
    default:
      return 'rgba(107, 114, 128, 0.2)'; // Gray
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '10px',
    marginTop: '16px',
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
  actions: {
    display: 'flex',
    gap: '4px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  loadingState: {
    padding: '20px',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: '20px',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },
  profileContent: {
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
  },
  profileHeader: {
    marginBottom: '16px',
  },
  profileTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: 0,
  },
  profileGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '16px',
  },
  profileSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  skillsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  skillTag: {
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#3B82F6',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '4px',
  },
  difficultyContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  difficultyBadge: {
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#1A1A1A',
    borderRadius: '12px',
    letterSpacing: '0.05em',
  },
  timeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timeValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  timeNote: {
    fontSize: '12px',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  helperTips: {
    padding: '12px',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  tipsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  tipsList: {
    fontSize: '12px',
    color: '#4B5563',
    margin: 0,
    paddingLeft: '16px',
    lineHeight: '1.5',
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