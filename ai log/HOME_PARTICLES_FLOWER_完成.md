# Home 页银河花朵粒子动画 - 升级完成 ✨

## 🌸 效果升级

从"行星+环"升级为**"银河花朵/宇宙绽放"**，视觉效果明显更高级。

### 核心改进

**之前**：简单的球体 + 环
**现在**：精致的花朵结构 + 螺旋爆散 + 能量脉冲

## 🎨 视觉特点

### 花朵结构（3层）

1. **花芯**（300 粒子）
   - 高斯分布，密集中心
   - 颜色：明亮青绿色（cyan-green）
   - 爆散：慢速径向

2. **花瓣**（800 粒子，8 片）
   - 贝塞尔曲线弯曲带
   - 颜色渐变：青绿 → 蓝紫
   - 8% 金色高光点缀
   - 爆散：沿切线螺旋散开

3. **背景星尘**（150 粒子）
   - 极淡白蓝色
   - 几乎静止，轻微漂移

### 高级质感

- ✨ **自定义 Shader**：软光晕 + bloom 效果
- ✨ **Additive Blending**：发光叠加
- ✨ **深度衰减**：近大远小
- ✨ **尾迹淡出**：爆散时粒子拖尾

## 🎬 动画流程（7秒）

```
0s ────────────────────────────────────────────> 7.0s
│
├─ 0-2.5s ──┤  聚合 (Gather)
            粒子从远处吸聚成花朵形状
            │
            ├─ 2.5-3.0s ──┤  呼吸 (Breathe)
                          轻微脉动（±2%）
                          │
                          ├─ 3.0-3.2s ──┤  能量脉冲 (Pulse)
                                        亮度闪烁 + 微放大
                                        │
                                        ├─ 3.2-5.5s ──┤  螺旋爆散 (Burst)
                                                      沿花瓣切线螺旋散开
                                                      带尾迹淡出
                                                      │
                                                      ├─ 5.5-7.0s ──┤  等待 (Wait)
                                                                    渐隐准备循环
```

## 🎛️ 可调参数（文件顶部）

```typescript
// ============ 可调参数 ============
const PETAL_COUNT = 8;                    // 花瓣数量（6-12）
const CORE_PARTICLES = 300;               // 花芯粒子数
const PETAL_PARTICLES = 800;              // 花瓣粒子数
const DUST_PARTICLES = 150;               // 背景星尘数
const BLOOM_INTENSITY = 1.5;              // 光晕强度（1.0-2.5）
const EXPLODE_SPIRAL = 1.2;               // 爆散螺旋强度（0.5-2.0）

const DURATION_GATHER = 2500;             // 聚合时长(ms)
const DURATION_BREATHE = 500;             // 呼吸时长(ms)
const DURATION_PULSE = 200;               // 能量脉冲时长(ms)
const DURATION_BURST = 2300;              // 爆散时长(ms)
const DURATION_WAIT = 1500;               // 等待时长(ms)
// ==================================
```

### 快速调整建议

**更多花瓣**：
```typescript
const PETAL_COUNT = 10;  // 6-12 都好看
```

**更强光晕**：
```typescript
const BLOOM_INTENSITY = 2.0;  // 1.0-2.5
```

**更强螺旋**：
```typescript
const EXPLODE_SPIRAL = 1.8;  // 0.5-2.0
```

**更快节奏**：
```typescript
const DURATION_GATHER = 2000;   // 减少聚合时间
const DURATION_BURST = 1800;    // 减少爆散时间
```

**更多粒子**（性能允许）：
```typescript
const CORE_PARTICLES = 400;
const PETAL_PARTICLES = 1000;
```

## 🎨 颜色系统

### 花芯（第 70-72 行）
```typescript
// 青绿色系
const coreHue = 0.15 + Math.random() * 0.15; // HSL 色相
const color = new THREE.Color().setHSL(coreHue, 0.7, 0.6);
```

### 花瓣（第 110-120 行）
```typescript
// 金色高光（8%）
if (Math.random() < 0.08) {
  color = new THREE.Color(0.9, 0.7, 0.3);
} else {
  // 青绿 → 蓝紫渐变
  const hue = 0.5 + t * 0.15; // 从内到外
  color = new THREE.Color().setHSL(hue, 0.6, 0.5);
}
```

### 星尘（第 145 行）
```typescript
// 极淡白蓝
const color = new THREE.Color(0.6, 0.6, 0.7);
```

## 🔧 技术实现

### 自定义 Shader

