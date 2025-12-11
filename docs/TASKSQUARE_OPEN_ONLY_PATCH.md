# TaskSquare Open-Only Patch - 可接单池改造

## 📋 改动文件清单

### 修改文件
1. **`frontend/src/pages/TaskSquare.tsx`** - 改造为 Open-only 可接单池

---

## 🎯 改动内容

### ✅ 严格遵守冻结点

#### 不改动的内容（冻结点）
- ✅ 不改 `useTasks.ts / useTaskActions.ts / useWallet.ts`
- ✅ 不改 chain sync / event listener
- ✅ 不改 TaskStatus 枚举、字段命名、链上读取
- ✅ 不改 category/search 的过滤逻辑本体
- ✅ 不改合约交互、后端接口、状态机

### 🎨 改动内容（仅 TaskSquare 页面层）

#### 1. Open-only 默认过滤
**之前**：`selectedStatus` 默认为 `null`（显示所有状态）

**之后**：`selectedStatus` 默认为 `TaskStatus.Open`（只显示 Open 任务）

```typescript
// 改动前
const [selectedStatus, setSelectedStatus] = useState<number | null>(null);

// 改动后
const [selectedStatus, setSelectedStatus] = useState<number | null>(TaskStatus.Open);
```

#### 2. 隐藏 Status Pills UI
- Status pills 区域设置为 `display: 'none'`
- 保留完整的 Status filter 逻辑和 handler
- 不删除任何代码，只隐藏 UI

#### 3. 保留 Category + Search 功能
- ✅ Category 下拉选择器继续可用
- ✅ Search 输入框继续可用
- ✅ 过滤逻辑完全不变
- ✅ 文案更新为 "Filter by Category" 和 "Search Tasks"

#### 4. 默认排序：最新在上
添加排序逻辑，按 `createdAt` 倒序：

```typescript
const sortedTasks = useMemo(() => {
  return [...filteredTasks].sort((a, b) => {
    const ta = a.createdAt ?? Number(a.taskId);
    const tb = b.createdAt ?? Number(b.createdAt);
    return tb - ta; // 倒序：最新在上
  });
}, [filteredTasks]);
```

#### 5. 新任务醒目标记
- **判定标准**：`createdAt` 在最近 24 小时内
- **视觉标记**：卡片右上角显示绿色 "✨ New" badge
- **纯 UI**：不影响任何过滤和排序逻辑

```typescript
const isNewTask = (task: { createdAt?: number }) => {
  if (!task.createdAt) return false;
  const now = Date.now() / 1000;
  return now - task.createdAt < 24 * 3600;
};
```

---

## 🔧 关键代码片段

### 1. Open-only 过滤逻辑

```typescript
// Open-only: 默认只显示 Open 状态任务
const [selectedStatus, setSelectedStatus] = useState<number | null>(TaskStatus.Open);

// 过滤任务（Open-only + Category + Search）
const filteredTasks = useMemo(() => {
  // 1. Status filter: 默认只显示 Open 任务
  let result = tasks.filter(task => {
    if (selectedStatus !== null) {
      return task.status === selectedStatus;
    }
    return true;
  });
  
  // 2. Category filter
  if (selectedCategory !== 'all') {
    result = result.filter(task => task.metadata?.category === selectedCategory);
  }
  
  // 3. Search filter
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    result = result.filter(task => {
      const title = task.metadata?.title?.toLowerCase() || '';
      const description = task.metadata?.description?.toLowerCase() || '';
      const categoryLabel = getCategoryLabel(task.metadata?.category).toLowerCase();
      return title.includes(term) || description.includes(term) || categoryLabel.includes(term);
    });
  }
  
  return result;
}, [tasks, selectedStatus, selectedCategory, searchTerm]);
```

### 2. 排序逻辑

```typescript
// 排序：最新在上（按 createdAt 倒序）
const sortedTasks = useMemo(() => {
  return [...filteredTasks].sort((a, b) => {
    const ta = a.createdAt ?? Number(a.taskId);
    const tb = b.createdAt ?? Number(b.createdAt);
    return tb - ta; // 倒序：最新在上
  });
}, [filteredTasks]);
```

### 3. 新任务标记

```tsx
{/* Tasks Grid - Sorted by newest first */}
{!loading && !error && sortedTasks.length > 0 && (
  <div style={styles.taskGrid}>
    {sortedTasks.map(task => (
      <div key={task.taskId} style={styles.taskCardWrapper}>
        {isNewTask(task) && (
          <div style={styles.newBadge}>✨ New</div>
        )}
        <TaskCard task={task} />
      </div>
    ))}
  </div>
)}
```

### 4. 隐藏 Status Pills

```tsx
{/* Status Row - Hidden (保留逻辑，隐藏 UI) */}
<div style={{ display: 'none' }}>
  <label style={styles.filterLabel}>Status</label>
  <div className="status-pills-responsive" style={styles.statusPills}>
    {/* Status pills 保留完整逻辑 */}
  </div>
</div>
```

### 5. New Badge 样式

```typescript
taskCardWrapper: {
  position: 'relative',
},
newBadge: {
  position: 'absolute',
  top: '-8px',
  right: '12px',
  backgroundColor: '#10b981',
  color: 'white',
  fontSize: '11px',
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: '12px',
  zIndex: 10,
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
},
```

---

## ✅ 验收清单

### P0 必须验收项

#### Open-only 功能
- [ ] **默认只显示 Open 任务**：打开 TaskSquare，只看到 Open 状态的任务
- [ ] **不显示其他状态**：InProgress / Submitted / Completed / Cancelled 任务不出现
- [ ] **Status UI 隐藏**：看不到 Status pills 选择器

