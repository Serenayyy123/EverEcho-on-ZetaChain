/**
 * Dispute Resolution Help Page
 * Stage 4.5: UX Hardening - Dispute & Exception Handling
 * 
 * 🎯 Purpose: Provide clear guidance on handling task disputes and issues
 * ✅ Non-protocol solutions: help docs, FAQ, contact info
 * ❌ No automated dispute resolution or contract modifications
 */

import { DarkPageLayout } from '../components/layout/DarkPageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export function DisputeHelp() {
  return (
    <DarkPageLayout title="Dispute Resolution & Help" theme="light">
      <div style={styles.container}>
        <Card>
          <div style={styles.content}>
            <div style={styles.header}>
              <h1 style={styles.title}>🛡️ Dispute Resolution & Help Center</h1>
              <p style={styles.subtitle}>
                Get help with task issues, disputes, and common problems
              </p>
            </div>

            <div style={styles.quickActions}>
              <h2 style={styles.sectionTitle}>🚨 Need Immediate Help?</h2>
              <div style={styles.actionGrid}>
                <div style={styles.actionCard}>
                  <div style={styles.actionIcon}>📞</div>
                  <h3 style={styles.actionTitle}>Contact Support</h3>
                  <p style={styles.actionDesc}>Get help from our team</p>
                  <Button variant="primary" size="sm" theme="light">
                    support@everecho.io
                  </Button>
                </div>
                <div style={styles.actionCard}>
                  <div style={styles.actionIcon}>💬</div>
                  <h3 style={styles.actionTitle}>Community Help</h3>
                  <p style={styles.actionDesc}>Ask the community</p>
                  <Button variant="secondary" size="sm" theme="light">
                    Join Discord
                  </Button>
                </div>
                <div style={styles.actionCard}>
                  <div style={styles.actionIcon}>📚</div>
                  <h3 style={styles.actionTitle}>Documentation</h3>
                  <p style={styles.actionDesc}>Read detailed guides</p>
                  <Button variant="secondary" size="sm" theme="light">
                    View Docs
                  </Button>
                </div>
              </div>
            </div>

            <div style={styles.faqSection}>
              <h2 style={styles.sectionTitle}>❓ Frequently Asked Questions</h2>
              
              <div style={styles.faqGrid}>
                <div style={styles.faqItem}>
                  <h3 style={styles.faqQuestion}>
                    🤔 Helper accepted my task but isn't responding
                  </h3>
                  <div style={styles.faqAnswer}>
                    <p><strong>What happens:</strong> Task is locked, but Helper is unresponsive.</p>
                    <p><strong>Solution:</strong></p>
                    <ul>
                      <li>Wait for the automatic timeout (usually 7 days)</li>
                      <li>After timeout, you can reclaim your funds automatically</li>
                      <li>Contact support if timeout doesn't work</li>
                    </ul>
                    <Alert variant="info">
                      Your funds are safe in escrow and will be returned if the Helper doesn't deliver.
                    </Alert>
                  </div>
                </div>

                <div style={styles.faqItem}>
                  <h3 style={styles.faqQuestion}>
                    😤 Helper delivered poor quality work
                  </h3>
                  <div style={styles.faqAnswer}>
                    <p><strong>What to do:</strong></p>
                    <ol>
                      <li>Don't confirm completion yet</li>
                      <li>Use the "Request Fix" feature to ask for improvements</li>
                      <li>Provide specific feedback on what needs to be fixed</li>
                      <li>If Helper refuses to fix, contact support with evidence</li>
                    </ol>
                    <Alert variant="warning">
                      Once you confirm completion, funds are released and cannot be reversed.
                    </Alert>
                  </div>
                </div>

                <div style={styles.faqItem}>
                  <h3 style={styles.faqQuestion}>
                    💸 I accidentally sent the wrong amount
                  </h3>
                  <div style={styles.faqAnswer}>
                    <p><strong>If task is still Open:</strong></p>
                    <ul>
                      <li>You can cancel the task and get a full refund</li>
                      <li>Create a new task with the correct amount</li>
                    </ul>
                    <p><strong>If task is already accepted:</strong></p>
                    <ul>
                      <li>Contact the Helper to discuss the situation</li>
                      <li>You may need to create an additional task for the difference</li>
                      <li>Contact support for guidance</li>
                    </ul>
                  </div>
                </div>

                <div style={styles.faqItem}>
                  <h3 style={styles.faqQuestion}>
                    🔒 Creator won't confirm my completed work
                  </h3>
                  <div style={styles.faqAnswer}>
                    <p><strong>Protection for Helpers:</strong></p>
                    <ul>
                      <li>After submitting work, there's an automatic timeout period</li>
                      <li>If Creator doesn't respond within the timeout, you get paid automatically</li>
                      <li>Keep evidence of your completed work</li>
                      <li>Contact support if you believe the Creator is acting unfairly</li>
                    </ul>
                    <Alert variant="success">
                      EverEcho protects Helpers with automatic timeout payments.
                    </Alert>
                  </div>
                </div>

                <div style={styles.faqItem}>
                  <h3 style={styles.faqQuestion}>
                    🤖 AI gave me wrong suggestions
                  </h3>
                  <div style={styles.faqAnswer}>
                    <p><strong>Remember:</strong> AI suggestions are just starting points.</p>
                    <ul>
                      <li>Always review and edit AI-generated content</li>
                      <li>AI doesn't understand your specific requirements</li>
                      <li>You're responsible for the final task details</li>
                      <li>Use AI as inspiration, not as final decisions</li>
                    </ul>
                    <Alert variant="warning">
                      AI suggestions are not guarantees. Always verify and customize them.
                    </Alert>
                  </div>
                </div>

                <div style={styles.faqItem}>
                  <h3 style={styles.faqQuestion}>
                    💰 I don't understand the fee structure
                  </h3>
                  <div style={styles.faqAnswer}>
                    <p><strong>Simple breakdown:</strong></p>
                    <ul>
                      <li><strong>You pay:</strong> Reward + 10 ECHO posting fee</li>
                      <li><strong>Helper gets:</strong> 98% of reward + your deposit + 10 ECHO</li>
                      <li><strong>Burned:</strong> 2% of reward (protocol fee)</li>
                    </ul>
                    <p><strong>Educational Example (100 ECHO reward):</strong></p>
                    <ul>
                      <li>You pay: 110 ECHO total</li>
                      <li>Helper receives: 208 ECHO total</li>
                      <li>Burned: 2 ECHO</li>
                    </ul>
                    <p><strong>Beta Example (10 ECHO reward):</strong></p>
                    <ul>
                      <li>You pay: 20 ECHO total</li>
                      <li>Helper receives: 29.8 ECHO total</li>
                      <li>Burned: 0.2 ECHO</li>
                    </ul>
                    <Alert variant="info">
                      Helpers earn more because they get your deposit back - this is by design!
                    </Alert>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.processSection}>
              <h2 style={styles.sectionTitle}>⚖️ Formal Dispute Process</h2>
              
              <div style={styles.processSteps}>
                <div style={styles.processStep}>
                  <div style={styles.stepNumber}>1</div>
                  <div style={styles.stepContent}>
                    <h3 style={styles.stepTitle}>Try Direct Communication</h3>
                    <p style={styles.stepDesc}>
                      Contact the other party using the provided contact information. 
                      Many issues can be resolved through clear communication.
                    </p>
                  </div>
                </div>

                <div style={styles.processStep}>
                  <div style={styles.stepNumber}>2</div>
                  <div style={styles.stepContent}>
                    <h3 style={styles.stepTitle}>Use Platform Features</h3>
                    <p style={styles.stepDesc}>
                      Try "Request Fix" for quality issues, or wait for automatic 
                      timeout if the other party is unresponsive.
                    </p>
                  </div>
                </div>

                <div style={styles.processStep}>
                  <div style={styles.stepNumber}>3</div>
                  <div style={styles.stepContent}>
                    <h3 style={styles.stepTitle}>Contact Support</h3>
                    <p style={styles.stepDesc}>
                      If direct communication fails, email support@everecho.io with:
                      task details, screenshots, and a clear explanation of the issue.
                    </p>
                  </div>
                </div>

                <div style={styles.processStep}>
                  <div style={styles.stepNumber}>4</div>
                  <div style={styles.stepContent}>
                    <h3 style={styles.stepTitle}>Community Mediation</h3>
                    <p style={styles.stepDesc}>
                      For complex disputes, we may involve trusted community members 
                      to help mediate and find a fair solution.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.preventionSection}>
              <h2 style={styles.sectionTitle}>🛡️ Preventing Disputes</h2>
              
              <div style={styles.preventionGrid}>
                <div style={styles.preventionCard}>
                  <h3 style={styles.preventionTitle}>📝 Clear Task Descriptions</h3>
                  <ul style={styles.preventionList}>
                    <li>Be specific about deliverables</li>
                    <li>Set clear deadlines</li>
                    <li>Provide examples or references</li>
                    <li>Define acceptance criteria</li>
                  </ul>
                </div>

                <div style={styles.preventionCard}>
                  <h3 style={styles.preventionTitle}>💬 Good Communication</h3>
                  <ul style={styles.preventionList}>
                    <li>Respond promptly to messages</li>
                    <li>Ask questions if anything is unclear</li>
                    <li>Provide regular progress updates</li>
                    <li>Be professional and respectful</li>
                  </ul>
                </div>

                <div style={styles.preventionCard}>
                  <h3 style={styles.preventionTitle}>⏰ Realistic Expectations</h3>
                  <ul style={styles.preventionList}>
                    <li>Set reasonable deadlines</li>
                    <li>Price tasks fairly</li>
                    <li>Don't rush the selection process</li>
                    <li>Review profiles and past work</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={styles.contactSection}>
              <h2 style={styles.sectionTitle}>📞 Contact Information</h2>
              
              <div style={styles.contactGrid}>
                <div style={styles.contactCard}>
                  <h3 style={styles.contactTitle}>📧 Email Support</h3>
                  <p style={styles.contactInfo}>support@everecho.io</p>
                  <p style={styles.contactNote}>Response time: 24-48 hours</p>
                </div>

                <div style={styles.contactCard}>
                  <h3 style={styles.contactTitle}>💬 Community Discord</h3>
                  <p style={styles.contactInfo}>discord.gg/everecho</p>
                  <p style={styles.contactNote}>Real-time community help</p>
                </div>

                <div style={styles.contactCard}>
                  <h3 style={styles.contactTitle}>📚 Documentation</h3>
                  <p style={styles.contactInfo}>docs.everecho.io</p>
                  <p style={styles.contactNote}>Comprehensive guides</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DarkPageLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  content: {
    padding: '32px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1A1A1A',
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '18px',
    color: '#6B7280',
    margin: 0,
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 20px 0',
  },
  quickActions: {
    marginBottom: '48px',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  actionCard: {
    padding: '24px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    textAlign: 'center',
  },
  actionIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  actionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  actionDesc: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 16px 0',
  },
  faqSection: {
    marginBottom: '48px',
  },
  faqGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  faqItem: {
    padding: '24px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
  },
  faqQuestion: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 16px 0',
  },
  faqAnswer: {
    fontSize: '14px',
    color: '#4B5563',
    lineHeight: '1.6',
  },
  processSection: {
    marginBottom: '48px',
  },
  processSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  processStep: {
    display: 'flex',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
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
    margin: '0 0 8px 0',
  },
  stepDesc: {
    fontSize: '14px',
    color: '#4B5563',
    margin: 0,
    lineHeight: '1.5',
  },
  preventionSection: {
    marginBottom: '48px',
  },
  preventionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  preventionCard: {
    padding: '20px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
  },
  preventionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 12px 0',
  },
  preventionList: {
    fontSize: '14px',
    color: '#4B5563',
    margin: 0,
    paddingLeft: '16px',
    lineHeight: '1.6',
  },
  contactSection: {
    marginBottom: '32px',
  },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  contactCard: {
    padding: '20px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    textAlign: 'center',
  },
  contactTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  contactInfo: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#2563EB',
    margin: '0 0 4px 0',
  },
  contactNote: {
    fontSize: '12px',
    color: '#6B7280',
    margin: 0,
  },
};