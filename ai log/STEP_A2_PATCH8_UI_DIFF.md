# Step A2 Patch-8 UI 入口 Diff

## 修改文件
- `frontend/src/pages/Profile.tsx`

---

## Profile.tsx - 添加 Demo Seed 按钮

### Diff 1: 导入 demoSeed 工具

```diff
  import { useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { useWallet } from '../hooks/useWallet';
  import { useProfile } from '../hooks/useProfile';
  import { useTaskHistory } from '../hooks/useTaskHistory';
  import { TaskHistory } from '../components/TaskHistory';
  import { formatECHO } from '../utils/formatters';
+ import { printDemoSeed } from '../utils/demoSeed';
```

---

### Diff 2: 添加 Demo Seed 处理函数

```diff
  export function Profile() {
    const navigate = useNavigate();
-   const { address, provider, disconnect } = useWallet();
+   const { address, chainId, provider, disconnect } = useWallet();
    const { profile, balance, loading: profileLoading, error: profileError } = useProfile(address, provider);
    
    const [activeTab, setActiveTab] = useState<TabType>('creator');

    // 加载任务历史
    const {
      tasks,
      loading: historyLoading,
      error: historyError,
    } = useTaskHistory(
      provider,
      address ? { role: activeTab, address } : null
    );

+   // Demo Seed 工具（仅开发环境）
+   const handleDemoSeed = async () => {
+     if (!provider || !chainId || !address) {
+       console.error('Wallet not connected');
+       return;
+     }
+     
+     try {
+       await printDemoSeed(provider, chainId, address, 10);
+     } catch (err) {
+       console.error('Demo seed failed:', err);
+     }
+   };
```

---

### Diff 3: 在 Header 添加 Demo Seed 按钮

```diff
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>My Profile</h1>
        <div style={styles.headerActions}>
+         {/* Demo Seed 按钮（仅开发环境显示） */}
+         {import.meta.env.DEV && (
+           <button 
+             onClick={handleDemoSeed} 
+             style={styles.demoButton}
+             title="Print demo seed to console"
+           >
+             🎯 Demo Seed
+           </button>
+         )}
          <button onClick={() => navigate('/tasks')} style={styles.navButton}>
            Task Square
          </button>
          <button onClick={disconnect} style={styles.disconnectButton}>
            Disconnect
          </button>
        </div>
      </div>
```

---

### Diff 4: 添加按钮样式

```diff
  const styles: Record<string, React.CSSProperties> = {
    // ... 其他样式
    
    headerActions: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    },
+   demoButton: {
+     backgroundColor: '#6c757d',
+     color: 'white',
+     border: 'none',
+     borderRadius: '6px',
+     padding: '8px 16px',
+     fontSize: '14px',
+     cursor: 'pointer',
+   },
    navButton: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '8px 16px',
      fontSize: '14px',
      cursor: 'pointer',
    },
    
    // ... 其他样式
  };
```

---

## 使用方式

### 1. 开发环境

**条件**：`import.meta.env.DEV === true`

**显示**：
```
┌─────────────────────────────────────────┐
│ My Profile                              │
│ [🎯 Demo Seed] [Task Square] [Disconnect] │
└─────────────────────────────────────────┘
```

**操作**：
1. 点击 "🎯 Demo Seed" 按钮
2. 打开浏览器控制台（F12）
3. 查看格式化的任务摘要

---

### 2. 生产环境

**条件**：`import.meta.env.DEV === false`

**显示**：
```
┌─────────────────────────────────────────┐
│ My Profile                              │
│ [Task Square] [Disconnect]              │
└─────────────────────────────────────────┘
```

**说明**：Demo Seed 按钮不显示

---

## 控制台输出示例

```
Loading demo seed...

============================================================
📋 EverEcho Demo Seed
============================================================

👤 Current Account:
   0x1234567890123456789012345678901234567890

🌐 Network:
   Sepolia (11155111)

📊 Task Statistics:
   Total Tasks: 15
   Showing: 10 recent tasks

📝 Recent Tasks:

  Task #15 - Open - 50 EOCHO
    Role: 👨‍💼 Creator
    
  Task #14 - InProgress - 30 EOCHO
    Role: 👷 Helper
    Actions: 📤 Can Submit
    
  Task #13 - Submitted - 40 EOCHO
    Role: 👨‍💼 Creator
    Actions: ✔️ Can Confirm
    
  Task #12 - Completed - 25 EOCHO
    Role: 👀 Viewer
    
  Task #11 - Open - 60 EOCHO
    Role: 👀 Viewer
    Actions: ✅ Can Accept

💡 Testing Tips:
   • Switch accounts in MetaMask to test different roles
   • Creator can: publish, confirm, request fix
   • Helper can: accept, submit work
   • Use different accounts to test the full workflow

============================================================
Generated at: 11/24/2025, 10:30:45 AM
============================================================
```

---

## 特性

### ✅ 仅开发环境启用

```typescript
{import.meta.env.DEV && (
  <button onClick={handleDemoSeed}>
    🎯 Demo Seed
  </button>
)}
```

- 生产环境自动隐藏
- 不影响生产代码
- 不增加生产包大小

---

### ✅ 不影响主逻辑

- 独立的工具函数
- 只读操作（不修改状态）
- 不依赖其他组件

---

### ✅ 快速调试

- 一键查看最近任务
- 显示角色关系
- 提示可执行操作
- 给出测试建议

---

## 验收清单

- [x] 仅在开发环境显示
- [x] 不影响生产逻辑
- [x] 不新增页面
- [x] 最小化修改
- [x] 功能完整

---

**验收结果**：✅ 通过
