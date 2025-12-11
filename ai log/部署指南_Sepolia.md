# EverEcho 合约部署指南 - Sepolia 测试网

## 📋 准备工作

### 1. 获取 Sepolia 测试网 ETH

访问以下水龙头获取测试 ETH：
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

每次可获得 0.5 ETH（测试网），足够部署合约。

### 2. 获取 RPC URL（可选，使用免费的也可以）

**选项 A：使用公共 RPC（免费）**
```
https://rpc.sepolia.org
```

**选项 B：使用 Alchemy（推荐，更稳定）**
1. 访问 https://www.alchemy.com/
2. 注册账号
3. 创建新应用（选择 Sepolia 网络）
4. 复制 RPC URL

**选项 C：使用 Infura**
1. 访问 https://infura.io/
2. 注册账号
3. 创建新项目
4. 复制 Sepolia RPC URL

### 3. 获取 Etherscan API Key（可选，用于验证合约）

1. 访问 https://etherscan.io/
2. 注册账号
3. 进入 API Keys 页面
4. 创建新的 API Key

---

## 🔧 配置步骤

### 步骤 1：安装依赖

```bash
npm install
```

### 步骤 2：配置环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Sepolia RPC URL
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# 你的钱包私钥（从 MetaMask 导出）
PRIVATE_KEY=your_private_key_here

# Etherscan API Key（可选）
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 步骤 3：导出 MetaMask 私钥

⚠️ **警告：私钥非常重要，不要泄露！**

1. 打开 MetaMask
2. 点击右上角三个点 → 账户详情
3. 点击 "导出私钥"
4. 输入密码
5. 复制私钥（不含 0x 前缀）
6. 粘贴到 `.env` 文件中

---

## 🚀 部署合约

### 编译合约

```bash
npx hardhat compile
```

### 部署到 Sepolia

```bash
npm run deploy:sepolia
```

或者：

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

---

## 📊 部署输出示例

```
==================================================
EverEcho 合约部署
==================================================

部署账户: 0x1234...5678
账户余额: 0.5 ETH

[1/3] 部署 EOCHOToken...
✓ EOCHOToken 部署成功: 0xabcd...1234

[2/3] 部署 Register...
✓ Register 部署成功: 0xefgh...5678

[3/3] 配置 EOCHOToken...
✓ EOCHOToken 配置完成

[4/4] 部署 TaskEscrow...
✓ TaskEscrow 部署成功: 0xijkl...9012

==================================================
部署完成！
==================================================

合约地址：
--------------------------------------------------
EOCHOToken:   0xabcd...1234
Register:     0xefgh...5678
TaskEscrow:   0xijkl...9012

前端配置（frontend/.env）：
--------------------------------------------------
VITE_EOCHO_TOKEN_ADDRESS=0xabcd...1234
VITE_REGISTER_ADDRESS=0xefgh...5678
VITE_TASK_ESCROW_ADDRESS=0xijkl...9012
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia
```

---

## 🔄 配置前端和后端

### 前端配置

编辑 `frontend/.env`：

```env
VITE_API_URL=http://localhost:3000
VITE_EOCHO_TOKEN_ADDRESS=0xabcd...1234
VITE_REGISTER_ADDRESS=0xefgh...5678
VITE_TASK_ESCROW_ADDRESS=0xijkl...9012
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia
```

### 后端配置

编辑 `backend/.env`：

```env
RPC_URL=https://rpc.sepolia.org
TASK_ESCROW_ADDRESS=0xijkl...9012
```

---

## 🦊 配置 MetaMask

### 添加 Sepolia 网络

1. 打开 MetaMask
2. 点击网络下拉菜单
3. 点击 "添加网络"
4. 选择 "Sepolia 测试网络"

或手动添加：
- 网络名称：Sepolia
- RPC URL：https://rpc.sepolia.org
- 链 ID：11155111
- 货币符号：ETH
- 区块浏览器：https://sepolia.etherscan.io

---

## ✅ 验证部署

### 1. 在 Etherscan 上查看

访问：`https://sepolia.etherscan.io/address/[合约地址]`

### 2. 验证合约代码（可选）

```bash
npx hardhat verify --network sepolia [EOCHOToken地址]
npx hardhat verify --network sepolia [Register地址] [EOCHOToken地址]
npx hardhat verify --network sepolia [TaskEscrow地址] [EOCHOToken地址]
```

### 3. 测试注册功能

1. 访问 `http://localhost:5173`
2. 连接 MetaMask（确保在 Sepolia 网络）
3. 点击 "Connect Wallet"
4. 填写注册表单
5. 确认交易
6. 等待确认（约 15-30 秒）
7. 检查钱包余额，应该收到 100 EOCHO

---

## 🔍 常见问题

### Q1: 部署失败 - insufficient funds

**原因**：账户余额不足

**解决**：从水龙头获取更多测试 ETH

### Q2: 部署失败 - nonce too low

**原因**：交易 nonce 冲突

**解决**：
```bash
# 清除 Hardhat 缓存
npx hardhat clean

# 重新部署
npm run deploy:sepolia
```

### Q3: MetaMask 交易失败

**原因**：Gas 费用估算错误或网络拥堵

**解决**：
1. 增加 Gas Limit
2. 等待网络不拥堵时重试
3. 重置 MetaMask 账户（设置 → 高级 → 重置账户）

### Q4: 合约验证失败

**原因**：Etherscan API Key 无效或合约代码不匹配

**解决**：
1. 检查 API Key 是否正确
2. 确保使用相同的编译器版本
3. 等待几分钟后重试

---

## 📝 部署检查清单

- [ ] 获取 Sepolia 测试 ETH
- [ ] 配置 `.env` 文件
- [ ] 编译合约成功
- [ ] 部署合约成功
- [ ] 配置前端 `.env`
- [ ] 配置后端 `.env`
- [ ] MetaMask 连接到 Sepolia
- [ ] 测试注册功能
- [ ] 验证收到 100 EOCHO

---

## 🎉 部署成功后

1. 保存 `deployment.json` 文件（包含所有合约地址）
2. 在 Sepolia Etherscan 上验证合约
3. 测试完整的注册流程
4. 开始开发后续功能

---

## 📚 相关链接

- Sepolia Etherscan: https://sepolia.etherscan.io
- Sepolia 水龙头: https://sepoliafaucet.com
- Alchemy: https://www.alchemy.com
- Infura: https://infura.io
- Hardhat 文档: https://hardhat.org/docs
