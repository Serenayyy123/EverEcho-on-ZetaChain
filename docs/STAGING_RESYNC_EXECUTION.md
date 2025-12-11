# Staging Resync 执行总结

## ✅ 代码已推送

**Commit**: `3eb5058`
**Message**: "feat: add fallback metadata for failed taskURI fetch"
**推送时间**: 刚刚
**状态**: 已推送到 GitHub main 分支

---

## 🚀 下一步：在 Render 上执行

### 方式 1: 等待 Render 自动部署后手动执行（推荐）

1. **等待 Render 自动部署**
   - 打开 Render Dashboard: https://dashboard.render.com
   - 查看 backend service 部署状态
   - 等待状态变为 "Live"（通常 3-5 分钟）

2. **打开 Render Shell**
   - 在 backend service 页面点击右上角 "Shell" 按钮
   - 等待 Shell 连接成功

3. **执行 Resync 脚本**
   ```bash
   # 方式 A: 使用 npm script（如果已配置）
   npm run resync:metadata
   
   # 方式 B: 直接运行脚本
   npx tsx scripts/resync-all-metadata.ts
   ```

4. **查看日志输出**
   - 应该看到类似本地测试的日志
   - 记录 "Updated" 和 "Fallback updated" 的数量

---

### 方式 2: 在 Render Build Command 中自动执行

如果希望每次部署后自动 resync，可以修改 Render 的 Build Command：

**当前 Build Command**:
```bash
npm run build
```

**修改为**:
```bash
npm run build && npx tsx scripts/resync-all-metadata.ts
```

**注意**: 这会让每次部署都执行 resync，可能不是你想要的。建议使用方式 1 手动执行。

---

## 📊 预期结果

### Resync 日志
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

[ResyncMetadata] [Task 2/5]
[ResyncMetadata]   📥 Fetching metadata from: https://api.everecho.io/task/2.json
[ResyncMetadata]   ⚠️  Fetch failed: fetch failed, using fallback
[ResyncMetadata]   🔄 Fallback updated: Task 2 (synced from chain)

[ResyncMetadata] [Task 3/5]
[ResyncMetadata]   📥 Fetching metadata from: https://api.everecho.io/task/3.json
[ResyncMetadata]   ⚠️  Fetch failed: fetch failed, using fallback
[ResyncMetadata]   🔄 Fallback updated: Task 3 (synced from chain)

[ResyncMetadata] [Task 4/5]
[ResyncMetadata]   📥 Fetching metadata from: https://api.everecho.io/task/4.json
[ResyncMetadata]   ⚠️  Fetch failed: fetch failed, using fallback
[ResyncMetadata]   🔄 Fallback updated: Task 4 (synced from chain)

[ResyncMetadata] [Task 5/5]
[ResyncMetadata]   📥 Fetching metadata from: https://api.everecho.io/task/5.json
[ResyncMetadata]   ⚠️  Fetch failed: fetch failed, using fallback
[ResyncMetadata]   🔄 Fallback updated: Task 5 (synced from chain)

============================================================
[ResyncMetadata] 📊 Resync Summary:
[ResyncMetadata]   ✅ Updated (real metadata): 0
[ResyncMetadata]   🔄 Fallback updated: 5
[ResyncMetadata]   ⏭️  Skipped: 0
[ResyncMetadata]   ❌ Failed: 0
============================================================
```

---

## ✅ 验证 API（在本地执行）

### 快速验证脚本

在本地 PowerShell 中运行：
```powershell
.\scripts\verify-staging-api.ps1
```

### 手动 curl 验证

**获取 Render backend URL**:
- 在 Render Dashboard 中找到 backend service 的 URL
- 通常是: `https://everecho-staging-backend.onrender.com`

**验证 Task API**:
```bash
# Task 1
curl https://everecho-staging-backend.onrender.com/api/task/84532/1

# Task 2
curl https://everecho-staging-backend.onrender.com/api/task/84532/2

# 所有任务
curl https://everecho-staging-backend.onrender.com/api/task/84532
```

**预期响应** (Task 1):
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

**验证 Profile API**:
```bash
# Profile 1
curl https://everecho-staging-backend.onrender.com/api/profile/0x099Fb550F7Dc5842621344c5a1678F943eEF3488
```

**预期响应**:
```json
{
  "nickname": "User (synced from chain)",
  "city": "",
  "skills": [],
  "encryptionPubKey": "",
  "contacts": null
}
```

---

## 📋 检查清单

执行完成后，请确认：

- [ ] Render 部署成功（状态为 "Live"）
- [ ] Resync 脚本执行成功（无 Failed 错误）
- [ ] 日志显示 "Fallback updated: 5"
- [ ] Task API 返回 200 + fallback metadata
- [ ] Profile API 返回 200 + fallback data
- [ ] 所有任务的 title 包含 "(synced from chain)"
- [ ] 所有任务的 description 包含 "Metadata unavailable"

---

## 🎯 提供给我的信息

执行完成后，请提供：

1. **Render Shell 日志**
   - 完整的 resync 脚本输出
   - 特别是最后的 Summary 部分

2. **API 验证结果**
   - 运行 `.\scripts\verify-staging-api.ps1` 的输出
   - 或者手动 curl 的响应

3. **任何错误或异常**
   - 如果有任何失败或警告，请提供详细信息

---

**创建时间**: 2024-11-27
**状态**: 等待 Render 部署和执行
