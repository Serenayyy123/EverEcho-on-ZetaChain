import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { motion } from 'framer-motion';
import { ParticlePlanet } from '../components/landing/ParticlePlanet';

/**
 * Landing 页面 V2 - Three.js 粒子动画版本
 * 只改 UI，不动任何业务逻辑
 */

export function LandingV2() {
  const navigate = useNavigate();
  const { address, isRegistered, isCheckingRegistration, isConnecting, error, connect } = useWallet();
  const [showContent, setShowContent] = useState(false);

  // 原有的注册检查逻辑（完全不变）
  useEffect(() => {
    if (!address) return;
    if (isCheckingRegistration) return;
    
    if (isRegistered) {
      navigate('/tasks');
    } else {
      navigate('/register');
    }
  }, [address, isRegistered, isCheckingRegistration, navigate]);

  // 标题滑入时机：5秒后（等待粒子散开）
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container}>
      {/* 粒子行星动画 */}
      <ParticlePlanet />

      {/* 内容层 */}
      <div style={styles.contentLayer}>
        {/* 标题 - 5秒后慢滑入 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={styles.titleContainer}
        >
          <h1 style={styles.title}>EverEcho</h1>
          <p style={styles.subtitle}>Built for creators.</p>
          
          {/* Builder 推特信息 */}
          <a
            href="https://twitter.com/BuilderHandle"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.builderLink}
          >
            by @BuilderHandle
          </a>
        </motion.div>

        {/* Connect Wallet 按钮 - 保留原有逻辑 */}
        {!address && showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={() => connect(true)}
              disabled={isConnecting}
              style={{
                ...styles.connectButton,
                opacity: isConnecting ? 0.6 : 1,
                cursor: isConnecting ? 'not-allowed' : 'pointer',
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </motion.div>
        )}

        {/* 错误提示 */}
        {error && showContent && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.error}
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    // 高级黑背景 - 深邃渐变
    background: `
      radial-gradient(circle at 50% 30%, #0C1020 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, #0A0B10 0%, transparent 60%),
      linear-gradient(180deg, #05060A 0%, #0A0B10 100%)
    `,
  },
  
  contentLayer: {
    position: 'relative',
    zIndex: 1,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },

  titleContainer: {
    textAlign: 'center',
    marginBottom: '48px',
  },

  title: {
    fontSize: 'clamp(56px, 7vw, 96px)',
    fontWeight: 600,
    fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
    color: '#F7F7F5',
    margin: 0,
    letterSpacing: '-0.02em',
    lineHeight: 0.95,
    textShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
    marginBottom: '16px',
  },

  subtitle: {
    fontSize: '18px',
    fontWeight: 400,
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    color: 'rgba(247, 247, 245, 0.7)',
    margin: 0,
    letterSpacing: '0.02em',
    marginBottom: '24px',
  },

  builderLink: {
    fontSize: '14px',
    fontWeight: 400,
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    color: 'rgba(247, 247, 245, 0.5)',
    textDecoration: 'none',
    letterSpacing: '0.01em',
    transition: 'color 200ms ease',
    display: 'inline-block',
  },

  connectButton: {
    padding: '18px 56px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    color: '#F7F7F5',
    background: 'linear-gradient(90deg, #495CFF 0%, #7A5CFF 100%)',
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      inset 0 -6px 12px rgba(0, 0, 0, 0.35),
      0 10px 30px rgba(76, 92, 255, 0.35)
    `,
    transition: 'all 280ms cubic-bezier(0.16, 1, 0.3, 1)',
    letterSpacing: '0.02em',
    outline: 'none',
  },

  error: {
    marginTop: '24px',
    color: '#FF6B6B',
    fontSize: '14px',
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
  },
};
