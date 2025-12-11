# EverEcho A4 Beta 部署指南

**版本**: A4 Beta v1.0  
**更新日期**: 2024-XX-XX  
**目标**: 部署 Beta 可试用版本

---

## 📋 部署概览

### 部署目标

将 EverEcho 部署到 Sepolia 测试网，支持：
- 5-20 人小范围试用
- 完整的错误处理和监控
- 稳定的用户体验
- 反馈收集机制

### 技术栈

- **前端**: React + TypeScript + ethers.js
- **后端**: Node.js + Express + Prisma
- **区块链**: Sepolia 测试网
- **数据库**: SQLite (开发) / PostgreSQL (生产)

---

## 🚀 快速部署

### 前提条件

1. **Node.js 18+**
2. **npm 或 yarn**
3. **Git**
4. **MetaMask 钱包**
5. **Sepolia 测试 ETH**

### 一键部署脚本

```bash
# 克隆仓库
git clone https://github.com/your-org/everecho.git
cd everecho

# 安装依赖
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 配置环境变量
cp .env.example .env
cp frontend/.env.testnet.example frontend/.env
cp backend/.env.testnet.example backend/.env

# 编辑配置文件（见下文）

# 部署合约
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia

# 启动服务
npm run dev
```

---

## 🔧 详细部署步骤

### 步骤 1: 环境准备

#### 1.1 获取 Sepolia 测试 ETH

**推荐水龙头**:
- https://sepoliafaucet.com/ (0.5 ETH/天)
- https://www.alchemy.com/faucets/ethereum-sepolia (0.5 ETH/天)
- https://faucet.quicknode.com/ethereum/sepolia (0.1 ETH/天)

**建议**:
- 准备 2-3 个部署账户
- 每个账户获取 0.5 ETH
- 保留一些 ETH 用于后续操作

#### 1.2 获取 RPC 服务（推荐）

**选项 A: Alchemy（推荐）**
1. 访问 https://www.alchemy.com/
2. 注册并创建应用
3. 选择 Sepolia 网络
4. 复制 HTTPS RPC URL

**选项 B: Infura**
1. 访问 https://infura.io/
2. 注册并创建项目
3. 选择 Sepolia 网络
4. 复制项目 ID

**选项 C: 公共 RPC（免费但不稳定）**
```
https://rpc.sepolia.org
```

---

### 步骤 2: 配置环境变量

#### 2.1 根目录 `.env`

```env
# Sepolia 网络配置
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# 部署账户私钥（从 MetaMask 导出）
PRIVATE_KEY=your_private_key_here

# Etherscan API Key（可选，用于验证合约）
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# 环境标识
NODE_ENV=development
```

**⚠️ 安全提醒**:
- 私钥非常重要，不要泄露
- 不要提交到 Git
- 使用专门的部署账户

#### 2.2 前端 `frontend/.env`

```env
# 后端 API URL
VITE_BACKEND_BASE_URL=http://localhost:3001

# 合约地址（部署后填写）
VITE_EOCHO_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
VITE_REGISTER_ADDRESS=0x0000000000000000000000000000000000000000
VITE_TASK_ESCROW_ADDRESS=0x0000000000000000000000000000000000000000

# 网络配置
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia
VITE_RPC_URL=https://rpc.sepolia.org
VITE_ETHERSCAN_URL=https://sepolia.etherscan.io
```

#### 2.3 后端 `backend/.env`

```env
# 数据库配置
DATABASE_URL="file:./dev.db"

# Sepolia RPC URL
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# 合约地址（部署后填写）
TASK_ESCROW_ADDRESS=0x0000000000000000000000000000000000000000

# 服务器配置
PORT=3001
NODE_ENV=development

# CORS 配置
CORS_ORIGIN=http://localhost:5173

# 日志级别
LOG_LEVEL=info

# 链 ID
CHAIN_ID=11155111
```

---

### 步骤 3: 合约部署

#### 3.1 编译合约

```bash
npx hardhat compile
```

**预期输出**:
```
Compiling 3 files with 0.8.19
Solidity compilation finished successfully
```

