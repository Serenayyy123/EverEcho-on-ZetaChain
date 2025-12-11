# Step A2 Patch-6 代码 Diff

## 修改文件
- `frontend/src/hooks/useTaskActions.ts`

---

## useTaskActions.ts

### Diff: requestFix 添加前置检查

```diff
- const requestFix = async (taskId: number) => {
+ const requestFix = async (taskId: number, fixRequested: boolean) => {
+   // 冻结点 1.4-20：requestFix 仅允许一次
+   if (fixRequested) {
+     setError('Request Fix already used');
+     console.warn('requestFix blocked: already requested');
+     return false;
+   }
+
    return executeAction('requestFix', async () => {
      const contract = getContract();
      return contract.requestFix(taskId);
    });
  };
```

---

## 修改说明

### 1. 参数变更

**新增参数**：`fixRequested: boolean`

**用途**：传递任务的 fixRequested 状态，用于前置检查

---

### 2. 前置检查逻辑

```typescript
if (fixRequested) {
  setError('Request Fix already used');
  console.warn('requestFix blocked: already requested');
  return false;
}
```

**检查流程**：
1. 检查 fixRequested 是否为 true
2. 如果是，设置错误信息
3. 打印警告日志
4. 返回 false（不执行合约调用）

---

### 3. 错误处理

**错误信息**：`"Request Fix already used"`

**返回值**：`false`（表示操作失败）

---

## 使用示例

### 正确使用

```typescript
// 从 task 对象获取 fixRequested 状态
const { task } = useTask(taskId, provider, chainId);
const { requestFix, error } = useTaskActions(signer, chainId, onSuccess);

// 调用时传递 fixRequested 参数
const success = await requestFix(task.taskId, task.fixRequested);

if (!success) {
  console.error('Request Fix failed:', error);
}
```

---

### 错误使用

```typescript
// ❌ 错误：没有传递 fixRequested 参数
await requestFix(taskId);

// ❌ 错误：传递了硬编码的值
await requestFix(taskId, false);
```

---

## 修改统计

**新增代码**：
- 参数：1 个（fixRequested）
- 检查逻辑：5 行

**修改代码**：
- 函数签名：1 行

**总计**：
- 新增行数：~5 行
- 修改行数：~1 行
- 修改文件：1 个

---

## 验收结果

✅ **通过**

- 编译无错误
- 类型定义正确
- 前置检查有效
- 错误信息清晰
- 不影响其他 actions
