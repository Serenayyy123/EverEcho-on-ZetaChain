# EverEcho 快速开始（3 步跑通测试网演示）

**版本**: Beta v1.0  
**目标**: 3 步内在本地跑通 Sepolia 测试网演示  
**时间**: 10-15 分钟

---

## 前提条件

- Node.js 18+
- MetaMask 浏览器插件
- Sepolia 测试 ETH（从水龙头获取）

---

## 步骤 1: 克隆并安装（3 分钟）

```bash
# 克隆仓库
git clone https://github.com/your-org/everecho.git
cd everecho

# 安装所有依赖（根目录 + 前端 + 后端）
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

---

## 步骤 2: 配置环境变量（5 分钟）

### 2.1 复制示例配置

```bash
# 根目录
cp .env.example .env

# 前端
cp frontend/.env.testnet.example frontend/.env

# 后端
cp backend/.env.testnet.example backend/.env
```

### 2.2 编辑配置文件

**根目录 `.env`**:
```env
# Sepolia RPC URL（使用公共 RPC 或 Alchemy）
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# 部署账户私钥（从 MetaMask 导出）
PRIVATE_KEY=your_private_key_here

# 可选：Etherscan API Key
ETHERSCAN_API_KEY=your_api_key_here
```

**前端 `frontend/.env`**:
```env
# 后端 API URL
VITE_BACKEND_BASE_URL=http://localhost:3001

# 合约地址（部署后填写，或使用已部署的地址）
VITE_EOCHO_TOKEN_ADDRESS=0x...
VITE_REGISTER_ADDRESS=0x...
VITE_TASK_ESCROW_ADDRESS=0x...

# 网络配置
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia
VITE_RPC_URL=https://rpc.sepolia.org
VITE_ETHERSCAN_URL=https://sepolia.etherscan.io
```

**后端 `backend/.env`**:
```env
# 数据库（开发环境使用 SQLite）
DATABASE_URL="file:./dev.db"

# Sepolia RPC URL
RPC_URL=https://rpc.sepolia.org

# 合约地址（部署后填写）
TASK_ESCROW_ADDRESS=0x...

# 服务器配置
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
CHAIN_ID=11155111
```

### 2.3 获取 Sepolia 测试 ETH

1. 访问水龙头：https://sepoliafaucet.com/
2. 粘贴你的钱包地址
3. 获取 0.5 ETH（用于部署和测试）

---

## 步骤 3: 部署合约并启动服务（5 分钟）

### 3.1 部署合约到 Sepolia

```bash
# 编译合约
npx hardhat compile

# 部署到 Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
```

**输出示例**:
```
EOCHOToken deployed to: 0xABCD...1234
Register deployed to: 0xEFGH...5678
TaskEscrow deployed to: 0xIJKL...9012
```

**重要**: 复制这些合约地址！

### 3.2 更新配置文件

将部署输出的合约地址填入：
- `frontend/.env` 的 `VITE_*_ADDRESS` 字段
- `backend/.env` 的 `TASK_ESCROW_ADDRESS` 字段

### 3.3 启动服务

**方式 A: 使用启动脚本（推荐）**

Windows:
```powershell
.\start-dev.ps1
```

Linux/Mac:
```bash
./start-dev.sh
```

**方式 B: 手动启动**

终端 1 - 后端:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run dev
```

终端 2 - 前端:
```bash
cd frontend
npm run dev
```

### 3.4 验证运行

1. **后端健康检查**:
   ```bash
   curl http://localhost:3001/healthz
   ```
   
   预期响应:
   ```json
   {
     "status": "ok",
     "checks": {
       "database": "ok",
       "rpc": "ok"
     }
   }
   ```

2. **前端访问**:
   - 打开浏览器访问 http://localhost:5173
   - 应该看到 EverEcho 首页

---

## 快速测试（5 分钟）

### 1. 连接钱包
- 点击 "Connect Wallet"
- 在 MetaMask 中确认连接
- 确认显示钱包地址

### 2. 注册用户
- 填写昵称、城市、技能
- 点击 "Register"
- 确认交易
- 等待确认（约 15-30 秒）
- 查看余额：应该显示 100 EOCHO（如果 CAP 未满）

### 3. 发布任务
- 点击 "Publish Task"
- 填写任务信息（标题、描述、奖励、联系方式）
- 点击 "Publish Task"
- 确认交易
- 等待确认
- 任务应该出现在任务广场

---

## 常见问题

### Q1: 合约部署失败

**错误**: `insufficient funds for intrinsic transaction cost`

**解决**:
1. 确认账户有足够的 Sepolia ETH
2. 从水龙头获取更多 ETH
3. 检查 RPC URL 是否正确

### Q2: 前端连接失败

**错误**: `Failed to fetch`

**解决**:
1. 确认后端服务正在运行（http://localhost:3001/healthz）
2. 检查 CORS 配置
3. 确认 `VITE_BACKEND_BASE_URL` 正确

### Q3: MetaMask 连接失败

**解决**:
1. 确认 MetaMask 已安装
2. 切换到 Sepolia 网络
3. 刷新页面重试

### Q4: 合约地址配置错误

**解决**:
1. 检查 `frontend/.env` 中的合约地址
2. 检查 `backend/.env` 中的合约地址
3. 确认地址与部署输出一致
4. 重启前端和后端服务

---

## 下一步

### 完整试用

参考 `docs/A4_BETA_GUIDE.md` 完成三条完整旅程：
1. 新用户注册
2. 任务主流程（Create → Accept → Submit → Confirm）
3. 异常处理（Fix / Terminate）

### 部署到生产

参考 `docs/A4_DEPLOYMENT.md` 了解生产环境部署步骤。

### 问题反馈

参考 `docs/A4_TRIAL_ISSUES.md` 提交问题和建议。

---

## 停止服务

**使用停止脚本**:

Windows:
```powershell
.\stop-dev.ps1
```

Linux/Mac:
```bash
./stop-dev.sh
```

**手动停止**:
- 在各个终端按 `Ctrl+C`

---

**完成！现在你可以开始使用 EverEcho 了！** 🎉

---

**版本历史**:
- v1.0 (2024-XX-XX): 初始版本
