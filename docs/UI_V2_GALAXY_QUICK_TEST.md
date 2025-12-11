# Galaxy Planet Animation - Quick Test Guide

## 快速测试（3分钟）

### 1. 启用动画
```bash
# 编辑 frontend/.env
VITE_UI_V2=true
VITE_ENABLE_HOME_PARTICLES=true

# 重启前端（如果正在运行）
cd frontend
npm run dev
```

### 2. 访问页面
打开浏览器：http://localhost:5173

### 3. 观察动画（7.5秒）
- **0-2.5s**：粒子从边缘聚合成行星 + 星环
- **2.5-4.5s**：行星悬浮，轻微呼吸
- **4.5-6.5s**：粒子 3D 散开
- **5.5-7.5s**：EverEcho 标题滑入

### 4. 测试功能
- 点击 "Connect Wallet" 按钮
- 连接 MetaMask
- 确认跳转到注册/任务页面

## 视觉检查清单

### 背景
- [ ] 深邃宇宙黑（不花哨）
- [ ] 轻微星云雾（克制）
- [ ] 微小恒星点（静态）

### 行星
- [ ] 球体形状明确
- [ ] 颜色有层次（深蓝/紫/青绿）
- [ ] 核心亮边缘暗
- [ ] 粒子有大小差异（3D 深度）

### 星环
- [ ] 椭圆环形状清晰
- [ ] 倾斜角度明显（约 25°）
- [ ] 颜色偏淡（淡蓝紫）
- [ ] 有前后层次感

### 散开
- [ ] 粒子向外爆散
- [ ] 保留 3D 深度（近大远小）
- [ ] 散开后逐渐淡出

### 标题
- [ ] 字距拉开（EVERECHO）
- [ ] 从左往右滑入
- [ ] 白色微发光
- [ ] Builder Twitter 链接可点击

### 按钮
- [ ] 玻璃质感（半透明）
- [ ] 冷色系（深蓝紫）
- [ ] Hover 时上移 + 发光
- [ ] 点击功能正常

## 回退测试

### 禁用粒子（回退到静态）
```bash
# frontend/.env
VITE_UI_V2=true
VITE_ENABLE_HOME_PARTICLES=false
```
应该看到 LandingV2（无粒子）

### 完全回退到 V1
```bash
# frontend/.env
VITE_UI_V2=false
```
应该看到原始 Home 页面（卡片式）

## 性能检查

### 控制台
- [ ] 无 JavaScript 错误
- [ ] 无业务逻辑报错
- [ ] 无 API 请求失败

### 流畅度
- [ ] 动画流畅（60fps）
- [ ] 无卡顿
- [ ] 按钮响应及时

### 兼容性
- [ ] Chrome/Edge 正常
- [ ] Firefox 正常
- [ ] Safari 正常（如有）

## 功能回归测试

### 钱包连接
- [ ] 点击按钮能唤起 MetaMask
- [ ] 连接成功后显示地址
- [ ] 自动检查注册状态

### 路由跳转
- [ ] 已注册用户 → /tasks
- [ ] 未注册用户 → /register
- [ ] 跳转逻辑正确

### 错误处理
- [ ] 拒绝连接显示错误提示
- [ ] 网络错误显示友好提示

## 常见问题

### Q: 看不到粒子动画？
A: 检查 `frontend/.env` 中 `VITE_ENABLE_HOME_PARTICLES=true`，重启前端

### Q: 动画卡顿？
A: 可能是设备性能问题，设置 `VITE_ENABLE_HOME_PARTICLES=false` 回退

### Q: 标题没出现？
A: 等待 5.5 秒，或检查控制台是否有错误

### Q: 按钮点击无反应？
A: 检查 MetaMask 是否安装，网络是否正确

## 调试技巧

### 查看动画阶段
打开浏览器控制台，在 `GalaxyPlanet.tsx` 中添加：
```typescript
useEffect(() => {
  console.log('Animation phase:', phase);
}, [phase]);
```

### 调整时间轴（加速测试）
在 `GalaxyPlanet.tsx` 中修改：
```typescript
setTimeout(() => setPhase('hold'), 1000);   // 原 2500
setTimeout(() => setPhase('burst'), 2000);  // 原 4500
setTimeout(() => setPhase('title'), 3000);  // 原 6500
```

### 调整粒子数量（性能测试）
```typescript
const planetCount = 100;  // 原 200
const ringCount = 60;     // 原 120
```

## 验收通过标准

- ✅ 所有视觉检查项通过
- ✅ 所有功能回归测试通过
- ✅ 控制台无错误
- ✅ 动画流畅不卡顿
- ✅ 回退机制正常工作

## 下一步

测试通过后：
1. 提交代码到分支
2. 创建 Pull Request
3. Code Review
4. 合并到主分支
5. 部署到 staging 测试
