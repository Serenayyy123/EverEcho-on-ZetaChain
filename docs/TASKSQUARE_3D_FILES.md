# TaskSquare 3D 界面文件清单

## 📂 核心文件结构

TaskSquare V2 的 3D 界面由以下文件组成：

```
frontend/src/
├── pages/
│   └── TaskSquareV2.tsx                    # 主页面（路由：/tasksquare-v2）
├── components/
│   └── tasksquare/
│       ├── TaskCarousel3D.tsx              # 3D 轮播容器
│       ├── TaskCard3D.tsx                  # 3D 卡片组件（带 Lottie 动画）
│       └── TaskFiltersBar.tsx              # 筛选栏
└── utils/
    └── categoryTheme.ts                    # 主题配置 + 动画映射
```

---

## 📄 文件详情

### 1. TaskSquareV2.tsx
**路径**: `frontend/src/pages/TaskSquareV2.tsx`  
**作用**: 主页面组件  
**路由**: `/tasksquare-v2`

**功能**:
- 任务数据获取和管理
- 筛选逻辑（分类、状态、搜索）
- 排序逻辑（最新、奖励、最旧）
- 布局和状态管理

**关键代码**:
```tsx
import { TaskCarousel3D } from '../components/tasksquare/TaskCarousel3D';
import { TaskFiltersBar } from '../components/tasksquare/TaskFiltersBar';

export function TaskSquareV2() {
  // ... 筛选和排序逻辑
  
  return (
    <PageLayout>
      <TaskFiltersBar {...filterProps} />
      <TaskCarousel3D tasks={sortedTasks} />
    </PageLayout>
  );
}
```

**特点**:
- ✅ 纯 UI 升级，不改业务逻辑
- ✅ 支持分类筛选（7 个分类）
- ✅ 支持状态切换（Open/Ongoing）
- ✅ 支持搜索和排序
- ✅ 链隔离的偏好存储

---

### 2. TaskCarousel3D.tsx
**路径**: `frontend/src/components/tasksquare/TaskCarousel3D.tsx`  
**作用**: 3D 轮播容器组件

**功能**:
- 管理卡片的 3D 布局
- 处理拖拽交互
- 控制卡片切换动画
- 响应式布局

**关键特性**:
```tsx
// 3D 透视容器
<div style={styles.perspective}>
  {tasks.map((task, index) => (
    <TaskCard3D
      key={task.taskId}
      task={task}
      index={index}
      activeIndex={activeIndex}
      totalCards={tasks.length}
    />
  ))}
</div>
```

**交互**:
- ✅ 鼠标拖拽切换卡片
- ✅ 键盘左右箭头切换
- ✅ 自动居中激活卡片
- ✅ 平滑过渡动画

**样式**:
```typescript
perspective: {
  perspective: '1000px',
  position: 'relative',
  width: '360px',
  height: '520px',
}
```

---

### 3. TaskCard3D.tsx
**路径**: `frontend/src/components/tasksquare/TaskCard3D.tsx`  
**作用**: 单个 3D 卡片组件（带 Lottie 动画）

**功能**:
- 显示任务详情
- 加载和播放 Lottie 动画
- 3D 变换效果
- 点击跳转详情页

**关键特性**:
```tsx
import Lottie from 'lottie-react';
import { getCategoryFullTheme, getCategoryAnimation } from '../../utils/categoryTheme';

export function TaskCard3D({ task, index, activeIndex, totalCards }) {
  const theme = getCategoryFullTheme(task.metadata?.category);
  const animationPath = getCategoryAnimation(task.metadata?.category);
  const [animationData, setAnimationData] = useState<any>(null);
  
  // 加载动画
  useEffect(() => {
    fetch(animationPath)
      .then(res => res.json())
      .then(data => setAnimationData(data));
  }, [animationPath]);
  
  // 3D 变换
  const offset = index - activeIndex;
  const scale = offset === 0 ? 1 : 0.85;
  const translateX = offset * 400;
  
  return (
    <div style={{ transform: `translateX(${translateX}px) scale(${scale})` }}>
      {/* Lottie 动画 */}
      {animationData && (
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={offset === 0}  // 只播放激活卡片
        />
      )}
      {/* 任务信息 */}
    </div>
  );
}
```

**卡片内容**:
- 🎨 Lottie 动画（180px 高度）
- 🏷️ 分类标签
- 📊 状态徽章
- 📝 任务标题和描述
- 💰 奖励金额
- 👤 创建者/帮助者信息
- ⏰ 创建时间

**尺寸**: 360px × 520px

---

### 4. TaskFiltersBar.tsx
**路径**: `frontend/src/components/tasksquare/TaskFiltersBar.tsx`  
**作用**: 筛选和控制栏

**功能**:
- 分类筛选按钮
- 状态切换开关
- 搜索框
- 排序选择
- 刷新按钮

**布局**:
```tsx
<div style={styles.filtersBar}>
  {/* 分类按钮 */}
  <div style={styles.categoryButtons}>
    {categories.map(cat => (
      <button onClick={() => onCategoryChange(cat.value)}>
        {cat.label}
      </button>
    ))}
  </div>
  
  {/* 状态切换 */}
  <label>
    <input type="checkbox" checked={showOngoing} />
    Show Ongoing
  </label>
  
  {/* 搜索框 */}
  <input type="text" placeholder="Search..." />
  
  {/* 排序 */}
  <select value={sortBy} onChange={...}>
    <option value="newest">Newest</option>
    <option value="reward">Highest Reward</option>
    <option value="oldest">Oldest</option>
  </select>
</div>
```

