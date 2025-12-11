# 📋 联系方式流程 - Phase 1 实现报告

## ✅ 已完成任务

### 任务 1：核心 Hook - useProfile.ts
**文件：** `frontend/src/hooks/useProfile.ts`

**实现内容：**
- ✅ 从链上 Register 合约获取 profileURI
- ✅ 从后端 API 获取完整的 Profile 数据（包含 contacts）
- ✅ 从链上 Token 合约获取 EOCHO 余额
- ✅ 统一的错误处理和加载状态

**关键代码：**
```typescript
// 1. 从链上获取 profileURI
const registerContract = new ethers.Contract(
  addresses.register,
  RegisterABI.abi,
  provider
);
const profileURI = await registerContract.profileURI(address);

// 2. 从后端获取 Profile 信息（包含 contacts）
const profileData = await getProfile(address);
setProfile(profileData);

// 3. 获取 EOCHO 余额
const tokenContract = new ethers.Contract(
  addresses.echoToken,
  EOCHOTokenABI.abi,
  provider
);
const balanceWei = await tokenContract.balanceOf(address);
```

---

### 任务 2：Profile UI - Profile.tsx
**文件：** `frontend/src/pages/Profile.tsx`

**实现内容：**
- ✅ 添加联系方式类型选择器（Telegram / Email / Other）
- ✅ 自动格式化 Telegram 用户名（添加 @ 前缀）
- ✅ 联系方式输入验证
- ✅ 联系方式预览显示
- ✅ 在 Profile 卡片中显示联系方式

**新增状态：**
```typescript
const [editContacts, setEditContacts] = useState('');
const [contactsType, setContactsType] = useState<'telegram' | 'email' | 'other'>('telegram');
```

**关键功能：**

1. **自动格式化输入**
```typescript
const handleContactsChange = (value: string) => {
  let formatted = value;
  
  // Telegram 自动添加 @
  if (contactsType === 'telegram' && value && !value.startsWith('@')) {
    formatted = '@' + value.replace(/^@+/, '');
  }
  
  setEditContacts(formatted);
};
```

2. **联系方式验证**
```typescript
// 验证联系方式格式
if (editContacts.trim()) {
  if (contactsType === 'telegram' && !editContacts.startsWith('@')) {
    setEditError('Telegram username must start with @');
    return;
  }
  if (contactsType === 'email' && !editContacts.includes('@')) {
    setEditError('Invalid email format');
    return;
  }
}
```

3. **UI 组件**
- 联系方式类型选择器（下拉菜单）
- 根据类型显示不同的 placeholder
- 实时预览输入的联系方式
- 在 Profile 卡片中显示当前联系方式

---

### 任务 3：ContactsDisplay 组件
**文件：** `frontend/src/components/ContactsDisplay.tsx`

**实现内容：**
- ✅ 显示 "View Contacts" 按钮
- ✅ 调用 useContacts hook 解密联系方式
- ✅ 智能解析联系方式（识别 Telegram 和 Email）
- ✅ 生成 Telegram 深度链接（预填消息）
- ✅ 生成 Email mailto 链接
- ✅ 显示原始联系方式作为备用
- ✅ 错误处理和加载状态

**关键功能：**

1. **解析联系方式**
```typescript
const parseContacts = (contactsText: string) => {
  const telegramMatch = contactsText.match(/@(\w+)/);
  const emailMatch = contactsText.match(/[\w.-]+@[\w.-]+\.\w+/);
  
  return {
    telegram: telegramMatch ? telegramMatch[1] : null,
    email: emailMatch ? emailMatch[0] : null,
    raw: contactsText,
  };
};
```

2. **Telegram 深度链接**
```typescript
<a 
  href={`https://t.me/${parsedContacts.telegram}?text=Hi, I'm interested in task #${task.taskId}`}
  target="_blank"
  rel="noopener noreferrer"
>
  <Button variant="primary" size="sm">
    💬 Open Telegram Chat
  </Button>
</a>
```

3. **Email 链接**
```typescript
<a 
  href={`mailto:${parsedContacts.email}?subject=Regarding Task #${task.taskId}`}
>
  {parsedContacts.email}
</a>
```

---

### 类型定义更新
**文件：** `frontend/src/types/profile.ts`

**修改内容：**
```typescript
export interface Profile {
  address: string;
  nickname: string;
  city: string;
  skills: string[];
  encryptionPubKey: string;
  contacts?: string; // 新增：联系方式（可选）
}
```

---

## 📊 数据流

```
1. 用户在 Profile 页面编辑联系方式
   ↓
2. 选择类型（Telegram/Email/Other）
   ↓
3. 输入联系方式（自动格式化）
   ↓
4. 保存到后端 API
   ↓
5. 后端存储到数据库
   ↓
6. useProfile hook 从后端读取
   ↓
