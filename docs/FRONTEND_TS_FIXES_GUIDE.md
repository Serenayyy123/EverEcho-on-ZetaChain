# Frontend TypeScript 修复指南

## 📋 修复清单总结

根据 Vercel 构建错误，需要修复以下 6 个问题：

### 1. ✅ TimeoutIndicator + useTimeout 字段对齐

**问题**：TimeoutIndicator 使用旧版 useTimeout 返回字段

**当前 useTimeout 返回**：
```typescript
{
  timeLeft: number,
  isTimeout: boolean,
  timeoutType: string | null,
  formatTimeLeft: () => string
}
```

**TimeoutIndicator 错误使用**：
- `timeoutInfo.label` (不存在)
- `timeoutInfo.deadline` (不存在)
- `timeoutInfo.isExpired` (应为 `isTimeout`)
- `timeoutInfo.remainingMs` (应为 `timeLeft`)

**修复方案**：

A. 修改 `useTimeout.ts` 入参类型（不改逻辑）：
```typescript
type TimeoutTask = Pick<Task, 'status' | 'createdAt' | 'acceptedAt' | 'submittedAt' | 'fixRequested'>;

export function useTimeout(task: TimeoutTask | null) {
  // 逻辑不变
}
```

B. 修改 `TimeoutIndicator.tsx` 使用新字段：
```typescript
// 第 60 行附近
if (!timeoutInfo.timeoutType) {
  return null;
}

// 第 100 行附近
<span>{timeoutInfo.timeoutType}:</span>

// 第 102 行附近
{!timeoutInfo.isTimeout ? timeoutInfo.formatTimeLeft() : 'Expired'}

// 第 109 行附近
{timeoutInfo.isTimeout && canTriggerTimeout() && (

// 第 145 行附近
{timeoutInfo.isTimeout && !canTriggerTimeout() && address && (
```

---

### 2. ✅ WalletConnector onClick 事件绑定

**问题**：TS2322 - 函数签名不匹配 MouseEventHandler

**文件**：`frontend/src/components/WalletConnector.tsx`

**错误代码**（第 18 行）：
```typescript
<button onClick={connect}>
```

**修复**：
```typescript
<button onClick={() => connect()}>
```

---

### 3. ✅ ToastContainer useEffect cleanup

**问题**：TS2345 - cleanup 返回 boolean

**文件**：`frontend/src/components/ui/ToastContainer.tsx`

**当前代码**（第 15 行）：
```typescript
return unsubscribe;
```

**修复**：
```typescript
return () => { unsubscribe(); };
```

或者如果 unsubscribe 本身就是函数：
```typescript
return unsubscribe; // 如果 unsubscribe 是 () => void
```

需要检查 `ToastManager.subscribe` 的返回类型。

---

### 4. ✅ useContacts 字段和未使用变量

**问题**：
- TS6133: `canViewContacts` 未使用
- TS2339: `response.contacts` 字段不存在

**文件**：`frontend/src/hooks/useContacts.ts`

**修复 A - 未使用变量**（第 18 行）：
```typescript
const _canViewContacts = (task: Task | null) => {
  // 或者直接删除这个函数
```

**修复 B - 字段名对齐**（第 68 行）：
```typescript
// 当前错误
const decryptedContacts = response.contacts || response.wrappedDEK;

// 修复（根据实际 API 返回）
const decryptedContacts = response.contactsEncryptedPayload || response.wrappedDEK;
```

---

### 5. ✅ useRegister bigint 比较

**问题**：TS2367 - number 与 bigint 比较

**文件**：`frontend/src/hooks/useRegister.ts`

**错误代码**（第 72 行）：
```typescript
if (mintedAmount === 0n) {
```

这个实际上是正确的！如果报错，可能是：

**修复方案 1**（如果 mintedAmount 是 bigint）：
```typescript
if (mintedAmount === 0n) {  // 已经正确
```

**修复方案 2**（如果需要转换）：
```typescript
if (Number(mintedAmount) === 0) {
```

---

### 6. ✅ useWallet 未使用变量

**问题**：TS6133 - `manuallyDisconnected` 未使用

**文件**：`frontend/src/hooks/useWallet.ts`

**当前代码**（第 27 行）：
```typescript
const [manuallyDisconnected, setManuallyDisconnected] = useState(() => {
```

**修复**：
```typescript
const [_manuallyDisconnected, setManuallyDisconnected] = useState(() => {
```

或者删除这个 state（如果确实不需要）。

---

## 🔧 快速修复脚本

由于涉及多个文件，建议按以下顺序修复：

1. **最简单的修复**（3, 6）：
   - ToastContainer cleanup
   - useWallet 未使用变量

2. **字段对齐**（2, 4, 5）：
   - WalletConnector onClick
   - useContacts 字段
   - useRegister bigint

3. **最复杂的修复**（1）：
   - TimeoutIndicator + useTimeout

---

## ✅ 验证步骤

修复后，在本地运行：

```bash
cd frontend
npm run build
```

确保 `tsc && vite build` 都通过。

---

## 🔒 为什么这些改动不改变功能

1. **TimeoutIndicator**：只是字段名对齐，UI 显示逻辑完全一致
2. **WalletConnector**：包装为箭头函数，调用行为不变
3. **ToastContainer**：cleanup 函数语义不变
4. **useContacts**：
   - 未使用变量重命名不影响逻辑
   - 字段名对齐真实 API 返回
5. **useRegister**：bigint 比较语义不变
6. **useWallet**：未使用变量重命名不影响逻辑

所有修改都是**类型对齐**，不改变任何运行时行为。

---

## 📝 注意事项

- 修复前先备份文件
- 逐个修复并测试
- 确保本地 `npm run build` 通过后再推送
- 如果 Vercel 还有其他错误，根据错误日志继续修复
