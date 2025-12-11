# 📋 联系方式流程 - Phase 2 前端实现报告

## ✅ 已完成任务

### 任务 1：PublishTask 页面集成
**文件：** `frontend/src/pages/PublishTask.tsx`

**实现内容：**

#### Action A：引入 useProfile Hook
```typescript
import { useProfile } from '../hooks/useProfile';

const { profile, loading: profileLoading } = useProfile(address, provider);
```

**功能：**
- ✅ 自动从用户 Profile 获取联系方式
- ✅ 显示加载状态
- ✅ 实时监听 Profile 变化

---

#### Action B：联系方式验证和预览 UI

**1. 表单验证逻辑**
```typescript
// 验证联系方式（从 Profile 获取）
if (!profile?.contacts) {
  errors.contacts = 'Please add contact info in your Profile first';
}
```

**2. UI 预览组件**
```typescript
{/* 联系方式预览（从 Profile 自动获取） */}
<div style={styles.contactsSection}>
  <label style={styles.label}>Contact Information *</label>
  {profileLoading ? (
    <div style={styles.contactsLoading}>
      <p style={styles.loadingText}>Loading profile...</p>
    </div>
  ) : profile?.contacts ? (
    <div style={styles.contactsPreview}>
      <div style={styles.contactsHeader}>
        <span style={styles.contactsIcon}>📱</span>
        <span style={styles.contactsValue}>{profile.contacts}</span>
      </div>
      <p style={styles.contactsHint}>
        This will be encrypted and shared with the Helper after they accept the task
      </p>
    </div>
  ) : (
    <div style={styles.contactsWarning}>
      <Alert variant="warning">
        ⚠️ No contact info in your profile.{' '}
        <Link to="/profile" style={styles.link}>
          Add contact info in Profile
        </Link>
      </Alert>
    </div>
  )}
</div>
```

**3. 提交按钮禁用逻辑**
```typescript
<Button
  type="submit"
  variant="success"
  size="lg"
  fullWidth
  loading={loading}
  disabled={loading || !profile?.contacts} // 没有联系方式时禁用
>
  Publish Task
</Button>
```

**4. 提交时传递联系方式**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  // 使用 Profile 中的联系方式
  const txHash = await createTask({
    title,
    description,
    contactsPlaintext: profile!.contacts!, // 传递明文联系方式
    reward,
  });

  if (txHash) {
    setTimeout(() => {
      navigate('/tasks');
    }, 2000);
  }
};
```

---

### 任务 2：useCreateTask Hook 修改
**文件：** `frontend/src/hooks/useCreateTask.ts`

**实现内容：**

#### Action C：修改函数签名
```typescript
export interface CreateTaskParams {
  title: string;
  description: string;
  contactsPlaintext: string; // 明文联系方式（从 Profile 获取）
  reward: string; // EOCHO 单位
}
```

**变更说明：**
- ❌ 移除：`contacts: string`
- ✅ 新增：`contactsPlaintext: string`
- 语义更清晰：明确表示这是明文联系方式

---

#### Action D：传递给后端 API
```typescript
// 5. 上传任务元数据到 backend（冻结点 2.2-P0-F4）
setStep('Uploading task metadata...');
const taskData: TaskData = {
  taskId: nextTaskId,
  title: params.title,
  description: params.description,
  contactsEncryptedPayload: params.contactsPlaintext, // 传递明文，后端负责加密
  createdAt: Math.floor(Date.now() / 1000),
};

const taskURI = await uploadTask(taskData);
```

**关键点：**
- 前端传递明文 `contactsPlaintext`
- 后端接收后负责加密处理
- 字段名 `contactsEncryptedPayload` 保持不变（后端兼容性）

---

## 📊 数据流

```
1. 用户打开 PublishTask 页面
   ↓
2. useProfile 自动加载用户 Profile
   ↓
3. 显示联系方式预览（profile.contacts）
   ↓
4. 用户填写任务信息（title, description, reward）
   ↓
5. 点击 "Publish Task"
   ↓
6. 验证表单（包括联系方式存在性）
   ↓
7. 调用 createTask({ contactsPlaintext: profile.contacts })
   ↓
8. useCreateTask 将 contactsPlaintext 传递给后端
   ↓
9. 后端接收明文并加密（Phase 3）
   ↓
10. 返回 taskURI
   ↓
11. 调用合约 createTask(reward, taskURI)
   ↓
