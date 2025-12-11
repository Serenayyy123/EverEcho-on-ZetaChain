# Staging Profile 数据缺失诊断报告

## 📊 Migrations 状态总结

### ✅ 已完成
- **Migration 文件**: `backend/prisma/migrations/20251126100000_init_postgres/migration.sql`
- **Provider 设置**: `postgresql` (migration_lock.toml)
- **Git 状态**: 已提交并推送到远程仓库
  - Commit: `703f0f5 db: reset migrations for postgres`
  - Commit: `1c0d926 chore: add prisma migrations to git`
- **.gitignore**: 不会阻止 migrations 提交 ✅
- **Build 命令**: `prisma generate && tsc` ✅

### 📋 Migration 内容
创建了 3 张表：
1. **Profile** (address PK)
2. **Task** (chainId + taskId 复合 PK)
3. **ContactKey** (chainId + taskId 复合 PK)

---

## 🔍 Profile 数据缺失根因分析

### 根因候选列表（按概率排序）

#### 1. 🎯 **最可能：历史用户只在链上注册，从未调用 backend API** (概率: 90%)

**证据链：**
- ✅ 链上有 5 个 UserRegistered 事件（已通过 sync-all-historical-profiles.ts 验证）
- ✅ 这 5 个用户的 Profile 已同步到 staging 数据库（占位符数据）
- ⚠️ 但前端 `useProfile` hook 的逻辑是：
  1. 先从链上读取 `profileURI`
  2. 再调用 `getProfile(address)` 从 backend 获取数据
- ⚠️ 如果链上 profileURI 为空或无效，前端会抛出错误："Profile not found. Please register first."

**代码位置：**
```typescript
// frontend/src/hooks/useProfile.ts:45-50
const profileURI = await registerContract.profileURI(address);

if (!profileURI) {
  throw new Error('Profile not found. Please register first.');
}

// 只有 profileURI 存在时才会调用 backend
const profileData = await getProfile(address);
```

**问题：**
- 历史用户在链上注册时，profileURI 可能为空字符串或指向不存在的域名
- 前端会在第一步就失败，根本不会调用 backend API
- 即使 backend 数据库有占位符数据，前端也看不到

---

#### 2. ⚠️ **可能：Staging 环境 VITE_BACKEND_BASE_URL 配置错误** (概率: 5%)

**证据链：**
- Frontend 使用 `import.meta.env.VITE_BACKEND_BASE_URL` 或默认 `http://localhost:3001`
- Staging 前端需要指向 Render backend URL

**需要验证：**
- Vercel 环境变量中 `VITE_BACKEND_BASE_URL` 是否正确设置
- 应该是：`https://everecho-staging-backend.onrender.com`（或实际的 Render URL）

---

#### 3. ⚠️ **可能：Backend API 返回 404/500** (概率: 3%)

**证据链：**
- Backend 路由：`GET /api/profile/:address`
- 逻辑：从 Prisma 查询 Profile 表
- 如果不存在返回 404

**已知状态：**
- ✅ 数据库有 5 个 Profile 记录（通过 sync-all-historical-profiles.ts 同步）
- ✅ 这些记录有占位符数据：`nickname: "User (synced from chain)"`

**需要验证：**
- 直接调用 staging backend API：`GET https://[staging-backend]/api/profile/0x099Fb550F7Dc5842621344c5a1678F943eEF3488`
- 应该返回 200 + JSON 数据

---

#### 4. ❌ **不太可能：Migrations 未在 Render 上执行** (概率: 2%)

**证据链：**
- ✅ Migrations 已提交到 GitHub
- ✅ Build 命令包含 `prisma generate`
- ⚠️ 但 Render 需要手动运行 `prisma migrate deploy`

**需要验证：**
- Render 的 Build Command 是否包含：`npm run build && npx prisma migrate deploy`
- 或者在 Start Command 之前运行 migrate

---

## 🎯 最薄片修复方案

### 方案 A：修复前端 Profile 读取逻辑（推荐）

**问题：** 前端依赖链上 profileURI，但历史用户的 profileURI 可能无效

**修复：** 在 `useProfile` hook 中添加容错逻辑

```typescript
// frontend/src/hooks/useProfile.ts

// 修改前：
const profileURI = await registerContract.profileURI(address);
if (!profileURI) {
  throw new Error('Profile not found. Please register first.');
}
const profileData = await getProfile(address);

// 修改后：
const profileURI = await registerContract.profileURI(address);

// 容错：即使 profileURI 为空，也尝试从 backend 获取
try {
  const profileData = await getProfile(address);
  setProfile(profileData);
} catch (apiError) {
  // 如果 backend 也没有，才抛出错误
  if (!profileURI) {
    throw new Error('Profile not found. Please register first.');
  }
  throw apiError;
}
```

**优点：**
- 最小改动
- 兼容历史数据和新数据
- 不破坏现有注册流程

**缺点：**
- 需要改前端代码

---

### 方案 B：在 Render 上手动运行 migrate（如果表不存在）

**步骤：**
1. 登录 Render Dashboard
2. 进入 backend service
3. 打开 Shell
4. 运行：`npx prisma migrate deploy`
5. 验证：`npx prisma studio` 或直接查询数据库

**优点：**
- 确保表结构正确
- 一次性操作

**缺点：**
- 需要手动操作
- 如果表已存在，不会有效果

---

### 方案 C：验证 Vercel 环境变量

**步骤：**
1. 登录 Vercel Dashboard
2. 进入 frontend project
3. 检查 Environment Variables
4. 确认 `VITE_BACKEND_BASE_URL` = `https://[your-render-backend-url]`
5. 如果不存在或错误，添加/修改后重新部署

**优点：**
- 简单直接
- 不需要改代码

**缺点：**
- 如果已经正确，不会解决问题

---

## 📝 下一步行动

### 立即执行（不改代码）：
1. ✅ **验证 Render migrations 状态**
   ```bash
   # 在 Render Shell 中运行
   npx prisma migrate status
   ```

2. ✅ **测试 staging backend API**
   ```bash
   curl https://[staging-backend]/api/profile/0x099Fb550F7Dc5842621344c5a1678F943eEF3488
   ```

3. ✅ **检查 Vercel 环境变量**
   - 确认 `VITE_BACKEND_BASE_URL` 正确

### 如果需要修复（最小改动）：
4. **方案 A**：修改 `frontend/src/hooks/useProfile.ts` 添加容错逻辑
5. **提交并部署**：只改这一个文件

---

## 🔗 相关文件

- Backend Routes: `backend/src/routes/profile.ts`
- Backend Service: `backend/src/services/profileService.ts`
- Frontend Hook: `frontend/src/hooks/useProfile.ts`
- Frontend API: `frontend/src/utils/api.ts`
- Sync Script: `backend/scripts/sync-all-historical-profiles.ts`
- Migration: `backend/prisma/migrations/20251126100000_init_postgres/migration.sql`

---

## 📊 当前数据状态

### Staging 数据库（已确认）：
- ✅ 5 个 Profile 记录（占位符数据）
- ✅ 5 个 Task 记录（占位符标题）
- ✅ 表结构正确（Profile/Task/ContactKey）

### 链上状态（Base Sepolia）：
- ✅ 5 个 UserRegistered 事件
- ⚠️ profileURI 可能为空或指向不存在的域名
- ✅ 5 个 TaskCreated 事件
- ⚠️ taskURI 指向不存在的域名（api.everecho.io）

---

**结论：** 最可能的根因是前端依赖链上 profileURI，但历史用户的 profileURI 无效。建议采用方案 A 添加容错逻辑，让前端在 profileURI 无效时也能从 backend 读取数据。
