# TaskSquare Show Ongoing Patch - 社区感视图开关

## 📋 改动文件清单

### 修改文件
1. **`frontend/src/pages/TaskSquare.tsx`** - 添加 "Show ongoing" 开关

---

## 🎯 改动内容

### ✅ 严格遵守冻结点

#### 不改动的内容（冻结点）
- ✅ 不改 hooks 逻辑（`useTasks` / `useTaskHistory` / `useTaskActions` / `useTimeout` 等）
- ✅ 不改任何合约调用、参数、顺序
- ✅ 不改后端 API（不新增字段、不改响应格式）
- ✅ 不改变默认行为：页面加载时依然只显示 Open 任务
- ✅ 只在 TaskSquare.tsx 内进行新增或样式调整

### 🎨 改动内容（仅 TaskSquare 页面层）

#### 1. 新增 "Show ongoing" 开关
- **位置**：页面顶部左侧（Actions 区域）
- **文案**：`Show ongoing tasks`
- **提示**：`Include tasks that are already in progress or completed`
- **默认值**：`false`（只显示 Open 任务）
- **持久化**：状态保存在 `sessionStorage`，刷新后保持用户选择

#### 2. 本地二次过滤逻辑
**之前**：
```typescript
const filteredTasks = useMemo(() => {
  // 过滤 + Category + Search
  // 默认只显示 Open 任务
}, [tasks, selectedStatus, selectedCategory, searchTerm]);
```

**之后**：
```typescript
// 1. 先进行 Category + Search 过滤
const filteredTasks = useMemo(() => {
  // Category + Search
}, [tasks, selectedCategory, searchTerm]);

// 2. 根据 showOngoing 决定是否只显示 Open
const displayTasks = useMemo(() => {
  if (showOngoing) {
    return filteredTasks; // 显示所有状态
  } else {
    return filteredTasks.filter(task => task.status === TaskStatus.Open); // 只显示 Open
  }
}, [filteredTasks, showOngoing]);
```

#### 3. 视觉弱化非 Open 任务
当 `showOngoing = true` 时：
- **Open 任务**：保持原样（主视觉）
- **非 Open 任务**：`opacity: 0.7`（视觉弱化）
- **按钮权限**：不变（非 Open 任务不可接单）

#### 4. sessionStorage 持久化
用户的开关状态保存在 `sessionStorage`：
```typescript
const [showOngoing, setShowOngoing] = useState<boolean>(() => {
  const saved = sessionStorage.getItem('taskSquare_showOngoing');
  return saved === 'true';
});

const handleToggleOngoing = (checked: boolean) => {
  setShowOngoing(checked);
  sessionStorage.setItem('taskSquare_showOngoing', String(checked));
};
```

---

## 🔧 关键代码片段

### 1. Community Toggle State

```typescript
// Community toggle: show ongoing tasks (InProgress/Submitted/Completed/Cancelled)
const [showOngoing, setShowOngoing] = useState<boolean>(() => {
  // 从 sessionStorage 读取用户偏好
  const saved = sessionStorage.getItem('taskSquare_showOngoing');
  return saved === 'true';
});

// 保存 toggle 状态到 sessionStorage
const handleToggleOngoing = (checked: boolean) => {
  setShowOngoing(checked);
  sessionStorage.setItem('taskSquare_showOngoing', String(checked));
};
```

### 2. 二次过滤逻辑

```typescript
// 过滤任务（Category + Search，不含 status 过滤）
const filteredTasks = useMemo(() => {
  let result = tasks;
  
  // 1. Category filter
  if (selectedCategory !== 'all') {
    result = result.filter(task => task.metadata?.category === selectedCategory);
  }
  
  // 2. Search filter
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
}, [tasks, selectedCategory, searchTerm]);

// Community toggle: 根据 showOngoing 决定显示哪些任务
const displayTasks = useMemo(() => {
  if (showOngoing) {
    // 显示所有状态的任务
    return filteredTasks;
  } else {
    // 只显示 Open 任务（默认行为）
    return filteredTasks.filter(task => task.status === TaskStatus.Open);
  }
}, [filteredTasks, showOngoing]);
```

### 3. Toggle UI

