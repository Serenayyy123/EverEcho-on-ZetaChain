import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

/**
 * 首页 V2 - Design Tokens 系统实现
 * Deep space / Quiet luxury / Soft glow
 * 保持所有原有逻辑不变，只升级视觉
 */

export function HomeV2() {
  const navigate = useNavigate();
  const { address, isRegistered, isCheckingRegistration, isConnecting, error, connect } = useWallet();

  // 连接后检查注册状态（逻辑完全不变）
  useEffect(() => {
    console.log('[Home] useEffect - address:', address, 'isRegistered:', isRegistered, 'isChecking:', isCheckingRegistration);
    
    if (!address) {
      console.log('[Home] No address, staying on home page');
      return;
    }
    
    if (isCheckingRegistration) {
      console.log('[Home] Still checking registration, waiting...');
      return;
    }
    
    if (isRegistered) {
      console.log('[Home] ✅ User registered, redirecting to tasks...');
      navigate('/tasks');
    } else {
      console.log('[Home] ❌ User not registered, redirecting to register...');
      navigate('/register');
    }
  }, [address, isRegistered, isCheckingRegistration, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Film-poster Serif Title - UI only */}
        <h1 style={styles.title}>EverEcho</h1>

        {!address ? (
          <>
            {/* Premium Button with Design Tokens - UI only */}
            <button
              onClick={() => connect(true)}
              disabled={isConnecting}
              style={{
                ...styles.primaryButton,
                ...(isConnecting ? styles.buttonLoading : {}),
              }}
              onMouseEnter={(e) => {
                if (!isConnecting) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.background = 'var(--btn-primary-bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isConnecting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'var(--btn-primary-bg)';
                }
              }}
              onMouseDown={(e) => {
                if (!isConnecting) {
                  e.currentTarget.style.transform = 'translateY(1px)';
                }
              }}
              onMouseUp={(e) => {
                if (!isConnecting) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>

            {error && (
              <div style={styles.errorMessage}>
                {error}
              </div>
            )}
          </>
        ) : (
          <p style={styles.statusText}>
            Checking registration...
          </p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  // Deep space background with Design Tokens - UI only
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-gradient)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    animation: 'breathe 10s ease-in-out infinite',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '64px',
  },
  // Film-poster Serif Title with Design Tokens - UI only
  title: {
    fontSize: 'var(--h1-size)',
    fontWeight: 'var(--h1-weight)' as any,
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-100)',
    margin: 0,
    letterSpacing: 'var(--h1-letter)',
    lineHeight: 'var(--h1-line)' as any,
    textShadow: 'var(--shadow-soft)',
    animation: 'fadeInUp var(--dur-slow) var(--ease-out)',
  },
  // Premium Button with Design Tokens - UI only
  primaryButton: {
    padding: '18px 56px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    color: 'var(--btn-primary-text)',
    background: 'var(--btn-primary-bg)',
    border: 'none',
    borderRadius: 'var(--radius-button)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: 'var(--btn-primary-shadow)',
    transition: 'all var(--dur-med) var(--ease-out)',
    letterSpacing: '0.02em',
    outline: 'none',
  },
  buttonLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  statusText: {
    fontSize: 'var(--tagline-size)',
    fontWeight: 'var(--tagline-weight)' as any,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-300)',
    margin: 0,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  errorMessage: {
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--error)',
    padding: '12px 24px',
    background: 'var(--error-bg)',
    border: '1px solid var(--error)',
    borderRadius: 'var(--radius-input)',
    maxWidth: '400px',
  },
};
