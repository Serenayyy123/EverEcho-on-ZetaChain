# RPC 连接故障排查指南

## 错误信息

```
MetaMask - RPC Error: Failed to fetch
Failed to check registration: Error: missing revert data
```

## 问题原因

这个错误表明 MetaMask 无法连接到 Sepolia 测试网的 RPC 节点。可能的原因：

1. **RPC 节点宕机或过载**
2. **网络连接问题**
3. **MetaMask 配置错误**
4. **防火墙或代理阻止连接**

---

## 解决方案

### 方案 1: 切换 Sepolia RPC 端点（推荐）

#### 步骤 1: 打开 MetaMask 设置
1. 点击 MetaMask 扩展图标
2. 点击顶部的网络名称（应该显示 "Sepolia"）
3. 点击 "设置" 或 "Settings"

#### 步骤 2: 编辑 Sepolia 网络
1. 找到 "Sepolia test network"
2. 点击右侧的 "编辑" 或 "Edit"

#### 步骤 3: 更换 RPC URL
尝试以下 RPC 端点（按推荐顺序）：

**选项 1: Alchemy（推荐，最稳定）**
```
https://eth-sepolia.g.alchemy.com/v2/demo
```

**选项 2: Infura**
```
https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
```

**选项 3: 公共 RPC**
```
https://rpc.sepolia.org
```

**选项 4: Chainstack**
```
https://ethereum-sepolia.publicnode.com
```

#### 步骤 4: 保存并测试
1. 点击 "保存" 或 "Save"
2. 刷新浏览器页面
3. 重新连接钱包

---

### 方案 2: 重新添加 Sepolia 网络

如果切换 RPC 端点无效，尝试删除并重新添加 Sepolia 网络：

#### 步骤 1: 删除现有网络
1. MetaMask → 设置 → 网络
2. 找到 "Sepolia test network"
3. 点击 "删除" 或 "Delete"

#### 步骤 2: 添加新网络
1. 点击 "添加网络" 或 "Add Network"
2. 点击 "手动添加网络" 或 "Add a network manually"
3. 填入以下信息：

```
网络名称: Sepolia
RPC URL: https://eth-sepolia.g.alchemy.com/v2/demo
链 ID: 11155111
货币符号: ETH
区块浏览器 URL: https://sepolia.etherscan.io
```

#### 步骤 3: 保存并切换
1. 点击 "保存"
2. 切换到新添加的 Sepolia 网络
3. 刷新浏览器页面

---

### 方案 3: 检查网络连接

#### 测试 RPC 连接
在浏览器控制台运行以下命令测试 RPC 连接：

```javascript
fetch('https://rpc.sepolia.org', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

如果返回错误，说明网络连接有问题。

#### 检查防火墙/代理
1. 检查是否有防火墙阻止 HTTPS 连接
2. 如果使用代理，尝试禁用代理
3. 如果在公司网络，可能需要联系 IT 部门

---

### 方案 4: 使用本地 Hardhat 网络（开发环境）

如果 Sepolia 连接持续失败，可以切换到本地 Hardhat 网络进行开发：

#### 步骤 1: 启动本地节点
```bash
# 在项目根目录
npx hardhat node
```

#### 步骤 2: 部署合约到本地
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

#### 步骤 3: 在 MetaMask 中添加本地网络
```
网络名称: Hardhat Local
RPC URL: http://127.0.0.1:8545
链 ID: 31337
货币符号: ETH
```

#### 步骤 4: 导入测试账户
Hardhat 会提供测试账户和私钥，导入到 MetaMask 中。

---

## 应用层面的改进

我已经在 `useWallet.ts` 中添加了错误处理，现在即使 RPC 连接失败，应用也不会完全阻塞：

```typescript
// 如果 RPC 失败，设置错误提示但允许用户继续使用
if (err.message.includes('Failed to fetch')) {
  setError('Network connection failed. Please check your RPC endpoint.');
  setIsRegistered(false);
  setBalance('0');
}
```

这意味着：
- ✅ 应用不会崩溃
- ✅ 用户会看到错误提示
- ✅ 用户可以尝试重新连接或切换网络

---

## 验证修复

### 测试 1: 检查 RPC 连接
1. 打开浏览器开发者工具（F12）
2. 切换到 "Network" 标签
3. 刷新页面
4. 查找对 RPC 端点的请求
5. 检查是否返回 200 状态码

### 测试 2: 检查合约调用
1. 打开浏览器控制台
2. 运行以下命令：
```javascript
// 检查 Register 合约
fetch('https://sepolia.etherscan.io/api?module=contract&action=getabi&address=0x26885C22c665ec1C713d49376d432Af618A18afb')
  .then(r => r.json())
  .then(d => console.log('Contract exists:', d.status === '1'))
```

### 测试 3: 重新连接钱包
1. 在应用中点击 "Disconnect"
2. 点击 "Connect Wallet"
3. 检查控制台是否还有 "Failed to fetch" 错误

---

## 常见问题

### Q: 为什么会出现 "missing revert data" 错误？
A: 这通常表示合约调用失败，但没有返回具体的错误信息。可能原因：
- RPC 节点连接失败
- 合约地址不存在
- 网络 ID 不匹配

### Q: 如何确认合约是否部署成功？
A: 访问 Sepolia Etherscan 检查合约地址：
```
https://sepolia.etherscan.io/address/0x26885C22c665ec1C713d49376d432Af618A18afb
```

### Q: 可以使用其他测试网吗？
A: 目前应用只支持 Sepolia 和 Hardhat Local。如果需要支持其他网络，需要：
1. 部署合约到目标网络
2. 更新 `frontend/src/contracts/addresses.ts`
3. 更新 `SUPPORTED_CHAIN_IDS`

---

## 获取帮助

如果以上方案都无法解决问题，请提供以下信息：

1. **MetaMask 版本**
2. **当前使用的 RPC URL**
3. **浏览器控制台的完整错误信息**
4. **Network 标签中的请求详情**
5. **是否可以访问 https://sepolia.etherscan.io**

---

**最后更新**: 2024-11-24  
**相关文档**: 
- `frontend/.env` - 前端环境变量配置
- `deployment.json` - 合约部署记录
- `frontend/src/contracts/addresses.ts` - 合约地址配置