```glsl
// Vertex Shader
attribute float size;
varying vec3 vColor;
void main() {
  vColor = color;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * 100.0 / -mvPosition.z;  // 深度衰减
  gl_Position = projectionMatrix * mvPosition;
}

// Fragment Shader
uniform float bloomIntensity;
varying vec3 vColor;
void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;
  
  // 软光晕
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  alpha = pow(alpha, 1.5) * bloomIntensity;
  
  gl_FragColor = vec4(vColor * bloomIntensity, alpha);
}
```

### 花瓣生成（贝塞尔曲线）

```typescript
const t = i / particlesPerPetal; // 0 到 1
const baseRadius = 0.5 + t * 2.5;
const curvature = Math.sin(t * Math.PI) * 0.8; // 弯曲
const angle = petalAngle + curvature * 0.3;
```

### 螺旋爆散

```typescript
// 径向速度
const burstVel = radialDir.multiplyScalar(2.5);
// 切线速度（螺旋）
const tangentVel = tangentDir.multiplyScalar(EXPLODE_SPIRAL * 1.5);

// 爆散时组合
const spiralPos = targetPos
  .add(burstVel.multiplyScalar(eased * 3.5))
  .add(tangentVel.multiplyScalar(eased * eased * 2));
```

## 🚀 测试

```bash
# 1. 确保环境变量
# frontend/.env
VITE_ENABLE_HOME_PARTICLES=true

# 2. 启动
cd frontend
npm run dev

# 3. 访问
http://localhost:5173
```

### 观察要点

- ✅ 粒子聚合成明显的花朵形状（8 片花瓣）
- ✅ 花芯密集明亮（青绿色）
- ✅ 花瓣有弯曲弧线（不是直线）
- ✅ 颜色从内到外渐变（青绿 → 蓝紫）
- ✅ 有金色高光点缀
- ✅ 呼吸阶段轻微脉动
- ✅ 能量脉冲明显闪烁
- ✅ 爆散沿螺旋轨迹（不是直线）
- ✅ 爆散时有尾迹淡出效果
- ✅ 背景星尘几乎静止

## 📊 性能

- **粒子总数**：1250（300 + 800 + 150）
- **Shader**：自定义 vertex + fragment
- **Blending**：Additive（发光）
- **预期帧率**：60fps（现代设备）

如果性能不足，可以减少粒子数：
```typescript
const CORE_PARTICLES = 200;
const PETAL_PARTICLES = 600;
const DUST_PARTICLES = 100;
```

## 🎯 与之前版本对比

| 特性 | 行星+环 | 银河花朵 |
|------|---------|----------|
| 形状 | 球体+环 | 花朵（花芯+花瓣） |
| 粒子数 | 1200 | 1250 |
| 颜色 | 蓝紫+淡金 | 青绿→蓝紫+金色高光 |
| 爆散 | 直线+切线 | 螺旋+尾迹 |
| 特效 | 基础闪光 | 能量脉冲+bloom |
| Shader | PointsMaterial | 自定义 ShaderMaterial |
| 高级感 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## ✅ 安全保证

- ✅ 只改了 HomeParticles.tsx（1 个文件）
- ✅ 不动 hooks / API / 合约 / 路由
- ✅ React 18 兼容
- ✅ 纯 Three.js（无 r3f）
- ✅ 环境变量开关不变
- ✅ 所有业务逻辑完全不变

## 📝 Git 信息

```bash
分支：ui-home-particles-v2
提交：feat(ui): Upgrade to cosmic flower bloom particle animation
文件：frontend/src/components/home/HomeParticles.tsx
```

## 🎨 微调建议

如果觉得效果需要调整：

**花瓣更密集**：
```typescript
const PETAL_PARTICLES = 1000;
```

**爆散更慢更优雅**：
```typescript
const DURATION_BURST = 3000;
```

**光晕更强**：
```typescript
const BLOOM_INTENSITY = 2.0;
```

**螺旋更明显**：
```typescript
const EXPLODE_SPIRAL = 1.8;
```

**花瓣更多**：
```typescript
const PETAL_COUNT = 10;
```

## 🌟 总结

成功升级为"银河花朵"效果，视觉质感明显提升：
- 🌸 精致的花朵结构（花芯+花瓣+星尘）
- ✨ 自定义 Shader 光晕效果
- 🌀 螺旋爆散 + 尾迹淡出
- ⚡ 能量脉冲闪烁
- 🎨 冷暖渐变 + 金色高光

**高级感显著提升，保持所有业务逻辑不变！** 🎉
