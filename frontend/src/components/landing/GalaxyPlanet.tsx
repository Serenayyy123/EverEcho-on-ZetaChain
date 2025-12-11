import { useEffect, useState } from 'react';

/**
 * 银河行星 + 星环 - 纯 CSS 3D 实现
 * Timeline (7.5s total):
 * 0-2.5s: 粒子聚合成行星 + 星环
 * 2.5-4.5s: 行星悬浮（轻微呼吸/自转）
 * 4.5-6.5s: 3D 散开（保留深度）
 * 5.5-7.5s: 标题滑入
 */

interface Particle {
  id: number;
  type: 'planet' | 'ring';
  // 初始位置
  startX: number;
  startY: number;
  // 目标位置（行星表面或星环）
  targetX: number;
  targetY: number;
  targetZ: number; // 深度（-100 到 100）
  // 散开位置
  burstX: number;
  burstY: number;
  burstZ: number;
  // 视觉属性
  size: number;
  color: string;
  brightness: number;
  blur: number;
  delay: number;
}

type Phase = 'gather' | 'hold' | 'burst' | 'title' | 'idle';

export function GalaxyPlanet() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [phase, setPhase] = useState<Phase>('gather');

  useEffect(() => {
    // 检测 prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setPhase('title');
      return;
    }

    // 生成粒子
    const newParticles: Particle[] = [];
    const planetRadius = 140;
    const ringRadiusInner = 200;
    const ringRadiusOuter = 280;
    const ringTilt = 25; // 星环倾斜角度

    // 1. 行星粒子（球体）- 200个
    const planetCount = 200;
    for (let i = 0; i < planetCount; i++) {
      // Fibonacci sphere 均匀分布
      const phi = Math.acos(1 - 2 * (i + 0.5) / planetCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      
      const x = planetRadius * Math.sin(phi) * Math.cos(theta);
      const y = planetRadius * Math.sin(phi) * Math.sin(theta);
      const z = planetRadius * Math.cos(phi);

      // 添加表面噪声
      const noise = (Math.random() - 0.5) * 12;
      const targetX = x + noise;
      const targetY = y + noise;
      const targetZ = z + noise;

      // 初始位置：屏幕边缘
      const angle = Math.random() * Math.PI * 2;
      const distance = 500 + Math.random() * 200;
      const startX = Math.cos(angle) * distance;
      const startY = Math.sin(angle) * distance;

      // 散开：沿法线方向
      const normal = Math.sqrt(x * x + y * y + z * z);
      const burstDistance = 400 + Math.random() * 150;
      const burstX = (x / normal) * burstDistance + (Math.random() - 0.5) * 80;
      const burstY = (y / normal) * burstDistance + (Math.random() - 0.5) * 80;
      const burstZ = (z / normal) * burstDistance + (Math.random() - 0.5) * 80;

      // 颜色：深蓝紫星云色，核心亮边缘暗
      const depthFactor = (targetZ / planetRadius + 1) / 2; // 0-1
      const brightness = 0.5 + depthFactor * 0.5;
      
      const colorRand = Math.random();
      let color;
      if (colorRand < 0.4) {
        // 深蓝
        const r = Math.floor((60 + Math.random() * 30) * brightness);
        const g = Math.floor((80 + Math.random() * 40) * brightness);
        const b = Math.floor((140 + Math.random() * 60) * brightness);
        color = `rgba(${r}, ${g}, ${b}, 0.85)`;
      } else if (colorRand < 0.7) {
        // 紫色
        const r = Math.floor((100 + Math.random() * 40) * brightness);
        const g = Math.floor((70 + Math.random() * 30) * brightness);
        const b = Math.floor((150 + Math.random() * 50) * brightness);
        color = `rgba(${r}, ${g}, ${b}, 0.8)`;
      } else {
        // 青绿
        const r = Math.floor((50 + Math.random() * 30) * brightness);
        const g = Math.floor((120 + Math.random() * 40) * brightness);
        const b = Math.floor((130 + Math.random() * 50) * brightness);
        color = `rgba(${r}, ${g}, ${b}, 0.75)`;
      }

      const size = 2 + depthFactor * 2.5;
      const blur = 0.5 + (1 - depthFactor) * 1;

      newParticles.push({
        id: i,
        type: 'planet',
        startX,
        startY,
        targetX,
        targetY,
        targetZ,
        burstX,
        burstY,
        burstZ,
        size,
        color,
        brightness,
        blur,
        delay: Math.random() * 0.4,
      });
    }

    // 2. 星环粒子（椭圆环）- 120个
    const ringCount = 120;
    for (let i = 0; i < ringCount; i++) {
      const t = (i / ringCount) * Math.PI * 2;
      const radius = ringRadiusInner + Math.random() * (ringRadiusOuter - ringRadiusInner);
      
      // 椭圆环
      let x = radius * Math.cos(t);
      let y = radius * Math.sin(t) * 0.3; // 压扁
      let z = radius * Math.sin(t) * 0.7;

      // 应用倾斜（绕 X 轴旋转）
      const tiltRad = (ringTilt * Math.PI) / 180;
      const yRotated = y * Math.cos(tiltRad) - z * Math.sin(tiltRad);
      const zRotated = y * Math.sin(tiltRad) + z * Math.cos(tiltRad);

      const targetX = x;
      const targetY = yRotated;
      const targetZ = zRotated;

      // 初始位置
      const angle = Math.random() * Math.PI * 2;
      const distance = 500 + Math.random() * 200;
      const startX = Math.cos(angle) * distance;
      const startY = Math.sin(angle) * distance;

      // 散开
      const burstAngle = Math.atan2(targetY, targetX);
      const burstDistance = 500 + Math.random() * 200;
      const burstX = Math.cos(burstAngle) * burstDistance;
      const burstY = Math.sin(burstAngle) * burstDistance;
      const burstZ = targetZ * 1.5 + (Math.random() - 0.5) * 100;

      // 星环颜色：淡蓝紫，偏亮
      const depthFactor = (targetZ / ringRadiusOuter + 1) / 2;
      const brightness = 0.7 + depthFactor * 0.3;
      
      const r = Math.floor((150 + Math.random() * 40) * brightness);
      const g = Math.floor((170 + Math.random() * 40) * brightness);
      const b = Math.floor((220 + Math.random() * 30) * brightness);
      const color = `rgba(${r}, ${g}, ${b}, 0.7)`;

      const size = 1.5 + depthFactor * 1.5;
      const blur = 0.8 + (1 - depthFactor) * 1.2;

      newParticles.push({
        id: planetCount + i,
        type: 'ring',
        startX,
        startY,
        targetX,
        targetY,
        targetZ,
        burstX,
        burstY,
        burstZ,
        size,
        color,
        brightness,
        blur,
        delay: Math.random() * 0.4,
      });
    }

    setParticles(newParticles);

    // 动画时间线
    const gatherTimer = setTimeout(() => setPhase('hold'), 2500);
    const holdTimer = setTimeout(() => setPhase('burst'), 4500);
    const burstTimer = setTimeout(() => setPhase('title'), 6500);
    const titleTimer = setTimeout(() => setPhase('idle'), 7500);

    return () => {
      clearTimeout(gatherTimer);
      clearTimeout(holdTimer);
      clearTimeout(burstTimer);
      clearTimeout(titleTimer);
    };
  }, []);

  return (
    <div style={styles.container}>
      {/* 背景微小恒星 */}
      <div style={styles.starsBackground} />

      <div style={styles.particleContainer}>
        {particles.map((particle) => {
          // 根据 Z 深度计算视觉属性
          const depthScale = 1 + particle.targetZ / 300; // 近大远小
          const depthOpacity = 0.4 + (particle.targetZ + 100) / 200 * 0.6; // 近亮远暗

          return (
            <div
              key={particle.id}
              className={`particle phase-${phase} type-${particle.type}`}
              style={{
                ...styles.particle,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
                filter: `blur(${particle.blur}px) brightness(${particle.brightness})`,
                animationDelay: `${particle.delay}s`,
                '--start-x': `${particle.startX}px`,
                '--start-y': `${particle.startY}px`,
                '--target-x': `${particle.targetX}px`,
                '--target-y': `${particle.targetY}px`,
                '--target-z': `${particle.targetZ}`,
                '--burst-x': `${particle.burstX}px`,
                '--burst-y': `${particle.burstY}px`,
                '--burst-z': `${particle.burstZ}`,
                '--depth-scale': depthScale,
                '--depth-opacity': depthOpacity,
                zIndex: Math.floor(particle.targetZ + 200),
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes gather {
          0% {
            transform: translate(var(--start-x), var(--start-y)) scale(0.5);
            opacity: 0.2;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(var(--depth-scale));
            opacity: var(--depth-opacity);
          }
        }

        @keyframes hold {
          0%, 100% {
            transform: translate(var(--target-x), var(--target-y)) scale(var(--depth-scale)) rotate(0deg);
          }
          50% {
            transform: translate(
              calc(var(--target-x) * 1.015),
              calc(var(--target-y) * 1.015)
            ) scale(calc(var(--depth-scale) * 1.02)) rotate(1deg);
          }
        }

        @keyframes burst {
          0% {
            transform: translate(var(--target-x), var(--target-y)) scale(var(--depth-scale));
            opacity: var(--depth-opacity);
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--burst-x), var(--burst-y)) scale(calc(var(--depth-scale) * 0.4));
            opacity: 0.1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(var(--burst-x), var(--burst-y));
          }
          25% {
            transform: translate(
              calc(var(--burst-x) + 8px),
              calc(var(--burst-y) - 6px)
            );
          }
          50% {
            transform: translate(
              calc(var(--burst-x) - 5px),
              calc(var(--burst-y) + 5px)
            );
          }
          75% {
            transform: translate(
              calc(var(--burst-x) - 6px),
              calc(var(--burst-y) - 4px)
            );
          }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
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
          animation: gather 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .particle.phase-hold {
          animation: hold 2s ease-in-out infinite;
          transform: translate(var(--target-x), var(--target-y)) scale(var(--depth-scale));
          opacity: var(--depth-opacity);
        }

        .particle.phase-burst {
          animation: burst 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .particle.phase-title,
        .particle.phase-idle {
          animation: float 15s ease-in-out infinite;
          opacity: 0.08;
        }

        /* 星环粒子特殊处理 */
        .particle.type-ring.phase-hold {
          animation: hold 2.5s ease-in-out infinite;
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
  starsBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `
      radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.3), transparent),
      radial-gradient(1px 1px at 60% 70%, rgba(255, 255, 255, 0.25), transparent),
      radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.2), transparent),
      radial-gradient(1px 1px at 80% 10%, rgba(255, 255, 255, 0.3), transparent),
      radial-gradient(1px 1px at 90% 60%, rgba(255, 255, 255, 0.25), transparent),
      radial-gradient(1px 1px at 33% 50%, rgba(255, 255, 255, 0.2), transparent),
      radial-gradient(1px 1px at 15% 80%, rgba(255, 255, 255, 0.3), transparent)
    `,
    backgroundSize: '200% 200%',
    animation: 'twinkle 8s ease-in-out infinite',
    opacity: 0.4,
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
