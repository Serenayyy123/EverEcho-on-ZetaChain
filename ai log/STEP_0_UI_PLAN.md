# Step 0-UI 最小子集实现方案

## 1. UI 信息架构与视觉规范（15行）

**设计原则**：简洁、卡片化、可演示
**色彩系统**：主色 #2563eb（蓝）、成功 #10b981（绿）、警告 #f59e0b（橙）、错误 #ef4444（红）
**布局**：居中卡片式，最大宽度 1200px，响应式
**组件层次**：Layout（导航+内容） → Page（页面容器） → Card（内容卡片） → Form/List（具体内容）
**状态标识**：
- Open: 蓝色徽章
- InProgress: 橙色徽章  
- Submitted: 紫色徽章
- Completed: 绿色徽章
- Cancelled: 灰色徽章
**交互反馈**：所有按钮有 hover/active/disabled 状态，loading 显示 spinner，错误显示 toast
**字体**：系统字体栈，标题 24-32px，正文 14-16px，辅助 12-14px
**间距**：8px 基础单位，卡片内边距 24-32px，元素间距 16-24px

---

## 2. 实现策略

由于代码量巨大（预计 2000+ 行），我将采用**分阶段交付**策略：

### Phase 1: 核心 UI 组件（优先）
- Button, Card, Badge, Input, Select 等基础组件
- Layout 和 Navigation 组件

### Phase 2: 页面优化（按优先级）
1. Home.tsx - 首页优化
2. Register.tsx - 注册表单优化
3. TaskSquare.tsx - 任务列表优化
4. TaskDetail.tsx - 任务详情优化
5. PublishTask.tsx - 发布任务优化
6. Profile.tsx - 个人资料优化

### Phase 3: 状态和提示
- CAP 满提示
- chainId 错误提示
- 元数据加载失败提示
- 结算明细显示

---

## 3. 需要确认的问题

**由于这是一个大型 UI 重构任务，我需要你确认：**

1. **实现方式**：
   - Option A: 我创建完整的 UI 组件库 + 重写所有页面（2000+ 行代码）
   - Option B: 我提供详细的设计规范 + 关键组件示例，你分批实现
   - Option C: 我优先实现最关键的 3-4 个页面，其他页面保持现状

2. **UI 框架**：
   - 使用 Tailwind CSS？（需要配置）
   - 使用原生 CSS + CSS Modules？
   - 继续使用 inline styles？（当前方式）

3. **优先级**：
   - 哪些页面最重要？（建议：Home → Register → TaskSquare → TaskDetail）
   - 是否需要响应式设计？
   - 是否需要暗黑模式？

---

## 4. 建议的最小可行方案

**我建议采用"渐进式优化"策略**：

### 立即可做（1-2 小时）
1. 创建统一的 UI 组件库（Button, Card, Badge, Input）
2. 优化 Home 和 Register 页面
3. 添加 CAP 满提示和 chainId 错误提示

### 后续优化（3-4 小时）
4. 优化 TaskSquare 和 TaskDetail
5. 优化 PublishTask 和 Profile
6. 完善所有状态提示

---

## 5. 快速决策建议

**如果你希望我立即开始，我建议：**

✅ **采用 Option C**：优先实现核心页面
✅ **使用原生 CSS**：避免配置 Tailwind
✅ **创建轻量组件库**：Button, Card, Badge, Input, Layout
✅ **优先级**：Home → Register → TaskSquare → TaskDetail

**这样可以在 2-3 小时内完成核心 UI 优化，让系统可演示。**

---

请告诉我：
1. 选择哪个 Option？
2. 是否同意建议的优先级？
3. 是否需要我立即开始实现核心组件？
