# TaskCard3D & TaskCarousel3D 版本对比

## 📊 版本总览

这两个文件有 **3 个主要版本**：

| 版本 | 位置 | 特点 | 动画支持 | 背景样式 |
|------|------|------|---------|---------|
| **V1 - 纯 CSS** | ui-tasksquare-v2 分支 | 深色宇宙风格 | ❌ 无 | 径向渐变 |
| **V2 - Lottie 插画** | stash@{0} | 浅色莫兰迪 + 动画 | ✅ 有 | 线性渐变 |
| **V3 - 当前** | 工作目录 (HEAD) | 与 V2 相同 | ✅ 有 | 线性渐变 |

---

## 🎨 TaskCard3D.tsx 版本对比

### 版本 1: 纯 CSS 版本 (ui-tasksquare-v2)

**特点**: 深色宇宙风格，无动画

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Task } from '../../hooks/useTasks';
import { getCategoryFullTheme } from '../../utils/categoryTheme';

export function TaskCard3D({ task, index, activeIndex, totalCards }) {
  const navigate = useNavigate();
  const theme = getCategoryFullTheme(task.metadata?.category);
  
  // 无动画相关代码
  
  return (
    <div style={{
      background: `
        radial-gradient(120% 120% at 20% 0%, rgba(255,255,255,0.06), transparent 55%),
        linear-gradient(180deg, rgba(255,255,255,0.04), transparent 35%),
        ${theme.bg}
      `,
    }}>
      {/* 纯文字内容，无动画 */}
    </div>
  );
}
```

**背景样式**:
- 径向渐变 + 线性渐变叠加
- 深色宇宙风格
- 霓虹色强调

**优点**:
- ✅ 性能好（无额外资源）
- ✅ 体积小
- ✅ 科技感强

**缺点**:
- ❌ 视觉单调
- ❌ 无动画吸引力

---

### 版本 2: Lottie 插画版本 (stash@{0})

**特点**: 浅色莫兰迪 + Lottie 动画

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';  // ← 新增
import { Task } from '../../hooks/useTasks';
import { getCategoryFullTheme, getCategoryAnimation } from '../../utils/categoryTheme';  // ← 新增

export function TaskCard3D({ task, index, activeIndex, totalCards }) {
  const navigate = useNavigate();
  const theme = getCategoryFullTheme(task.metadata?.category);
  const animationPath = getCategoryAnimation(task.metadata?.category);  // ← 新增
  const [animationData, setAnimationData] = React.useState<any>(null);  // ← 新增
  
  // ← 新增：加载动画数据
  React.useEffect(() => {
    fetch(animationPath)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Failed to load animation:', err));
  }, [animationPath]);
  
  return (
    <div style={{
      background: theme.bg,  // ← 简化：直接使用主题背景
    }}>
      {/* ← 新增：Lottie 动画容器 */}
      {animationData && (
        <div style={styles.animationContainer}>
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={isActive}  // 只播放激活卡片
            style={styles.animation}
          />
        </div>
      )}
      
      {/* 任务内容 */}
    </div>
  );
}

// ← 新增：动画样式
const styles = {
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
};
```

**背景样式**:
- 纯线性渐变
- 浅色莫兰迪配色
- 温暖亲切

**新增功能**:
- ✅ Lottie 动画加载
- ✅ 动画容器 (180px)
- ✅ 智能播放（只播放激活卡片）
- ✅ 动画路径映射

**优点**:
- ✅ 视觉丰富
- ✅ 品牌感强
- ✅ 用户吸引力高
- ✅ 分类识别度高

**缺点**:
- ❌ 需要加载动画文件 (~471 KB)
- ❌ 性能略低

---

### 版本 3: 当前工作目录 (HEAD)

**状态**: ✅ 与版本 2 完全相同

已从 stash@{0} 恢复，包含所有 Lottie 动画功能。

---

## 🎡 TaskCarousel3D.tsx 版本对比

### 版本演进历史

```
cdf4980 - feat: TaskSquare V2 - 3D card gallery with premium dark theme
    ↓
bc7e030 - enhance: improve 3D carousel effects and drag interaction
    ↓
4a0cafb - refactor: convert 3D carousel to 2D horizontal slide
    ↓
04043e7 - feat: full-width layout + category theme cards
    ↓
9a3d462 - fix: break out of PageLayout maxWidth constraint (当前)
```

### 主要变化

#### 1. 从 3D 到 2D 横向滑动
**Commit**: `4a0cafb`

```tsx
// 之前：3D 旋转木马
transform: `rotateY(${angle}deg) translateZ(${radius}px)`

// 之后：2D 横向滑动
transform: `translateX(${translateX}px) scale(${scale})`
```

#### 2. 全宽布局
**Commit**: `04043e7` & `9a3d462`

```tsx
// 添加全宽容器
<div style={styles.fullWidthContainer}>
  <div style={styles.carouselContainer}>
    {/* 轮播内容 */}
  </div>
</div>

// 样式
fullWidthContainer: {
  width: '100vw',
  marginLeft: 'calc(-50vw + 50%)',
  maxWidth: 'none',
}
```

#### 3. 拖拽交互增强
**Commit**: `bc7e030` & `d65db37`

