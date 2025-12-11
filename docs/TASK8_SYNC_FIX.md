# Task8 Metadata Load Fix

## 问题描述

Task8 在 TaskSquare 页面显示"Metadata Load Failed"错误，标题、描述等信息无法显示。

## 根本原因

**链上数据和数据库不同步**：
- Task8 在链上存在（taskCounter = 8）
- Task8 在本地数据库中不存在
- 前端从链上读取到 Task8，但无法从后端 API 获取 metadata（404）

## 解决方案

### 1. 确认链上状态

```bash
cd backend
npx ts-node scripts/check-task8-chain.ts
```

输出：
```
Task Counter: 8
Task ID: 8
Creator: 0x2bF490F5a7Be8e8AC83020d77d240c4E39165C30
Helper: 0x18D5eeDd85Caf7E96eEcB5c0a50514f810f98541
Reward: 10.0 ECHO
Task URI: https://everecho-staging-backend.onrender.com/task/8.json
Status: 1 (InProgress)
```

### 2. 同步 Task8 到数据库

```bash
cd backend
npx ts-node scripts/sync-task8-from-chain.ts
```

脚本执行：
1. 从链上读取 Task8 数据
2. 从 taskURI 获取 metadata（title, description, category）
3. 写入本地数据库（使用 chainId + taskId 复合主键）

### 3. 验证修复

```bash
powershell -ExecutionPolicy Bypass -File scripts/check-task8-simple.ps1
```

确认：
- ✓ Backend API 返回 Task8 数据
- ✓ Title: "finalTest"
- ✓ Category: "hosting"
- ✓ Creator/Helper nicknames 正确显示

### 4. 前端验证

刷新 TaskSquare 页面，Task8 应该正常显示：
- ✓ 标题：finalTest
- ✓ 描述：finalTest
- ✓ 分类：Hosting（带动画）
- ✓ 奖励：10 ECHO
- ✓ Creator/Helper 信息

## 技术细节

### 数据流

```
Chain (Task8) 
  ↓
useTasks Hook (读取链上数据)
  ↓
apiClient.getTask(8) → Backend API /api/task/8
  ↓
Database (Task table: chainId='84532', taskId='8')
  ↓
返回 metadata → 前端显示
```

### 关键文件

- `backend/scripts/sync-task8-from-chain.ts` - 同步脚本
- `backend/scripts/check-task8-chain.ts` - 链上检查
- `scripts/check-task8-simple.ps1` - API 验证
- `frontend/src/hooks/useTasks.ts` - 前端数据加载
- `backend/src/routes/task.ts` - 后端 API 路由

### 数据库 Schema

```prisma
model Task {
  chainId                   String   // 链 ID
  taskId                    String   // 任务 ID
  title                     String
  description               String
  contactsEncryptedPayload  String
  category                  String?
  creator                   String?
  createdAt                 String
  updatedAt                 DateTime @updatedAt

  @@id([chainId, taskId])  // 复合主键
}
```

## 预防措施

### 自动同步机制

后端有 `taskSyncCoordinator` 服务，应该自动同步链上任务到数据库。如果出现不同步：

1. 检查后端日志中的同步错误
2. 检查 RPC 连接状态
3. 手动运行同步脚本

### 通用同步脚本

如果其他任务也出现类似问题，可以创建通用同步脚本：

```bash
cd backend
npx ts-node scripts/sync-all-tasks-from-chain.ts
```

## 测试清单

- [x] Task8 在链上存在
- [x] Task8 在数据库中存在
- [x] Backend API 返回 Task8 数据
- [x] 前端显示 Task8 信息（标题、描述、分类）
- [x] Lottie 动画正常显示
- [x] Creator/Helper 昵称正确显示

## 相关文档

- `docs/CHAIN_ISOLATION_FINAL_REPORT.md` - 链隔离机制
- `docs/TASK_SYNC_FIX_ACCEPTANCE.md` - 任务同步修复
- `docs/TASK_METADATA_COMPLETE_FIX.md` - Metadata 绑定修复
