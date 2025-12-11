import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { Button } from '../ui/Button';

export interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PageLayout({ children, title, showNav = true, maxWidth = 'lg' }: PageLayoutProps) {
  const navigate = useNavigate();
  const { address, chainId, disconnect, connect, isConnecting } = useWallet();

  const maxWidthValues: Record<string, string> = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  };

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#0a0a0f',
  };

  const headerStyles: React.CSSProperties = {
    backgroundColor: '#0d0d0d',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '0 32px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  };

  const headerContentStyles: React.CSSProperties = {
    maxWidth: maxWidthValues[maxWidth],
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const logoStyles: React.CSSProperties = {
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
  };

  const logoOrangeStyles: React.CSSProperties = {
    color: '#FF6B35',
  };

  const logoWhiteStyles: React.CSSProperties = {
    color: '#FFFFFF',
  };

  const navStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginLeft: '60px',
    flex: 1,
  };

  const addressStyles: React.CSSProperties = {
    fontSize: '13px',
    color: '#d1d5db',
    padding: '8px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginLeft: 'auto',
  };

  const mainStyles: React.CSSProperties = {
    maxWidth: maxWidthValues[maxWidth],
    margin: '0 auto',
    padding: '24px',
  };

  const getChainName = (chainId: number | null): string => {
    if (!chainId) return 'Unknown';
    const names: Record<number, string> = {
      11155111: 'Sepolia',
      31337: 'Hardhat',
      1: 'Mainnet',
    };
    return names[chainId] || `Chain ${chainId}`;
  };

  return (
    <div style={containerStyles}>
      {showNav && (
        <header style={headerStyles}>
          <div style={headerContentStyles}>
            <h1 style={logoStyles} onClick={() => navigate('/')}>
              <span style={logoOrangeStyles}>Ever</span>
              <span style={logoWhiteStyles}>Echo</span>
            </h1>
            <nav style={navStyles}>
              {address ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/tasks')}
                    style={{
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: '14px',
                      fontWeight: 500,
                      padding: '8px 16px',
                    }}
                  >
                    Tasks
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/publish')}
                    style={{
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: '14px',
                      fontWeight: 500,
                      padding: '8px 16px',
                    }}
                  >
                    Publish
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    style={{
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: '14px',
                      fontWeight: 500,
                      padding: '8px 16px',
                    }}
                  >
                    Profile
                  </Button>
                  <div style={addressStyles}>
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#9ca3af', 
                      marginBottom: '2px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {getChainName(chainId)}
                    </div>
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={disconnect}
                    style={{
                      fontSize: '13px',
                      padding: '8px 14px',
                    }}
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
      <main style={mainStyles}>
        {title && (
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 700,
              fontFamily: '"Comic Sans MS", "Chalkboard SE", "Bradley Hand", cursive',
              marginBottom: '24px',
              color: '#111827',
            }}
          >
            {title}
          </h2>
        )}
        {children}
      </main>
    </div>
  );
}