```tsx
// 添加鼠标拖拽
const handleMouseDown = (e: React.MouseEvent) => {
  setIsDragging(true);
  setDragStartX(e.clientX);
};

const handleMouseMove = (e: React.MouseEvent) => {
  if (!isDragging) return;
  const diff = e.clientX - dragStartX;
  if (Math.abs(diff) > 50) {
    // 切换卡片
  }
};
```

---

## 📝 关键差异总结

### TaskCard3D.tsx

| 特性 | V1 (纯 CSS) | V2/V3 (Lottie) |
|------|------------|---------------|
| 导入 | 无 Lottie | `import Lottie from 'lottie-react'` |
| 动画加载 | ❌ | ✅ `useEffect` + `fetch` |
| 动画状态 | ❌ | ✅ `useState<any>` |
| 动画容器 | ❌ | ✅ 180px 高度 |
| 背景样式 | 径向渐变叠加 | 纯线性渐变 |
| 卡片高度 | 480px | 520px (+40px) |
| 文件大小 | ~200 行 | ~250 行 |

### TaskCarousel3D.tsx

| 特性 | 早期版本 | 当前版本 |
|------|---------|---------|
| 布局方式 | 3D 旋转 | 2D 横向滑动 |
| 容器宽度 | 固定宽度 | 全宽 (100vw) |
| 拖拽支持 | 基础 | 增强（鼠标+键盘） |
| 性能 | 中等 | 更好 |

---

## 🔄 版本切换命令

### 切换到 V1 (纯 CSS)
```bash
git show ui-tasksquare-v2:frontend/src/components/tasksquare/TaskCard3D.tsx > frontend/src/components/tasksquare/TaskCard3D.tsx
git show ui-tasksquare-v2:frontend/src/components/tasksquare/TaskCarousel3D.tsx > frontend/src/components/tasksquare/TaskCarousel3D.tsx
```

### 切换到 V2 (Lottie 插画)
```bash
git show "stash@{0}:frontend/src/components/tasksquare/TaskCard3D.tsx" > frontend/src/components/tasksquare/TaskCard3D.tsx
git show "stash@{0}:frontend/src/components/tasksquare/TaskCarousel3D.tsx" > frontend/src/components/tasksquare/TaskCarousel3D.tsx
```

### 查看当前版本
```bash
git log -1 --oneline -- frontend/src/components/tasksquare/TaskCard3D.tsx
```

---

## 📊 Git 历史

### TaskCard3D.tsx
```
108ac1f - On ui-tasksquare-v2: backup-before-rollback (stash)
334a27e - fix: break out of PageLayout maxWidth constraint
71c09b7 - feat: full-width layout + category theme cards
629c76a - refactor: convert 3D carousel to 2D horizontal slide
d65db37 - enhance: improve 3D carousel effects and drag interaction
cd8d87a - feat: TaskSquare V2 - 3D card gallery (clean cherry-pick)
```

### TaskCarousel3D.tsx
```
71c09b7 - feat: full-width layout + category theme cards
629c76a - refactor: convert 3D carousel to 2D horizontal slide
d65db37 - enhance: improve 3D carousel effects and drag interaction
cd8d87a - feat: TaskSquare V2 - 3D card gallery (clean cherry-pick)
```

---

## 🎯 推荐使用

### 场景 1: 生活互助平台（EverEcho）
**推荐**: V2/V3 (Lottie 插画版本)

**理由**:
- ✅ 视觉吸引力强
- ✅ 分类识别度高
- ✅ 品牌感强
- ✅ 用户体验好

### 场景 2: 技术外包平台
**推荐**: V1 (纯 CSS 版本)

**理由**:
- ✅ 性能更好
- ✅ 科技感强
- ✅ 加载更快
- ✅ 体积更小

---

## 🔧 开发建议

### 如果使用 V2 (Lottie 版本)

1. **确保动画文件存在**
   ```bash
   ls frontend/public/animations/
   ```

2. **检查 lottie-react 依赖**
   ```bash
   npm list lottie-react
   ```

3. **优化性能**
   - 只播放激活卡片的动画 ✅ 已实现
   - 考虑懒加载动画文件
   - 压缩动画 JSON 文件

### 如果使用 V1 (纯 CSS 版本)

1. **调整主题配色**
   - 编辑 `categoryTheme.ts`
   - 修改径向渐变参数

2. **增强视觉效果**
   - 添加更多 CSS 动画
   - 使用 CSS 滤镜
   - 添加粒子效果

---

## 📚 相关文档

- [插画版本说明](./TASKSQUARE_ILLUSTRATION_VERSION.md)
- [主题配置版本](./CATEGORYTHEME_VERSIONS.md)
- [3D 文件清单](./TASKSQUARE_3D_FILES.md)
- [插画恢复报告](./ILLUSTRATION_RESTORE_REPORT.md)

---

## ✨ 总结

**当前状态**: 使用 **V2/V3 (Lottie 插画版本)**

这是最适合 EverEcho 生活互助平台的版本，提供：
- 🎨 7 个分类专属 Lottie 动画
- 🌈 浅色莫兰迪配色
- 💫 智能动画播放
- 🎯 优秀的用户体验

如需切换版本，使用上述命令即可！
