import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { Alert } from '../components/ui/Alert';
import { HowItWorks } from '../components/home/HowItWorks';


/**
 * 首页 - 钱包连接
 * 冻结点 2.2-P0-F1：连接钱包 → 检查 isRegistered
 * 冻结点 1.1-4：注册状态来源唯一 - 只使用 useWallet 提供的 isRegistered
 */

export function Home() {
  const navigate = useNavigate();
  const { address, isRegistered, isCheckingRegistration, isConnecting, error, connect } = useWallet();

  // 连接后检查注册状态（使用 useWallet 的 isRegistered，唯一数据源）
  useEffect(() => {
    console.log('[Home] useEffect - address:', address, 'isRegistered:', isRegistered, 'isChecking:', isCheckingRegistration);
    
    if (!address) {
      console.log('[Home] No address, staying on home page');
      return;
    }
    
    // 等待注册状态检查完成
    if (isCheckingRegistration) {
      console.log('[Home] Still checking registration, waiting...');
      return;
    }
    
    // 使用 useWallet 提供的 isRegistered 状态（冻结点 1.1-4）
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
      <style>{`
        @keyframes popIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* 响应式媒体查询 */
        @media (max-width: 1500px) and (min-width: 1200px) {
          .home-title-group {
            left: 25% !important;
          }
          
          .home-right-section {
            right: 2% !important;
            top: 50% !important;
            transform: translateY(-50%) scale(0.9) !important;
          }
        }

        @media (max-width: 1199px) {
          .home-title-group {
            left: 50% !important;
            top: 15vh !important;
            transform: translateX(-50%) !important;
          }
          
          .home-title {
            font-size: 90px !important;
          }
          
          .home-zetachain-text {
            font-size: 24px !important;
            bottom: -25px !important;
            right: -80px !important;
          }
          
          .home-right-section {
            position: static !important;
            margin: 20px auto !important;
            transform: none !important;
            display: flex !important;
            justify-content: center !important;
            padding-top: 40px !important;
          }
          
          .home-button-area {
            bottom: 4vh !important;
          }
        }

        @media (max-width: 1200px) {
          .home-title {
            font-size: 70px !important;
          }
          
          .home-zetachain-text {
            font-size: 20px !important;
            bottom: -20px !important;
            right: -60px !important;
          }
        }

        @media (max-width: 768px) {
          .home-title-group {
            top: 10vh !important;
          }
          
          .home-title {
            font-size: 50px !important;
          }
          
          .home-zetachain-text {
            font-size: 16px !important;
            bottom: -15px !important;
            right: -40px !important;
          }
          
          .home-button-area {
            bottom: 2vh !important;
          }
        }
      `}</style>

      {/* EverEcho标题 - 左侧黄金分割位置 */}
      <div className="home-title-group" style={styles.titleGroup}>
        <div style={styles.titleContainer}>
          <h1 className="home-title" style={styles.title}>
            <span style={styles.titleOrange}>
              {'Ever'.split('').map((letter, index) => (
                <span
                  key={`ever-${index}`}
                  style={{
                    ...styles.letter,
                    animation: `popIn 0.5s ease ${index * 0.1}s forwards`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.animation = 'none';
                    e.currentTarget.style.transform = 'scale(1.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {letter}
                </span>
              ))}
            </span>
            <span style={styles.titleWhite}>
              {'Echo'.split('').map((letter, index) => (
                <span
                  key={`echo-${index}`}
                  style={{
                    ...styles.letter,
                    animation: `popIn 0.5s ease ${(index + 4) * 0.1}s forwards`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.animation = 'none';
                    e.currentTarget.style.transform = 'scale(1.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {letter}
                </span>
              ))}
            </span>
          </h1>
          <span className="home-zetachain-text" style={styles.zetachainText}>on ZetaChain</span>
        </div>

      </div>

      {/* Connect Wallet按钮 - 中间底部 */}
      <div className="home-button-area" style={styles.buttonArea}>
        {!address ? (
          <>
            <div style={styles.buttonWrapper}>
              <button
                onClick={() => connect(true)}
                disabled={isConnecting}
                style={styles.customButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {isConnecting ? 'Connecting...' : (
                  <>
                    <span style={styles.buttonTextOrange}>Connect</span>
                    <span style={styles.buttonTextWhite}>Wallet</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}
          </>
        ) : (
          <>
            <Alert variant="info">
              Connected: {address.slice(0, 10)}...{address.slice(-8)}
            </Alert>
            <p style={styles.hint}>
              🔄 Checking registration status...
            </p>
          </>
        )}

        {/* Created By - 按钮下方 */}
        <p style={styles.credit}>
          Created By: <a href="https://x.com/369Serena" target="_blank" rel="noopener noreferrer" style={styles.creditLink}>
            <svg style={styles.twitterIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            @369Serena
          </a>
        </p>
      </div>

      {/* How It Works流程图 - 右侧 */}
      <div className="home-right-section" style={styles.rightSection}>
        <HowItWorks />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#F5F1E8',
    padding: '20px',
    position: 'relative',
  },
  titleGroup: {
    position: 'absolute',
    top: '30vh',
    left: '38%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  titleContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '120px',
    fontWeight: 800,
    margin: 0,
    textAlign: 'center',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },
  titleOrange: {
    color: '#FF6B35',
    WebkitTextStroke: '2px #1A1A1A',
    textShadow: '4px 4px 0 rgba(0, 0, 0, 0.15)',
    display: 'inline-block',
    transform: 'rotate(-3deg)',
    marginRight: '8px',
  },
  titleWhite: {
    color: '#FFFFFF',
    WebkitTextStroke: '2px #1A1A1A',
    textShadow: '3px 3px 0 rgba(0, 0, 0, 0.15)',
    display: 'inline-block',
    transform: 'rotate(2deg)',
  },
  buttonArea: {
    position: 'absolute',
    bottom: '8vh',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  buttonWrapper: {
    maxWidth: '300px',
    margin: '0 auto',
  },
  hint: {
    fontSize: '14px',
    color: '#6B7280',
    marginTop: '16px',
  },
  tagline: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#1A1A1A',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: '12px 0 8px 0',
  },
  credit: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  creditLink: {
    color: '#FF6B35',
    textDecoration: 'none',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  twitterIcon: {
    width: '16px',
    height: '16px',
    display: 'inline-block',
  },
  rightSection: {
    position: 'absolute',
    top: '50%',
    right: '5%',
    transform: 'translateY(-50%)',
  },
  customButton: {
    padding: '16px 40px',
    fontSize: '24px',
    fontWeight: 700,
    borderRadius: '12px',
    border: '3px solid #1A1A1A',
    background: '#FF6B35',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    boxShadow: '4px 4px 0 rgba(0, 0, 0, 0.2)',
    color: '#FFFFFF',
    transform: 'scale(1)',
  },
  buttonTextOrange: {
    color: '#FFFFFF',
  },
  buttonTextWhite: {
    color: '#FFFFFF',
  },
  letter: {
    display: 'inline-block',
    transition: 'transform 0.2s ease',
    cursor: 'default',
  },
  zetachainText: {
    position: 'absolute',
    bottom: '-35px',
    right: '-120px',
    fontSize: '32px',
    fontWeight: 700,
    color: '#00D4AA',
    fontStyle: 'italic',
    transform: 'rotate(8deg)',
    animation: 'popIn 0.5s ease 0.8s forwards',
    opacity: 0,
  },
};
