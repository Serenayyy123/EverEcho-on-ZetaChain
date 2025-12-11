# 📋 数据库迁移指南 - 联系方式功能

## 🎯 迁移目的

为支持联系方式的重加密功能，需要在 `Task` 表中添加 `contactsPlaintext` 字段。

---

## 📝 Schema 变更

### 修改前
```prisma
model Task {
  taskId                    String   @id
  title                     String
  description               String
  contactsEncryptedPayload  String
  createdAt                 String
  updatedAt                 DateTime @updatedAt
}
```

### 修改后
```prisma
model Task {
  taskId                    String   @id
  title                     String
  description               String
  contactsEncryptedPayload  String
  contactsPlaintext         String?  // 新增字段
  createdAt                 String
  updatedAt                 DateTime @updatedAt
}
```

---

## 🚀 迁移步骤

### 步骤 1：进入后端目录
```bash
cd backend
```

### 步骤 2：创建迁移
```bash
npx prisma migrate dev --name add_contacts_plaintext
```

**预期输出：**
```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"

SQLite database dev.db created at file:./dev.db

Applying migration `20241124_add_contacts_plaintext`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20241124_add_contacts_plaintext/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client
```

### 步骤 3：生成 Prisma Client
```bash
npx prisma generate
```

**预期输出：**
```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client
```

### 步骤 4：验证迁移
```bash
npx prisma studio
```

打开 Prisma Studio，检查 `Task` 表是否有 `contactsPlaintext` 字段。

---

## 📄 生成的 SQL

**文件：** `backend/prisma/migrations/YYYYMMDD_add_contacts_plaintext/migration.sql`

```sql
-- AlterTable
ALTER TABLE "Task" ADD COLUMN "contactsPlaintext" TEXT;
```

**说明：**
- 添加可选字段 `contactsPlaintext`（TEXT 类型）
- 现有数据的该字段值为 `NULL`
- 不影响现有功能

---

## 🔄 回滚方案

### 如果需要回滚迁移

**步骤 1：查看迁移历史**
```bash
npx prisma migrate status
```

**步骤 2：回滚到上一个版本**
```bash
npx prisma migrate resolve --rolled-back YYYYMMDD_add_contacts_plaintext
```

**步骤 3：手动删除字段（如果需要）**
```sql
ALTER TABLE "Task" DROP COLUMN "contactsPlaintext";
```

---

## ⚠️ 注意事项

### 1. 数据兼容性
- ✅ 新字段为可选（`String?`）
- ✅ 现有任务不受影响
- ✅ 新任务会自动填充该字段

### 2. 生产环境迁移
```bash
# 生产环境使用 migrate deploy
npx prisma migrate deploy
```

### 3. 备份建议
```bash
# 迁移前备份数据库
cp backend/prisma/dev.db backend/prisma/dev.db.backup
```

---

## 🧪 测试验证

### 测试 1：创建新任务
```typescript
// 应该能够存储 contactsPlaintext
await prisma.task.create({
  data: {
    taskId: '1',
    title: 'Test',
    description: 'Test',
    contactsEncryptedPayload: 'encrypted...',
    contactsPlaintext: '@testuser', // 新字段
    createdAt: '1234567890',
  },
});
```

### 测试 2：查询任务
```typescript
// 应该能够读取 contactsPlaintext
const task = await prisma.task.findUnique({
  where: { taskId: '1' },
  select: {
    taskId: true,
    contactsPlaintext: true,
  },
});

console.log(task.contactsPlaintext); // '@testuser'
```

### 测试 3：更新任务
```typescript
// 应该能够更新 contactsPlaintext
await prisma.task.update({
  where: { taskId: '1' },
  data: {
    contactsPlaintext: '@newuser',
  },
});
```

---

## 📊 迁移影响分析

### 影响范围
- ✅ **数据库**：添加一个可选字段
- ✅ **API**：不影响现有 API 响应
- ✅ **前端**：无需修改
- ✅ **性能**：可忽略（字段为可选）

### 风险评估
- 🟢 **低风险**：向后兼容
- 🟢 **可回滚**：简单的字段添加
- 🟢 **无数据丢失**：不修改现有数据

---

## ✅ 完成检查清单

- [ ] 备份数据库
- [ ] 运行 `npx prisma migrate dev`
- [ ] 运行 `npx prisma generate`
- [ ] 验证 Prisma Studio 中的字段
- [ ] 测试创建任务
- [ ] 测试查询任务
- [ ] 测试更新任务
- [ ] 重启后端服务
- [ ] 验证 API 功能正常

---

## 🎯 总结

这是一个简单且安全的数据库迁移：
- 添加可选字段 `contactsPlaintext`
- 向后兼容，不影响现有功能
- 支持新的重加密流程

迁移完成后，后端将能够：
1. 存储明文联系方式（用于重加密）
2. 在 Helper 接受任务时重新加密
3. 为 Creator 和 Helper 生成独立的 wrappedDEK
