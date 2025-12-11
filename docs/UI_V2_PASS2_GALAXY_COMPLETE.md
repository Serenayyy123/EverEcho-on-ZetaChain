# UI V2 Pass 2: Galaxy Planet Animation - Complete

## 概述

升级 Home 页面粒子动画为"银河行星 + 星环 + 3D 散开 + 电影感标题"，保持所有业务逻辑不变。

## 实现内容

### 1. 新增组件

#### `frontend/src/components/landing/GalaxyPlanet.tsx`
- **行星粒子系统**：200个粒子，Fibonacci sphere 均匀分布
- **星环系统**：120个粒子，椭圆环倾斜 25°
- **颜色系统**：
  - 行星：深蓝/紫/青绿冷色星云色
  - 星环：淡蓝紫，偏亮
  - 根据 Z 深度调整亮度和大小
- **3D 深度**：
  - Z 值控制粒子大小、透明度、模糊度
  - 前后层次通过 zIndex 和视觉属性模拟
- **背景恒星**：极低密度微小恒星点（静态）

#### `frontend/src/pages/Home.galaxy.tsx`
- 使用 GalaxyPlanet 组件
- 保留所有原有业务逻辑（钱包连接、注册检查、路由跳转）
- 标题字距拉开（letter-spacing: 0.08em）
- 按钮玻璃质感（半透明 + 细边框 + hover 发光）
- 冷色系配色（深蓝紫渐变）

### 2. 动画时间轴（7.5秒）

```
0s - 2.5s   聚合阶段 (gather)
            粒子从屏幕边缘收拢成行星 + 星环
            
2.5s - 4.5s 悬浮阶段 (hold)
            行星轻微呼吸/自转
            星环稳定存在
            
4.5s - 6.5s 散开阶段 (burst)
            粒子沿法线方向 3D 散开
            保留深度感（近大远小）
            
5.5s - 7.5s 标题阶段 (title)
            EverEcho 标题慢滑入（从左往右）
            Builder Twitter 淡入
            Connect Wallet 按钮依次出现
            
7.5s+       闲置阶段 (idle)
            粒子轻微漂浮
```

### 3. 视觉设计

#### 背景
```css
radial-gradient(ellipse at 50% 20%, rgba(30, 40, 80, 0.15) 0%, transparent 50%),
radial-gradient(ellipse at 80% 70%, rgba(50, 30, 70, 0.12) 0%, transparent 60%),
radial-gradient(circle at 20% 80%, rgba(20, 50, 80, 0.1) 0%, transparent 50%),
linear-gradient(180deg, #030408 0%, #060810 50%, #0A0C15 100%)
```
- 高级宇宙黑
- 轻微星云雾（克制）
- 深邃渐变

#### 标题
- 字体：Playfair Display（衬线）
- 大小：64px - 110px（响应式）
- 字重：300（轻盈）
- 字距：0.08em（拉开）
- 颜色：#F7F7F5（高级白）
- 发光：淡蓝紫光晕

#### 按钮
- 冷色系渐变：深蓝紫（80, 100, 200）→（100, 80, 180）
- 玻璃边框：rgba(150, 170, 255, 0.25)
- 内阴影 + 外发光
- Hover：上移 + 增强发光

### 4. UI 开关系统

#### 环境变量
```bash
# 启用 UI V2
VITE_UI_V2=true

# 启用粒子动画（默认 true）
VITE_ENABLE_HOME_PARTICLES=true
```

#### 逻辑
```typescript
const isUIV2 = import.meta.env.VITE_UI_V2 === 'true';
const enableParticles = import.meta.env.VITE_ENABLE_HOME_PARTICLES !== 'false';

let HomeComponent = Home;
if (isUIV2) {
  HomeComponent = enableParticles ? HomeGalaxy : LandingV2;
}
```

- `VITE_ENABLE_HOME_PARTICLES=false` → 回退到 LandingV2（静态版本）
- 默认开启粒子动画

### 5. 技术栈

- **纯 CSS 动画**：keyframes + CSS variables
- **framer-motion**：标题/按钮滑入动画（已安装）
- **无 Three.js**：避免 React 版本冲突
- **无新依赖**：使用现有库

### 6. 性能优化

