/**
 * AI Integration Summary Component
 * Stage 4.3-E: Frontend AI Integration Summary
 * 
 * 🔒 CODE FREEZE: This component is completely off-chain
 * ❌ Does NOT access contracts, private keys, or trigger transactions
 * ✅ Provides overview of AI capabilities and health status
 */

import { useState, useEffect } from 'react';
import { useAIService } from '../../hooks/useAIService';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

interface AIIntegrationSummaryProps {
  showDetails?: boolean;
}

export function AIIntegrationSummary({ showDetails = false }: AIIntegrationSummaryProps) {
  const { checkHealth } = useAIService();
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [showSummary, setShowSummary] = useState(showDetails);

  useEffect(() => {
    const checkAIHealth = async () => {
      const healthy = await checkHealth();
      setIsHealthy(healthy);
    };

    checkAIHealth();
  }, []);

  if (!showSummary) {
    return (
      <div style={styles.compactContainer}>
        <div style={styles.compactHeader}>
          <div style={styles.statusIndicator}>
            <span style={styles.aiIcon}>🤖</span>
            <span style={styles.statusText}>
              AI Assistant {isHealthy ? 'Active' : 'Offline'}
            </span>
            <div style={{
              ...styles.statusDot,
              backgroundColor: isHealthy ? '#10B981' : '#EF4444',
            }} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSummary(true)}
            theme="light"
          >
            ℹ️
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <span style={styles.icon}>🤖</span>
          <span style={styles.title}>AI Assistant Overview</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSummary(false)}
          theme="light"
        >
          ✕
        </Button>
      </div>

      <div style={styles.content}>
        <div style={styles.healthSection}>
          <div style={styles.healthHeader}>
            <span style={styles.healthLabel}>Service Status</span>
            <div style={styles.healthStatus}>
              <div style={{
                ...styles.healthDot,
                backgroundColor: isHealthy ? '#10B981' : '#EF4444',
              }} />
              <span style={styles.healthText}>
                {isHealthy ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.featuresSection}>
          <h4 style={styles.featuresTitle}>Available AI Features</h4>
          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>✨</span>
              <div style={styles.featureContent}>
                <span style={styles.featureName}>Task Draft Generator</span>
                <span style={styles.featureDesc}>Create tasks from natural language</span>
              </div>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>💰</span>
              <div style={styles.featureContent}>
                <span style={styles.featureName}>Reward Suggestion</span>
                <span style={styles.featureDesc}>Smart pricing based on complexity</span>
              </div>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🎯</span>
              <div style={styles.featureContent}>
                <span style={styles.featureName}>Helper Profile Matching</span>
                <span style={styles.featureDesc}>Suggested skills and requirements</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.usageSection}>
          <h4 style={styles.usageTitle}>How to Use AI Features</h4>
          <ol style={styles.usageList}>
            <li style={styles.usageItem}>
              <strong>Creating Tasks:</strong> Use the AI Task Generator on the publish page
            </li>
            <li style={styles.usageItem}>
              <strong>Setting Rewards:</strong> AI will suggest amounts based on task complexity
            </li>
            <li style={styles.usageItem}>
              <strong>Finding Helpers:</strong> View AI-suggested helper profiles on task details
            </li>
          </ol>
        </div>

        <div style={styles.disclaimer}>
          <Alert variant="info">
            <div style={styles.disclaimerContent}>
              <span style={styles.disclaimerIcon}>⚠️</span>
              <div style={styles.disclaimerText}>
                <strong>Important:</strong> AI suggestions are for reference only. 
                All blockchain transactions require manual confirmation. 
                AI does not access your wallet or execute any on-chain operations.
              </div>
            </div>
          </Alert>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  compactContainer: {
    padding: '8px 12px',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  compactHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  aiIcon: {
    fontSize: '16px',
  },
  statusText: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1A1A1A',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  container: {
    padding: '20px',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    fontSize: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  healthSection: {
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '8px',
  },
  healthHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  healthStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  healthDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  healthText: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1A1A1A',
  },
  featuresSection: {
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '8px',
  },
  featuresTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 12px 0',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  featureIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
  },
  featureContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  featureName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  featureDesc: {
    fontSize: '12px',
    color: '#6B7280',
  },
  usageSection: {
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '8px',
  },
  usageTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 12px 0',
  },
  usageList: {
    fontSize: '14px',
    color: '#4B5563',
    margin: 0,
    paddingLeft: '16px',
    lineHeight: '1.6',
  },
  usageItem: {
    marginBottom: '6px',
  },
  disclaimer: {
    marginTop: '4px',
  },
  disclaimerContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  disclaimerIcon: {
    fontSize: '16px',
    marginTop: '2px',
  },
  disclaimerText: {
    fontSize: '13px',
    lineHeight: '1.5',
  },
};