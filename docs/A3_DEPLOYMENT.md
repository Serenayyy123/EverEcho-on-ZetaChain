# A3 测试网部署指南

**目标**: 将 EverEcho MVP 部署到 Sepolia 测试网，供演示和试用

**约束**: 不改变任何合约/后端/前端语义，只做配置和部署

---

## 📋 部署前准备

### 1. 获取 Sepolia 测试 ETH

访问以下水龙头（每个地址可获得 0.5 ETH）：
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

**建议**: 准备 2-3 个账户，每个账户获取 0.5 ETH，用于部署和测试。

### 2. 获取 RPC URL（可选）

**选项 A: 使用公共 RPC（免费）**
```
https://rpc.sepolia.org
```

**选项 B: 使用 Alchemy（推荐）**
1. 访问 https://www.alchemy.com/
2. 注册并创建应用（选择 Sepolia）
3. 复制 HTTPS RPC URL

### 3. 获取 Etherscan API Key（可选）

用于验证合约代码：
1. 访问 https://etherscan.io/
2. 注册并创建 API Key
3. 复制 API Key

---

## 🔧 部署步骤

### 步骤 1: 配置环境变量

创建根目录 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env`:

```env
# Sepolia RPC URL
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# 部署账户私钥（从 MetaMask 导出）
PRIVATE_KEY=your_private_key_here

# Etherscan API Key（可选，用于验证合约）
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**⚠️ 警告**: 私钥非常重要，不要泄露！不要提交到 Git！

### 步骤 2: 编译合约

```bash
npm install
npx hardhat compile
```

### 步骤 3: 部署合约

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

**预期输出**:
```
==================================================
EverEcho 合约部署到 Sepolia
==================================================

部署账户: 0x1234...5678
账户余额: 0.5 ETH

[1/3] 部署 EOCHOToken...
✓ EOCHOToken 部署成功: 0xABCD...1234

[2/3] 部署 Register...
✓ Register 部署成功: 0xEFGH...5678

[3/3] 部署 TaskEscrow...
✓ TaskEscrow 部署成功: 0xIJKL...9012

==================================================
部署完成！
==================================================

合约地址：
EOCHOToken:   0xABCD...1234
Register:     0xEFGH...5678
TaskEscrow:   0xIJKL...9012

Sepolia Etherscan:
https://sepolia.etherscan.io/address/0xABCD...1234
https://sepolia.etherscan.io/address/0xEFGH...5678
https://sepolia.etherscan.io/address/0xIJKL...9012
```

**重要**: 保存这些合约地址，后续配置需要使用！

### 步骤 4: 验证合约（可选）

```bash
npx hardhat verify --network sepolia <EOCHOToken地址>
npx hardhat verify --network sepolia <Register地址> <EOCHOToken地址>
npx hardhat verify --network sepolia <TaskEscrow地址> <EOCHOToken地址>
```

---

## 🎨 配置前端

### 步骤 1: 创建前端环境变量

创建 `frontend/.env`:

```env
# 后端 API URL
VITE_BACKEND_BASE_URL=http://localhost:3001

# 合约地址（从部署输出复制）
VITE_EOCHO_TOKEN_ADDRESS=0xABCD...1234
VITE_REGISTER_ADDRESS=0xEFGH...5678
VITE_TASK_ESCROW_ADDRESS=0xIJKL...9012

# 网络配置
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia
```

### 步骤 2: 更新 addresses.ts

编辑 `frontend/src/contracts/addresses.ts`，更新 Sepolia 地址：

```typescript
const SEPOLIA_ADDRESSES: ContractAddresses = {
  echoToken: '0xABCD...1234',  // 替换为实际地址
  register: '0xEFGH...5678',    // 替换为实际地址
  taskEscrow: '0xIJKL...9012',  // 替换为实际地址
};
```

### 步骤 3: 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问: http://localhost:5173

---

## 🔙 配置后端

### 步骤 1: 创建后端环境变量

创建 `backend/.env`:

```env
# 数据库
DATABASE_URL="file:./dev.db"

# Sepolia RPC
RPC_URL=https://rpc.sepolia.org

# 合约地址
TASK_ESCROW_ADDRESS=0xIJKL...9012

# 服务器配置
PORT=3001
```