- `will-change: transform, opacity`
- `pointer-events: none` 在粒子层
- `prefers-reduced-motion` 检测（直接跳到标题）
- 粒子数量控制：行星 200 + 星环 120 = 320 个

## 文件清单

### 新增文件
- `frontend/src/components/landing/GalaxyPlanet.tsx`
- `frontend/src/pages/Home.galaxy.tsx`
- `docs/UI_V2_PASS2_GALAXY_COMPLETE.md`

### 修改文件
- `frontend/src/App.tsx` - 添加 HomeGalaxy 路由和开关逻辑
- `frontend/.env.example` - 添加 VITE_ENABLE_HOME_PARTICLES 文档

## 验收标准

### 功能验收
- [ ] 刷新页面能看到粒子聚合成行星
- [ ] 星环显眼且有倾斜空间感
- [ ] 粒子 3D 散开（近大远小）
- [ ] EverEcho 标题顺滑滑入
- [ ] Connect Wallet 按钮可用
- [ ] 点击按钮能正常连接钱包
- [ ] 连接后正常跳转到注册/任务页面

### 视觉验收
- [ ] 背景是高级宇宙黑（不花哨）
- [ ] 行星有颜色层次（核心亮边缘暗）
- [ ] 星环有前后层次感
- [ ] 标题字距拉开，高级感
- [ ] 按钮玻璃质感，hover 发光
- [ ] 整体极简克制

### 技术验收
- [ ] 控制台无新增业务报错
- [ ] 任何 API/链上逻辑都没被改动
- [ ] useWallet / useTasks / useProfile 等 hooks 未修改
- [ ] 环境变量逻辑未改动
- [ ] 开关关闭时回退旧主页

## 测试步骤

### 1. 启用粒子动画
```bash
# frontend/.env
VITE_UI_V2=true
VITE_ENABLE_HOME_PARTICLES=true

# 重启前端
cd frontend
npm run dev
```

访问 http://localhost:5173，观察：
1. 粒子从边缘聚合成行星（2.5秒）
2. 行星悬浮 + 星环（2秒）
3. 粒子 3D 散开（2秒）
4. 标题滑入（2秒）
5. 点击 Connect Wallet 测试功能

### 2. 禁用粒子动画（回退测试）
```bash
# frontend/.env
VITE_UI_V2=true
VITE_ENABLE_HOME_PARTICLES=false

# 重启前端
```

应该看到 LandingV2 静态版本（无粒子动画）

### 3. 完全回退到 V1
```bash
# frontend/.env
VITE_UI_V2=false

# 重启前端
```

应该看到原始 Home 页面（卡片式布局）

## Git 分支

```bash
# 当前分支
git branch
# * ui-v2-pass2-galaxy

# 查看改动
git status
git diff
```

## 下一步

1. 测试验收
2. 如果通过，合并到主分支
3. 部署到 staging 环境测试
4. 收集用户反馈

## 注意事项

### 安全护栏（已遵守）
- ✅ 不动任何 hooks / 数据请求 / 合约交互
- ✅ 不修改 useWallet / useTasks / useProfile
- ✅ 不改 API base url / 环境变量逻辑
- ✅ 只改 UI 展示层
- ✅ 新建分支 ui-v2-pass2-galaxy
- ✅ 加 UI 开关，默认开
- ✅ 不引入 three.js
- ✅ 只用轻量 UI 依赖（framer-motion 已有）

### 可调参数

在 `GalaxyPlanet.tsx` 中可调整：
```typescript
const planetRadius = 140;           // 行星半径
const ringRadiusInner = 200;        // 星环内径
const ringRadiusOuter = 280;        // 星环外径
const ringTilt = 25;                // 星环倾斜角度
const planetCount = 200;            // 行星粒子数
const ringCount = 120;              // 星环粒子数
```

时间轴：
```typescript
setTimeout(() => setPhase('hold'), 2500);   // 聚合时长
setTimeout(() => setPhase('burst'), 4500);  // 悬浮时长
setTimeout(() => setPhase('title'), 6500);  // 散开时长
setTimeout(() => setPhase('idle'), 7500);   // 标题时长
```

## 总结

成功升级 Home 页面为银河行星动画，保持所有业务逻辑不变，提供开关回退机制，视觉效果高级克制。
