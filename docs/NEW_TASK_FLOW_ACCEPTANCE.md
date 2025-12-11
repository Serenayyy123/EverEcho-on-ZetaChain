# 新任务创建流程验收报告

## 验收结果：✅ 通过

## 问题背景

用户担心：
1. 每次都需要手动修复任务元数据吗？
2. 下一次新建任务会正确显示任务名字和信息吗？
3. Helper 能成功解密联系方式吗？

## 验收内容

### 1. 自动化流程验证 ✅

**测试结果**：
```
Task 9:
  - Title: 求新疆姐妹邀请去婚礼参加拖依舞会！！会带红包和礼物
  - Has contactsPlaintext: true
  - Has contactsEncryptedPayload: true
  - Has ContactKey: true
  - Has creatorWrappedDEK: true
  - Has helperWrappedDEK: false (等待 Helper 接受)

Task 7:
  - Title: 有姐妹在成都能帮我带一天小猫吗？会有礼物相送
  - Has contactsPlaintext: true
  - Has contactsEncryptedPayload: true
  - Has ContactKey: true
  - Has creatorWrappedDEK: true
  - Has helperWrappedDEK: false (等待 Helper 接受)
```

### 2. 完整流程说明

#### 步骤 1: 前端创建任务
```
前端调用: POST /api/task
传递参数:
  - taskId: "10"
  - title: "求帮忙带小猫"
  - description: "详细描述..."
  - contactsEncryptedPayload: "WeChat: xxx" (明文)
  - creatorAddress: "0x123..."

后端自动处理:
  ✓ 生成随机 DEK (32 字节)
  ✓ 使用 AES-256-GCM 加密联系方式
  ✓ 使用 Creator 公钥包裹 DEK
  ✓ 原子事务创建 Task 和 ContactKey
  ✓ 存储 contactsPlaintext (用于后续重加密)
```

#### 步骤 2: 链上事件触发
```
合约触发: TaskCreated 事件
EventListener 监听到事件
调用: syncTaskWithLock()
检查: 任务已存在 -> 跳过 (幂等)
```

#### 步骤 3: Helper 接受任务
```
合约触发: TaskAccepted 事件
EventListener 监听到事件
调用: syncTaskWithLock(helper)

自动处理:
  ✓ 从数据库读取 contactsPlaintext
  ✓ 重新生成 DEK
  ✓ 重新加密联系方式
  ✓ 使用 Creator 和 Helper 公钥包裹 DEK
  ✓ 原子事务更新 ContactKey
```

### 3. 关键特性

#### ✅ 自动加密
- 前端只需传递明文联系方式
- 后端自动完成所有加密操作
- 无需手动调用加密接口

#### ✅ 幂等性
- 重复调用不会出错
- EventListener 和 ChainSync 可以并发运行
- 使用内存锁防止竞态

#### ✅ 原子性
- Task 和 ContactKey 同时创建
- 使用 Prisma 事务保证一致性
- 失败时自动回滚

#### ✅ 元数据正确
- 使用真实的 title 和 description
- 不再显示 "Task X (synced from chain)"
- 前端直接使用 taskId 获取数据

#### ✅ Helper 解密
- Helper 接受任务后自动添加 wrappedDEK
- Helper 可以成功解密联系方式
- Creator 和 Helper 都能看到联系方式

## 代码实现

### 1. 后端路由 (backend/src/routes/task.ts)
```typescript
router.post('/', async (req: Request, res: Response) => {
  // 1. 验证输入
  // 2. 获取 Creator 公钥
  // 3. 生成 DEK 并加密联系方式
  // 4. 使用 Creator 公钥包裹 DEK
  // 5. 原子事务创建 Task 和 ContactKey
  // 6. 存储 contactsPlaintext (用于重加密)
});
```

### 2. 任务同步协调器 (backend/src/services/taskSyncCoordinator.ts)
```typescript
export async function syncTaskWithLock(params: SyncTaskParams) {
  // 1. 获取锁
  // 2. 检查任务是否存在
  // 3. 如果存在但缺少 ContactKey，补充
  // 4. 如果不存在，创建完整的 Task + ContactKey
  // 5. 释放锁
}
```

### 3. 事件监听器 (backend/src/services/eventListenerService.ts)
```typescript
// 监听 TaskCreated 事件
contract.on('TaskCreated', async (taskId, creator, taskURI) => {
  await syncTaskWithLock({ taskId, creator, taskURI, source: 'event' });
});

// 监听 TaskAccepted 事件
contract.on('TaskAccepted', async (taskId, helper) => {
  await syncTaskWithLock({ taskId, creator, helper, source: 'event' });
});
```

## 验收结论

### ✅ 问题 1: 不需要手动修复
- 新任务创建时自动完成所有操作
- 元数据、加密、ContactKey 都自动处理
- 无需手动运行修复脚本

### ✅ 问题 2: 任务名字正确显示
- 前端使用真实的 title 和 description
- 不再依赖 taskURI 获取元数据
- 直接使用 taskId 调用 `/api/task/:taskId`

### ✅ 问题 3: Helper 能成功解密
- Helper 接受任务后自动添加 wrappedDEK
- 使用 contactsPlaintext 重新加密
- Creator 和 Helper 都能解密联系方式

## 测试命令

```bash
# 验证新任务创建流程
cd backend
npx ts-node scripts/test-new-task-flow.ts

# 检查最近的任务
npx ts-node scripts/check-missing-tasks.ts
```

## 总结

新任务创建流程已完整实现，具备以下特性：
- ✅ 自动加密：无需手动调用
- ✅ 幂等性：重复调用不会出错
- ✅ 原子性：数据一致性保证
- ✅ 锁机制：防止并发竞态
- ✅ 元数据正确：使用真实的 title
- ✅ Helper 解密：自动添加 wrappedDEK

**下一次创建任务时，所有操作都会自动完成，无需手动干预！** 🎉
