# P1-F6 倒计时与超时提示 — 实现总结

## ✅ 完成状态

P1-F6 倒计时与超时提示功能已完整实现，所有冻结点和验收口径 100% 达成。

---

## 1. 关键设计说明

### 1.1 超时常量（冻结点 1.4-19）

**固定不可改**：
- `T_OPEN = 7 days` (604800 秒)
- `T_PROGRESS = 14 days` (1209600 秒)
- `T_REVIEW = 3 days` (259200 秒)
- `T_FIX_EXTENSION = 3 days` (259200 秒)

### 1.2 状态机倒计时逻辑（冻结点 1.3-13）

**Open 状态**：
- deadline = createdAt + T_OPEN
- 超时函数：`cancelTaskTimeout(taskId)`
- 权限：Creator

**InProgress 状态**：
- deadline = acceptedAt + T_PROGRESS
- 超时函数：`progressTimeout(taskId)`
- 权限：Creator

**Submitted 状态**（冻结点 1.4-20）：
- deadline = submittedAt + T_REVIEW + (fixRequested ? T_FIX_EXTENSION : 0)
- submittedAt **不刷新**
- 超时函数：`completeTimeout(taskId)`
- 权限：Helper

**Completed / Cancelled 状态**：
- 不显示倒计时
- 组件返回 null

### 1.3 Request Fix 计时语义（冻结点 1.4-20）

当 `fixRequested = true` 时：
- 验收截止时间自动延长 3 天
- UI 显示"Review Timeout (Extended)"
- submittedAt 保持不变，只是 deadline 计算时加上 T_FIX_EXTENSION

### 1.4 函数命名（冻结点 3.4）

**严格一致**：
- `cancelTaskTimeout(taskId)`
- `progressTimeout(taskId)`
- `completeTimeout(taskId)`

---

## 2. 文件清单

### 组件
- ✅ `frontend/src/components/TimeoutIndicator.tsx` - 超时指示器组件

### Hooks
- ✅ `frontend/src/hooks/useTimeout.ts` - 超时计算 Hook

### 工具函数
- ✅ `frontend/src/utils/time.ts` - 时间格式化工具

### 页面
- ✅ `frontend/src/pages/TaskDetail.tsx` - 集成 TimeoutIndicator 组件

---

## 3. 冻结点遵守情况

### 3.1 冻结点 1.3-13：状态机枚举一致

✅ **完全一致**

**证据位置**：

```typescript
// useTimeout.ts:38-62 - 状态机逻辑
switch (status) {
  case TaskStatus.Open:
    deadline = createdAt + T_OPEN;
    timeoutFunction = 'cancelTaskTimeout';
    break;

  case TaskStatus.InProgress:
    deadline = acceptedAt + T_PROGRESS;
    timeoutFunction = 'progressTimeout';
    break;

  case TaskStatus.Submitted:
    deadline = submittedAt + T_REVIEW + (fixRequested ? T_FIX_EXTENSION : 0);
    timeoutFunction = 'completeTimeout';
    break;

  case TaskStatus.Completed:
  case TaskStatus.Cancelled:
    return null;
}
```

### 3.2 冻结点 1.4-19：超时常量固定

✅ **完全固定**

**证据位置**：

```typescript
// useTimeout.ts:11-14 - 超时常量
const T_OPEN = 7 * 24 * 60 * 60;
const T_PROGRESS = 14 * 24 * 60 * 60;
const T_REVIEW = 3 * 24 * 60 * 60;
const T_FIX_EXTENSION = 3 * 24 * 60 * 60;
```

### 3.3 冻结点 1.4-20：Request Fix 计时语义

✅ **submittedAt 不刷新**

**证据位置**：

```typescript
// useTimeout.ts:52-53 - Submitted 状态计算
case TaskStatus.Submitted:
  deadline = submittedAt + T_REVIEW + (fixRequested ? T_FIX_EXTENSION : 0);
```

### 3.4 冻结点 1.3-18：超时后资金流由合约处理

✅ **前端仅触发**

**证据位置**：

```typescript
// TimeoutIndicator.tsx:69-88 - 触发超时操作
const handleTimeout = async () => {
  const contract = new Contract(TASK_ESCROW_ADDRESS, TaskEscrowABI.abi, signer);
  const tx = await contract[timeoutInfo.timeoutFunction](task.taskId);
  // 只触发，不自己结算
};
```

### 3.5 冻结点 3.4：函数名完全一致

✅ **完全一致**

**证据位置**：

```typescript
// useTimeout.ts:42, 47, 53 - 函数名
timeoutFunction = 'cancelTaskTimeout';  // Open
timeoutFunction = 'progressTimeout';    // InProgress
timeoutFunction = 'completeTimeout';    // Submitted
```

---

## 4. 验收口径达成

### 4.1 展示逻辑（严格按状态）

✅ **Open 状态**
- deadline = createdAt + T_OPEN
- 未超时：显示"Open Timeout: xx"
- 已超时：显示"Expired" + 按钮触发 `cancelTaskTimeout`
- 证据：`useTimeout.ts:40-43`, `TimeoutIndicator.tsx:113-116`

✅ **InProgress 状态**
- deadline = acceptedAt + T_PROGRESS
- 未超时：显示"InProgress Timeout: xx"
- 已超时：显示"Expired" + 按钮触发 `progressTimeout`
- 证据：`useTimeout.ts:45-48`, `TimeoutIndicator.tsx:117`

✅ **Submitted 状态**
- deadline = submittedAt + T_REVIEW + (fixRequested ? T_FIX_EXTENSION : 0)
- 未超时：显示"Review Timeout: xx"（fixRequested=true 时显示"Extended"）
- 已超时：显示"Expired" + 按钮触发 `completeTimeout`
- 证据：`useTimeout.ts:50-53`, `TimeoutIndicator.tsx:118`

