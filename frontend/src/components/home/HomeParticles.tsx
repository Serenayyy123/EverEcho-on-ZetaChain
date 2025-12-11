import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Three.js 粒子动画 - 银河花朵/宇宙绽放
 * 聚合成花朵 → 能量脉冲 → 螺旋爆散（带尾迹）
 * 纯 Three.js，不用 @react-three/fiber
 */

// ============ 可调参数 ============
const PETAL_COUNT = 8;                    // 花瓣数量（6-12）
const CORE_PARTICLES = 400;               // 花芯粒子数（增加密度）
const PETAL_PARTICLES = 1200;             // 花瓣粒子数（增加密度）
const DUST_PARTICLES = 200;               // 背景星尘数
const BLOOM_INTENSITY = 2.2;              // 光晕强度（增强发光）
const EXPLODE_SPIRAL = 1.6;               // 爆散螺旋强度（增强螺旋）

const DURATION_GATHER = 2500;             // 聚合时长(ms)
const DURATION_BREATHE = 500;             // 呼吸时长(ms)
const DURATION_PULSE = 300;               // 能量脉冲时长(ms)（延长）
const DURATION_BURST = 2300;              // 爆散时长(ms)
const DURATION_WAIT = 1500;               // 等待时长(ms)
// ==================================

interface ParticleConfig {
  petalCount: number;
  coreParticles: number;
  petalParticles: number;
  dustParticles: number;
  bloomIntensity: number;
  explodeSpiral: number;
  gatherDuration: number;
  breatheDuration: number;
  pulseDuration: number;
  burstDuration: number;
  waitDuration: number;
}

const DEFAULT_CONFIG: ParticleConfig = {
  petalCount: PETAL_COUNT,
  coreParticles: CORE_PARTICLES,
  petalParticles: PETAL_PARTICLES,
  dustParticles: DUST_PARTICLES,
  bloomIntensity: BLOOM_INTENSITY,
  explodeSpiral: EXPLODE_SPIRAL,
  gatherDuration: DURATION_GATHER,
  breatheDuration: DURATION_BREATHE,
  pulseDuration: DURATION_PULSE,
  burstDuration: DURATION_BURST,
  waitDuration: DURATION_WAIT,
};

