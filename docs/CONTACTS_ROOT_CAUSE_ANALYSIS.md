# Contacts 乱码问题 - 根本原因分析

## 🔍 问题确认

**所有任务（包括新创建的 Task 7）的联系方式都显示为加密的十六进制字符串**

```
Task 2: a0cd83feb5a8cf0acdb778750a4bb657...
Task 6: a0cd83feb5a8cf0acdb778750a4bb657...
Task 7: c197ab6e3665c5efec0fbc83c05f3820... (新创建)
```

## 📊 根本原因

**Profile.contacts 字段存储的是加密数据，而不是明文**

### 数据流分析

```
用户注册/编辑 Profile
  ↓
Profile.contacts = 加密数据 ❌ (应该是明文)
  ↓
创建任务时读取 Profile.contacts
  ↓
Task.contactsPlaintext = 加密数据 ❌
  ↓
View Contacts 时返回加密数据
  ↓
前端显示乱码
```

## 🎯 问题源头

### 可能性 1: Profile 编辑时加密了数据

在 Profile 页面编辑 contacts 时，可能某个环节加密了数据。

**需要检查**:
- `frontend/src/pages/Profile.tsx` - 编辑 Profile 的逻辑
- `backend/src/routes/profile.ts` - 保存 Profile 的逻辑

### 可能性 2: Profile 恢复时使用了错误的数据

在 off-chain profile restore 时，可能使用了加密数据而不是明文。

**需要检查**:
- Profile restore 功能的实现

### 可能性 3: 历史遗留数据

早期版本中 Profile.contacts 就存储了加密数据，一直没有修复。

## 🔧 解决方案

### 方案 A: 手动更新 Profile.contacts（立即可用）

直接在数据库中更新你的 Profile.contacts 为明文：

```sql
UPDATE Profile
SET contacts = '@myTelegram, my@email.com'
WHERE address = '0x099Fb550F7Dc5842621344c5a1678F943eEF3488';
```

然后创建新任务测试。

### 方案 B: 修复 Profile 编辑逻辑（长期方案）

1. 检查 Profile 编辑时是否加密了 contacts
2. 确保 contacts 字段始终存储明文
3. 添加验证防止存储加密数据

### 方案 C: 添加数据迁移脚本

创建脚本批量修复所有用户的 Profile.contacts：

```typescript
// backend/scripts/fix-profile-contacts.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany();
  
  for (const profile of profiles) {
    // 检查 contacts 是否是加密数据
    if (profile.contacts && /^[0-9a-f]{64,}$/i.test(profile.contacts)) {
      console.log(`Profile ${profile.address} has encrypted contacts`);
      // 需要用户重新输入明文
    }
  }
}

main();
```

## 📋 立即诊断步骤

### 步骤 1: 检查你的 Profile.contacts

在浏览器控制台运行：

```javascript
fetch('https://everecho-staging-backend.onrender.com/api/profile/0x099Fb550F7Dc5842621344c5a1678F943eEF3488')
  .then(r => r.json())
  .then(d => {
    console.log('Profile contacts:', d.contacts);
    console.log('Is encrypted:', /^[0-9a-f]{64,}$/i.test(d.contacts));
  });
```

**期望结果**:
- `Profile contacts: "@telegram, email@example.com"` ✅
- `Is encrypted: false` ✅

**实际结果（如果有问题）**:
- `Profile contacts: "c197ab6e3665c5efec..."` ❌
- `Is encrypted: true` ❌

### 步骤 2: 确认问题源头

如果 Profile.contacts 是加密数据，说明问题在 Profile 编辑/创建时。

### 步骤 3: 临时解决方案

**选项 A**: 如果有数据库访问权限
```sql
UPDATE Profile
SET contacts = '@yourTelegram, your@email.com'
WHERE address = 'YOUR_ADDRESS';
```

**选项 B**: 如果没有数据库访问权限
- 需要修复 Profile 编辑逻辑
- 或者创建一个 API 端点来更新 contacts

## 🎯 下一步行动

### 立即行动

1. **检查 Profile.contacts**
   ```javascript
   // 在浏览器控制台运行
   fetch('https://everecho-staging-backend.onrender.com/api/profile/YOUR_ADDRESS')
     .then(r => r.json())
     .then(d => console.log('Contacts:', d.contacts));
   ```

2. **确认是否加密**
   - 如果是十六进制字符串 → 问题确认
   - 如果是明文 → 问题在其他地方

3. **临时修复**
   - 如果有数据库访问 → 直接更新
   - 如果没有 → 需要创建修复脚本

### 长期修复

1. **找到加密数据的源头**
   - 检查 Profile 编辑逻辑
   - 检查 Profile 恢复逻辑
   - 检查注册逻辑

2. **添加验证**
   ```typescript
   // 在保存 Profile 时验证
   if (/^[0-9a-f]{64,}$/i.test(contacts)) {
     throw new Error('Contacts should be plaintext, not encrypted');
   }
   ```

3. **数据迁移**
   - 创建脚本修复所有用户的 Profile.contacts
   - 需要用户重新输入明文

## 📊 总结

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 所有任务乱码 | Profile.contacts 是加密数据 | 更新 Profile.contacts 为明文 |
| 新任务也乱码 | 从 Profile 继承了加密数据 | 修复 Profile 后重新创建任务 |
| 无法编辑修复 | Profile 编辑逻辑有问题 | 直接更新数据库或修复代码 |

---

**关键发现**: Profile.contacts 字段存储了加密数据，这是所有任务乱码的根本原因。需要先修复 Profile.contacts，然后所有新创建的任务才会正常显示。