**分类列表**:
- All
- Pet
- Exchange
- Hosting
- Coffee Chat
- Career
- Outreach Help
- Other

---

### 5. categoryTheme.ts
**路径**: `frontend/src/utils/categoryTheme.ts`  
**作用**: 主题配置和动画映射

**导出内容**:

#### 接口定义
```typescript
export interface CategoryTheme {
  accent: string;
  glow: string;
  label: string;
}

export interface CategoryFullTheme extends CategoryTheme {
  bg: string;
  border: string;
  text: string;
  tag: string;
  cta: string;
}
```

#### 动画映射 ⭐
```typescript
export const categoryAnimations: Record<string, string> = {
  pet: '/animations/Pet.json',
  exchange: '/animations/Exchange.json',
  hosting: '/animations/Hosting.json',
  coffeechat: '/animations/Coffee Chat.json',
  career: '/animations/Career.json',
  outreach_help: '/animations/Outreach Help.json',
  other: '/animations/Others.json',
};
```

#### 主题配色
```typescript
export const CATEGORY_FULL_THEME: Record<string, CategoryFullTheme> = {
  pet: {
    accent: '#e8b4b8',
    bg: 'linear-gradient(135deg, #e8b4b8 0%, #f5c7c7 100%)',
    text: '#2d2d2d',
    // ...
  },
  // ... 其他分类
};
```

#### 工具函数
```typescript
export const getCategoryFullTheme = (category?: string): CategoryFullTheme;
export const getCategoryAnimation = (category?: string): string;
export const getCategorySuccessTheme = (category?: string): SuccessTheme;
```

---

## 🎨 动画资源

### 动画文件位置
```
frontend/public/animations/
├── Pet.json              (107 KB)
├── Exchange.json         (164 KB)
├── Hosting.json          (14 KB)
├── Coffee Chat.json      (16 KB)
├── Career.json           (93 KB)
├── Outreach Help.json    (42 KB)
└── Others.json           (36 KB)
```

**总大小**: ~471 KB

---

## 🔗 文件依赖关系

```
TaskSquareV2.tsx
    ├─→ TaskFiltersBar.tsx
    ├─→ TaskCarousel3D.tsx
    │       └─→ TaskCard3D.tsx
    │               ├─→ categoryTheme.ts
    │               │       └─→ /animations/*.json
    │               └─→ lottie-react
    └─→ PageLayout.tsx
```

---

## 🎯 3D 效果实现

### CSS Transform
```typescript
// TaskCard3D.tsx
const offset = index - activeIndex;
const scale = offset === 0 ? 1 : 0.85;
const translateX = offset * 400;

style={{
  transform: `translateX(${translateX}px) scale(${scale})`,
  opacity: offset === 0 ? 1 : 0.5,
  zIndex: totalCards - Math.abs(offset),
}}
```

### Perspective 容器
```typescript
// TaskCarousel3D.tsx
perspective: {
  perspective: '1000px',
  position: 'relative',
  width: '360px',
  height: '520px',
}
```

### 过渡动画
```typescript
transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
```

---

## 📱 路由配置

需要在 `App.tsx` 中添加路由：

```tsx
import { TaskSquareV2 } from './pages/TaskSquareV2';

<Route path="/tasksquare-v2" element={<TaskSquareV2 />} />
```

---

## 🚀 访问地址

开发环境:
```
http://localhost:5173/tasksquare-v2
```

生产环境:
```
https://your-domain.com/tasksquare-v2
```

---

## 📦 依赖包

```json
{
  "lottie-react": "^2.4.1",
  "react": "^18.2.0",
  "react-router-dom": "^6.x.x"
}
```

---

## 🎨 视觉特性

### 卡片效果
- ✅ 3D 横向滑动
- ✅ 中心卡片最大最亮
- ✅ 两侧卡片缩小变暗
- ✅ 平滑过渡动画
- ✅ 鼠标拖拽交互

### 动画效果
- ✅ Lottie 动画自动播放（仅激活卡片）
- ✅ 分类主题色渐变背景
- ✅ 毛玻璃质感
- ✅ 悬停发光边框

### 主题配色
- 🎨 莫兰迪浅色系
- 🎨 7 个分类专属配色
- 🎨 渐变背景
- 🎨 柔和对比度

---

## 🔧 开发建议

### 修改卡片样式
编辑 `TaskCard3D.tsx` 中的 `styles` 对象

### 修改 3D 效果
调整 `TaskCarousel3D.tsx` 中的 `perspective` 和 `transform` 值

### 添加新分类
1. 在 `categoryTheme.ts` 中添加配置
2. 准备对应的 Lottie 动画文件
3. 更新 `TaskFiltersBar.tsx` 的分类列表

### 性能优化
- 动画文件已按需加载
- 只播放激活卡片的动画
- 使用 CSS transform 而非 position

---

## 📝 总结

**核心文件**: 5 个
- 1 个页面组件
- 3 个 UI 组件
- 1 个配置文件

**动画资源**: 7 个 Lottie JSON 文件

**总代码量**: ~1000 行

**特点**: 纯 UI 升级，不改业务逻辑，完全向后兼容