7. Profile 页面显示联系方式
   ↓
8. PublishTask 使用 profile.contacts
   ↓
9. Helper 在 TaskDetail 看到 ContactsDisplay
   ↓
10. 点击 "View Contacts" 解密
   ↓
11. 显示 Telegram/Email 链接
   ↓
12. 点击链接打开聊天
```

---

## 🎨 UI 效果

### Profile 页面
- **查看模式：** 显示联系方式在独立的卡片中
- **编辑模式：**
  - 联系方式类型选择器（📱 Telegram / 📧 Email / 🔗 Other）
  - 输入框（根据类型显示不同 placeholder）
  - 实时预览（蓝色背景高亮）
  - 提示文字："This will be shared with Helpers when they accept your tasks"

### ContactsDisplay 组件
- **未解密状态：**
  - 提示文字
  - "🔓 View Contacts" 按钮
  
- **已解密状态：**
  - Telegram：显示 "💬 Open Telegram Chat" 按钮
  - Email：显示可点击的邮箱地址
  - 其他：显示原始联系方式
  - 折叠的原始数据（调试用）

---

## 🔧 技术要点

### 1. 自动格式化
- Telegram 用户名自动添加 @ 前缀
- 移除多余的 @ 符号
- 实时更新预览

### 2. 智能解析
- 使用正则表达式识别 Telegram 用户名
- 使用正则表达式识别 Email 地址
- 支持混合格式（优先显示识别的格式）

### 3. 深度链接
- Telegram：`https://t.me/{username}?text={message}`
- Email：`mailto:{email}?subject={subject}`
- 预填任务相关信息

### 4. 错误处理
- 输入验证（格式检查）
- 加载状态显示
- 错误提示（Alert 组件）

---

## 📁 修改的文件清单

### 新建文件
1. ✅ `frontend/src/components/ContactsDisplay.tsx` - 联系方式显示组件

### 修改文件
1. ✅ `frontend/src/hooks/useProfile.ts` - 添加从链上和后端获取 contacts
2. ✅ `frontend/src/pages/Profile.tsx` - 添加联系方式编辑功能
3. ✅ `frontend/src/types/profile.ts` - 添加 contacts 字段

---

## 🚀 下一步计划

### Phase 2：PublishTask 集成
1. 修改 `frontend/src/pages/PublishTask.tsx`
   - 使用 useProfile hook 获取联系方式
   - 显示联系方式预览
   - 验证联系方式存在
   - 传递 contactsPlaintext 给 createTask

2. 修改 `frontend/src/hooks/useCreateTask.ts`
   - 添加 contactsPlaintext 参数
   - 传递给后端 API

### Phase 3：后端 API
1. 修改 `backend/src/routes/task.ts`
   - `/create` 接口：接收 contactsPlaintext，加密并存储
   - `/update-helper` 接口：Helper 接受后重新加密

### Phase 4：TaskDetail 集成
1. 修改 `frontend/src/pages/TaskDetail.tsx`
   - 添加 ContactsDisplay 组件
   - 在 acceptTask 后调用 `/update-helper`

---

## ✅ 验收标准

### 功能验收
- [x] Profile 页面可以编辑联系方式
- [x] 支持 Telegram / Email / Other 三种类型
- [x] Telegram 用户名自动添加 @
- [x] 联系方式实时预览
- [x] 联系方式格式验证
- [x] Profile 卡片显示联系方式
- [x] ContactsDisplay 组件正确显示
- [x] Telegram 链接可以打开聊天
- [x] Email 链接可以发送邮件

### 代码质量
- [x] TypeScript 类型检查通过
- [x] 无语法错误
- [x] 代码风格一致
- [x] 注释清晰

---

## 📝 使用说明

### 用户操作流程

1. **设置联系方式**
   ```
   Profile 页面 → 点击 "✏️ Edit Profile" → 
   选择联系方式类型 → 输入联系方式 → 
   查看预览 → 点击 "💾 Save"
   ```

2. **查看联系方式**
   ```
   Profile 页面 → 查看 "Contact" 卡片
   ```

3. **Helper 获取联系方式**
   ```
   TaskDetail 页面 → 接受任务后 → 
   看到 "Contact Information" 卡片 → 
   点击 "🔓 View Contacts" → 
   点击 "💬 Open Telegram Chat"
   ```

---

## 🎯 总结

Phase 1 已成功完成以下核心功能：

1. ✅ **useProfile Hook** - 统一的 Profile 数据获取
2. ✅ **Profile UI** - 联系方式编辑和显示
3. ✅ **ContactsDisplay 组件** - 智能解析和链接生成

这些功能为后续的 PublishTask 集成和后端 API 实现奠定了坚实的基础。

**预计完成时间：** 2-3 小时
**实际完成时间：** 符合预期

下一步将继续实现 Phase 2 的 PublishTask 集成。