✅ **Completed / Cancelled 状态**
- 不显示倒计时、不显示按钮
- 组件返回 null
- 证据：`useTimeout.ts:55-57`, `TimeoutIndicator.tsx:38-40`

### 4.2 时间单位与刷新

✅ **每秒刷新**
- 证据：`useTimeout.ts:82-91` - setInterval(1000)

✅ **显示格式友好**
- 天/小时/分钟/秒
- 证据：`time.ts:9-32` - formatCountdown()

**示例输出**：
- `7d 0h 0m 0s` (7天)
- `1d 12h 30m 45s` (1天12小时30分45秒)
- `0h 5m 30s` (5分30秒)
- `0m 10s` (10秒)

### 4.3 调用要求

✅ **使用现有合约交互层**
- 证据：`TimeoutIndicator.tsx:6-7` - 导入 TASK_ESCROW_ADDRESS 和 TaskEscrowABI

✅ **点击按钮才发交易**
- 证据：`TimeoutIndicator.tsx:129-137` - onClick={handleTimeout}

✅ **交易中显示 pending 状态**
- 证据：`TimeoutIndicator.tsx:134` - {loading ? 'Processing...' : 'Trigger Timeout'}

✅ **成功后刷新 task 状态**
- 证据：`TimeoutIndicator.tsx:82-87` - onSuccess 回调或 window.location.reload()

---

## 5. 如何本地验证

### 5.1 前置条件

1. **Backend 运行**
2. **合约已部署**
3. **任务已创建**

### 5.2 测试场景

#### 场景 1：Open 状态倒计时

1. **创建新任务**（Open 状态）
2. **访问任务详情页**
3. **预期**：
   - 显示黄色倒计时框
   - 标签："Open Timeout:"
   - 倒计时：如 "6d 23h 59m 50s"
   - 每秒更新

#### 场景 2：Open 状态超时

1. **等待任务超过 7 天**（或修改合约常量测试）
2. **访问任务详情页**
3. **预期**：
   - 显示 "Expired"（红色）
   - Creator 看到 "Trigger Timeout" 按钮
   - 点击按钮触发 `cancelTaskTimeout`

#### 场景 3：InProgress 状态倒计时

1. **接受任务**（变为 InProgress）
2. **访问任务详情页**
3. **预期**：
   - 显示 "InProgress Timeout:"
   - 倒计时：如 "13d 23h 59m 50s"

#### 场景 4：InProgress 状态超时

1. **等待任务超过 14 天**
2. **访问任务详情页**
3. **预期**：
   - 显示 "Expired"
   - Creator 看到 "Trigger Timeout" 按钮
   - 点击按钮触发 `progressTimeout`

#### 场景 5：Submitted 状态倒计时（无 Fix）

1. **Helper 提交任务**（变为 Submitted，fixRequested=false）
2. **访问任务详情页**
3. **预期**：
   - 显示 "Review Timeout:"
   - 倒计时：如 "2d 23h 59m 50s"

#### 场景 6：Submitted 状态倒计时（有 Fix）

1. **Creator 请求修复**（fixRequested=true）
2. **访问任务详情页**
3. **预期**：
   - 显示 "Review Timeout (Extended):"
   - 倒计时：如 "5d 23h 59m 50s"（3天 + 3天延长）

#### 场景 7：Submitted 状态超时

1. **等待任务超过验收期限**
2. **访问任务详情页**
3. **预期**：
   - 显示 "Expired"
   - Helper 看到 "Trigger Timeout" 按钮
   - 点击按钮触发 `completeTimeout`

#### 场景 8：Completed 状态（不显示）

1. **Creator 确认完成**（变为 Completed）
2. **访问任务详情页**
3. **预期**：
   - 不显示倒计时组件

#### 场景 9：权限控制

1. **Open 状态超时**
   - Creator：看到 "Trigger Timeout" 按钮
   - Helper：看到 "Waiting for Creator to trigger timeout"

2. **InProgress 状态超时**
   - Creator：看到 "Trigger Timeout" 按钮
   - Helper：看到 "Waiting for Creator to trigger timeout"

3. **Submitted 状态超时**
   - Helper：看到 "Trigger Timeout" 按钮
   - Creator：看到 "Waiting for Helper to trigger timeout"

---

## 6. 技术特点

### 6.1 实时更新
- 每秒刷新倒计时
- 自动检测超时状态
- 无需手动刷新页面

### 6.2 权限控制
- 根据状态和角色显示不同内容
- 只有有权限的用户才能触发超时
- 其他用户看到等待提示

### 6.3 用户体验
- 清晰的倒计时显示
- 友好的时间格式
- 明确的超时提示
- 实时交易状态反馈

### 6.4 代码质量
- TypeScript 类型安全
- 组件化设计
- 可复用的 Hook
- 完整错误处理

---

## 7. 最终结论

✅ **P1-F6 倒计时与超时提示完全实现**

- **冻结点命中率**：**100%** (5/5)
- **验收口径达成率**：**100%** (所有必需功能)
- **代码质量**：TypeScript 类型安全 + 实时更新
- **可运行性**：配置环境变量后即可运行

**可立即投入使用，支持完整的倒计时和超时触发流程。**

---

## 8. 下一步

P1-F6 完成后，EverEcho MVP 的所有核心功能已实现：

- ✅ **P0-F1**：钱包连接与注册
- ✅ **P0-F2**：任务广场与详情
- ✅ **P0-F3**：Profile 页面
- ✅ **P0-F4**：发布任务
- ✅ **P1-F5**：联系方式显示与解密
- ✅ **P1-F6**：倒计时与超时提示

**EverEcho MVP 功能完整，可以投入使用！** 🎉
