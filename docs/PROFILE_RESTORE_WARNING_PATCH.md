# Profile Restore Warning UI Patch

## 🎯 目标
为历史用户（缺少 encryptionPubKey 或占位昵称）在 Profile 页面显示警告卡 + Re-register 按钮。

---

## ✅ 修改完成

### 修改的文件
**文件**: `frontend/src/pages/Profile.tsx`
**行号**: 241-270（插入在 Profile Header 之前）

### 修改内容

**插入位置**: 在 `{!profileLoading && !profileError && profile && (` 分支内，Profile Header 上方

**新增代码**:
```tsx
{/* Historical User Warning */}
{(() => {
  const needsRestore =
    profile &&
    (
      !profile.encryptionPubKey ||
      profile.encryptionPubKey.trim() === '' ||
      profile.nickname.includes('(synced from chain)')
    );
  
  return needsRestore && (
    <div style={{ marginBottom: '24px' }}>
      <Alert variant="warning" title="Profile incomplete (historical user)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0 }}>
            Your profile was synced from an old on-chain record. The historical profileURI is unreachable,
            so your encryption key and off-chain details were not recovered.
          </p>
          <p style={{ margin: 0 }}>
            Impact: ContactKey sync will fail for tasks created by this address, and Helpers may not see your contacts.
          </p>
          <p style={{ margin: 0 }}>
            Fix: Re-register once to regenerate your encryption key and upload a full profile to staging.
          </p>
          <div style={{ marginTop: 8 }}>
            <Button variant="primary" onClick={() => navigate('/register')}>
              Restore profile (Re-register)
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
})()}
```

---

## 📋 判定逻辑

### 历史用户判定条件（任一满足即显示警告）:
1. `!profile.encryptionPubKey` - 没有加密公钥
2. `profile.encryptionPubKey.trim() === ''` - 加密公钥为空字符串
3. `profile.nickname.includes('(synced from chain)')` - 昵称包含占位符标记

### 正常用户:
- 有完整的 encryptionPubKey
- 昵称不包含 "(synced from chain)"
- **不会显示警告卡**

---

## 🖼️ UI 效果

### 历史用户看到的警告卡:
```
⚠️ Profile incomplete (historical user)

Your profile was synced from an old on-chain record. The historical 
profileURI is unreachable, so your encryption key and off-chain details 
were not recovered.

Impact: ContactKey sync will fail for tasks created by this address, 
and Helpers may not see your contacts.

Fix: Re-register once to regenerate your encryption key and upload a 
full profile to staging.

[Restore profile (Re-register)]  ← 蓝色按钮
```

### 点击按钮:
- 跳转到 `/register` 页面
- 用户可以重新注册，生成新的 encryptionPubKey
- 上传完整的 profile 数据

---

## ✅ 验收标准

### 1. ✅ 历史用户能看到警告
**测试用户**: 
- encryptionPubKey 为空的用户
- nickname 包含 "(synced from chain)" 的用户

**预期**: 在 Profile 页面顶部看到黄色警告卡

### 2. ✅ 正常用户不显示警告
**测试用户**:
- 有完整 encryptionPubKey 的用户
- 正常注册的用户

**预期**: 不显示警告卡，直接显示 Profile Header

### 3. ✅ 按钮功能正常
**操作**: 点击 "Restore profile (Re-register)" 按钮

**预期**: 跳转到 `/register` 页面

### 4. ✅ 不影响现有功能
**验证**:
- Profile 显示逻辑不变
- 编辑功能不变
- 任务历史不变
- 统计数据不变

---

## 🔒 保护措施

### ✅ 只改一个文件
- 只修改 `frontend/src/pages/Profile.tsx`
- 不改 hooks、不改 Register 流程、不改合约、不改 backend

### ✅ 不改变成功路径
- 正常用户完全不受影响
- 历史用户只是多了一个警告提示
- 所有现有功能保持不变

### ✅ 复用现有组件
- 使用现有的 `Alert` 组件
- 使用现有的 `Button` 组件
- 使用现有的 `navigate` 函数

### ✅ 最小判断逻辑
- 只检查 3 个条件
- 使用 IIFE 避免污染组件状态
- 不需要额外的 state 或 effect

---

## 📊 影响范围

### 修改的文件: 1
- `frontend/src/pages/Profile.tsx`

### 新增代码行数: ~30 行
- 判定逻辑: 8 行
- UI 渲染: 22 行

### 依赖的组件: 3
- `Alert` (已存在)
- `Button` (已存在)
- `navigate` (已存在)

---

## 🎯 使用场景

### Staging 环境
- 历史用户从链上同步，但 profileURI 不可用
- encryptionPubKey 为空，导致 ContactKey 同步失败
- 显示警告，引导用户重新注册

### Production 环境
- 如果有类似的历史数据迁移
- 同样会显示警告，引导用户更新 profile

---

**修改完成时间**: 2024-11-27
**修改类型**: 极薄片 UI 补丁
**影响范围**: 仅 Profile 页面 UI，不影响任何业务逻辑
