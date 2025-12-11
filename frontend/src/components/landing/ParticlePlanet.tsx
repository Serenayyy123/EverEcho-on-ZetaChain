import { useEffect, useState } from 'react';

/**
 * 粒子行星动画 - 纯 CSS 实现
 * Phase A (0-3s): 聚合成球体
 * Phase B (3-4s): 稳定悬浮
 * Phase C (4-5.5s): 冲击散开
 * Phase D (5-6.5s): 标题慢滑入
 */

interface Particle {
  id: number;
  // 初始位置（屏幕边缘）
  startX: number;
  startY: number;
  // 球体表面位置（3D 投影到 2D）
  sphereX: number;
  sphereY: number;
  sphereZ: number; // 用于亮度/大小
  // 散开位置
  burstX: number;
  burstY: number;
  size: number;
  color: string;
  delay: number;
}

type Phase = 'gather' | 'hold' | 'burst' | 'title' | 'idle';

export function ParticlePlanet() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [phase, setPhase] = useState<Phase>('gather');

  useEffect(() => {
    // 检测 prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setPhase('title');
      return;
    }

    // 生成粒子 - 球体分布
    const particleCount = 150;
    const newParticles: Particle[] = [];
    const sphereRadius = 120; // 球体半径（像素）

    for (let i = 0; i < particleCount; i++) {
      // Fibonacci sphere 分布（均匀球面采样）
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      
      // 球面坐标转笛卡尔坐标
      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const z = sphereRadius * Math.cos(phi);

      // 添加少量噪声（行星表面凹凸感）
      const noise = (Math.random() - 0.5) * 15;
      const sphereX = x + noise;
      const sphereY = y + noise;
      const sphereZ = z + noise;

      // 初始位置：屏幕边缘随机
      const angle = Math.random() * Math.PI * 2;
      const distance = 400 + Math.random() * 200;
      const startX = Math.cos(angle) * distance;
      const startY = Math.sin(angle) * distance;

      // 散开位置：从球心向外
      const burstAngle = Math.atan2(sphereY, sphereX);
      const burstDistance = 300 + Math.random() * 200;
      const burstX = Math.cos(burstAngle) * burstDistance;
      const burstY = Math.sin(burstAngle) * burstDistance;

      // 颜色：根据 Z 轴（深度）调整亮度
      const brightness = 0.6 + (sphereZ / sphereRadius) * 0.4;
      const colorChoice = Math.random();
      let color;
      if (colorChoice < 0.7) {
        // 暖白色
        const r = Math.floor(240 * brightness);
        const g = Math.floor(237 * brightness);
        const b = Math.floor(230 * brightness);
        color = `rgba(${r}, ${g}, ${b}, 0.8)`;
      } else {
        // 淡蓝紫
        const r = Math.floor((180 + Math.random() * 40) * brightness);
        const g = Math.floor((190 + Math.random() * 30) * brightness);
        const b = Math.floor((220 + Math.random() * 30) * brightness);
        color = `rgba(${r}, ${g}, ${b}, 0.7)`;
      }

      // 大小：根据 Z 轴（深度）调整
      const size = 2 + (sphereZ / sphereRadius + 1) * 1.5;

      newParticles.push({
        id: i,
        startX,
        startY,
        sphereX,
        sphereY,
        sphereZ,
        burstX,
        burstY,
        size,
        color,
        delay: Math.random() * 0.3,
      });
    }

    setParticles(newParticles);

    // 动画时间线（更慢）
    const gatherTimer = setTimeout(() => setPhase('hold'), 3000);
    const holdTimer = setTimeout(() => setPhase('burst'), 4000);
    const burstTimer = setTimeout(() => setPhase('title'), 5500);
    const titleTimer = setTimeout(() => setPhase('idle'), 6500);

    return () => {
      clearTimeout(gatherTimer);
      clearTimeout(holdTimer);
      clearTimeout(burstTimer);
      clearTimeout(titleTimer);
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.particleContainer}>
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`particle phase-${phase}`}
            style={{
              ...styles.particle,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              animationDelay: `${particle.delay}s`,
              '--start-x': `${particle.startX}px`,
              '--start-y': `${particle.startY}px`,
              '--sphere-x': `${particle.sphereX}px`,
              '--sphere-y': `${particle.sphereY}px`,
              '--burst-x': `${particle.burstX}px`,
              '--burst-y': `${particle.burstY}px`,
              zIndex: Math.floor(particle.sphereZ + 100),
            } as React.CSSProperties}
          />
        ))}
      </div>

      <style>{`
        @keyframes gather {
          0% {
            transform: translate(var(--start-x), var(--start-y));
            opacity: 0.3;
          }
          100% {
            transform: translate(var(--sphere-x), var(--sphere-y));
            opacity: 0.9;
          }
        }

        @keyframes hold {
          0%, 100% {
            transform: translate(var(--sphere-x), var(--sphere-y)) rotate(0deg);
          }
          50% {
            transform: translate(
              calc(var(--sphere-x) * 1.02),
              calc(var(--sphere-y) * 1.02)
            ) rotate(2deg);
          }
        }

        @keyframes burst {
          0% {
            transform: translate(var(--sphere-x), var(--sphere-y)) scale(1);
            opacity: 0.9;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--burst-x), var(--burst-y)) scale(0.3);
            opacity: 0.2;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(var(--burst-x), var(--burst-y));
          }
          25% {
            transform: translate(
              calc(var(--burst-x) + 5px),
              calc(var(--burst-y) - 5px)
            );
          }
          50% {
            transform: translate(
              calc(var(--burst-x) - 3px),
              calc(var(--burst-y) + 3px)
            );
          }
          75% {
            transform: translate(
              calc(var(--burst-x) - 5px),
              calc(var(--burst-y) - 3px)
            );
          }
        }

        .particle {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          pointer-events: none;
          will-change: transform, opacity;
        }

        .particle.phase-gather {
          animation: gather 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .particle.phase-hold {
          animation: hold 1s ease-in-out infinite;
          transform: translate(var(--sphere-x), var(--sphere-y));
        }

        .particle.phase-burst {
          animation: burst 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .particle.phase-title,
        .particle.phase-idle {
          animation: float 12s ease-in-out infinite;
          opacity: 0.15;
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  particleContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  },
  particle: {
    position: 'absolute',
  },
};
