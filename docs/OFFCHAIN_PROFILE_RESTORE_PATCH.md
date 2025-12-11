# Off-chain Profile Restore Patch

## 🎯 目标
为历史用户提供链下恢复 Profile 的功能，生成新的 encryptionPubKey，不触发任何链上交易或 token mint。

---

## ✅ 修改完成

### 修改的文件
**文件**: `frontend/src/pages/Profile.tsx`
**行数**: +45 行

### 新增功能

#### 1. 导入加密工具函数
```typescript
import { generateEncryptionKeyPair, saveEncryptionPrivateKey } from '../utils/encryption';
```

#### 2. 添加状态管理
```typescript
const [restoreLoading, setRestoreLoading] = useState(false);
const [restoreError, setRestoreError] = useState<string | null>(null);
```

#### 3. 实现链下恢复函数
```typescript
const handleRestoreOffchain = async () => {
  if (!address || !profile) return;
  
  setRestoreLoading(true);
  setRestoreError(null);
  
  try {
    // 1. 生成新的加密密钥对（不触发链上交易）
    const { publicKey, privateKey } = generateEncryptionKeyPair();
    
    // 2. 保存私钥到 localStorage
    saveEncryptionPrivateKey(address, privateKey);
    
    // 3. 准备 profile 数据（清理占位符）
    const nickname = profile.nickname.includes('(synced from chain)') 
      ? 'User' 
      : profile.nickname;
    
    // 4. 只调用 backend API，不触发链上交易
    await apiClient.createProfile({
      address,
      nickname,
      city: profile.city || '',
      skills: profile.skills || [],
      contacts: profile.contacts || undefined,
      encryptionPubKey: publicKey,
    });
    
    alert('Profile restored off-chain successfully! No tokens minted.');
    window.location.reload();
  } catch (e) {
    console.error('Restore failed:', e);
    setRestoreError(e instanceof Error ? e.message : 'Failed to restore profile');
  } finally {
    setRestoreLoading(false);
  }
};
```

#### 4. 更新警告 UI
```tsx
{needsRestore && (
  <Alert variant="warning" title="Profile incomplete (historical user)">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p>This is a historical on-chain account...</p>
      <p><strong>Impact:</strong> Tasks cannot create ContactKey...</p>
      <p><strong>Fix:</strong> Restore off-chain (NO tokens minted)</p>
      
      {restoreError && <p style={{ color: '#b91c1c' }}>{restoreError}</p>}
      
      <Button
        variant="primary"
        onClick={handleRestoreOffchain}
        loading={restoreLoading}
        disabled={restoreLoading}
      >
        Restore profile (off-chain)
      </Button>
    </div>
  </Alert>
)}
```

---

## 🔒 关键保护措施

### ✅ 绝对不触发链上交易
- **不调用**: `register()` 合约函数
- **不调用**: `mint()` 或任何 token 相关函数
- **只调用**: `apiClient.createProfile()` - 纯 HTTP POST 到 backend

### ✅ 复用现有工具函数
- `generateEncryptionKeyPair()` - 来自 `frontend/src/utils/encryption.ts`
- `saveEncryptionPrivateKey()` - 来自 `frontend/src/utils/encryption.ts`
- `apiClient.createProfile()` - 来自 `frontend/src/api/client.ts`

### ✅ 只改一个文件
- 只修改 `Profile.tsx`
- 不改 hooks、不改 Register 页面、不改 backend、不改合约

### ✅ 不影响正常用户
- 只对历史占位用户显示警告和按钮
- 正常用户完全不受影响
- 新用户注册流程保持不变

---

## 📋 历史用户判定逻辑

```typescript
const needsRestore =
  profile &&
  (
    !profile.encryptionPubKey ||
    profile.encryptionPubKey.trim() === '' ||
    profile.nickname.includes('(synced from chain)')
  );
```

**满足任一条件即显示恢复入口**:
1. 没有 encryptionPubKey
2. encryptionPubKey 为空字符串
3. nickname 包含 "(synced from chain)" 占位符

---

## 🎯 用户操作流程

### 1. 历史用户访问 Profile 页面
- 看到黄色警告卡
- 显示 "Restore profile (off-chain)" 按钮

### 2. 点击恢复按钮
- 前端本地生成新的加密密钥对
- 私钥保存到 localStorage
- 公钥通过 HTTP POST 发送到 backend

### 3. Backend 处理
- 接收 POST /api/profile 请求
- Upsert Profile 表（更新 encryptionPubKey）
- 返回成功响应