12. 成功后跳转到 Task Square
```

---

## 🎨 UI 效果

### 联系方式预览卡片

**状态 1：加载中**
```
┌─────────────────────────────────┐
│ Contact Information *           │
│ ┌─────────────────────────────┐ │
│ │  Loading profile...         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**状态 2：有联系方式**
```
┌─────────────────────────────────┐
│ Contact Information *           │
│ ┌─────────────────────────────┐ │
│ │ 📱 @username                │ │
│ │                             │ │
│ │ This will be encrypted and  │ │
│ │ shared with the Helper...   │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**状态 3：无联系方式**
```
┌─────────────────────────────────┐
│ Contact Information *           │
│ ┌─────────────────────────────┐ │
│ │ ⚠️ No contact info in your  │ │
│ │    profile.                 │ │
│ │    Add contact info in      │ │
│ │    Profile →                │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 🔧 技术要点

### 1. 自动获取联系方式
- 使用 `useProfile` hook 自动加载
- 无需用户手动输入
- 保证联系方式一致性

### 2. 实时验证
- Profile 加载完成后立即验证
- 没有联系方式时禁用提交按钮
- 清晰的错误提示

### 3. 用户引导
- 提供 "Add contact info in Profile" 链接
- 点击直接跳转到 Profile 页面
- 流畅的用户体验

### 4. 数据传递
- 前端传递明文 `contactsPlaintext`
- 后端负责加密处理
- 职责分离清晰

---

## 📁 修改的文件清单

### 修改文件
1. ✅ `frontend/src/pages/PublishTask.tsx`
   - 引入 useProfile hook
   - 移除手动输入联系方式的 TextArea
   - 添加联系方式预览卡片
   - 修改提交逻辑

2. ✅ `frontend/src/hooks/useCreateTask.ts`
   - 修改 CreateTaskParams 接口
   - 更新参数名：`contacts` → `contactsPlaintext`
   - 传递明文给后端

---

## 🚀 下一步：Phase 3 后端实现

### 任务 2：后端 API 核心逻辑

**目标文件：** `backend/src/routes/task.ts`

**需要实现：**

1. **Action E：修改 `/create` 接口**
   - 接收 `contactsPlaintext` 参数
   - 验证参数存在性

2. **Action F：加密逻辑**
   ```typescript
   // 1. 获取 Creator 的公钥（从链上）
   const creatorPubKey = await getPublicKeyFromChain(creatorAddress);
   
   // 2. 加密联系方式（只用 Creator 公钥）
   const encryptedContacts = await encryptionService.encryptContacts(
     contactsPlaintext,
     creatorPubKey,
     null // Helper 公钥暂时为空
   );
   
   // 3. 存储到数据库
   await database.tasks.insert({
     taskId,
     title,
     description,
     encryptedContacts, // 加密结果
     originalContacts: contactsPlaintext, // 明文（用于重加密）
     creator: creatorAddress,
     helper: null,
   });
   ```

3. **优化提醒：公钥缓存**
   ```typescript
   // 避免重复调用链上数据
   const publicKeyCache = new Map<string, string>();
   
   async function getPublicKeyFromChain(address: string): Promise<string> {
     if (publicKeyCache.has(address)) {
       return publicKeyCache.get(address)!;
     }
     
     const pubKey = await registerContract.getUserInfo(address).publicKey;
     publicKeyCache.set(address, pubKey);
     return pubKey;
   }
   ```

---

## ✅ 验收标准

### 功能验收
- [x] PublishTask 页面自动显示 Profile 联系方式
- [x] 没有联系方式时显示警告并禁用提交
- [x] 有联系方式时显示预览卡片
- [x] 提交时正确传递 contactsPlaintext
- [x] useCreateTask 正确接收和传递参数

### 代码质量
- [x] TypeScript 类型检查通过
- [x] 无语法错误
- [x] 代码风格一致
- [x] 注释清晰

### 用户体验
- [x] 加载状态显示
- [x] 清晰的错误提示
- [x] 引导用户添加联系方式
- [x] 流畅的页面跳转

---

## 📝 使用说明

### 用户操作流程

1. **准备工作**
   ```
   Profile 页面 → 添加联系方式 → 保存
   ```

2. **发布任务**
   ```
   PublishTask 页面 → 
   查看联系方式预览（自动显示） → 
   填写任务信息 → 
   点击 "Publish Task"
   ```

3. **如果没有联系方式**
   ```
   PublishTask 页面 → 
   看到警告提示 → 
   点击 "Add contact info in Profile" → 
   跳转到 Profile 页面 → 
   添加联系方式 → 
   返回 PublishTask
   ```

---

## 🎯 总结

Phase 2 前端部分已成功完成：

1. ✅ **PublishTask 集成** - 自动获取和显示联系方式
2. ✅ **useCreateTask 修改** - 传递明文给后端
3. ✅ **用户体验优化** - 清晰的提示和引导

**关键改进：**
- 用户无需重复输入联系方式
- 自动从 Profile 获取，保证一致性
- 清晰的 UI 反馈和错误处理
- 流畅的用户引导流程

**预计完成时间：** 1-2 小时
**实际完成时间：** 符合预期

下一步将实现 Phase 3 的后端加密逻辑。
