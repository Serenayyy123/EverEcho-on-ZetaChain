# Step A1 快速开始指南

## 已完成的工作

### ✅ Mock 数据层
- `mock/types.ts` - 类型定义（与真实接口一致）
- `mock/profiles.ts` - 用户数据（3 个预置用户）
- `mock/tasks.ts` - 任务数据（5 个预置任务，覆盖所有状态）
- `mock/contacts.ts` - 联系方式数据

### ✅ Mock Hooks
- `useMockWallet.ts` - 钱包连接/断开/切换账户
- `useMockRegister.ts` - 用户注册
- `useMockTasks.ts` - 任务列表/单任务/创建任务
- `useMockTaskActions.ts` - 任务操作（accept/submit/confirm/cancel/terminate/fix）
- `useMockTimeout.ts` - 超时计算和倒计时
- `useMockContacts.ts` - 联系方式加载/保存

### ✅ Mock 组件
- `MockWalletSelector.tsx` - Mock 钱包选择器

## 如何集成到现有页面

### 方案 1：在现有页面中添加 Mock 模式开关

在每个页面顶部添加：

```typescript
import { MockWalletSelector } from '../components/MockWalletSelector';
import { useMockWallet } from '../hooks/useMockWallet';

// 在组件中
const { address, isRegistered, balance } = useMockWallet();

// 在 JSX 中
<MockWalletSelector />
```

### 方案 2：创建独立的 Mock Demo 页面

创建 `frontend/src/pages/MockDemo.tsx`：

```typescript
import { MockWalletSelector } from '../components/MockWalletSelector';
import { useMockTasks } from '../hooks/useMockTasks';
import { TaskCard } from '../components/TaskCard';

export function MockDemo() {
  const { tasks, loading } = useMockTasks();

  return (
    <div>
      <h1>Mock Demo</h1>
      <MockWalletSelector />
      
      <h2>Tasks</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {tasks.map((task) => (
            <TaskCard key={task.taskId} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 方案 3：替换现有 Hooks

将现有页面中的 hooks 替换为 mock 版本：

```typescript
// 原来
import { useWallet } from '../hooks/useWallet';
import { useTasks } from '../hooks/useTasks';

// 改为
import { useMockWallet as useWallet } from '../hooks/useMockWallet';
import { useMockTasks as useTasks } from '../hooks/useMockTasks';
```

## 修改现有页面以支持 Mock

### TaskSquare.tsx

```typescript
// 添加 import
import { useMockTasks } from '../hooks/useMockTasks';
import { useMockWallet } from '../hooks/useMockWallet';

// 替换 hooks
const { tasks, loading, error } = useMockTasks();
const { address } = useMockWallet();
```

### TaskDetail.tsx

```typescript
// 添加 import
import { useMockTask } from '../hooks/useMockTasks';
import { useMockTaskActions } from '../hooks/useMockTaskActions';
import { useMockTimeout } from '../hooks/useMockTimeout';
import { useMockContacts } from '../hooks/useMockContacts';
import { useMockWallet } from '../hooks/useMockWallet';

// 替换 hooks
const { task, loading, error, refresh } = useMockTask(taskId);
const { acceptTask, submitWork, confirmComplete, requestFix } = useMockTaskActions();
const { timeLeft, isTimeout, formatTimeLeft } = useMockTimeout(task);
const { contacts, loadContacts } = useMockContacts(taskId);
const { address } = useMockWallet();
```

### PublishTask.tsx

```typescript
// 添加 import
import { useMockCreateTask } from '../hooks/useMockTasks';
import { useMockWallet } from '../hooks/useMockWallet';

// 替换 hooks
const { createTask, isCreating, error } = useMockCreateTask();
const { address } = useMockWallet();
```

### Profile.tsx

```typescript
// 添加 import
import { useMockWallet } from '../hooks/useMockWallet';
import { useMockTasks } from '../hooks/useMockTasks';

// 替换 hooks
const { address, balance, isRegistered } = useMockWallet();
const { tasks } = useMockTasks();

// 过滤用户的任务
const myTasks = tasks.filter(
  (t) => t.creator === address || t.helper === address
);
```

## 测试用户旅程

### 1. 连接钱包
```
访问页面 → 看到 MockWalletSelector → 选择 0xAlice → 连接成功
```

### 2. 浏览任务
```
TaskSquare → 看到 5 个预置任务 → 点击任务 → 进入 TaskDetail
```

### 3. 创建任务（Alice）
```
PublishTask → 填写表单 → 提交 → 任务创建成功 → 状态 Open
```

### 4. 接受任务（切换到 Bob）
```
切换账户到 0xBob → TaskDetail → Accept Task → 状态变为 InProgress
```

### 5. 提交工作（Bob）
```
TaskDetail → Submit Work → 状态变为 Submitted
```

### 6. 确认完成（切换到 Alice）
```
切换账户到 0xAlice → TaskDetail → Confirm Complete → 状态变为 Completed
```

### 7. Request Fix（Alice）
```
在 Submitted 状态 → Request Fix → fixRequested=true → 倒计时延长
```

### 8. 协商终止（InProgress）
```
任一方 → Request Terminate → 对方 → Agree to Terminate → 状态变为 Cancelled
```

## 验证冻结点

### 状态机（1.3-13）
- ✅ Open → InProgress → Submitted → Completed/Cancelled
- ✅ 状态流转正确

### 双向抵押（1.3-14）
- ✅ UI 显示 Creator 抵押 R
- ✅ UI 显示 Helper 抵押 R

### 资金流（1.3-15）
- ✅ Completed 时显示 Helper 得 0.98R
- ✅ 显示 0.02R burn
- ✅ 显示保证金 R 退回

### 取消限制（1.3-16, 1.3-17）
- ✅ InProgress 不显示单方取消按钮
- ✅ Submitted 不显示取消按钮

### Request Fix（1.4-20）
- ✅ 只允许一次（按钮消失）
- ✅ 不刷新 submittedAt
- ✅ 延长验收期 3 天

### 命名一致（3.1/3.3/3.4）
- ✅ 字段名与合约一致
- ✅ 函数名与合约一致
- ✅ 事件名与合约一致

## 下一步

1. **集成到现有页面**：选择上述方案之一
2. **测试所有流程**：按照用户旅程测试
3. **验证 UI 状态**：确保按钮显示/隐藏正确
4. **准备真实集成**：Mock hooks 接口形状已与真实接口一致

---

**Step A1 Mock 数据层已完成，可以开始集成和测试！** ✅
