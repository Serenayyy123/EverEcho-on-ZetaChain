# Home 页 Three.js 粒子动画 - 实现说明

## 概述

使用纯 Three.js（不用 @react-three/fiber）实现首页背景粒子动画：
- 行星球体（800 粒子）+ 环（400 粒子）
- 聚合 → 蓄力闪 → 3D 爆散 → 循环
- 总时长约 6-7 秒

## 文件清单

### 新增文件
- `frontend/src/components/home/HomeParticles.tsx` - Three.js 粒子组件

### 修改文件
- `frontend/src/pages/Home.tsx` - 引入粒子组件（3 行改动）
- `frontend/.env.example` - 更新开关说明
- `frontend/package.json` - 添加 three + @types/three

## 可调参数

在 `HomeParticles.tsx` 中的 `DEFAULT_CONFIG`：

```typescript
const DEFAULT_CONFIG: ParticleConfig = {
  planetCount: 800,          // 行星粒子数（建议 500-1500）
  ringCount: 400,            // 环粒子数（建议 200-600）
  planetRadius: 1.8,         // 行星半径（建议 1.5-2.5）
  ringInnerRadius: 2.8,      // 环内径（建议 2.5-3.5）
  ringOuterRadius: 3.6,      // 环外径（建议 3.0-4.5）
  gatherDuration: 2500,      // 聚合时长(ms)
  chargeDuration: 300,       // 蓄力闪光时长(ms)
  burstDuration: 2000,       // 爆散时长(ms)
  loopDelay: 1000,           // 循环延迟(ms)
};
```

### 颜色调整

**行星颜色**（第 80-90 行）：
```typescript
// 蓝色系
color = new THREE.Color(0.2, 0.3, 0.6);
// 紫色系
color = new THREE.Color(0.4, 0.2, 0.7);
// 青绿色系
color = new THREE.Color(0.2, 0.5, 0.6);
```

**环颜色**（第 130 行）：
```typescript
// 淡金紫色
const color = new THREE.Color(0.7, 0.6, 0.8);
```

### 粒子大小

第 160 行：
```typescript
const material = new THREE.PointsMaterial({
  size: 0.05,  // 粒子大小（建议 0.03-0.08）
  // ...
});
```

### 爆散速度

第 95 行（行星）：
```typescript
const burstVel = burstDir.multiplyScalar(3 + Math.random() * 2);
// 第一个数字：基础速度（建议 2-5）
// 第二个数字：随机范围（建议 1-3）
```

第 125 行（环）：
```typescript
const burstVel = burstDir.multiplyScalar(4 + Math.random() * 2);
```

### 旋转速度

第 217 行：
```typescript
points.rotation.y += 0.0005;  // 旋转速度（建议 0.0003-0.001）
```

## 开关控制

### 环境变量

```bash
# frontend/.env
VITE_ENABLE_HOME_PARTICLES=true   # 启用（默认）
VITE_ENABLE_HOME_PARTICLES=false  # 禁用
```

### 代码位置

`frontend/src/pages/Home.tsx` 第 14 行：
```typescript
const enableParticles = import.meta.env.VITE_ENABLE_HOME_PARTICLES !== 'false';
```

## 动画流程

```
0s ──────────────────────────────────────────────> 6.8s
│
├─ 0-2.5s ──┤  聚合 (gather)
            粒子从随机位置聚合成行星+环
            │
            ├─ 2.5-2.8s ──┤  蓄力闪 (charge)
                          粒子闪烁 + 轻微缩放
                          │
                          ├─ 2.8-4.8s ──┤  爆散 (burst)
                                        粒子 3D 散开（带螺旋轨迹）
                                        │
                                        ├─ 4.8-5.8s ──┤  等待 (wait)
                                                      │
                                                      └─> 循环
```

## 性能优化

- 使用 `BufferGeometry` 和 `BufferAttribute`
- `AdditiveBlending` 发光效果
- `requestAnimationFrame` 动画循环
- 自动响应窗口大小变化
- 组件卸载时清理资源

## 测试步骤

1. **启用动画**
```bash
# frontend/.env
VITE_ENABLE_HOME_PARTICLES=true

# 重启前端
npm run dev
```

2. **访问首页**
http://localhost:5173

3. **观察动画**
- 粒子从边缘聚合成行星+环（2.5秒）
- 蓄力闪光（0.3秒）
- 3D 爆散（2秒）
- 循环播放

4. **测试功能**
- Connect Wallet 按钮正常工作
- 钱包连接后正常跳转

## 禁用动画

```bash
# frontend/.env
VITE_ENABLE_HOME_PARTICLES=false

# 重启前端
```

应该看到原始 Home 页面（无粒子动画）

## 技术细节

### 粒子分布算法

**行星（Fibonacci sphere）**：
```typescript
const phi = Math.acos(1 - 2 * (i + 0.5) / count);
const theta = Math.PI * (1 + Math.sqrt(5)) * i;
```
均匀分布在球面上

**环（参数化椭圆）**：
```typescript
const x = radius * Math.cos(t);
const y = radius * Math.sin(t) * 0.15;  // 压扁
const z = radius * Math.sin(t) * 0.3;
// 再旋转 20° 倾斜
```

### 爆散轨迹

```typescript
// 沿法线方向
const burstDir = targetPos.clone().normalize();
// 添加切线分量（螺旋效果）
const tangent = new THREE.Vector3(-burstDir.y, burstDir.x, 0).normalize();
const burstVel = burstDir.multiplyScalar(3).add(tangent.multiplyScalar(1.5));
```

### 蓄力闪光

```typescript
const flash = Math.sin(t * Math.PI * 4) * 0.3 + 1;
material.opacity = 0.9 * flash;
material.size = 0.05 * (1 + Math.sin(t * Math.PI * 2) * 0.3);
```

## 依赖版本

```json
{
  "dependencies": {
    "three": "^0.160.0"
  },
  "devDependencies": {
    "@types/three": "^0.160.0"
  }
}
```

## 兼容性

- ✅ React 18.2.0
- ✅ Vite 5.0.8
- ✅ TypeScript 5.2.2
- ✅ 不依赖 @react-three/fiber
- ✅ 不依赖 React 19

## 故障排查

### Q: 看不到粒子？
A: 检查 `VITE_ENABLE_HOME_PARTICLES=true`，重启前端

### Q: 粒子太多/太少？
A: 调整 `planetCount` 和 `ringCount`

### Q: 动画太快/太慢？
A: 调整 `gatherDuration`、`burstDuration`

### Q: 颜色不对？
A: 修改第 80-90 行（行星）和第 130 行（环）的颜色值

### Q: 性能问题？
A: 减少粒子数量或设置 `VITE_ENABLE_HOME_PARTICLES=false`

## 总结

- ✅ 纯 Three.js 实现（无 @react-three/fiber）
- ✅ React 18 兼容
- ✅ 只新增 1 个组件
- ✅ Home 页最小改动（3 行）
- ✅ 环境变量开关
- ✅ 不影响任何业务逻辑
- ✅ 行星 + 环形状
- ✅ 聚合 → 蓄力闪 → 爆散流程
- ✅ 参数可调
