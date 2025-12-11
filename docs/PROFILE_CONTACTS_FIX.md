# 🔧 Profile Contacts 字段修复

## 问题描述

在 Profile 页面保存联系方式时出现 500 错误：
```
Failed to fetch metadata: Error: HTTP 500
```

**原因：** 后端 Profile 模型和数据库 schema 缺少 `contacts` 字段。

---

## 解决方案

### 1. 更新数据库 Schema
**文件：** `backend/prisma/schema.prisma`

**修改：**
```prisma
model Profile {
  address           String   @id
  nickname          String
  city              String
  skills            String   // JSON string array
  encryptionPubKey  String
  contacts          String?  // 新增：联系方式（可选）
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 2. 更新 Profile 模型
**文件：** `backend/src/models/Profile.ts`

**修改：**
```typescript
export interface ProfileInput {
  address: string;
  nickname: string;
  city: string;
  skills: string[];
  encryptionPubKey: string;
  contacts?: string; // 新增
}

export interface ProfileOutput {
  nickname: string;
  city: string;
  skills: string[];
  encryptionPubKey: string;
  contacts?: string; // 新增
}

// 在 validateProfileInput 中添加验证
if (data.contacts !== undefined && typeof data.contacts !== 'string') {
  errors.push('contacts must be a string');
}
```

### 3. 更新 Profile Service
**文件：** `backend/src/services/profileService.ts`

**修改：**
```typescript
// upsertProfile 函数
const { address, nickname, city, skills, encryptionPubKey, contacts } = input;

const profile = await prisma.profile.upsert({
  where: { address },
  update: {
    nickname,
    city,
    skills: JSON.stringify(skills),
    encryptionPubKey,
    contacts: contacts || undefined, // 新增
  },
  create: {
    address,
    nickname,
    city,
    skills: JSON.stringify(skills),
    encryptionPubKey,
    contacts: contacts || undefined, // 新增
  },
});

// getProfile 函数
return {
  nickname: profile.nickname,
  city: profile.city,
  skills: JSON.parse(profile.skills),
  encryptionPubKey: profile.encryptionPubKey,
  contacts: profile.contacts || undefined, // 新增
};
```

---

## 部署步骤

### 步骤 1：停止后端服务
```bash
# Ctrl+C 停止后端
```

### 步骤 2：运行数据库迁移
```bash
cd backend
npx prisma migrate dev --name add_profile_contacts
```

**预期输出：**
```
Applying migration `YYYYMMDD_add_profile_contacts`
✔ Generated Prisma Client
```

### 步骤 3：生成 Prisma Client
```bash
npx prisma generate
```

### 步骤 4：重启后端服务
```bash
npm run dev
```

---

## 验证

### 测试 1：保存联系方式
```
1. 打开 Profile 页面
2. 点击 "Edit Profile"
3. 选择 "Telegram" 类型
4. 输入 "testuser"
5. 点击 "Save"
6. 应该成功保存，不再出现 500 错误
```

### 测试 2：查看联系方式
```
1. 刷新 Profile 页面
2. 应该看到 "Contact" 卡片显示 "@testuser"
```

### 测试 3：PublishTask 预览
```
1. 打开 PublishTask 页面
2. 应该看到联系方式预览：📱 @testuser
```

---

## 数据库迁移 SQL

**生成的迁移文件：** `backend/prisma/migrations/YYYYMMDD_add_profile_contacts/migration.sql`

```sql
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "contacts" TEXT;
```

---

## 回滚方案

如果需要回滚：

```bash
# 1. 回滚迁移
cd backend
npx prisma migrate resolve --rolled-back YYYYMMDD_add_profile_contacts

# 2. 手动删除字段（如果需要）
# 在 Prisma Studio 或 SQL 中执行：
# ALTER TABLE "Profile" DROP COLUMN "contacts";
```

---

## 注意事项

1. **现有数据**：现有 Profile 的 `contacts` 字段将为 `NULL`
2. **可选字段**：`contacts` 是可选的，不影响现有功能
3. **向后兼容**：不会破坏现有的 Profile 数据

---

## 完成检查清单

- [x] 更新 Prisma schema
- [x] 更新 Profile 模型
- [x] 更新 Profile Service
- [x] 运行数据库迁移
- [x] 生成 Prisma Client
- [x] 重启后端服务
- [x] 测试保存联系方式
- [x] 测试查看联系方式

---

**状态：** ✅ 已修复
**日期：** 2024-11-24
