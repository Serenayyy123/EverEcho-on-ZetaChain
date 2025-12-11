# P1-F6 倒计时与超时提示 — 快速开始指南

## 🚀 关键设计说明

### 1. useTimeout Hook 返回值

```typescript
{
  deadline: number | null,      // 截止时间戳（秒）
  remainingMs: number | null,   // 剩余毫秒数
  isExpired: boolean,           // 是否已超时
  label: string | null          // 状态标签
}
```

### 2. TimeoutIndicator 组件 Props

```typescript
{
  taskId: string | number,      // 任务 ID
  status: TaskStatus,           // 任务状态
  createdAt: number,            // 创建时间戳
  acceptedAt: number,           // 接受时间戳
  submittedAt: number,          // 提交时间戳
  fixRequested: boolean,        // 是否请求修复
  creator: string,              // Creator 地址
  helper: string,               // Helper 地址
  signer: ethers.Signer | null, // 钱包签名器
  address: string | null,       // 当前用户地址
  onTimeoutTxSuccess?: () => void // 超时交易成功回调
}
```

### 3. 复用现有 Hooks

- ✅ 使用 `useWallet` 获取 signer 和 address
- ✅ 使用现有的 TaskEscrow ABI 和地址配置
- ✅ 使用 ethers.js Contract 进行合约交互

---

## 📋 完整代码

### 1. useTimeout Hook

**文件**：`frontend/src/hooks/useTimeout.ts`

```typescript
import { useState, useEffect } from 'react';
import { TaskStatus } from '../types/task';

// 超时常量（秒）
const T_OPEN = 7 * 24 * 60 * 60;
const T_PROGRESS = 14 * 24 * 60 * 60;
const T_REVIEW = 3 * 24 * 60 * 60;
const T_FIX_EXTENSION = 3 * 24 * 60 * 60;

export interface TimeoutInfo {
  deadline: number | null;
  remainingMs: number | null;
  isExpired: boolean;
  label: string | null;
}

export interface UseTimeoutParams {
  status: TaskStatus;
  createdAt: number;
  acceptedAt: number;
  submittedAt: number;
  fixRequested: boolean;
}

export function useTimeout(params: UseTimeoutParams): TimeoutInfo {
  const { status, createdAt, acceptedAt, submittedAt, fixRequested } = params;
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const getTimeoutInfo = (): TimeoutInfo => {
    let deadline: number | null = null;
    let label: string | null = null;

    switch (status) {
      case TaskStatus.Open:
        deadline = createdAt + T_OPEN;
        label = 'Open Timeout';
        break;

      case TaskStatus.InProgress:
        deadline = acceptedAt + T_PROGRESS;
        label = 'InProgress Timeout';
        break;

      case TaskStatus.Submitted:
        deadline = submittedAt + T_REVIEW + (fixRequested ? T_FIX_EXTENSION : 0);
        label = fixRequested ? 'Review Timeout (Extended)' : 'Review Timeout';
        break;

      case TaskStatus.Completed:
      case TaskStatus.Cancelled:
        return {
          deadline: null,
          remainingMs: null,
          isExpired: false,
          label: null,
        };

      default:
        return {
          deadline: null,
          remainingMs: null,
          isExpired: false,
          label: null,
        };
    }

    const now = Math.floor(Date.now() / 1000);
    const remainingSec = deadline - now;
    const remainingMillis = remainingSec * 1000;
    const isExpired = remainingSec <= 0;

    return {
      deadline,
      remainingMs: remainingMillis,
      isExpired,
      label,
    };
  };

  useEffect(() => {
    const updateRemaining = () => {
      const info = getTimeoutInfo();
      setRemainingMs(info.remainingMs);
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);

    return () => clearInterval(timer);
  }, [status, createdAt, acceptedAt, submittedAt, fixRequested]);

  const info = getTimeoutInfo();
  
  return {
    ...info,
    remainingMs,
  };
}
```

### 2. TimeoutIndicator 组件

**文件**：`frontend/src/components/TimeoutIndicator.tsx`

（完整代码见文件）

### 3. 时间格式化工具

**文件**：`frontend/src/utils/time.ts`

```typescript
export function formatCountdown(milliseconds: number | null): string {
  if (milliseconds === null || milliseconds <= 0) {
    return 'Expired';
  }

  const seconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}
```

### 4. TaskDetail 集成

**文件**：`frontend/src/pages/TaskDetail.tsx`

```typescript
<TimeoutIndicator
  taskId={task.taskId}
  status={task.status}
  createdAt={task.createdAt}
  acceptedAt={task.acceptedAt}
  submittedAt={task.submittedAt}
  fixRequested={task.fixRequested}
  creator={task.creator}
  helper={task.helper}
  signer={signer}
  address={address}
  onTimeoutTxSuccess={() => window.location.reload()}
/>
```

---

## 🧪 本地手动验证

### 前置条件

1. Backend 运行
2. 合约已部署
3. MetaMask 已连接

### 测试场景

#### 场景 1：Open 状态 - 未超时

**步骤**：
1. 创建新任务（Open 状态）
2. 访问任务详情页 `/tasks/:taskId`

**预期结果**：
- ✅ 显示黄色倒计时框
- ✅ 标签："Open Timeout:"
- ✅ 倒计时：如 "6d 23h 59m 50s"
- ✅ 每秒更新
- ✅ 无按钮