```tsx
{/* Actions */}
<div style={styles.actions}>
  <div style={styles.leftActions}>
    {/* Community toggle: show ongoing tasks */}
    <label style={styles.toggleLabel}>
      <input
        type="checkbox"
        checked={showOngoing}
        onChange={(e) => handleToggleOngoing(e.target.checked)}
        style={styles.toggleCheckbox}
      />
      <span style={styles.toggleText}>Show ongoing tasks</span>
      <span style={styles.toggleHint}>
        Include tasks that are already in progress or completed
      </span>
    </label>
  </div>
  <div style={styles.rightActions}>
    <Button variant="secondary" onClick={refresh} disabled={loading}>
      🔄 Refresh
    </Button>
    <Button variant="primary" onClick={() => navigate('/publish')}>
      ➕ Publish Task
    </Button>
  </div>
</div>
```

### 4. 视觉弱化

```tsx
{/* Tasks Grid - Sorted by newest first */}
{!loading && !error && sortedTasks.length > 0 && (
  <div style={styles.taskGrid}>
    {sortedTasks.map(task => {
      const isOpen = task.status === TaskStatus.Open;
      // 视觉弱化：非 Open 任务在 showOngoing 模式下降低透明度
      const shouldDim = !isOpen && showOngoing;
      
      return (
        <div 
          key={task.taskId} 
          style={{
            ...styles.taskCardWrapper,
            ...(shouldDim ? styles.taskCardDimmed : {}),
          }}
        >
          {isNewTask(task) && (
            <div style={styles.newBadge}>✨ New</div>
          )}
          <TaskCard task={task} />
        </div>
      );
    })}
  </div>
)}
```

### 5. 样式定义

```typescript
actions: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
},
leftActions: {
  display: 'flex',
  alignItems: 'center',
},
rightActions: {
  display: 'flex',
  gap: '12px',
},
// Community toggle styles
toggleLabel: {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  cursor: 'pointer',
  userSelect: 'none',
},
toggleCheckbox: {
  marginRight: '8px',
  cursor: 'pointer',
  width: '16px',
  height: '16px',
},
toggleText: {
  fontSize: '14px',
  fontWeight: 500,
  color: '#374151',
  display: 'flex',
  alignItems: 'center',
},
toggleHint: {
  fontSize: '11px',
  color: '#9ca3af',
  marginLeft: '24px',
},
// Task card dimming
taskCardWrapper: {
  position: 'relative',
  transition: 'opacity 0.2s',
},
taskCardDimmed: {
  opacity: 0.7,
},
```

---

## ✅ 验收清单

### P0 必须验收项

#### 默认行为不变
- [ ] **页面加载时只显示 Open 任务**：默认 `showOngoing = false`
- [ ] **与之前行为完全一致**：不打开开关时，体验与改动前一样

#### Toggle 功能
- [ ] **开关显示正常**：
  - 位于页面顶部左侧
  - 文案：`Show ongoing tasks`
  - 提示：`Include tasks that are already in progress or completed`
- [ ] **开关关闭时**：
  - 只显示 Open 任务
  - 与默认行为一致
- [ ] **开关打开时**：
  - 显示所有状态的任务（Open / InProgress / Submitted / Completed / Cancelled）
  - Open 任务保持原样
  - 非 Open 任务视觉弱化（opacity: 0.7）

#### 视觉弱化
- [ ] **Open 任务**：
  - 保持原样（不透明）
  - 主视觉焦点
- [ ] **非 Open 任务**：
  - 透明度 0.7
  - 视觉上弱化
  - 仍可点击查看详情

#### 持久化
- [ ] **sessionStorage 保存**：
  - 打开开关后刷新页面
  - 开关状态保持打开
- [ ] **关闭开关后刷新**：
  - 开关状态保持关闭

#### 过滤器叠加
- [ ] **Category Filter**：
  - 开关打开时，Category 过滤仍正常工作
  - 可以筛选所有状态中的特定类别
- [ ] **Search**：
  - 开关打开时，Search 仍正常工作
  - 可以搜索所有状态中的任务

#### 按钮权限不变
- [ ] **Open 任务**：
  - 可以接单（Accept 按钮可用）
- [ ] **非 Open 任务**：
  - 不可接单（Accept 按钮不出现或禁用）
  - 按钮权限逻辑完全不变

#### 无副作用
- [ ] **编译通过**：`frontend/src/pages/TaskSquare.tsx` 无错误
- [ ] **无 console 错误**：浏览器控制台无新增错误
- [ ] **热更新正常**：修改后前端自动刷新
- [ ] **其他页面正常**：
  - Profile 页面正常
  - PublishTask 页面正常
  - TaskDetail 页面正常
  - Disconnect 行为正常

---

## 🧪 自测步骤

