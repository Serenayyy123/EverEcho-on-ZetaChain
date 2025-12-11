# Staging 环境 Resync 执行指南

## 🎯 目标
在 Render staging 环境执行 resync 脚本，更新所有历史任务和 Profile 的 fallback metadata。

---

## 📋 前置条件

### 1. 确认代码已部署到 Render
```bash
# 本地提交并推送
git add backend/scripts/resync-all-metadata.ts
git add backend/scripts/sync-all-historical-tasks.ts
git commit -m "feat: add fallback metadata for failed taskURI fetch"
git push origin main
```

### 2. 等待 Render 自动部署完成
- 登录 Render Dashboard
- 查看 backend service 的 Deploy 状态
- 等待状态变为 "Live"

---

## 🚀 执行步骤

### Step 1: 登录 Render Shell

1. 打开 Render Dashboard: https://dashboard.render.com
2. 选择 backend service (everecho-staging-backend)
3. 点击右上角 "Shell" 按钮
4. 等待 Shell 连接成功

### Step 2: 验证环境变量

在 Render Shell 中执行：
```bash
# 检查必要的环境变量
echo $DATABASE_URL
echo $RPC_URL
echo $TASK_ESCROW_ADDRESS
echo $REGISTER_ADDRESS
echo $CHAIN_ID
```

**预期输出**:
```
DATABASE_URL=postgresql://everecho_staging_db_user:...
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
REGISTER_ADDRESS=0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
CHAIN_ID=84532
```

### Step 3: 执行 Resync Metadata 脚本

```bash
# 在 Render Shell 中执行
npm run resync:metadata
```

**预期日志**:
```
[ResyncMetadata] 🔄 Starting metadata resync...
[ResyncMetadata] Chain ID: 84532
[ResyncMetadata] RPC URL: https://sepolia.base.org
[ResyncMetadata] TaskEscrow: 0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
[ResyncMetadata] 📊 Total tasks on chain: 5

[ResyncMetadata] [Task 1/5]
[ResyncMetadata]   📥 Fetching metadata from: https://api.everecho.io/task/13.json
[ResyncMetadata]   ⚠️  Fetch failed: fetch failed, using fallback
[ResyncMetadata]   🔄 Fallback updated: Task 1 (synced from chain)

... (重复 2-5)

============================================================
[ResyncMetadata] 📊 Resync Summary:
[ResyncMetadata]   ✅ Updated (real metadata): 0
[ResyncMetadata]   🔄 Fallback updated: 5
[ResyncMetadata]   ⏭️  Skipped: 0
[ResyncMetadata]   ❌ Failed: 0
============================================================
```

### Step 4: 验证 Profile 数据（可选）

如果需要重新同步 Profile：
```bash
npm run sync:profiles
```

**预期日志**:
```
[SyncProfiles] 🔄 Starting historical profile sync...
[SyncProfiles] 📊 Total found: 5 registration events

... (处理每个 profile)

============================================================
[SyncProfiles] 📊 Sync Summary:
[SyncProfiles]   ✅ Synced (with metadata): 0
[SyncProfiles]   ⚠️  Synced (with placeholder): 5
[SyncProfiles]   📝 Total: 5
============================================================
```

---

## ✅ 验证结果

### 1. 验证 Task API

在本地终端执行（替换为实际的 Render backend URL）：

```bash
# 获取 Task 1
curl https://everecho-staging-backend.onrender.com/api/task/84532/1

# 获取 Task 2
curl https://everecho-staging-backend.onrender.com/api/task/84532/2

# 获取 Task 3
curl https://everecho-staging-backend.onrender.com/api/task/84532/3

# 获取 Task 4
curl https://everecho-staging-backend.onrender.com/api/task/84532/4

# 获取 Task 5
curl https://everecho-staging-backend.onrender.com/api/task/84532/5
```

**预期响应** (Task 1 示例):
```json
{
  "taskId": "1",
  "title": "Task 1 (synced from chain)",
  "description": "Metadata unavailable (taskURI unreachable). Using fallback.",
  "contactsEncryptedPayload": "",
  "createdAt": "1732704000000",
  "category": null
}
```

### 2. 验证 Profile API

```bash
# 获取 Profile 1
curl https://everecho-staging-backend.onrender.com/api/profile/0x099Fb550F7Dc5842621344c5a1678F943eEF3488

# 获取 Profile 2
curl https://everecho-staging-backend.onrender.com/api/profile/0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db

# 获取 Profile 3
curl https://everecho-staging-backend.onrender.com/api/profile/0xD68a76259d4100A2622D643d5e62F5F92C28C4fe

# 获取 Profile 4
curl https://everecho-staging-backend.onrender.com/api/profile/0x2bF490F5a7Be8e8AC83020d77d240c4E39165C30

# 获取 Profile 5
curl https://everecho-staging-backend.onrender.com/api/profile/0x18D5eeDd85Caf7E96eEcB5c0a50514f810f98541
```

**预期响应** (Profile 1 示例):
```json
{
  "nickname": "User (synced from chain)",
  "city": "",
  "skills": [],
  "encryptionPubKey": "",
  "contacts": null
}
```

### 3. 验证所有 Tasks

```bash
# 获取所有任务列表
curl https://everecho-staging-backend.onrender.com/api/task/84532
```

**预期响应**:
```json
[
  {
    "taskId": "1",
    "title": "Task 1 (synced from chain)",
    "description": "Metadata unavailable (taskURI unreachable). Using fallback.",
    ...
  },
  {
    "taskId": "2",
    "title": "Task 2 (synced from chain)",
    "description": "Metadata unavailable (taskURI unreachable). Using fallback.",
    ...
  },
  ...
]
```

---

## 🔍 故障排查

### 问题 1: npm run resync:metadata 找不到命令

**原因**: package.json 中没有定义该脚本

**解决**:
```bash
# 直接运行脚本
npx tsx scripts/resync-all-metadata.ts
```

### 问题 2: DATABASE_URL 未设置

**原因**: Render 环境变量未配置

**解决**:
1. 在 Render Dashboard 中打开 backend service
2. 进入 "Environment" 标签
3. 添加 `DATABASE_URL` 环境变量
4. 重新部署

### 问题 3: Prisma Client 未生成

**原因**: Build 命令未包含 `prisma generate`

**解决**:
```bash
# 在 Render Shell 中手动生成
npx prisma generate
```

### 问题 4: 脚本执行超时

**原因**: Render Shell 有时间限制

**解决**:
- 将脚本拆分为多个小批次
- 或者在 Render 的 Build Command 中添加脚本执行

---

## 📊 成功标准

### ✅ Resync 成功
- 日志显示 "Fallback updated: 5"
- 没有 "Failed" 错误
- 所有任务都有 fallback metadata

### ✅ API 验证成功
- `/api/task/84532/:id` 返回 200 + JSON
- Title 包含 "(synced from chain)"
- Description 包含 "Metadata unavailable"

### ✅ Profile 验证成功
- `/api/profile/:address` 返回 200 + JSON
- Nickname 为 "User (synced from chain)"

---

## 🎯 下一步

执行完成后，请提供：
1. Render Shell 的完整日志输出
2. curl 验证的响应结果
3. 任何错误或异常信息

我会根据结果进行进一步的调整和优化。

---

**创建时间**: 2024-11-27
**执行环境**: Render Staging
**预计执行时间**: 5-10 分钟