### 步骤 2: 初始化数据库

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma generate
```

### 步骤 3: 启动后端

```bash
npm run dev
```

后端运行在: http://localhost:3001

---

## 🦊 配置 MetaMask

### 添加 Sepolia 网络

1. 打开 MetaMask
2. 点击网络下拉菜单
3. 点击 "添加网络"
4. 选择 "Sepolia 测试网络"

或手动添加：
- **网络名称**: Sepolia
- **RPC URL**: https://rpc.sepolia.org
- **链 ID**: 11155111
- **货币符号**: ETH
- **区块浏览器**: https://sepolia.etherscan.io

### 导入测试账户

如果需要使用特定测试账户：
1. 点击 MetaMask 右上角
2. 选择 "导入账户"
3. 粘贴私钥
4. 确认导入

---

## ✅ 验证部署

### 1. 测试钱包连接

1. 访问 http://localhost:5173
2. 点击 "Connect Wallet"
3. 选择 MetaMask
4. 确认连接
5. 确认显示正确的地址和网络（Sepolia）

### 2. 测试注册流程

1. 点击 "Register"
2. 填写表单：
   - Nickname: TestUser
   - City: Beijing
   - Skills: 选择 2-3 个
3. 点击 "Register"
4. 确认 MetaMask 交易
5. 等待确认（约 15-30 秒）
6. 验证：
   - 显示 "Minted 100 EOCHO"
   - 跳转到 TaskSquare
   - 余额显示 100 EOCHO

### 3. 测试发布任务

1. 点击 "Publish Task"
2. 填写表单：
   - Title: Test Task
   - Description: This is a test task
   - Reward: 10
   - Contacts: test@example.com
3. 点击 "Publish Task"
4. 确认交易
5. 验证任务出现在 TaskSquare

---

## 📊 部署信息表

### 合约地址

| 合约 | 地址 | Etherscan |
|------|------|-----------|
| EOCHOToken | `0xABCD...1234` | [查看](https://sepolia.etherscan.io/address/0xABCD...1234) |
| Register | `0xEFGH...5678` | [查看](https://sepolia.etherscan.io/address/0xEFGH...5678) |
| TaskEscrow | `0xIJKL...9012` | [查看](https://sepolia.etherscan.io/address/0xIJKL...9012) |

### 网络信息

| 项目 | 值 |
|------|-----|
| 网络名称 | Sepolia |
| Chain ID | 11155111 |
| RPC URL | https://rpc.sepolia.org |
| 区块浏览器 | https://sepolia.etherscan.io |
| 水龙头 | https://sepoliafaucet.com |

### 服务地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5173 |
| 后端 | http://localhost:3001 |
| 后端 API | http://localhost:3001/api |

---

## 🔍 常见问题

### Q1: 部署失败 - insufficient funds

**原因**: 账户余额不足

**解决**: 从水龙头获取更多测试 ETH

### Q2: 前端连接失败

**原因**: 合约地址配置错误或后端未启动

**解决**:
1. 检查 `frontend/.env` 中的合约地址
2. 确认后端正在运行
3. 检查浏览器控制台错误

### Q3: 交易失败 - wrong network

**原因**: MetaMask 未切换到 Sepolia

**解决**: 在 MetaMask 中切换到 Sepolia 网络

### Q4: 注册后未收到 EOCHO

**原因**: CAP 已满或交易未确认

**解决**:
1. 等待交易确认（15-30 秒）
2. 检查是否显示 "CAP reached" 提示
3. 在 Etherscan 上查看交易状态

---

## 📝 部署检查清单

- [ ] 获取 Sepolia 测试 ETH
- [ ] 配置根目录 `.env`
- [ ] 编译合约成功
- [ ] 部署合约成功
- [ ] 保存合约地址
- [ ] 配置前端 `.env`
- [ ] 更新 `addresses.ts`
- [ ] 配置后端 `.env`
- [ ] 启动前端服务
- [ ] 启动后端服务
- [ ] MetaMask 连接到 Sepolia
- [ ] 测试注册流程成功
- [ ] 测试发布任务成功

---

## 🎉 部署成功！

现在可以开始演示和试用了！

**下一步**: 查看 `A3_DEMO_GUIDE.md` 了解如何演示三条必跑旅程。
