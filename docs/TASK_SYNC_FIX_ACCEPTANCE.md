# Task 同步修复 - 验收报告

**修复版本**: v1.0  
**完成时间**: 2025-11-25  
**状态**: ✅ 代码完成，等待验收

---

## 📋 问题总结

### 原始问题
用户创建任务后，偶发出现：
- 后端数据库缺少任务记录
- 前端访问 metadata 返回 404
- 任务广场显示 "synced from chain"

### 根因分析
1. **主因**: 前端 POST 失败后重试不够健壮，链上已创建但后端无数据
2. **次因1**: 后端幂等性检查不完整，只检查 Task 不检查 ContactKey
3. **次因2**: EventListener 和 ChainSync 存在竞态，可能同时创建相同记录
4. **次因3**: 没有统一的补漏入口，逻辑重复难以维护

---

## 🔧 修复方案

### 1. 前端强化重试机制
**文件**: `frontend/src/hooks/useCreateTask.ts`

**修改内容**:
- 增加重试次数：3次 → 5次
- 使用指数退避：1s, 2s, 4s, 8s, 10s
- POST 必须成功才能继续链上创建
- 失败时抛出明确错误，阻止用户继续

**代码变更**:
```typescript
// 指数退避重试
for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
    if (attempt > 0) {
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
    taskURI = await uploadTask(taskData);
    break; // 成功
  } catch (uploadError) {
    if (attempt === maxRetries - 1) {
      // 最后一次也失败，阻止链上创建
      throw new Error(`Failed to upload after ${maxRetries} attempts`);
    }
  }
}
```

### 2. 后端完善幂等性检查
**文件**: `backend/src/routes/task.ts`

**修改内容**:
- 检查 Task 存在时，同时检查 ContactKey
- 如果 ContactKey 缺失，自动补充
- 使用事务保证 Task 和 ContactKey 原子性创建

**代码变更**:
```typescript
// 检查任务是否已存在
const existingTask = await prisma.task.findUnique({ where: { taskId } });

if (existingTask) {
  // 检查 ContactKey 是否存在
  const existingContactKey = await prisma.contactKey.findUnique({ where: { taskId } });
  
  if (!existingContactKey) {
    // 补充 ContactKey
    await recreateContactKey(taskId, creatorAddress);
  }
  
  return res.status(200).json({ taskURI, message: 'Task already exists' });
}

// 使用事务创建
await prisma.$transaction(async (tx) => {
  await tx.task.upsert({ ... });
  await tx.contactKey.upsert({ ... });
});
```

### 3. 统一任务同步协调器
**文件**: `backend/src/services/taskSyncCoordinator.ts` (新增)

**功能**:
- 统一管理 Task 和 ContactKey 的创建逻辑
- 使用内存锁防止并发创建
- 幂等、原子、带锁的同步方法
- EventListener 和 ChainSync 都调用此协调器

**核心方法**:
```typescript
export async function syncTaskWithLock(params: SyncTaskParams): Promise<boolean> {
  const releaseLock = await acquireTaskLock(taskId);
  
  try {
    // 检查任务是否已存在
    const existingTask = await prisma.task.findUnique({ where: { taskId } });
    
    if (existingTask) {
      // 检查 ContactKey
      const existingContactKey = await prisma.contactKey.findUnique({ where: { taskId } });
      
      if (existingContactKey) {
        return true; // 已完整
      }
      
      // 补充 ContactKey
      return await createContactKeyOnly(taskId, creator, helper);
    }
    
    // 创建完整的 Task + ContactKey
    return await createTaskAndContactKey(taskId, creator, helper, taskURI);
  } finally {
    releaseLock();
  }
}
```

### 4. 更新 EventListener 和 ChainSync
**文件**: 
- `backend/src/services/eventListenerService.ts`
- `backend/src/services/chainSyncService.ts`

**修改内容**:
- 移除重复的创建逻辑
- 统一调用 `syncTaskWithLock`
- 简化代码，提高可维护性

**代码变更**:
```typescript
// EventListener
private async handleTaskCreated(taskId: string, creator: string, taskURI: string) {
  await syncTaskWithLock({ taskId, creator, taskURI, source: 'event' });
}

// ChainSync
private async syncMissingTasks() {
  const result = await syncMissingTasks(this.contract, 'chain-sync');
}
```

### 5. 一键检测和修复脚本
**文件**: `backend/scripts/check-missing-tasks.ts` (新增)

**功能**:
- 检测链上和数据库的差异
- 列出缺失的 Task 和 ContactKey
- 支持 `--fix` 参数自动修复

**用法**:
```bash
# 检测
npx ts-node backend/scripts/check-missing-tasks.ts

# 检测并修复
npx ts-node backend/scripts/check-missing-tasks.ts --fix
```

### 6. 自动化测试
**文件**: `backend/scripts/test-task-sync.ts` (新增)