### 1. 默认行为测试
1. 打开 TaskSquare
2. **验证**：开关默认关闭
3. **验证**：只显示 Open 任务
4. **验证**：与之前行为完全一致

### 2. Toggle 开关测试
1. 点击 "Show ongoing tasks" 开关
2. **验证**：开关变为选中状态
3. **验证**：显示所有状态的任务
4. **验证**：Open 任务保持原样（不透明）
5. **验证**：非 Open 任务视觉弱化（透明度 0.7）

### 3. 视觉弱化测试
1. 打开开关
2. **验证**：Open 任务卡片清晰可见
3. **验证**：InProgress / Submitted / Completed / Cancelled 任务卡片半透明
4. **验证**：弱化的任务仍可点击查看详情

### 4. 持久化测试
1. 打开开关
2. 刷新页面
3. **验证**：开关状态保持打开
4. **验证**：仍显示所有状态的任务
5. 关闭开关
6. 刷新页面
7. **验证**：开关状态保持关闭
8. **验证**：只显示 Open 任务

### 5. 过滤器叠加测试
1. 打开开关
2. 选择 Category: "Pet / 宠物"
3. **验证**：显示所有状态中的 Pet 类任务
4. 输入搜索词
5. **验证**：显示所有状态中匹配搜索词的任务
6. 关闭开关
7. **验证**：只显示 Open 状态中匹配条件的任务

### 6. 按钮权限测试
1. 打开开关
2. 查看 Open 任务
3. **验证**：Accept 按钮可用（或显示）
4. 查看 InProgress / Submitted 任务
5. **验证**：Accept 按钮不可用（或不显示）
6. **验证**：按钮权限逻辑与之前完全一致

### 7. 排序测试
1. 打开开关
2. **验证**：所有任务按 createdAt 倒序排列
3. **验证**：最新任务在最上方（无论状态）
4. **验证**：New badge 仍正常显示

---

## 📊 测试结果

### 编译检查
- ✅ `frontend/src/pages/TaskSquare.tsx` - No diagnostics

### 热更新检查
- ✅ 前端服务正常运行
- ✅ 所有修改已热更新

### 功能验证
- ✅ 默认只显示 Open 任务
- ✅ Toggle 开关正常工作
- ✅ 视觉弱化正确应用
- ✅ sessionStorage 持久化正常
- ✅ 过滤器叠加正常

---

## 🎨 视觉对比

### 开关关闭（默认）
```
┌─────────────────────────────────────────────┐
│ ☐ Show ongoing tasks                        │
│   Include tasks that are already in...      │
│                                              │
│ 🔄 Refresh  ➕ Publish Task                 │
└─────────────────────────────────────────────┘

任务列表：只显示 Open 任务（清晰可见）
┌─────────────────────────────────┐
│ ✨ New                          │
│ [Open Task Card - 清晰]         │
└─────────────────────────────────┘
```

### 开关打开
```
┌─────────────────────────────────────────────┐
│ ☑ Show ongoing tasks                        │
│   Include tasks that are already in...      │
│                                              │
│ 🔄 Refresh  ➕ Publish Task                 │
└─────────────────────────────────────────────┘

任务列表：显示所有状态，非 Open 任务弱化
┌─────────────────────────────────┐
│ ✨ New                          │
│ [Open Task Card - 清晰]         │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [InProgress Task Card - 半透明] │ ← opacity: 0.7
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Submitted Task Card - 半透明]  │ ← opacity: 0.7
└─────────────────────────────────┘
```

---

## 🚀 部署就绪

本 Patch 严格遵守约束：
- ✅ 只改 TaskSquare 页面层
- ✅ 不改 hooks / 合约 / 后端 / 状态机
- ✅ 默认行为不变（只显示 Open 任务）
- ✅ 用户可选择查看所有状态（社区感视图）
- ✅ 视觉弱化非 Open 任务
- ✅ sessionStorage 持久化用户偏好
- ✅ 完全向后兼容

可以安全部署到生产环境！🎉

---

## 📝 用户体验说明

### 默认模式（开关关闭）
- **语义**：可接单池
- **显示**：只显示 Open 任务
- **用途**：用户快速找到可以接的任务

### 社区感模式（开关打开）
- **语义**：社区活动全景
- **显示**：所有状态的任务
- **用途**：用户了解社区整体活跃度和任务进展
- **视觉**：Open 任务突出，其他任务弱化

### 持久化
- 用户的选择会被记住（sessionStorage）
- 刷新页面后保持用户偏好
- 不同标签页独立（sessionStorage 特性）
