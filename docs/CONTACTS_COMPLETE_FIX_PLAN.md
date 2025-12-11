# Contacts 乱码问题 - 完整修复方案

## 🔍 问题确认

**所有任务（Task 2, Task 6 等）的联系方式都显示为乱码（十六进制字符串）**

## 📊 问题分析

### 数据流

```
Profile.contacts (明文?) 
  → PublishTask 
  → useCreateTask 
  → Backend /api/task 
  → DB: Task.contactsPlaintext (加密数据 ❌)
  → Backend /api/contacts/decrypt 
  → Frontend (显示乱码)
```

### 可能的原因

1. **Profile.contacts 存储了加密数据**（最可能）
2. **创建任务时前端加密了数据**
3. **后端错误地加密了数据**

## 🎯 解决方案

### 方案 A: 创建新任务测试（推荐）

**步骤**:

1. **更新 Profile 的 contacts**
   - 进入 Profile 页面
   - 点击 "Edit Profile"
   - 在 Contacts 字段输入明文：`@myTelegram, my@email.com`
   - 保存

2. **创建新任务**
   - 进入 Publish Task 页面
   - 填写任务信息
   - 确认 Contact Information 显示正确
   - 发布任务

3. **测试 View Contacts**
   - 进入新任务详情页
   - 点击 "View Contacts"
   - 应该看到明文联系方式

### 方案 B: 修复所有历史数据

如果需要保留历史任务，需要：

1. **找到原始明文**
   - 检查用户的 Profile.contacts
   - 如果也是加密的，需要用户重新输入

2. **批量更新数据库**
   ```sql
   -- 示例：更新 Task 6
   UPDATE Task
   SET contactsPlaintext = '@telegram, email@example.com'
   WHERE taskId = '6';
   ```

3. **更新所有相关任务**

## 🔧 立即行动

### 步骤 1: 检查你的 Profile

1. 访问 Profile 页面
2. 查看 "Contact Information" 显示的是什么
3. 如果是乱码 → 需要重新输入
4. 如果是明文 → 继续下一步

### 步骤 2: 更新 Profile Contacts

1. 点击 "Edit Profile"
2. 在 Contacts 字段输入：
   ```
   @yourTelegram, your@email.com
   ```
3. 点击 "Save Changes"
4. 确认保存成功

### 步骤 3: 创建测试任务

1. 进入 "Publish Task"
2. 填写：
   - Title: `Test Contacts Display`
   - Description: `Testing if contacts show correctly`
   - Reward: `10`
   - Category: 任意
3. 确认 Contact Information 预览显示正确
4. 点击 "Publish Task"

### 步骤 4: 验证修复

1. 等待任务创建成功
2. 进入新任务详情页
3. 点击 "View Contacts"
4. 应该看到：
   ```
   Telegram: @yourTelegram
   Email: your@email.com
   ```

## 📋 如果还是乱码

### 检查 1: Profile.contacts 是否正确

在浏览器控制台运行：
```javascript
// 获取当前用户的 Profile
fetch('https://everecho-staging-backend.onrender.com/api/profile/YOUR_ADDRESS')
  .then(r => r.json())
  .then(d => console.log('Profile contacts:', d.contacts))
```

如果显示乱码，说明 Profile 中存储的就是加密数据。

### 检查 2: 创建任务时传递的数据

在 PublishTask 页面，打开浏览器控制台，查看 Network 标签中 POST /api/task 请求的 payload：

```json
{
  "contactsEncryptedPayload": "应该是明文，不是十六进制"
}
```

如果是十六进制，说明前端传递了加密数据。

## 🔍 诊断脚本

创建一个脚本来检查所有任务的 contacts 数据类型：

```typescript
// backend/scripts/diagnose-contacts-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    select: {
      taskId: true,
      contactsPlaintext: true,
    },
  });

  tasks.forEach(task => {
    const isHex = /^[0-9a-f]{64,}$/i.test(task.contactsPlaintext || '');
    console.log(`Task ${task.taskId}: ${isHex ? 'ENCRYPTED' : 'PLAINTEXT'}`);
    console.log(`  Preview: ${task.contactsPlaintext?.slice(0, 50)}...`);
  });
}

main();
```

## 🎯 预防措施

### 1. 添加验证

在后端 `/api/task` 路由中添加：

```typescript
// 检查 contactsPlaintext 是否看起来像加密数据
if (/^[0-9a-f]{64,}$/i.test(contactsPlaintext)) {
  console.warn('[Task] contactsPlaintext looks like encrypted data!');
  return res.status(400).json({
    error: 'contactsPlaintext should be plaintext, not encrypted',
  });
}
```

### 2. 添加日志

在创建任务时记录数据：

```typescript
console.log('[Task] Creating task with contacts:', {
  length: contactsPlaintext.length,
  preview: contactsPlaintext.slice(0, 50),
  looksLikeHex: /^[0-9a-f]+$/i.test(contactsPlaintext),
});
```

### 3. 前端验证

在 PublishTask 中验证 Profile.contacts：

```typescript
if (profile.contacts && /^[0-9a-f]{64,}$/i.test(profile.contacts)) {
  alert('Your profile contacts appear to be encrypted. Please update your profile.');
  return;
}
```

## 📊 总结

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 所有任务乱码 | 历史数据存储了加密数据 | 创建新任务测试 |
| Profile 显示乱码 | Profile.contacts 是加密数据 | 重新编辑 Profile |
| 新任务也乱码 | 前端传递了加密数据 | 检查代码逻辑 |

## 🎯 下一步

1. ✅ 检查你的 Profile.contacts 是否是明文
2. ✅ 如果是乱码，重新编辑 Profile
3. ✅ 创建一个新任务测试
4. ✅ 验证新任务的 contacts 显示正常

---

**快速修复**: 
1. Edit Profile → 输入明文 contacts → Save
2. Publish Task → 创建新任务
3. View Contacts → 验证显示正常
