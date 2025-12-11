# P0-B4 签名验证服务 — 快速参考

## 快速开始

### 1. 在路由中使用中间件

```typescript
import { Router } from 'express';
import { verifySignatureMiddleware } from '../middleware/verifySignature';

const router = Router();

// 需要签名验证的路由
router.post('/protected', verifySignatureMiddleware, (req, res) => {
  // req.user 包含验证后的用户信息
  const { address, taskId } = req.user!;
  
  res.json({
    success: true,
    message: `Verified user ${address} for task ${taskId}`,
  });
});

export default router;
```

### 2. 直接使用服务函数

```typescript
import { verifySignatureWithTaskId } from '../services/authService';

// 在业务逻辑中验证
const result = verifySignatureWithTaskId(
  message,
  signature,
  address,
  taskId
);

if (!result.success) {
  return res.status(401).json({
    error: result.error,
    details: result.details,
  });
}

// 验证通过，继续业务逻辑
```

### 3. 前端签名示例

```typescript
import { ethers } from 'ethers';

// 1. 生成签名消息
const taskId = '123';
const message = `EverEcho: decrypt for task ${taskId}`;

// 2. 使用钱包签名
const signer = await provider.getSigner();
const signature = await signer.signMessage(message);

// 3. 发送请求
const response = await fetch('/api/contacts/decrypt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: await signer.getAddress(),
    taskId,
    message,
    signature,
  }),
});
```

---

## API 参考

### authService

#### generateSignMessage(taskId, action?)
生成标准签名消息

```typescript
const message = generateSignMessage('123'); 
// => "EverEcho: decrypt for task 123"

const message = generateSignMessage('123', 'submit');
// => "EverEcho: submit for task 123"
```

#### verifySignature(message, signature, expectedAddress)
基础签名验证，返回 boolean

```typescript
const isValid = verifySignature(message, signature, address);
if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

#### verifySignatureDetailed(message, signature, expectedAddress)
详细签名验证，返回结果对象

```typescript
const result = verifySignatureDetailed(message, signature, address);
if (!result.success) {
  return res.status(401).json({
    error: result.error,
    details: result.details,
  });
}
```

#### extractTaskIdFromMessage(message)
从消息中提取 taskId

```typescript
const taskId = extractTaskIdFromMessage(message);
if (!taskId) {
  return res.status(401).json({ error: 'TaskId not found' });
}
```

#### verifySignatureWithTaskId(message, signature, expectedAddress, expectedTaskId)
签名 + taskId 联合验证

```typescript
const result = verifySignatureWithTaskId(
  message,
  signature,
  address,
  taskId
);

if (!result.success) {
  return res.status(401).json({
    error: result.error,
    details: result.details,
  });
}
```

#### validateSignatureParams(params)
参数完整性校验

```typescript
const validation = validateSignatureParams({
  address,
  taskId,
  message,
  signature,
});

if (!validation.valid) {
  return res.status(400).json({
    error: 'Missing required fields',
    missing: validation.missing,
  });
}
```

---

## 中间件

### verifySignatureMiddleware
标准中间件（需要 taskId）

```typescript
router.post('/api/endpoint', verifySignatureMiddleware, handler);
```

验证通过后：
- `req.user.address` - 验证后的用户地址
- `req.user.taskId` - 验证后的任务 ID

### verifySignatureOptionalTaskId
可选 taskId 中间件

```typescript
router.post('/api/profile', verifySignatureOptionalTaskId, handler);
```

用于不需要 taskId 的场景（如 Profile 更新）

---

## 错误处理

| 状态码 | 场景 | 错误信息 |
|--------|------|----------|
| 400 | 缺少必填字段 | Missing required fields |
| 401 | 签名无效 | Invalid signature |
| 401 | 地址不匹配 | Address mismatch |
| 401 | taskId 不存在 | TaskId not found in message |
| 401 | taskId 不匹配 | TaskId mismatch |
| 500 | 服务器错误 | Internal server error |

---

## 消息格式

### 标准格式
```
EverEcho: {action} for task {taskId}
```

### 示例
- `EverEcho: decrypt for task 123`
- `EverEcho: submit for task 456`

### 支持的 taskId 提取模式
- `task 123`
- `taskId: 123`
- `taskId 123`

---

## 测试

```bash
# 运行所有测试
npm test

# 只运行 authService 测试
npm test -- authService

# 只运行中间件测试
npm test -- verifySignature
```

---

## 集成示例

### P1-B3 Contacts 路由

```typescript
// backend/src/routes/contacts.ts
import { verifySignature, extractTaskIdFromMessage } from '../services/authService';

router.post('/decrypt', async (req, res) => {
  const { taskId, address, signature, message } = req.body;

  // 1. 验证签名
  if (!verifySignature(message, signature, address)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. 验证 taskId
  const extractedTaskId = extractTaskIdFromMessage(message);
  if (extractedTaskId !== taskId) {
    return res.status(401).json({ error: 'TaskId mismatch' });
  }

  // 3. 继续业务逻辑
  // ...
});
```

---

## 完整文档

详见：
- `P0-B4_实现总结.md` - 完整实现说明
- `P0-B4_验收报告.md` - 验收报告