#### Category + Search 功能保留
- [ ] **Category Filter 可用**：
  - 下拉选择器正常显示
  - 选择不同 category，筛选 Open 任务中的对应类别
  - 与之前行为完全一致
- [ ] **Search 可用**：
  - 输入框正常显示
  - 按 title / description / category 搜索 Open 任务
  - 与之前行为完全一致
- [ ] **叠加过滤**：Category + Search 同时使用，结果正确

#### 排序功能
- [ ] **最新在上**：
  - 任务按 `createdAt` 倒序排列
  - 最新发布的任务显示在最上方
  - 旧任务在下方

#### 新任务标记
- [ ] **New Badge 显示**：
  - 24 小时内发布的任务显示 "✨ New" badge
  - Badge 位于卡片右上角
  - 绿色背景，白色文字
- [ ] **New Badge 不影响逻辑**：
  - 不影响过滤结果
  - 不影响排序
  - 纯视觉标记

#### 无副作用
- [ ] **编译通过**：`frontend/src/pages/TaskSquare.tsx` 无错误
- [ ] **无 console 错误**：浏览器控制台无新增错误
- [ ] **热更新正常**：修改后前端自动刷新
- [ ] **其他页面正常**：
  - Profile 页面正常（TaskHistory 显示所有状态）
  - PublishTask 页面正常
  - TaskDetail 页面正常
  - Disconnect 行为正常

---

## 🧪 自测步骤

### 1. Open-only 测试
1. 打开 TaskSquare
2. **验证**：只看到 Open 状态的任务
3. **验证**：看不到 InProgress / Submitted / Completed / Cancelled 任务
4. **验证**：看不到 Status pills 选择器

### 2. Category Filter 测试
1. 在 TaskSquare 选择不同 Category
2. **验证**：只显示 Open 状态 + 对应 Category 的任务
3. 选择 "All Categories"
4. **验证**：显示所有 Open 任务

### 3. Search 测试
1. 在搜索框输入关键词
2. **验证**：只显示 Open 状态 + 匹配关键词的任务
3. 清空搜索
4. **验证**：显示所有 Open 任务

### 4. 排序测试
1. 查看任务列表
2. **验证**：最新发布的任务在最上方
3. **验证**：旧任务在下方
4. 发布一个新任务
5. **验证**：新任务出现在列表顶部

### 5. New Badge 测试
1. 查看任务列表
2. **验证**：24 小时内发布的任务显示 "✨ New" badge
3. **验证**：Badge 位于卡片右上角，绿色背景
4. **验证**：旧任务（>24h）不显示 badge

### 6. 叠加过滤测试
1. 选择 Category: "Pet / 宠物"
2. 输入搜索词
3. **验证**：结果同时满足 Open + Pet + 搜索词
4. 清空过滤器
5. **验证**：显示所有 Open 任务

### 7. 其他页面回归测试
1. 进入 Profile 页面
2. **验证**：TaskHistory 显示所有状态的任务（不受影响）
3. 进入 PublishTask 页面
4. **验证**：发布任务功能正常
5. 进入 TaskDetail 页面
6. **验证**：任务详情显示正常
7. 测试 Disconnect 行为
8. **验证**：断开连接和重连正常

---

## 📊 测试结果

### 编译检查
- ✅ `frontend/src/pages/TaskSquare.tsx` - No diagnostics

### 热更新检查
- ✅ 前端服务正常运行
- ✅ 所有修改已热更新

### 功能验证
- ✅ 默认只显示 Open 任务
- ✅ Category Filter 继续可用
- ✅ Search 继续可用
- ✅ 排序最新在上
- ✅ New Badge 显示正确

---

## 🎨 视觉对比

### 之前
```
┌─────────────────────────────────┐
│ Filters                         │
│                                 │
│ Status                          │
│ ⚪All  🔵Open  ⚪In Progress  ⚪Submitted │
│                                 │
│ Category          Search        │
│ [Dropdown ▼]     [Input field]  │
└─────────────────────────────────┘

任务列表：显示所有状态（Open, InProgress, Submitted）
```

### 之后
```
┌─────────────────────────────────┐
│ Filter Open Tasks               │
│                                 │
│ Filter by Category  Search Tasks│
│ [Dropdown ▼]       [Input field]│
└─────────────────────────────────┘

任务列表：只显示 Open 任务，最新在上
┌─────────────────────────────────┐
│ ✨ New                          │
│ [Task Card - 最新任务]           │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Task Card - 较旧任务]           │
└─────────────────────────────────┘
```

---

## 🚀 部署就绪

本 Patch 严格遵守约束：
- ✅ 只改 TaskSquare 页面层
- ✅ 不改 hooks / 合约 / 后端 / 状态机
- ✅ 保留 Category + Search 功能
- ✅ 添加排序和新任务标记
- ✅ 完全向后兼容

可以安全部署到生产环境！🎉

---

## 📝 语义变更说明

### TaskSquare 页面语义
**之前**：任务广场（显示所有状态的任务）

**之后**：可接单池（只显示 Open 状态的任务）

### 用户体验变化
- **更聚焦**：用户只看到可以接单的任务
- **更清晰**：不再被 InProgress / Submitted 任务干扰
- **更及时**：最新任务优先显示，带 New 标记

### Profile 页面不变
- Profile 的 TaskHistory 仍显示所有状态
- 用户可以在 Profile 查看自己的所有任务（包括 InProgress / Submitted / Completed）
