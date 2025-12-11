import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { motion } from 'framer-motion';
import { GalaxyPlanet } from '../components/landing/GalaxyPlanet';

/**
 * Home 页面 - 银河行星版本
 * 粒子聚合 → 行星+星环 → 3D散开 → 标题滑入
 * 只改 UI，不动任何业务逻辑
 */

export function HomeGalaxy() {
  const navigate = useNavigate();
  const { address, isRegistered, isCheckingRegistration, isConnecting, error, connect } = useWallet();
  const [showContent, setShowContent] = useState(false);

  // 原有的注册检查逻辑（完全不变）
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

  // 标题滑入时机：5.5秒后（等待粒子散开到60%）
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 5500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container}>
      {/* 银河行星动画 */}
      <GalaxyPlanet />

      {/* 内容层 */}
      <div style={styles.contentLayer}>
        {/* 标题 - 5.5秒后慢滑入 */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={showContent ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          style={styles.titleContainer}
        >
          <h1 style={styles.title}>EverEcho</h1>
          
          {/* Builder 推特信息 */}
          <motion.a
            href="https://twitter.com/BuilderHandle"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.builderLink}
            initial={{ opacity: 0 }}
            animate={showContent ? { opacity: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ color: 'rgba(247, 247, 245, 0.9)' }}
          >
            by @BuilderHandle
          </motion.a>
        </motion.div>

        {/* Connect Wallet 按钮 - 保留原有逻辑 */}
        {!address && showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={() => connect(true)}
              disabled={isConnecting}
              style={{
                ...styles.connectButton,
                opacity: isConnecting ? 0.6 : 1,
                cursor: isConnecting ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isConnecting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `
                    inset 0 1px 0 rgba(255, 255, 255, 0.3),
                    inset 0 -6px 12px rgba(0, 0, 0, 0.4),
                    0 12px 40px rgba(100, 120, 255, 0.5)
                  `;
                }
              }}
              onMouseLeave={(e) => {
                if (!isConnecting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    inset 0 -6px 12px rgba(0, 0, 0, 0.3),
                    0 10px 30px rgba(80, 100, 200, 0.3)
                  `;
                }
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </motion.div>
        )}

        {/* 已连接状态 */}
        {address && showContent && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.statusText}
          >
            Checking registration...
          </motion.p>
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
    // 高级宇宙黑背景 - 深邃渐变 + 轻微星云雾
    background: `
      radial-gradient(ellipse at 50% 20%, rgba(30, 40, 80, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 70%, rgba(50, 30, 70, 0.12) 0%, transparent 60%),
      radial-gradient(circle at 20% 80%, rgba(20, 50, 80, 0.1) 0%, transparent 50%),
      linear-gradient(180deg, #030408 0%, #060810 50%, #0A0C15 100%)
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
    gap: '56px',
  },

  titleContainer: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },

  title: {
    fontSize: 'clamp(64px, 8vw, 110px)',
    fontWeight: 300,
    fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
    color: '#F7F7F5',
    margin: 0,
    letterSpacing: '0.08em', // 字距拉开
    lineHeight: 1,
    textShadow: `
      0 0 40px rgba(150, 170, 255, 0.3),
      0 8px 30px rgba(0, 0, 0, 0.6)
    `,
    textTransform: 'uppercase',
  },

  builderLink: {
    fontSize: '15px',
    fontWeight: 400,
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    color: 'rgba(247, 247, 245, 0.45)',
    textDecoration: 'none',
    letterSpacing: '0.03em',
    transition: 'color 300ms cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'inline-block',
  },

  connectButton: {
    padding: '20px 64px',
    fontSize: '15px',
    fontWeight: 500,
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    color: '#F7F7F5',
    // 冷色系渐变 - 深蓝紫
    background: 'linear-gradient(135deg, rgba(80, 100, 200, 0.9) 0%, rgba(100, 80, 180, 0.85) 100%)',
    // 玻璃质感边框
    border: '1px solid rgba(150, 170, 255, 0.25)',
    borderRadius: '999px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      inset 0 -6px 12px rgba(0, 0, 0, 0.3),
      0 10px 30px rgba(80, 100, 200, 0.3)
    `,
    transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
    letterSpacing: '0.04em',
    outline: 'none',
    textTransform: 'uppercase',
  },

  statusText: {
    fontSize: '14px',
    fontWeight: 400,
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    color: 'rgba(247, 247, 245, 0.5)',
    margin: 0,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },

  error: {
    marginTop: '24px',
    color: 'rgba(255, 120, 120, 0.9)',
    fontSize: '14px',
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    padding: '12px 24px',
    background: 'rgba(255, 80, 80, 0.1)',
    border: '1px solid rgba(255, 120, 120, 0.3)',
    borderRadius: '8px',
  },
};