**验证点**：
- 倒计时数字每秒递减
- 格式正确（天/小时/分钟/秒）

---

#### 场景 2：Open 状态 - 已超时

**步骤**：
1. 等待任务超过 7 天（或修改合约常量测试）
2. 访问任务详情页

**预期结果（Creator 视角）**：
- ✅ 显示 "Expired"（红色）
- ✅ 显示 "Trigger Timeout" 按钮
- ✅ 点击按钮触发 MetaMask 签名
- ✅ 交易发送后显示 tx hash
- ✅ 交易确认后刷新页面

**预期结果（非 Creator 视角）**：
- ✅ 显示 "Expired"
- ✅ 显示提示："Waiting for Creator to trigger timeout"
- ✅ 无按钮

**验证点**：
- Creator 可以触发 `cancelTaskTimeout`
- 非 Creator 不能触发
- 交易成功后任务状态变为 Cancelled

---

#### 场景 3：InProgress 状态 - 未超时

**步骤**：
1. 接受任务（变为 InProgress）
2. 访问任务详情页

**预期结果**：
- ✅ 显示 "InProgress Timeout:"
- ✅ 倒计时：如 "13d 23h 59m 50s"
- ✅ 每秒更新

**验证点**：
- deadline = acceptedAt + 14 days
- 倒计时正确

---

#### 场景 4：InProgress 状态 - 已超时

**步骤**：
1. 等待任务超过 14 天
2. 访问任务详情页

**预期结果（Creator 视角）**：
- ✅ 显示 "Expired"
- ✅ 显示 "Trigger Timeout" 按钮
- ✅ 点击触发 `progressTimeout`

**预期结果（Helper 视角）**：
- ✅ 显示 "Expired"
- ✅ 显示提示："Waiting for Creator to trigger timeout"

**验证点**：
- Creator 可以触发
- Helper 不能触发
- 交易成功后任务状态变为 Cancelled

---

#### 场景 5：Submitted 状态 - 未超时（无 Fix）

**步骤**：
1. Helper 提交任务（变为 Submitted，fixRequested=false）
2. 访问任务详情页

**预期结果**：
- ✅ 显示 "Review Timeout:"
- ✅ 倒计时：如 "2d 23h 59m 50s"

**验证点**：
- deadline = submittedAt + 3 days
- 无 "Extended" 标识

---

#### 场景 6：Submitted 状态 - 未超时（有 Fix）

**步骤**：
1. Creator 请求修复（fixRequested=true）
2. 访问任务详情页

**预期结果**：
- ✅ 显示 "Review Timeout (Extended):"
- ✅ 倒计时：如 "5d 23h 59m 50s"

**验证点**：
- deadline = submittedAt + 3 days + 3 days
- 显示 "Extended" 标识
- submittedAt 未刷新

---

#### 场景 7：Submitted 状态 - 已超时

**步骤**：
1. 等待任务超过验收期限
2. 访问任务详情页

**预期结果（Helper 视角）**：
- ✅ 显示 "Expired"
- ✅ 显示 "Trigger Timeout" 按钮
- ✅ 点击触发 `completeTimeout`

**预期结果（Creator 视角）**：
- ✅ 显示 "Expired"
- ✅ 显示提示："Waiting for Helper to trigger timeout"

**验证点**：
- Helper 可以触发
- Creator 不能触发
- 交易成功后任务状态变为 Completed

---

#### 场景 8：Completed 状态（不显示）

**步骤**：
1. Creator 确认完成（变为 Completed）
2. 访问任务详情页

**预期结果**：
- ✅ 不显示倒计时组件

---

#### 场景 9：Cancelled 状态（不显示）

**步骤**：
1. 取消任务（变为 Cancelled）
2. 访问任务详情页

**预期结果**：
- ✅ 不显示倒计时组件

---

## 🔧 调试技巧

### 1. 修改超时常量（仅测试用）

在 `useTimeout.ts` 中临时修改：

```typescript
// 测试用：改为 1 分钟
const T_OPEN = 60;
const T_PROGRESS = 120;
const T_REVIEW = 30;
```

### 2. 查看倒计时计算

在浏览器控制台：

```javascript
// 查看当前时间戳
Math.floor(Date.now() / 1000)

// 查看任务创建时间
task.createdAt

// 计算 deadline
task.createdAt + (7 * 24 * 60 * 60)

// 计算剩余时间
deadline - Math.floor(Date.now() / 1000)
```

### 3. 模拟超时

修改系统时间或等待实际超时。

---

## ✅ 验收检查清单

- [ ] Open 状态显示 7 天倒计时
- [ ] InProgress 状态显示 14 天倒计时
- [ ] Submitted 状态显示 3 天倒计时
- [ ] fixRequested=true 时显示 6 天倒计时（Extended）
- [ ] 倒计时每秒更新
- [ ] 超时后显示 "Expired"
- [ ] Creator 可触发 Open/InProgress 超时
- [ ] Helper 可触发 Submitted 超时
- [ ] 非权限用户看到等待提示
- [ ] 点击按钮触发正确的合约函数
- [ ] 交易成功后刷新页面
- [ ] Completed/Cancelled 状态不显示倒计时

---

## 📚 相关文档

- 完整实现总结：`P1-F6_Implementation_Summary.md`
- 薄片校准定稿：`薄片校准定稿_v1.0.md`
- PRD 文档：`PRD.md`
