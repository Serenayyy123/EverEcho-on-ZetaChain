# 🚀 联系方式功能部署说明

## ⚠️ 重要提示

由于 Prisma 生成过程中的权限问题，需要手动执行以下步骤。

---

## 📋 部署步骤

### 步骤 1：停止所有服务
```bash
# 停止前端
# Ctrl+C 或关闭终端

# 停止后端
# Ctrl+C 或关闭终端
```

### 步骤 2：数据库迁移
```bash
cd backend

# 创建迁移
npx prisma migrate dev --name add_contacts_plaintext

# 如果遇到权限错误，请：
# 1. 关闭所有 Node.js 进程
# 2. 以管理员身份运行终端
# 3. 重新执行上述命令
```

### 步骤 3：生成 Prisma Client
```bash
# 在 backend 目录下
npx prisma generate

# 如果遇到权限错误：
# 1. 删除 node_modules/.prisma 目录
# 2. 以管理员身份运行
# 3. 重新执行命令
```

### 步骤 4：验证 Schema
```bash
# 打开 Prisma Studio 验证
npx prisma studio

# 检查 Task 表是否有 contactsPlaintext 字段
```

### 步骤 5：重启服务
```bash
# 后端
cd backend
npm run dev

# 前端（新终端）
cd frontend
npm run dev
```

---

## 🧪 功能测试

### 测试 1：Profile 设置联系方式
```
1. 打开 http://localhost:5173/profile
2. 点击 "Edit Profile"
3. 选择 "Telegram" 类型
4. 输入 "testuser"（自动添加 @）
5. 点击 "Save"
6. 验证显示 "@testuser"
```

### 测试 2：PublishTask 预览
```
1. 打开 http://localhost:5173/publish
2. 查看 "Contact Information" 部分
3. 应该显示：📱 @testuser
4. 填写任务信息
5. 点击 "Publish Task"
```

### 测试 3：后端加密
```
1. 查看后端日志
2. 应该看到：
   [Task 1] Encrypting contacts for creator 0x...
   [Task 1] Contacts encrypted and DEK stored
3. 检查数据库：
   - Task 表应该有 contactsEncryptedPayload
   - Task 表应该有 contactsPlaintext
   - ContactKey 表应该有 creatorWrappedDEK
```

---

## ⚠️ 常见问题

### 问题 1：Prisma 生成权限错误
```
Error: EPERM: operation not permitted
```

**解决方案：**
1. 关闭所有 Node.js 进程（包括 VS Code 终端）
2. 删除 `backend/node_modules/.prisma` 目录
3. 以管理员身份打开终端
4. 重新运行 `npx prisma generate`

---

### 问题 2：数据库迁移失败
```
Error: Migration failed
```

**解决方案：**
1. 备份数据库：`cp backend/prisma/dev.db backend/prisma/dev.db.backup`
2. 删除迁移目录：`rm -rf backend/prisma/migrations`
3. 重新初始化：`npx prisma migrate dev --name init`

---

### 问题 3：TypeScript 类型错误
```
Property 'contactsPlaintext' does not exist
```

**解决方案：**
1. 确保已运行 `npx prisma generate`
2. 重启 TypeScript 服务器（VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"）
3. 重新打开文件

---

### 问题 4：后端启动失败
```
Cannot find module '@prisma/client'
```

**解决方案：**
```bash
cd backend
npm install
npx prisma generate
npm run dev
```

---

## 📊 验证清单

- [ ] Prisma 迁移成功
- [ ] Prisma Client 生成成功
- [ ] 后端启动无错误
- [ ] 前端启动无错误
- [ ] Profile 可以设置联系方式
- [ ] PublishTask 显示联系方式预览
- [ ] 创建任务成功
- [ ] 后端日志显示加密成功
- [ ] 数据库有加密数据

---

## 🔄 回滚方案

如果部署失败，可以回滚：

### 回滚数据库
```bash
cd backend

# 恢复备份
cp prisma/dev.db.backup prisma/dev.db

# 或者删除最新迁移
npx prisma migrate resolve --rolled-back YYYYMMDD_add_contacts_plaintext
```

### 回滚代码
```bash
# 使用 git 回滚
git checkout HEAD~1 backend/src/routes/task.ts
git checkout HEAD~1 backend/src/services/taskService.ts
git checkout HEAD~1 backend/prisma/schema.prisma
```

---

## 📝 注意事项

### 1. 生产环境部署
```bash
# 使用 migrate deploy 而不是 migrate dev
npx prisma migrate deploy
```

### 2. 环境变量
确保 `.env` 文件包含：
```env
DATABASE_URL="file:./dev.db"
RPC_URL="http://localhost:8545"
TASK_ESCROW_ADDRESS="0x..."
REGISTER_ADDRESS="0x..."
```

### 3. 权限要求
- 数据库文件写入权限
- node_modules 目录写入权限
- 如果在 Windows 上，可能需要管理员权限

---

## ✅ 部署完成

部署成功后，你应该能够：
1. ✅ 在 Profile 中设置联系方式
2. ✅ 在 PublishTask 中看到联系方式预览
3. ✅ 创建任务时自动加密联系方式
4. ✅ 后端正确存储加密数据

下一步可以继续实现 Phase 4（Helper 接受任务和查看联系方式）。

---

**最后更新：** 2024-11-24
**状态：** Phase 1-3 部署就绪
