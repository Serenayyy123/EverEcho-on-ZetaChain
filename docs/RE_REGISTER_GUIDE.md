# 🔄 重新注册指南

## 问题

当前账户的加密公钥格式不正确（21字节，需要32字节），导致无法发布任务。

---

## 解决方案

已修复注册流程，现在会生成正确的 32 字节 NaCl 公钥。

---

## 重新注册步骤

### 步骤 1：刷新浏览器
按 `F5` 刷新页面，加载新的注册代码

### 步骤 2：访问注册页面
打开：http://localhost:5173/register

### 步骤 3：填写注册信息
1. **Nickname**: 输入昵称（如 "Serena"）
2. **City**: 输入城市（如 "Shanghai"）
3. **Skills**: 选择至少一个技能

### 步骤 4：提交注册
1. 点击 "Register" 按钮
2. MetaMask 弹出交易请求
3. 确认交易
4. 等待交易确认

### 步骤 5：验证注册成功
- 应该看到成功提示
- 自动跳转到 Task Square
- 获得 EOCHO 代币（如果未达到 CAP）

---

## 新的公钥生成逻辑

**修改文件：** `frontend/src/pages/Register.tsx`

**新逻辑：**
```typescript
// 生成 NaCl 加密密钥对（32 字节公钥）
const keyPair = nacl.box.keyPair();
const encryptionPubKey = '0x' + Buffer.from(keyPair.publicKey).toString('hex');

// 保存私钥到 localStorage
const privateKeyHex = Buffer.from(keyPair.secretKey).toString('hex');
localStorage.setItem(`encryptionPrivateKey_${address}`, privateKeyHex);
```

**公钥格式：**
- 长度：32 字节（64 个十六进制字符）
- 格式：`0x` + 64 个十六进制字符
- 示例：`0x1234...abcd`（共 66 个字符）

---

## 重新注册后

### 1. 设置联系方式
1. 打开 Profile 页面
2. 点击 "Edit Profile"
3. 添加联系方式（如 @serena_369y）
4. 保存

### 2. 发布任务
1. 打开 PublishTask 页面
2. 填写任务信息
3. 确认看到联系方式预览
4. 点击 "Publish Task"
5. ✅ 应该成功发布

---

## 注意事项

### 私钥存储
当前实现将私钥存储在 localStorage 中，这仅用于演示。

**存储位置：** `localStorage.encryptionPrivateKey_{address}`

**安全提示：**
- 这是临时方案
- 生产环境应使用更安全的方式（如硬件钱包、加密存储等）
- 不要在生产环境中使用 localStorage 存储私钥

### 旧账户数据
重新注册后：
- 旧的 Profile 数据会被覆盖
- 旧的公钥将被新公钥替换
- 之前的任务不受影响（如果有）

---

## 验证公钥格式

注册成功后，可以在浏览器控制台看到：

```
[Register] Generated encryption key pair
  Public key: 0x1234...abcd
  Public key length: 32 bytes
```

确认公钥长度是 32 字节。

---

## 测试完整流程

重新注册后，测试完整的联系方式流程：

1. ✅ 注册成功
2. ✅ 设置联系方式
3. ✅ 发布任务（联系方式加密）
4. ✅ Helper 接受任务
5. ✅ Helper 查看联系方式（解密）
6. ✅ 点击 Telegram 链接

---

**状态：** ✅ 已修复
**日期：** 2024-11-25
