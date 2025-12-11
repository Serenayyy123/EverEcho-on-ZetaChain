import React, { useEffect, useState } from 'react';
import { ErrorDetails, formatErrorForCopy, copyToClipboard } from '../../utils/errorHandler';

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: ErrorDetails;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ type, message, details, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleCopy = async () => {
    if (details) {
      const text = formatErrorForCopy(details);
      const success = await copyToClipboard(text);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#d4edda',
          border: '#c3e6cb',
          text: '#155724',
          icon: '✓',
        };
      case 'error':
        return {
          bg: '#f8d7da',
          border: '#f5c6cb',
          text: '#721c24',
          icon: '✕',
        };
      case 'warning':
        return {
          bg: '#fff3cd',
          border: '#ffeaa7',
          text: '#856404',
          icon: '⚠',
        };
      case 'info':
        return {
          bg: '#d1ecf1',
          border: '#bee5eb',
          text: '#0c5460',
          icon: 'ℹ',
        };
    }
  };

  const typeStyles = getTypeStyles();

  if (!isVisible) return null;

  return (
    <div
      style={{
        ...styles.container,
        backgroundColor: typeStyles.bg,
        borderColor: typeStyles.border,
        color: typeStyles.text,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
      }}
    >
      <div style={styles.header}>
        <div style={styles.iconMessage}>
          <span style={styles.icon}>{typeStyles.icon}</span>
          <span style={styles.message}>{message}</span>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          style={styles.closeButton}
        >
          ×
        </button>
      </div>

      {details && (
        <div style={styles.detailsSection}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={styles.detailsToggle}
          >
            {showDetails ? '▼' : '▶'} {showDetails ? 'Hide' : 'Show'} Details
          </button>

          {showDetails && (
            <div style={styles.detailsContent}>
              {details.details && (
                <p style={styles.detailsText}>{details.details}</p>
              )}
              {details.action && (
                <p style={styles.actionText}>
                  <strong>Action:</strong> {details.action}
                </p>
              )}
              {details.copyable && (
                <button
                  onClick={handleCopy}
                  style={styles.copyButton}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Error Details'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    maxWidth: '400px',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 9999,
    transition: 'all 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  iconMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  icon: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  message: {
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '1.4',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    marginLeft: '8px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
  },
  detailsSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
  },
  detailsToggle: {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '4px 0',
    fontWeight: 500,
    opacity: 0.8,
  },
  detailsContent: {
    marginTop: '8px',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  detailsText: {
    margin: '4px 0',
    opacity: 0.9,
  },
  actionText: {
    margin: '8px 0',
    opacity: 0.9,
  },
  copyButton: {
    marginTop: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    fontWeight: 500,
  },
};

// Toast 容器管理器
export class ToastManager {
  private static toasts: Map<string, ToastProps> = new Map();
  private static listeners: Set<() => void> = new Set();

  static show(props: Omit<ToastProps, 'onClose'>) {
    const id = Date.now().toString();
    this.toasts.set(id, {
      ...props,
      onClose: () => {
        this.toasts.delete(id);
        this.notify();
      },
    });
    this.notify();
    return id;
  }

  static success(message: string, duration?: number) {
    return this.show({ type: 'success', message, duration });
  }

  static error(message: string, details?: ErrorDetails, duration?: number) {
    return this.show({ type: 'error', message, details, duration: duration || 10000 });
  }

  static warning(message: string, duration?: number) {
    return this.show({ type: 'warning', message, duration });
  }

  static info(message: string, duration?: number) {
    return this.show({ type: 'info', message, duration });
  }

  static getAll(): ToastProps[] {
    return Array.from(this.toasts.values());
  }

  static subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notify() {
    this.listeners.forEach(listener => listener());
  }
}
