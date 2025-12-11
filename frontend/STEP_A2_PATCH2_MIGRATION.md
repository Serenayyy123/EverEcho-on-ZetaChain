# Step A2 Patch-2 迁移指南

## 概述

Patch-2 修复了 API 类型定义，使其与薄片完全一致。这是一个**破坏性变更**，需要更新现有代码。

## 变更内容

### ProfileData 字段变更

| 旧字段 | 新字段 | 变更类型 |
|--------|--------|----------|
| name | nickname | 重命名 |
| - | encryptionPubKey | 新增（必填） |
| - | city | 新增（可选） |
| - | skills | 新增（可选） |
| bio | bio | 不变 |
| avatar | avatar | 不变 |
| contacts | contacts | 不变 |

### TaskData 字段变更

| 旧字段 | 新字段 | 变更类型 |
|--------|--------|----------|
| - | contactsEncryptedPayload | 新增（必填） |
| - | createdAt | 新增（必填） |
| title | title | 不变 |
| description | description | 不变 |
| category | category | 不变 |
| deliverables | deliverables | 不变 |

## 迁移步骤

### 1. 更新 Profile 创建代码

#### 旧代码
```typescript
const profileData = {
  name: 'Alice',
  bio: 'Full-stack developer',
  avatar: 'https://example.com/avatar.jpg',
  contacts: 'alice@example.com',
};
```

#### 新代码
```typescript
const profileData: ProfileData = {
  nickname: 'Alice', // name → nickname
  encryptionPubKey: '0x04abc...', // 新增必填
  city: 'San Francisco', // 新增可选
  skills: 'React, TypeScript', // 新增可选
  bio: 'Full-stack developer',
  avatar: 'https://example.com/avatar.jpg',
  contacts: 'alice@example.com',
};
```

### 2. 更新 Task 创建代码

#### 旧代码
```typescript
const taskData = {
  title: 'Build a Landing Page',
  description: 'Need a modern landing page',
  category: 'Web Development',
};
```

#### 新代码
```typescript
const taskData: TaskData = {
  title: 'Build a Landing Page',
  description: 'Need a modern landing page',
  contactsEncryptedPayload: encryptedContacts, // 新增必填
  createdAt: Math.floor(Date.now() / 1000), // 新增必填
  category: 'Web Development',
};
```

### 3. 生成 encryptionPubKey

如果你还没有加密公钥生成逻辑，可以使用以下方法：

```typescript
import { ethers } from 'ethers';

// 方法 1：从钱包地址派生（简化版）
async function getEncryptionPubKey(signer: ethers.Signer): Promise<string> {
  const address = await signer.getAddress();
  // 实际应该使用专门的加密密钥对
  // 这里仅作示例
  return `0x04${address.slice(2)}...`;
}

// 方法 2：使用 MetaMask 的 eth_getEncryptionPublicKey
async function getEncryptionPubKeyFromMetaMask(address: string): Promise<string> {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  
  const pubKey = await window.ethereum.request({
    method: 'eth_getEncryptionPublicKey',
    params: [address],
  });
  
  return pubKey;
}
```

### 4. 生成 contactsEncryptedPayload

```typescript
import { encrypt } from './utils/encryption';

// 加密联系方式
async function encryptContacts(
  contacts: string,
  recipientPubKey: string
): Promise<string> {
  // 使用接收方的公钥加密
  const encrypted = await encrypt(contacts, recipientPubKey);
  return encrypted;
}

// 在创建任务时使用
const taskData: TaskData = {
  title: 'My Task',
  description: 'Task description',
  contactsEncryptedPayload: await encryptContacts(
    'alice@example.com',
    helperPubKey
  ),
  createdAt: Math.floor(Date.now() / 1000),
};
```

## 需要更新的文件

### 前端页面

#### 1. Register 页面
```typescript
// 文件：frontend/src/pages/Register.tsx

// 旧代码
const handleRegister = async () => {
  await register({
    name: formData.name,
    bio: formData.bio,
  });
};

// 新代码
const handleRegister = async () => {
  const pubKey = await getEncryptionPubKey(signer);
  
  await register({
    nickname: formData.nickname, // name → nickname
    encryptionPubKey: pubKey, // 新增
    city: formData.city, // 新增
    skills: formData.skills, // 新增
    bio: formData.bio,
  });
};
```