#### 3.2 部署到 Sepolia

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

**重要**: 保存这些合约地址！

#### 3.3 验证合约（可选）

```bash
npx hardhat verify --network sepolia <EOCHOToken地址>
npx hardhat verify --network sepolia <Register地址> <EOCHOToken地址>
npx hardhat verify --network sepolia <TaskEscrow地址> <EOCHOToken地址>
```

---

### 步骤 4: 更新配置

#### 4.1 更新前端配置

编辑 `frontend/.env`:

```env
# 使用部署输出的实际地址
VITE_EOCHO_TOKEN_ADDRESS=0xABCD...1234
VITE_REGISTER_ADDRESS=0xEFGH...5678
VITE_TASK_ESCROW_ADDRESS=0xIJKL...9012
```

#### 4.2 更新后端配置

编辑 `backend/.env`:

```env
# 使用部署输出的实际地址
TASK_ESCROW_ADDRESS=0xIJKL...9012
```

---

### 步骤 5: 启动服务

#### 5.1 初始化后端

```bash
cd backend

# 初始化数据库
npx prisma migrate dev
npx prisma generate

# 启动后端服务
npm run dev
```

**预期输出**:
```
🚀 Server running on http://localhost:3001
✅ Database connected
✅ RPC connected to Sepolia
```

#### 5.2 启动前端

```bash
cd frontend

# 启动前端服务
npm run dev
```

**预期输出**:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### 步骤 6: 验证部署

#### 6.1 健康检查

```bash
# 检查后端健康状态
curl http://localhost:3001/healthz

# 预期响应
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 60,
  "checks": {
    "database": "ok",
    "rpc": "ok"
  }
}
```

#### 6.2 前端功能测试

1. **访问应用**
   - 打开 http://localhost:5173
   - 确认页面正常加载

2. **连接钱包**
   - 点击 "Connect Wallet"
   - 连接 MetaMask
   - 确认显示钱包地址

3. **注册测试**
   - 填写注册表单
   - 确认交易
   - 验证获得 100 EOCHO

4. **发布任务测试**
   - 点击 "Publish Task"
   - 填写任务信息
   - 确认交易
   - 验证任务出现在广场

---

## 🔍 故障排除

### 常见问题

#### Q1: 合约部署失败

**错误**: `insufficient funds for intrinsic transaction cost`

**解决**:
1. 检查账户余额
2. 从水龙头获取更多 ETH
3. 降低 Gas Price

#### Q2: 前端连接失败

**错误**: `Failed to fetch`

**解决**:
1. 确认后端服务正在运行
2. 检查 CORS 配置
3. 验证 API URL 正确

#### Q3: 合约调用失败

**错误**: `execution reverted`

**解决**:
1. 检查合约地址配置
2. 确认网络匹配
3. 验证账户权限

#### Q4: 数据库连接失败

**错误**: `Can't reach database server`

**解决**:
1. 检查数据库文件权限
2. 运行 `npx prisma migrate dev`
3. 重新生成 Prisma Client

---

## 📋 部署检查清单

### 部署前
- [ ] 获取足够的测试 ETH
- [ ] 配置所有环境变量
- [ ] 测试 RPC 连接
- [ ] 准备部署账户

### 部署中
- [ ] 合约编译成功
- [ ] 合约部署成功
- [ ] 记录合约地址
- [ ] 更新配置文件

### 部署后
- [ ] 健康检查通过
- [ ] 前端页面正常
- [ ] 钱包连接成功
- [ ] 注册流程正常
- [ ] 任务发布正常

### Beta 准备
- [ ] 准备试用指南
- [ ] 设置反馈渠道
- [ ] 准备支持材料
- [ ] 邀请试用者

---

## 📞 技术支持

### 联系方式

- **技术支持**: dev@everecho.io
- **部署问题**: deploy@everecho.io

### 支持时间

- **工作日**: 9:00-18:00
- **响应时间**: <2 小时

---

**部署完成！准备开始 Beta 试用！** 🎉
