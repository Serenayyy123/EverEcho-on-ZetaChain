# Task Metadata 修复 - 从 taskURI 恢复真实标题

**问题**: Task 被 ChainSync 自动同步时使用默认标题 "Task X (synced from chain)"，丢失了用户输入的真实标题

**修复时间**: 2025-11-25

---

## 问题分析

### 场景
1. 用户创建任务，输入中文标题
2. 前端 POST /api/task 上传 metadata
3. 如果 POST 失败或延迟，链上已创建但数据库无记录
4. ChainSync 从链上同步时，使用默认标题创建记录
5. 用户看到的是 "Task X (synced from chain)" 而不是真实标题

### 根因
- ChainSync 只能从链上读取 taskURI，无法直接获取 title/description
- 之前的实现没有尝试从 taskURI 解析和获取真实 metadata

---

## 修复方案

### 1. 新增 metadata 获取函数

**文件**: `backend/src/services/taskSyncCoordinator.ts`

```typescript
async function fetchMetadataFromURI(taskURI: string): Promise<{ title: string; description: string } | null> {
  // 解析 taskURI: https://api.everecho.io/task/{taskId}.json
  const match = taskURI.match(/\/task\/(\d+)\.json$/);
  if (!match) return null;
  
  const originalTaskId = match[1];
  
  // 从数据库读取原始任务的 metadata
  const originalTask = await prisma.task.findUnique({
    where: { taskId: originalTaskId },
    select: { title: true, description: true },
  });
  
  if (originalTask && !originalTask.title.includes('synced from chain')) {
    return {
      title: originalTask.title,
      description: originalTask.description,
    };
  }
  
  return null;
}
```

### 2. 在创建任务时使用真实 metadata

**修改**: `createTaskAndContactKey` 函数

```typescript
// 尝试从 taskURI 获取真实的 metadata
let title = `Task ${taskId} (synced from chain)`;
let description = 'This task was automatically synced from blockchain';

if (taskURI) {
  const metadata = await fetchMetadataFromURI(taskURI);
  if (metadata) {
    title = metadata.title;
    description = metadata.description;
  }
}

// 使用真实或默认的 title/description 创建任务
await tx.task.create({
  data: {
    taskId,
    title,
    description,
    // ...
  },
});
```

---

## 修复已存在的任务

### 自动修复脚本

**文件**: `backend/scripts/fix-task9-metadata.ts`

**功能**:
1. 从链上读取 Task 9 的 taskURI
2. 解析 taskURI 获取原始 taskId
3. 从数据库读取原始任务的 metadata
4. 更新 Task 9 的 title 和 description

**用法**:
```bash
cd backend
npx ts-node scripts/fix-task9-metadata.ts
```

### 手动修复

如果自动修复无法恢复（原始任务也是自动同步的），需要手动更新：

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

await prisma.task.update({
  where: { taskId: '9' },
  data: {
    title: '你的真实标题',
    description: '你的真实描述',
  },
});
```

---

## 效果

### Before (修复前)
- ChainSync 同步的任务标题: "Task X (synced from chain)"
- 用户看不到真实的中文标题
- 无法区分任务内容

### After (修复后)
- ChainSync 尝试从 taskURI 获取真实 metadata
- 如果原始任务存在，使用真实标题
- 如果无法获取，才使用默认标题
- 支持中文标题和描述

---

## 限制

### 当前实现的限制
1. 只支持本地 API 的 taskURI（`https://api.everecho.io/task/{id}.json`）
2. 不支持 IPFS 或其他外部存储
3. 如果原始任务也是自动同步的，无法恢复

### 未来改进
1. 支持从 IPFS 获取 metadata
2. 支持从其他 HTTP(S) URL 获取
3. 缓存 metadata 避免重复查询

---

## 测试

### 测试场景 1: 正常创建
1. 用户创建任务，POST 成功
2. 链上创建成功
3. 数据库有完整记录
4. ✅ 标题正确显示

### 测试场景 2: POST 延迟
1. 用户创建任务，POST 延迟
2. 链上先创建成功
3. ChainSync 同步时从 taskURI 获取 metadata
4. ✅ 标题正确显示

### 测试场景 3: POST 失败
1. 用户创建任务，POST 失败
2. 链上创建成功
3. ChainSync 同步时无法获取 metadata
4. ⚠️ 显示默认标题（需要手动修复）

---

## 相关文件

- `backend/src/services/taskSyncCoordinator.ts` - 核心修复逻辑
- `backend/scripts/fix-task9-metadata.ts` - 修复脚本
- `backend/scripts/list-all-tasks.ts` - 列出所有任务

---

**修复状态**: ✅ 完成

**适用版本**: v1.1+
