# 🔧 公钥格式问题

## 问题描述

发布任务时出现错误：
```
Invalid public key length (must be 32 bytes, got 21)
```

**原因：** 用户注册时使用的公钥格式不正确。

**当前公钥：** `0x04099Fb550F7Dc5842621344c5a1678F943eEF3488` (21 字节)

**期望格式：** 32 字节的 NaCl 加密公钥

---

## 根本原因

用户的 `encryptionPubKey` 不是有效的 NaCl 公钥格式。看起来像是以太坊地址（20字节）+ 前缀（1字节）。

正确的 NaCl 公钥应该是 32 字节（64 个十六进制字符）。

---

## 解决方案

### 方案 1：重新注册（推荐）

用户需要重新注册并提供正确的 32 字节加密公钥。

**步骤：**
1. 生成正确的 NaCl 密钥对
2. 重新注册
3. 使用新的公钥

### 方案 2：临时禁用加密（仅用于测试）

为了让你能继续测试其他功能，我们可以暂时禁用联系方式加密。

**修改：** `backend/src/routes/task.ts`

注释掉加密逻辑，直接存储明文：

```typescript
// 临时方案：跳过加密，直接存储明文
const encryptedPayload = contactsPlaintext; // 不加密

// 跳过 DEK 生成和包裹
// const dek = generateDEK();
// const creatorWrappedDEK = wrapDEK(dek, creatorPubKey);

// 存储空的 wrappedDEK
await prisma.contactKey.upsert({
  where: { taskId },
  update: {
    creatorWrappedDEK: '',
    helperWrappedDEK: '',
  },
  create: {
    taskId,
    creatorWrappedDEK: '',
    helperWrappedDEK: '',
  },
});
```

---

## 当前状态

**用户地址：** `0x099Fb550F7Dc5842621344c5a1678F943eEF3488`

**公钥长度：** 21 字节（不正确）

**需要：** 32 字节

---

## 建议

由于这是测试环境，建议：

1. **短期：** 暂时禁用加密，让你能继续测试其他功能
2. **长期：** 修复注册流程，确保生成正确的 32 字节 NaCl 公钥

---

**日期：** 2024-11-25
**状态：** 需要修复