export function HomeParticles({ config = DEFAULT_CONFIG }: { config?: Partial<ParticleConfig> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  console.log('[HomeParticles] Component mounted');

  useEffect(() => {
    console.log('[HomeParticles] useEffect running, containerRef:', containerRef.current);
    if (!containerRef.current) {
      console.log('[HomeParticles] No container ref, returning');
      return;
    }
    console.log('[HomeParticles] Starting Three.js setup...');

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Particle data
    interface ParticleData {
      startPos: THREE.Vector3;
      targetPos: THREE.Vector3;
      burstVel: THREE.Vector3;
      tangentVel: THREE.Vector3;
      color: THREE.Color;
      type: 'core' | 'petal' | 'dust';
      petalIndex?: number;
      size: number;
    }

    const particles: ParticleData[] = [];
    const totalParticles = fullConfig.coreParticles + fullConfig.petalParticles + fullConfig.dustParticles;
    const positions: Float32Array = new Float32Array(totalParticles * 3);
    const colors: Float32Array = new Float32Array(totalParticles * 3);
    const sizes: Float32Array = new Float32Array(totalParticles);

    // 1. Generate core particles (dense center, Gaussian distribution)
    for (let i = 0; i < fullConfig.coreParticles; i++) {
      // Gaussian distribution for dense core
      const r = Math.abs(THREE.MathUtils.randFloatSpread(0.4)) * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const startAngle = Math.random() * Math.PI * 2;
      const startDist = 10 + Math.random() * 5;
      const startPos = new THREE.Vector3(
        Math.cos(startAngle) * startDist,
        (Math.random() - 0.5) * 12,
        Math.sin(startAngle) * startDist
      );

      const targetPos = new THREE.Vector3(x, y, z);

      // Burst: slow radial
      const burstDir = targetPos.clone().normalize();
      const burstVel = burstDir.multiplyScalar(1.5 + Math.random() * 1);
      const tangentVel = new THREE.Vector3();

      // Core colors: bright cyan-green to blue (增强亮度和饱和度)
      const coreHue = 0.15 + Math.random() * 0.15; // cyan-green
      const color = new THREE.Color().setHSL(coreHue, 0.9, 0.7 + Math.random() * 0.2); // 高饱和度，高亮度

      const size = 0.12 + Math.random() * 0.08; // 增大花芯粒子

      particles.push({ startPos, targetPos, burstVel, tangentVel, color, type: 'core', size });
    }

    // 2. Generate petal particles (curved Bezier bands)
    for (let petalIdx = 0; petalIdx < fullConfig.petalCount; petalIdx++) {
      const petalAngle = (petalIdx / fullConfig.petalCount) * Math.PI * 2;
      const particlesPerPetal = Math.floor(fullConfig.petalParticles / fullConfig.petalCount);

      for (let i = 0; i < particlesPerPetal; i++) {
        const t = i / particlesPerPetal; // 0 to 1 along petal

        // Bezier curve for petal shape (curved outward)
        const baseRadius = 0.5 + t * 2.5;
        const curvature = Math.sin(t * Math.PI) * 0.8; // Petal curve

        const angle = petalAngle + curvature * 0.3;
        const x = baseRadius * Math.cos(angle);
        const y = baseRadius * Math.sin(angle);
        const z = (Math.random() - 0.5) * 0.3 * (1 - t); // Slight depth variation

        const startAngle = Math.random() * Math.PI * 2;
        const startDist = 10 + Math.random() * 5;
        const startPos = new THREE.Vector3(
          Math.cos(startAngle) * startDist,
          (Math.random() - 0.5) * 12,
          Math.sin(startAngle) * startDist
        );

        const targetPos = new THREE.Vector3(x, y, z);

        // Burst: along petal tangent (spiral)
        const radialDir = new THREE.Vector3(x, y, 0).normalize();
        const tangentDir = new THREE.Vector3(-radialDir.y, radialDir.x, 0);
        
        const burstVel = radialDir.multiplyScalar(2.5 + Math.random() * 1.5);
        const tangentVel = tangentDir.multiplyScalar(fullConfig.explodeSpiral * (1.5 + Math.random() * 1));

        // Petal colors: gradient from cyan-green (inner) to blue-purple (outer) with gold accents
        let color: THREE.Color;
        if (Math.random() < 0.12) {
          // Gold accent particles (12% - 增加金色比例)
          color = new THREE.Color(1.0, 0.8, 0.4); // 更亮的金色
        } else {
          const hue = 0.5 + t * 0.15 + Math.random() * 0.05; // cyan to blue-purple
          const sat = 0.85 + Math.random() * 0.15; // 增强饱和度
          const light = 0.6 + (1 - t) * 0.2 + Math.random() * 0.1; // 增强亮度
          color = new THREE.Color().setHSL(hue, sat, light);
        }

        const size = 0.08 + Math.random() * 0.06; // 增大花瓣粒子

        particles.push({ 
          startPos, 
          targetPos, 
          burstVel, 
          tangentVel, 
          color, 
          type: 'petal', 
          petalIndex: petalIdx,
          size 
        });
      }
    }

    // 3. Generate background dust particles (very faint, almost static)
    for (let i = 0; i < fullConfig.dustParticles; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 15;
      const z = (Math.random() - 0.5) * 10;

      const startPos = new THREE.Vector3(x, y, z);
      const targetPos = startPos.clone();
      const burstVel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      const tangentVel = new THREE.Vector3();

      // Dust colors: very faint white-blue
      const color = new THREE.Color(0.6 + Math.random() * 0.3, 0.6 + Math.random() * 0.3, 0.7 + Math.random() * 0.3);

      const size = 0.04 + Math.random() * 0.03; // 增大星尘粒子

      particles.push({ startPos, targetPos, burstVel, tangentVel, color, type: 'dust', size });
    }

    // Initialize positions at start
    particles.forEach((p, i) => {
      positions[i * 3] = p.startPos.x;
      positions[i * 3 + 1] = p.startPos.y;
      positions[i * 3 + 2] = p.startPos.z;
      colors[i * 3] = p.color.r;
      colors[i * 3 + 1] = p.color.g;
      colors[i * 3 + 2] = p.color.b;
      sizes[i] = p.size;
    });

    // Create particle system
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        bloomIntensity: { value: fullConfig.bloomIntensity },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 100.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float bloomIntensity;
        varying vec3 vColor;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // Soft glow
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha = pow(alpha, 1.5) * bloomIntensity;
          
          gl_FragColor = vec4(vColor * bloomIntensity, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Animation state
    let phase: 'gather' | 'breathe' | 'pulse' | 'burst' | 'wait' = 'gather';
    let phaseStartTime = Date.now();
    let animationId: number;

    // Animation loop
    function animate() {
      animationId = requestAnimationFrame(animate);

      const now = Date.now();
      const elapsed = now - phaseStartTime;
      const posAttr = geometry.getAttribute('position');
      const sizeAttr = geometry.getAttribute('size');

      if (phase === 'gather') {
        const t = Math.min(elapsed / fullConfig.gatherDuration, 1);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad

        particles.forEach((p, i) => {
          if (p.type === 'dust') {
            // Dust stays in place
            posAttr.setXYZ(i, p.startPos.x, p.startPos.y, p.startPos.z);
          } else {
            const pos = p.startPos.clone().lerp(p.targetPos, eased);
            posAttr.setXYZ(i, pos.x, pos.y, pos.z);
          }
        });

        if (t >= 1) {
          phase = 'breathe';
          phaseStartTime = now;
        }
      } else if (phase === 'breathe') {
        const t = elapsed / fullConfig.breatheDuration;
        const breathe = Math.sin(t * Math.PI * 2) * 0.02; // Very subtle

        particles.forEach((p, i) => {
          if (p.type !== 'dust') {
            const pos = p.targetPos.clone().multiplyScalar(1 + breathe);
            posAttr.setXYZ(i, pos.x, pos.y, pos.z);
          }
        });

        if (elapsed >= fullConfig.breatheDuration) {
          phase = 'pulse';
          phaseStartTime = now;
        }
      } else if (phase === 'pulse') {
        const t = elapsed / fullConfig.pulseDuration;
        const pulse = Math.sin(t * Math.PI) * 0.3 + 1; // Energy pulse

        particles.forEach((p, i) => {
          if (p.type !== 'dust') {
            const scale = 1 + pulse * 0.15;
            const pos = p.targetPos.clone().multiplyScalar(scale);
            posAttr.setXYZ(i, pos.x, pos.y, pos.z);
            sizeAttr.setX(i, p.size * pulse);
          }
        });

        material.uniforms.bloomIntensity.value = fullConfig.bloomIntensity * pulse;

        if (elapsed >= fullConfig.pulseDuration) {
          phase = 'burst';
          phaseStartTime = now;
          material.uniforms.bloomIntensity.value = fullConfig.bloomIntensity;
        }
      } else if (phase === 'burst') {
        const t = Math.min(elapsed / fullConfig.burstDuration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic

        particles.forEach((p, i) => {
          if (p.type === 'dust') {
            // Dust drifts slowly
            const drift = p.burstVel.clone().multiplyScalar(eased * 0.5);
            const pos = p.startPos.clone().add(drift);
            posAttr.setXYZ(i, pos.x, pos.y, pos.z);
          } else {
            // Spiral burst with trail decay
            const spiralPos = p.targetPos.clone()
              .add(p.burstVel.clone().multiplyScalar(eased * 3.5))
              .add(p.tangentVel.clone().multiplyScalar(eased * eased * 2));
            
            posAttr.setXYZ(i, spiralPos.x, spiralPos.y, spiralPos.z);
            
            // Trail fade
            const fade = 1 - eased * 0.8;
            sizeAttr.setX(i, p.size * fade);
          }
        });

        // Fade out bloom
        material.uniforms.bloomIntensity.value = fullConfig.bloomIntensity * (1 - t * 0.6);

        if (t >= 1) {
          phase = 'wait';
          phaseStartTime = now;
        }
      } else if (phase === 'wait') {
        if (elapsed >= fullConfig.waitDuration) {
          // Reset
          particles.forEach((p, i) => {
            posAttr.setXYZ(i, p.startPos.x, p.startPos.y, p.startPos.z);
            sizeAttr.setX(i, p.size);
          });
          material.uniforms.bloomIntensity.value = fullConfig.bloomIntensity;
          phase = 'gather';
          phaseStartTime = now;
        }
      }

      posAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;

      // Very slow rotation
      points.rotation.z += 0.0003;

      renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [fullConfig]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
