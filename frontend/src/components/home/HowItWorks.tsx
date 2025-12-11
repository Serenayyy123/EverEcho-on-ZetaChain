import React from 'react';

/**
 * How It Works - 用户流程说明组件
 * 展示EverEcho的核心流程：注册获得ECHO → 发布任务消耗ECHO → 帮助他人赚取ECHO
 * 使用做旧卡片风格，带毛边效果
 * 动画效果：渐入 + 悬停 + 脉冲圆点
 */
export function HowItWorks() {
  const steps = [
    {
      number: 1,
      color: '#FF6B35', // 橙色 - 品牌色
      title: 'REGISTER',
      subtitle: '100 ECHO FREE',
      rotation: -2, // 轻微旋转
    },
    {
      number: 2,
      color: '#4A90E2', // 蓝色 - 冷静
      title: 'NEED HELP?',
      subtitle: 'SPEND ECHO',
      rotation: 1,
    },
    {
      number: 3,
      color: '#10B981', // 绿色 - 成长
      title: 'GIVE HELP?',
      subtitle: 'EARN ECHO',
      rotation: -1,
    },
  ];

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideInFade {
          0% {
            opacity: 0;
            transform: translateX(50px) rotate(0deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotate(var(--rotation));
          }
        }

        @keyframes pulseDot {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.8;
          }
        }

        .how-it-works-card {
          animation: slideInFade 0.6s ease-out forwards;
          opacity: 0;
        }

        .how-it-works-card:nth-child(1) {
          animation-delay: 0.2s;
        }

        .how-it-works-card:nth-child(2) {
          animation-delay: 0.4s;
        }

        .how-it-works-card:nth-child(3) {
          animation-delay: 0.6s;
        }

        .how-it-works-card:hover {
          transform: translateY(-4px) rotate(var(--rotation)) !important;
          box-shadow: 6px 8px 0 rgba(0, 0, 0, 0.25) !important;
        }

        .pulse-dot {
          animation: pulseDot 2s ease-in-out infinite;
        }
      `}</style>

      <div style={styles.cardsContainer}>
        {steps.map((step, index) => (
          <div
            key={step.number}
            className="how-it-works-card"
            style={{
              ...styles.card,
              // @ts-ignore - CSS变量
              '--rotation': `${step.rotation}deg`,
            }}
          >
            {/* 彩色圆点 - 带脉冲动画 */}
            <div
              className="pulse-dot"
              style={{
                ...styles.dot,
                backgroundColor: step.color,
                animationDelay: `${index * 0.3}s`,
              }}
            />

            {/* 卡片内容 */}
            <div style={styles.cardContent}>
              <span style={styles.title}>{step.title}</span>
              <span style={styles.arrow}>→</span>
              <span style={styles.subtitle}>{step.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    padding: '0',
  },
  cardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    maxWidth: '380px',
  },
  card: {
    background: '#FFFEF9',
    padding: '20px 24px',
    borderRadius: '8px',
    border: '3px solid #1A1A1A',
    boxShadow: '5px 5px 0 rgba(0, 0, 0, 0.2)',
    position: 'relative',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    // 毛边效果 - 使用 filter 模拟纸张质感
    filter: 'contrast(1.05) brightness(0.98)',
    // 做旧纹理
    backgroundImage: `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.01) 2px,
        rgba(0, 0, 0, 0.01) 4px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.01) 2px,
        rgba(0, 0, 0, 0.01) 4px
      )
    `,
  },
  dot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    position: 'absolute',
    top: '20px',
    left: '24px',
    border: '2px solid #1A1A1A',
  },
  cardContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: '32px',
    fontSize: '18px',
    fontWeight: 700,
    color: '#1A1A1A',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  title: {
    fontWeight: 900,
    fontSize: '22px',
    color: '#1A1A1A',
  },
  arrow: {
    color: '#9CA3AF',
    fontWeight: 700,
    fontSize: '20px',
  },
  subtitle: {
    color: '#6B7280',
    fontWeight: 700,
    fontSize: '18px',
  },
};
