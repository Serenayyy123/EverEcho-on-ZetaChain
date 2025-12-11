# 账号切换测试指南

## 目标
快速切换不同的 MetaMask 账号来测试应用功能。

---

## 方法 1: 在 MetaMask 中直接切换（推荐，最快）

### 优点
- ✅ 最快速
- ✅ 不需要断开连接
- ✅ 自动刷新数据
- ✅ 适合频繁切换

### 步骤

1. **保持应用连接状态**
   - 不需要点击 Disconnect

2. **打开 MetaMask 扩展**
   - 点击浏览器右上角的 MetaMask 图标

3. **点击顶部的账户名称**
   - 会显示账户列表

4. **选择另一个账户**
   - 点击你想切换到的账号

5. **页面自动刷新**
   - 应用会自动检测到账号变化
   - 自动加载新账号的数据

### 示例流程
```
当前账号: Account 1 (0x099F...)
↓
打开 MetaMask → 点击账户名 → 选择 Account 2
↓
页面自动刷新
↓
新账号: Account 2 (0x456A...)
```

---

## 方法 2: 使用 Disconnect + Connect 切换（新功能）

### 优点
- ✅ 可以选择账号
- ✅ 清空旧账号数据
- ✅ 适合测试断开/连接流程

### 步骤

1. **点击 Disconnect 按钮**
   - 清空当前账号数据
   - 显示 "Connect Wallet" 按钮

2. **点击 Connect Wallet 按钮**
   - 会弹出 MetaMask 窗口
   - 显示账号选择器

3. **选择要连接的账号**
   - 可以选择不同的账号
   - 点击 "连接" 或 "Connect"

4. **应用加载新账号数据**
   - 显示新账号的信息

### 示例流程
```
当前账号: Account 1 (0x099F...)
↓
点击 Disconnect
↓
显示 "Connect Wallet" 按钮
↓
点击 Connect Wallet
↓
MetaMask 弹窗 → 选择 Account 2 → 点击连接
↓
新账号: Account 2 (0x456A...)
```

---

## 方法 3: 在 MetaMask 中添加/导入新账号

### 如何添加新账号

#### 选项 A: 创建新账号
1. 打开 MetaMask
2. 点击右上角的账户图标
3. 点击 "创建账户" 或 "Create Account"
4. 输入账号名称
5. 点击 "创建"

#### 选项 B: 导入已有账号
1. 打开 MetaMask
2. 点击右上角的账户图标
3. 点击 "导入账户" 或 "Import Account"
4. 输入私钥
5. 点击 "导入"

### 测试账号私钥（Hardhat 本地测试）
如果你在本地 Hardhat 网络测试，可以使用这些测试账号：

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

⚠️ **警告**: 这些是测试私钥，**永远不要**在主网或测试网上使用！

---

## 测试场景

### 场景 1: 测试注册功能
1. 使用 Account 1 连接
2. 注册并获得 100 EOCHO
3. 切换到 Account 2
4. 验证 Account 2 未注册
5. 注册 Account 2

### 场景 2: 测试任务创建和接受
1. 使用 Account 1（Creator）连接
2. 创建一个任务
3. 切换到 Account 2（Helper）
4. 接受任务
5. 切换回 Account 1
6. 验证任务状态

### 场景 3: 测试余额和转账
1. 使用 Account 1 连接
2. 查看余额
3. 切换到 Account 2
4. 查看余额
5. 验证余额不同

### 场景 4: 测试权限控制
1. 使用 Account 1 创建任务
2. 切换到 Account 2
3. 尝试取消 Account 1 的任务
4. 验证权限错误

---

## 技术实现

### 修改的代码

#### useWallet.ts
```typescript
const connect = async (forceSelect = false) => {
  // ...
  
  // 如果 forceSelect 为 true，弹出账号选择器
  if (forceSelect) {
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
    } catch (permErr) {
      console.log('Permission request cancelled or not supported');
    }
  }
  
  await provider.send('eth_requestAccounts', []);
  // ...
};
```

#### PageLayout.tsx
```typescript
<Button onClick={() => connect(true)}>
  Connect Wallet
</Button>
```

### 工作原理

1. **wallet_requestPermissions**:
   - 请求 MetaMask 权限
   - 弹出账号选择器
   - 用户可以选择不同的账号

2. **eth_requestAccounts**:
   - 获取选中的账号
   - 建立连接

3. **accountsChanged 事件**:
   - 监听账号变化
   - 自动更新应用状态

---

## 常见问题

### Q1: 切换账号后数据没有更新？
**A**: 刷新页面（F5）或等待几秒，数据会自动更新。

### Q2: Connect Wallet 没有弹出账号选择器？
**A**: 
- 确保已经点击了 Disconnect
- 刷新浏览器页面（Ctrl + Shift + R）
- 如果还是不行，在 MetaMask 中手动断开网站连接

### Q3: 如何快速在两个账号之间切换？
**A**: 使用方法 1（在 MetaMask 中直接切换），最快速。

### Q4: 测试账号没有 ETH 怎么办？
**A**: 
- Sepolia 测试网：访问 https://sepoliafaucet.com/ 获取测试 ETH
- Hardhat 本地：测试账号自动有 10000 ETH

### Q5: 切换账号后需要重新注册吗？
**A**: 是的，每个账号都需要单独注册。

---

## 最佳实践

### 测试准备
1. **准备多个测试账号**（至少 3 个）
2. **每个账号都获取一些测试 ETH**
3. **给账号起有意义的名字**（如 "Creator", "Helper", "Admin"）

### 测试流程
1. **使用方法 1 快速切换**进行日常测试
2. **使用方法 2 测试连接流程**
3. **记录每个账号的状态**（已注册、余额、任务等）

### 调试技巧
1. **打开浏览器控制台**（F12）
2. **查看账号变化日志**
3. **使用 React DevTools** 查看状态

---

## 快速测试脚本

### 测试账号切换
1. 连接 Account 1
2. 访问 Profile 页面，记录余额
3. 切换到 Account 2（使用方法 1）
4. 验证余额不同
5. 切换回 Account 1
6. 验证余额恢复

### 测试 Disconnect + Connect
1. 连接 Account 1
2. 点击 Disconnect
3. 点击 Connect Wallet
4. 在弹窗中选择 Account 2
5. 验证连接到 Account 2

---

## 总结

### 推荐方法
- **日常测试**: 使用方法 1（MetaMask 直接切换）
- **测试连接流程**: 使用方法 2（Disconnect + Connect）
- **添加新账号**: 使用方法 3（创建/导入账号）

### 关键改进
✅ Connect Wallet 按钮现在会弹出账号选择器  
✅ 可以在 Disconnect 后选择不同账号连接  
✅ 支持快速切换账号进行测试

---

**最后更新**: 2024-11-24  
**相关文件**:
- `frontend/src/hooks/useWallet.ts`
- `frontend/src/components/layout/PageLayout.tsx`
