# TaskSquare 插画版本说明

## 📍 位置

插画版本保存在 **stash@{0}** 中：
```bash
stash@{0}: On ui-tasksquare-v2: backup-before-rollback-20251128-1405
```

## 🎨 核心特性

### 1. Lottie 动画集成

TaskCard3D 组件集成了 **Lottie 动画**，每个分类都有专属的动画插画：

```typescript
import Lottie from 'lottie-react';
import { getCategoryAnimation } from '../../utils/categoryTheme';

// 动画加载
const animationPath = getCategoryAnimation(task.metadata?.category);
const [animationData, setAnimationData] = React.useState<any>(null);

React.useEffect(() => {
  fetch(animationPath)
    .then(res => res.json())
    .then(data => setAnimationData(data))
    .catch(err => console.error('Failed to load animation:', err));
}, [animationPath]);
```

### 2. 动画展示区域

卡片顶部有 **180px 高度的动画容器**：

```typescript
<div style={styles.animationContainer}>
  <Lottie
    animationData={animationData}
    loop={true}
    autoplay={isActive}  // 只有激活的卡片才播放
    style={styles.animation}
  />
</div>
```

样式配置：
```typescript
animationContainer: {
  width: '100%',
  height: '180px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '8px',
},
animation: {
  width: '160px',
  height: '160px',
},
```

## 🎭 分类动画映射

每个分类对应一个 Lottie JSON 文件：

| 分类 | 动画文件 | 文件大小 |
|------|---------|---------|
| Pet / 宠物 | `/animations/Pet.json` | 109 KB |
| Exchange / 交换 | `/animations/Exchange.json` | 167 KB |
| Hosting / 借宿 | `/animations/Hosting.json` | 14 KB |
| Coffee Chat | `/animations/Coffee Chat.json` | 16 KB |
| Career / 职业发展 | `/animations/Career.json` | 95 KB |
| Outreach Help / 在外互助 | `/animations/Outreach Help.json` | 43 KB |
| Other | `/animations/Others.json` | 37 KB |

**总计**: 7 个动画文件，约 481 KB

## 📂 文件结构

```
frontend/
├── dist/
│   └── animations/          # Lottie 动画文件
│       ├── Pet.json
│       ├── Exchange.json
│       ├── Hosting.json
│       ├── Coffee Chat.json
│       ├── Career.json
│       ├── Outreach Help.json
│       └── Others.json
├── src/
│   ├── components/
│   │   └── tasksquare/
│   │       └── TaskCard3D.tsx    # 插画版本
│   └── utils/
│       └── categoryTheme.ts      # 动画路径配置
└── package.json                  # 包含 lottie-react
```

## 🔧 依赖

插画版本需要 **lottie-react** 包（已安装）：

```json
{
  "dependencies": {
    "lottie-react": "^2.x.x",
    "lottie-web": "^5.x.x"
  }
}
```

## 🎯 视觉效果

### 卡片布局（520px 高）

```
┌─────────────────────────────────┐
│  [Category Tag]    [Status]     │  ← 顶部标签
│                                 │
│     ┌─────────────────┐         │
│     │                 │         │
│     │  Lottie 动画    │  180px  │  ← 动画区域
│     │   (160x160)     │         │
│     └─────────────────┘         │
│                                 │
│  Task Title                     │  ← 标题
│                                 │
│  Task description text...       │  ← 描述
│                                 │
│  ─────────────────────────      │
│  💰 100 ECHO                    │  ← 奖励
│                                 │
│  CREATOR: 0x1234...5678         │  ← 元信息
│  HELPER:  0xabcd...ef01         │
│  CREATED: 2H AGO                │
└─────────────────────────────────┘
```

## 🎨 主题配色（莫兰迪清新）

插画版本使用**浅色莫兰迪渐变背景**：

```typescript
pet: {
  bg: 'linear-gradient(135deg, #e8b4b8 0%, #f5c7c7 100%)',
  accent: '#e8b4b8',
  text: '#2d2d2d',
}
```

所有分类都是**浅色系**，与动画插画完美搭配。

## 🔄 恢复插画版本

### 方法 1: 恢复单个文件

```bash
# 恢复 TaskCard3D 组件
git show "stash@{0}:frontend/src/components/tasksquare/TaskCard3D.tsx" > frontend/src/components/tasksquare/TaskCard3D.tsx

# 恢复主题配置
git show "stash@{0}:frontend/src/utils/categoryTheme.ts" > frontend/src/utils/categoryTheme.ts
```

### 方法 2: 应用整个 stash

```bash
git stash apply stash@{0}
```

### 方法 3: 创建新分支

```bash
git checkout -b tasksquare-illustration
git stash apply stash@{0}
```

## ⚠️ 注意事项

1. **动画文件位置**: 确保动画文件在 `frontend/dist/animations/` 或 `frontend/public/animations/`
2. **路径配置**: 检查 `categoryTheme.ts` 中的路径是否正确
3. **性能考虑**: 
   - 只有激活的卡片才播放动画 (`autoplay={isActive}`)
   - 动画文件总大小约 481 KB
4. **浅色主题**: 插画版本使用浅色背景，需要同时恢复 `index.css`

## 📊 与当前版本对比

| 特性 | 当前版本 (ui-tasksquare-v2) | 插画版本 (stash@{0}) |
|------|---------------------------|---------------------|
| 视觉元素 | 纯 CSS 渐变 | Lottie 动画插画 |
| 卡片高度 | 480px | 520px |
| 主题色系 | 深色/浅色可选 | 浅色莫兰迪 |
| 动画区域 | 无 | 180px (160x160) |
| 文件大小 | 小 | +481 KB (动画) |
| 依赖 | 无额外依赖 | lottie-react |
| 性能 | 更快 | 略慢（动画加载） |

## 🎬 动画播放逻辑

```typescript
// 只有激活的卡片才播放动画
<Lottie
  animationData={animationData}
  loop={true}
  autoplay={isActive}  // ← 关键：非激活卡片不播放
  style={styles.animation}
/>
```

这样可以：
- ✅ 节省性能（只播放一个动画）
- ✅ 突出焦点卡片
- ✅ 减少视觉干扰

## 🚀 快速测试

恢复插画版本后，访问 TaskSquare V2 页面：

```bash
# 1. 恢复文件
git show "stash@{0}:frontend/src/components/tasksquare/TaskCard3D.tsx" > frontend/src/components/tasksquare/TaskCard3D.tsx

# 2. 启动开发服务器
npm run dev

# 3. 访问
http://localhost:3000/tasksquare-v2
```

应该能看到：
- ✅ 每个卡片顶部有动画插画
- ✅ 激活的卡片动画在播放
- ✅ 非激活卡片动画静止
- ✅ 浅色莫兰迪配色

## 📝 总结

**插画版本的优势**：
- 🎨 视觉更丰富，每个分类有专属动画
- 🎭 品牌感更强，更有记忆点
- 💫 交互更生动，激活时动画播放

**当前版本的优势**：
- ⚡ 性能更好，无额外资源加载
- 📦 体积更小，无动画文件
- 🎯 更简洁，纯 CSS 实现

根据产品定位选择合适的版本！
