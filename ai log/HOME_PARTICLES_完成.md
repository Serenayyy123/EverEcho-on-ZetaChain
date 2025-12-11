# Home 页 Three.js 粒子动画 - 完成 ✨

## 交付内容

### 新增组件
`frontend/src/components/home/HomeParticles.tsx`
- 纯 Three.js 实现（不用 @react-three/fiber）
- 行星 800 粒子 + 环 400 粒子
- 聚合 → 蓄力闪 → 3D 爆散 → 循环
- 总时长 ~6-7 秒

### Home 页改动（最小化）
`frontend/src/pages/Home.tsx` - 只改 3 处：
1. 导入组件：`import { HomeParticles } from '../components/home/HomeParticles';`
2. 添加开关：`const enableParticles = import.meta.env.VITE_ENABLE_HOME_PARTICLES !== 'false';`
3. 条件渲染：`{enableParticles && <HomeParticles />}`

### 依赖
- `three@0.160.0` - React 18 兼容
- `@types/three@0.160.0` - TypeScript 类型

## 可调参数

在 `HomeParticles.tsx` 的 `DEFAULT_CONFIG`：

```typescript
{
  planetCount: 800,          // 行星粒子数
  ringCount: 400,            // 环粒子数
  planetRadius: 1.8,         // 行星半径
  ringInnerRadius: 2.8,      // 环内径
  ringOuterRadius: 3.6,      // 环外径
  gatherDuration: 2500,      // 聚合时长(ms)
  chargeDuration: 300,       // 蓄力闪光(ms)
  burstDuration: 2000,       // 爆散时长(ms)
  loopDelay: 1000,           // 循环延迟(ms)
}
```

### 快速调整

**粒子数量**（第 30-31 行）：
```typescript
planetCount: 800,  // 建议 500-1500
ringCount: 400,    // 建议 200-600
```

**动画速度**（第 35-38 行）：
```typescript
gatherDuration: 2500,  // 聚合时长
chargeDuration: 300,   // 蓄力时长
burstDuration: 2000,   // 爆散时长
loopDelay: 1000,       // 循环延迟
```

**颜色**（第 80-90 行 行星，第 130 行 环）：
```typescript
// 行星：蓝紫青绿渐变
color = new THREE.Color(0.2, 0.3, 0.6);  // 深蓝
color = new THREE.Color(0.4, 0.2, 0.7);  // 紫色
color = new THREE.Color(0.2, 0.5, 0.6);  // 青绿

// 环：淡金紫
color = new THREE.Color(0.7, 0.6, 0.8);
```

**粒子大小**（第 160 行）：
```typescript
size: 0.05,  // 建议 0.03-0.08
```

**爆散速度**（第 95、125 行）：
```typescript
multiplyScalar(3 + Math.random() * 2)  // 基础速度 + 随机
```

## 开关控制

### 启用动画（默认）
```bash
# frontend/.env
VITE_ENABLE_HOME_PARTICLES=true
```

### 禁用动画
```bash
# frontend/.env
VITE_ENABLE_HOME_PARTICLES=false
```

重启前端生效：
```bash
cd frontend
npm run dev
```

## 动画流程

```
0s ────────────────────────────────────> 6.8s
│
├─ 0-2.5s ──┤  聚合
            粒子从边缘收拢成行星+环
            │
            ├─ 2.5-2.8s ──┤  蓄力闪
                          粒子闪烁缩放
                          │
                          ├─ 2.8-4.8s ──┤  爆散
                                        3D 散开（螺旋轨迹）
                                        │
                                        ├─ 4.8-5.8s ──┤  等待
                                                      │
                                                      └─> 循环
```

## 测试

1. **启用动画**
```bash
# frontend/.env
VITE_ENABLE_HOME_PARTICLES=true

cd frontend
npm run dev
```

2. **访问** http://localhost:5173

3. **观察**
- 粒子聚合成行星+环
- 蓄力闪光
- 3D 爆散
- 循环播放

4. **测试功能**
- Connect Wallet 按钮正常
- 钱包连接后正常跳转

## 技术特点

- ✅ 纯 Three.js（无 @react-three/fiber）
- ✅ React 18 兼容
- ✅ Fibonacci 球面均匀分布
- ✅ 参数化椭圆环（倾斜 20°）
- ✅ 螺旋爆散轨迹
- ✅ 蓄力闪光效果
- ✅ 自动循环播放
- ✅ 响应式设计
- ✅ 资源自动清理

## 安全保证

- ✅ 不动 hooks / API / 合约
- ✅ 不升级 React / Vite
- ✅ 只新增 1 个组件
- ✅ Home 页最小改动（3 行）
- ✅ 环境变量开关
- ✅ 不影响业务逻辑

## Git 信息

```bash
# 分支
ui-home-particles-v2

# 提交
feat(ui): Add Three.js particle animation for Home page

# 文件变更
6 files changed, 624 insertions(+), 6 deletions(-)
```

## 文件清单

### 新增
- `frontend/src/components/home/HomeParticles.tsx` - 粒子组件
- `docs/HOME_PARTICLES_THREEJS.md` - 详细文档
- `HOME_PARTICLES_完成.md` - 本文档

### 修改
- `frontend/src/pages/Home.tsx` - 引入粒子（3 行）
- `frontend/.env.example` - 更新开关说明
- `frontend/package.json` - 添加 three 依赖

## 详细文档

完整技术文档：`docs/HOME_PARTICLES_THREEJS.md`

包含：
- 所有可调参数详解
- 颜色/速度/大小调整方法
- 粒子分布算法说明
- 爆散轨迹实现
- 故障排查指南

## 总结

成功实现 Three.js 粒子动画，严格遵守所有约束：
- 纯 Three.js，不用 @react-three/fiber
- React 18 兼容，不升级依赖
- 只新增 1 个组件
- Home 页最小改动
- 环境变量开关
- 不动任何业务逻辑

**效果**：行星 + 环 → 蓄力闪 → 3D 爆散 → 循环，总时长 6-7 秒，丝滑流畅。