**测试场景**:
1. 并发同步同一任务（测试锁机制）
2. 多次同步同一任务（测试幂等性）
3. Task 存在但 ContactKey 缺失（测试恢复能力）

**用法**:
```bash
npx ts-node backend/scripts/test-task-sync.ts
```

---

## ✅ 验收标准

### 1. 前端行为
- [ ] POST 失败时，前端显示明确错误，不继续链上创建
- [ ] POST 重试最多 5 次，使用指数退避
- [ ] 用户不会看到"任务创建成功"但实际后端无数据的情况

### 2. 后端行为
- [ ] 创建任务后 ≤ 30 秒内必须在数据库可查到
- [ ] `GET /api/task/:taskId` 不再出现 404（链上有但 DB 没有）
- [ ] Task 和 ContactKey 同时存在或同时不存在（原子性）

### 3. 补漏机制
- [ ] EventListener 监听到事件后能正确同步
- [ ] ChainSync 定期扫描能发现并修复缺失
- [ ] 两个服务不会产生竞态或数据不一致

### 4. 幂等性
- [ ] 同一任务多次同步不会重新生成 DEK
- [ ] ContactKey 一旦创建不会被覆盖
- [ ] 并发同步不会创建重复记录

### 5. 工具脚本
- [ ] `check-missing-tasks.ts` 能正确检测差异
- [ ] `check-missing-tasks.ts --fix` 能修复所有问题
- [ ] `test-task-sync.ts` 所有测试通过

---

## 🧪 测试步骤

### 测试 1: 正常创建流程
1. 用户创建任务
2. 确认 POST 成功
3. 确认链上创建成功
4. 30 秒内检查数据库：
   ```bash
   npx ts-node backend/scripts/check-missing-tasks.ts
   ```
5. 确认无缺失

### 测试 2: POST 失败场景
1. 临时停止后端服务
2. 用户尝试创建任务
3. 确认前端显示错误，未调用链上合约
4. 重启后端服务
5. 用户重新创建，确认成功

### 测试 3: 后端重启场景
1. 创建任务时立即重启后端
2. 等待 30 秒
3. 运行检测脚本：
   ```bash
   npx ts-node backend/scripts/check-missing-tasks.ts
   ```
4. 如有缺失，运行修复：
   ```bash
   npx ts-node backend/scripts/check-missing-tasks.ts --fix
   ```
5. 确认修复成功

### 测试 4: 并发创建
1. 多个用户同时创建任务
2. 运行测试脚本：
   ```bash
   npx ts-node backend/scripts/test-task-sync.ts
   ```
3. 确认所有测试通过

### 测试 5: 历史数据修复
1. 如果已有缺失的任务（如 taskId=1）
2. 运行修复脚本：
   ```bash
   npx ts-node backend/scripts/check-missing-tasks.ts --fix
   ```
3. 确认任务和 ContactKey 都已创建
4. 前端访问任务详情，确认不再 404

---

## 📊 修复效果

### Before (修复前)
- ❌ 创建任务后偶发 404
- ❌ POST 失败但链上已创建
- ❌ EventListener 和 ChainSync 竞态
- ❌ 缺少统一的补漏机制

### After (修复后)
- ✅ POST 必须成功才能链上创建
- ✅ 30 秒内必定同步到数据库
- ✅ 统一协调器避免竞态
- ✅ 一键检测和修复工具

---

## 🔄 回滚方案

如需回滚，恢复以下文件：
1. `frontend/src/hooks/useCreateTask.ts`
2. `backend/src/routes/task.ts`
3. `backend/src/services/eventListenerService.ts`
4. `backend/src/services/chainSyncService.ts`

删除新增文件：
- `backend/src/services/taskSyncCoordinator.ts`
- `backend/scripts/check-missing-tasks.ts`
- `backend/scripts/test-task-sync.ts`

---

## 📝 部署清单

### 前端部署
```bash
cd frontend
npm run build
# 部署 dist/ 目录
```

### 后端部署
```bash
cd backend
npm install
npm run build
# 重启服务
pm2 restart everecho-backend
```

### 验证部署
```bash
# 检查服务状态
curl http://localhost:3001/healthz

# 检查任务同步状态
npx ts-node backend/scripts/check-missing-tasks.ts
```

---

## 🎯 验收签字

### 开发确认
- **开发人员**: Kiro AI
- **完成时间**: 2025-11-25
- **签字**: ✅

### 测试确认
- **测试人员**: _____________
- **测试时间**: _____________
- **签字**: ⏳

### 验收确认
- **验收人员**: _____________
- **验收时间**: _____________
- **签字**: ⏳

---

**修复状态**: ✅ 代码完成，等待测试验收

**预计测试时间**: 30 分钟

**建议测试人员**: 后端工程师 + QA 工程师
