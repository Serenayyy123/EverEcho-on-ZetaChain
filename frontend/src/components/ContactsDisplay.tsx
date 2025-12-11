import React from 'react';
import { ethers } from 'ethers';
import { useContacts } from '../hooks/useContacts';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { getCategorySuccessTheme } from '../utils/categoryTheme';

interface ContactsDisplayProps {
  task: {
    taskId: number | string;
    metadata?: {
      category?: string;
    };
  };
  signer: ethers.Signer | null;
  address: string | null;
}

/**
 * ContactsDisplay 组件
 * 显示任务的联系方式，支持解密和 Telegram 链接生成
 */
export function ContactsDisplay({ task, signer, address }: ContactsDisplayProps) {
  const { contacts, loading, error, loadContacts } = useContacts(
    task.taskId,
    signer,
    address
  );

  // 获取category主题色用于文字颜色
  const categoryTheme = task.metadata?.category 
    ? getCategorySuccessTheme(task.metadata.category)
    : null;

  // 解析联系方式，识别 Telegram 和 Email
  const parseContacts = (contactsText: string) => {
    console.log('[ContactsDisplay] Parsing contacts:', contactsText);
    
    const telegramMatch = contactsText.match(/@(\w+)/);
    const emailMatch = contactsText.match(/[\w.-]+@[\w.-]+\.\w+/);
    
    console.log('[ContactsDisplay] Telegram match:', telegramMatch);
    console.log('[ContactsDisplay] Email match:', emailMatch);
    
    return {
      telegram: telegramMatch ? telegramMatch[1] : null,
      email: emailMatch ? emailMatch[0] : null,
      raw: contactsText,
    };
  };

  const parsedContacts = contacts ? parseContacts(contacts) : null;
  console.log('[ContactsDisplay] Parsed contacts:', parsedContacts);

  return (
    <Card category={task.metadata?.category}>
      <h3 style={{
        ...styles.title,
        color: categoryTheme?.text || styles.title.color,
      }}>📱 Contact Information</h3>
      
      {!contacts ? (
        <div style={styles.loadSection}>
          <p style={styles.hint}>
            Click below to decrypt and view the Creator's contact information
          </p>
          <Button 
            onClick={loadContacts} 
            loading={loading}
            variant="ghost"
            theme="light"
          >
            🔓 View Contacts
          </Button>
        </div>
      ) : (
        <div style={styles.contactsContainer}>
          {/* Telegram 链接 */}
          {parsedContacts?.telegram && (
            <div style={styles.contactItem}>
              <div style={styles.contactLabel}>
                <span style={styles.icon}>📱</span>
                <span>Telegram:</span>
              </div>
              <a 
                href={`https://t.me/${parsedContacts.telegram}?text=Hi, I'm interested in task #${task.taskId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                <Button variant="ghost" size="sm" theme="light">
                  💬 Open Telegram Chat
                </Button>
              </a>
            </div>
          )}

          {/* Email */}
          {parsedContacts?.email && (
            <div style={styles.contactItem}>
              <div style={styles.contactLabel}>
                <span style={styles.icon}>📧</span>
                <span>Email:</span>
              </div>
              <a 
                href={`mailto:${parsedContacts.email}?subject=Regarding Task #${task.taskId}`}
                style={styles.emailLink}
              >
                {parsedContacts.email}
              </a>
            </div>
          )}

          {/* 原始联系方式（作为备用） */}
          {parsedContacts && !parsedContacts.telegram && !parsedContacts.email && (
            <div style={styles.contactItem}>
              <div style={styles.contactLabel}>
                <span style={styles.icon}>🔗</span>
                <span>Contact:</span>
              </div>
              <span style={styles.rawValue}>{parsedContacts.raw}</span>
            </div>
          )}

          {/* 显示原始数据（调试用） */}
          <div style={styles.rawSection}>
            <details>
              <summary style={styles.rawSummary}>Show raw data</summary>
              <div style={styles.rawData}>
                <code>{parsedContacts?.raw}</code>
              </div>
            </details>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="error">
          Failed to load contacts: {error}
        </Alert>
      )}
    </Card>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 20px 0',
  },
  loadSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
  },
  hint: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: 0,
  },
  contactsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  contactLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  },
  icon: {
    fontSize: '20px',
  },
  link: {
    textDecoration: 'none',
  },
  emailLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
  },
  rawValue: {
    fontSize: '14px',
    color: '#111827',
    fontWeight: 500,
  },
  rawSection: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
  },
  rawSummary: {
    fontSize: '12px',
    color: '#6b7280',
    cursor: 'pointer',
    userSelect: 'none',
  },
  rawData: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#374151',
    wordBreak: 'break-all',
  },
};