#### 2. PublishTask 页面
```typescript
// 文件：frontend/src/pages/PublishTask.tsx

// 旧代码
const handlePublish = async () => {
  await createTask(reward, {
    title: formData.title,
    description: formData.description,
  });
};

// 新代码
const handlePublish = async () => {
  const encrypted = await encryptContacts(
    formData.contacts,
    helperPubKey
  );
  
  await createTask(reward, {
    title: formData.title,
    description: formData.description,
    contactsEncryptedPayload: encrypted, // 新增
    createdAt: Math.floor(Date.now() / 1000), // 新增
  });
};
```

### Mock 数据

#### 更新 Mock Profiles
```typescript
// 文件：frontend/src/mock/profiles.ts

export const MOCK_PROFILES: Record<string, Profile> = {
  '0xAlice': {
    address: '0xAlice',
    nickname: 'Alice', // name → nickname
    encryptionPubKey: '0x04abc...', // 新增
    city: 'San Francisco', // 新增
    skills: 'React, TypeScript', // 新增
    profileURI: 'https://api.everecho.io/profile/alice.json',
    isRegistered: true,
    balance: '100',
  },
};
```

#### 更新 Mock Tasks
```typescript
// 文件：frontend/src/mock/tasks.ts

export const MOCK_TASKS: Task[] = [
  {
    taskId: 1,
    title: 'Build a Landing Page',
    description: 'Need a modern landing page',
    contactsEncryptedPayload: 'encrypted_data', // 新增
    createdAt: now - 3600, // 新增
    // ...
  },
];
```

## TypeScript 编译检查

### 运行类型检查
```bash
cd frontend
npm run type-check
```

### 常见错误

#### 错误 1：缺少 encryptionPubKey
```
Property 'encryptionPubKey' is missing in type '{ nickname: string; }' 
but required in type 'ProfileData'.
```

**解决**：添加 encryptionPubKey 字段

#### 错误 2：使用了旧字段名
```
Object literal may only specify known properties, 
and 'name' does not exist in type 'ProfileData'.
```

**解决**：将 `name` 改为 `nickname`

#### 错误 3：缺少 contactsEncryptedPayload
```
Property 'contactsEncryptedPayload' is missing in type '{ title: string; }' 
but required in type 'TaskData'.
```

**解决**：添加 contactsEncryptedPayload 和 createdAt 字段

## 测试清单

### 手动测试
- [ ] 注册新用户（包含 encryptionPubKey）
- [ ] 创建任务（包含 contactsEncryptedPayload）
- [ ] 查看 Profile（显示 nickname）
- [ ] 查看 Task（显示正确字段）

### 自动化测试
```bash
# 运行单元测试
npm run test

# 运行集成测试
npm run test:integration
```

## 回滚方案

如果需要回滚到旧版本：

```bash
git checkout HEAD~1 -- frontend/src/api/client.ts
```

或手动恢复旧字段定义。

## 常见问题

### Q1: 为什么要改 name 为 nickname？
A: 为了与薄片字段命名保持一致（冻结点 3.2）。

### Q2: encryptionPubKey 从哪里获取？
A: 可以从 MetaMask 的 `eth_getEncryptionPublicKey` 方法获取，或使用专门的加密密钥对。

### Q3: contactsEncryptedPayload 如何生成？
A: 使用接收方的公钥加密联系方式，具体实现见 P1-B3 加密模块。

### Q4: 旧数据如何迁移？
A: 后端需要提供数据迁移脚本，将旧字段映射到新字段。

## 相关文档

- `STEP_A2_PATCH2_REPORT.md` - 验收报告
- `frontend/src/api/client.ts` - API 类型定义
- `薄片校准定稿_v1.0.md` - 冻结点参考

---

**迁移完成后，请运行完整测试确保所有功能正常！** ✅
