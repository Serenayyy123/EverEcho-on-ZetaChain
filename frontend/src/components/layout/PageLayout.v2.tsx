import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { ButtonV2 } from '../ui/Button.v2';
import { themeV2 } from '../../styles/theme-v2';

export interface PageLayoutV2Props {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PageLayoutV2({ children, title, showNav = true, maxWidth = 'lg' }: PageLayoutV2Props) {
  const navigate = useNavigate();
  const { address, chainId, disconnect, connect, isConnecting } = useWallet();

  const maxWidthValues: Record<string, string> = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
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

  return (
    <div style={styles.container}>
      {/* 背景装饰 */}
      <div style={styles.bgDecoration} />
      
      {showNav && (
        <header style={styles.header}>
          <div style={{ ...styles.headerContent, maxWidth: maxWidthValues[maxWidth] }}>
            <h1 style={styles.logo} onClick={() => navigate('/')}>
              <span style={styles.logoIcon}>🔊</span>
              EverEcho
            </h1>
            <nav style={styles.nav}>
              {address ? (
                <>
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/tasks')}
                  >
                    Tasks
                  </ButtonV2>
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/publish')}
                  >
                    Publish
                  </ButtonV2>
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                  >
                    Profile
                  </ButtonV2>
                  <div style={styles.address}>
                    <div style={styles.chainName}>
                      {getChainName(chainId)}
                    </div>
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                  <ButtonV2
                    variant="danger"
                    size="sm"
                    onClick={disconnect}
                  >
                    Disconnect
                  </ButtonV2>
                </>
              ) : (
                <ButtonV2
                  variant="primary"
                  size="sm"
                  onClick={() => connect(true)}
                  loading={isConnecting}
                >
                  Connect Wallet
                </ButtonV2>
              )}
            </nav>
          </div>
        </header>
      )}
      
      <main style={{ ...styles.main, maxWidth: maxWidthValues[maxWidth] }}>
        {title && (
          <h2 style={styles.pageTitle}>
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
    background: themeV2.colors.bg.gradient,
    position: 'relative',
    overflow: 'hidden',
  },
  bgDecoration: {
    position: 'fixed',
    top: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '800px',
    height: '800px',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  header: {
    background: themeV2.glass.strong.background,
    backdropFilter: themeV2.glass.strong.backdropFilter,
    WebkitBackdropFilter: themeV2.glass.strong.backdropFilter,
    borderBottom: `1px solid ${themeV2.colors.border.light}`,
    padding: '16px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 700,
    background: themeV2.colors.brand.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    cursor: 'pointer',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
  },
  nav: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  address: {
    fontSize: '14px',
    color: themeV2.colors.text.secondary,
    padding: '8px 12px',
    background: themeV2.glass.light.background,
    backdropFilter: themeV2.glass.light.backdropFilter,
    border: themeV2.glass.light.border,
    borderRadius: themeV2.radius.sm,
  },
  chainName: {
    fontSize: '10px',
    color: themeV2.colors.text.muted,
    marginBottom: '2px',
  },
  main: {
    margin: '0 auto',
    padding: '24px',
    position: 'relative',
    zIndex: 1,
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '24px',
    color: themeV2.colors.text.primary,
    textShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
  },
};
