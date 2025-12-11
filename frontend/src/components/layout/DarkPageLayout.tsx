import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { Button } from '../ui/Button';

export interface DarkPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fullWidth?: boolean;
  theme?: 'dark' | 'light';
}

/**
 * 暗色/浅色主题页面布局
 * 只改样式，不改功能
 */
export function DarkPageLayout({
  children,
  title,
  showNav = true,
  maxWidth = 'lg',
  fullWidth = false,
  theme = 'dark'
}: DarkPageLayoutProps) {
  const navigate = useNavigate();
  const { address, chainId, disconnect, connect, isConnecting } = useWallet();
  
  const maxWidthValues: Record<string, string> = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    full: '100%',
  };

  const getChainName = (chainId: number | null): string => {
    if (!chainId) return 'Unknown';
    const names: Record<number, string> = {
      11155111: 'Sepolia',
      84532: 'Base Sepolia',
      31337: 'Hardhat',
      1: 'Mainnet',
    };
    return names[chainId] || `Chain ${chainId}`;
  };

  const containerStyle = theme === 'light'
    ? { ...styles.container, background: 'linear-gradient(135deg, #F5F3ED 0%, #E8E6DD 100%)' }
    : styles.container;

  // Header 始终保持深色，与 TaskSquareV2 一致
  const headerStyle = styles.header;
  const logoStyle = styles.logo;
  const logoOrangeStyle = styles.logoOrange;
  const logoWhiteStyle = styles.logoWhite;
  const navButtonStyle = styles.navButton;
  const addressStyle = styles.address;
  const chainNameStyle = styles.chainName;

  // 只有页面标题在浅色主题下使用深色文字
  const titleStyle = theme === 'light'
    ? { ...styles.title, color: '#1A1A1A' }
    : styles.title;

  return (
    <div style={containerStyle}>
      {showNav && (
        <header style={headerStyle}>
          <div style={{
            ...styles.headerContent,
            maxWidth: '100%',
          }}>
            <h1 style={logoStyle} onClick={() => navigate('/')}>
              <span style={logoOrangeStyle}>Ever</span>
              <span style={logoWhiteStyle}>Echo</span>
            </h1>
            <nav style={styles.nav}>
              {address ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/tasks')}
                    style={navButtonStyle}
                  >
                    Tasks
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/publish')}
                    style={navButtonStyle}
                  >
                    Publish
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    style={navButtonStyle}
                  >
                    Profile
                  </Button>
                  <div style={addressStyle}>
                    <div style={chainNameStyle}>
                      {getChainName(chainId)}
                    </div>
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={disconnect}
                    style={styles.disconnectButton}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => connect(true)}
                  loading={isConnecting}
                >
                  Connect Wallet
                </Button>
              )}
            </nav>
          </div>
        </header>
      )}
      <main style={{
        ...styles.main,
        maxWidth: fullWidth ? '100%' : maxWidthValues[maxWidth],
        padding: fullWidth ? '0' : '24px',
      }}>
        {title && (
          <h2 style={titleStyle}>
            {title}
          </h2>
        )}
        {children}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0f',
  },
  header: {
    backgroundColor: '#0d0d0d',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '0 32px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 700,
    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Bradley Hand", cursive',
    cursor: 'pointer',
    margin: 0,
    padding: '10px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'all 0.2s ease',
    letterSpacing: '0.5px',
  },
  logoOrange: {
    color: '#FF6B35',
  },
  logoWhite: {
    color: '#FFFFFF',
  },
  nav: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginLeft: '32px',
    flex: 1,
    justifyContent: 'flex-start',
  },
  navButton: {
    color: 'rgba(255, 255, 255, 0.85)',
    background: 'transparent',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    padding: '8px 16px',
    transition: 'all 0.2s ease',
    minWidth: '80px',
    textAlign: 'center',
  },
  address: {
    fontSize: '13px',
    color: '#d1d5db',
    padding: '8px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginLeft: 'auto',
    minWidth: '180px',
    textAlign: 'center',
  },
  chainName: {
    fontSize: '10px',
    color: '#9ca3af',
    marginBottom: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  disconnectButton: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    fontSize: '13px',
    padding: '8px 14px',
    minWidth: '100px',
    textAlign: 'center',
  },
  main: {
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Bradley Hand", cursive',
    marginBottom: '24px',
    color: '#e5e7eb',
  },
};