### 4. 前端刷新
- 显示成功提示
- 页面自动刷新
- 警告卡消失（因为 encryptionPubKey 不再为空）

---

## ✅ 验收标准

### 1. ✅ 历史用户能看到恢复入口
**测试用户**: 
- encryptionPubKey 为空
- nickname 包含 "(synced from chain)"

**预期**: 看到警告卡 + "Restore profile (off-chain)" 按钮

### 2. ✅ 点击后不触发链上交易
**操作**: 点击 "Restore profile (off-chain)" 按钮

**预期**: 
- ❌ 不弹出 MetaMask 签名窗口
- ❌ 不发生任何链上交易
- ✅ 只有 HTTP 请求到 backend

### 3. ✅ Backend 立即返回更新后的 profile
**验证**: 
```bash
curl https://staging-backend/api/profile/0x099Fb550F7Dc5842621344c5a1678F943eEF3488
```

**预期响应**:
```json
{
  "nickname": "User",
  "city": "",
  "skills": [],
  "encryptionPubKey": "a1b2c3d4...",  // ← 不再为空
  "contacts": null
}
```

### 4. ✅ ContactKey 同步错误减少
**验证**: 查看 backend chain-sync 日志

**预期**: 
- 之前: "Creator ... not found or has no encryption key"
- 之后: 成功创建 ContactKey（如果用户恢复了 profile）

### 5. ✅ 正常用户不受影响
**测试用户**: 有完整 encryptionPubKey 的用户

**预期**: 
- 不显示警告卡
- Profile 页面正常显示
- 所有功能正常

---

## 🔍 技术细节

### 加密密钥生成
```typescript
// 使用 tweetnacl (x25519) 生成密钥对
const keyPair = nacl.box.keyPair();

// 转换为 hex 格式
publicKey: uint8ArrayToHex(keyPair.publicKey)   // 64 字符
privateKey: uint8ArrayToHex(keyPair.secretKey)  // 64 字符
```

### 私钥存储
```typescript
// 按链隔离存储到 localStorage
const key = `encryption_key_${chainId}_${address.toLowerCase()}`;
localStorage.setItem(key, privateKey);

// 向后兼容旧 key
localStorage.setItem(`encryption_key_${address.toLowerCase()}`, privateKey);
```

### Backend API 调用
```typescript
// POST /api/profile
{
  address: "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
  nickname: "User",
  city: "",
  skills: [],
  encryptionPubKey: "a1b2c3d4e5f6...",  // 新生成的公钥
  contacts: undefined
}
```

---

## 📊 影响范围

### 修改的文件: 1
- `frontend/src/pages/Profile.tsx`

### 新增代码行数: ~45 行
- 导入: 1 行
- 状态: 2 行
- 恢复函数: 30 行
- UI 更新: 12 行

### 依赖的工具: 3
- `generateEncryptionKeyPair()` (已存在)
- `saveEncryptionPrivateKey()` (已存在)
- `apiClient.createProfile()` (已存在)

### 不涉及的部分
- ❌ 不改 backend
- ❌ 不改合约
- ❌ 不改 Register 页面
- ❌ 不改 hooks
- ❌ 不触发链上交易

---

## 🎯 与之前方案的对比

### 之前的方案（已废弃）
- ❌ 显示 "Re-register" 按钮
- ❌ 跳转到 Register 页面
- ❌ 尝试调用 register() 合约
- ❌ 失败：AlreadyRegistered 错误

### 当前方案（已实施）
- ✅ 显示 "Restore profile (off-chain)" 按钮
- ✅ 在 Profile 页面直接处理
- ✅ 只调用 backend API
- ✅ 成功：生成新 encryptionPubKey

---

## 🚀 部署后验证

### 1. 测试历史用户恢复
```bash
# 1. 访问历史用户的 Profile 页面
# 2. 点击 "Restore profile (off-chain)" 按钮
# 3. 等待成功提示
# 4. 验证 backend API 返回新的 encryptionPubKey
```

### 2. 验证 ContactKey 同步
```bash
# 1. 等待 backend chain-sync 运行
# 2. 查看日志，确认不再有 "no encryption key" 错误
# 3. 验证 ContactKey 表有新记录
```

### 3. 验证正常用户不受影响
```bash
# 1. 使用正常用户登录
# 2. 访问 Profile 页面
# 3. 确认不显示警告卡
# 4. 所有功能正常
```

---

**修改完成时间**: 2024-11-27
**修改类型**: 极薄片前端补丁
**影响范围**: 仅 Profile 页面，不触发链上交易
