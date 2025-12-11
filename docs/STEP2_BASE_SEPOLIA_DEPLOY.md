# Step 2: Base Sepolia 部署指南

## 📋 变更说明

### Token 名称变更（唯一的业务变更）
- **ERC20 name**: `"EverEcho Token"` → `"ECHO Token"`
- **ERC20 symbol**: `"EOCHO"` → `"ECHO"`
- **合约名称**: `EOCHOToken` **保持不变**（避免破坏导入）

### 为什么不影响冻结点
- `name()` 和 `symbol()` 是 ERC20 纯展示函数
- 不影响任何权限、资金流、状态机、事件
- 所有变量名（`echoToken`）保持不变
- 所有函数名、事件名、字段名完全不变

---

## 🚀 部署步骤

### 前置条件

1. **获取 Base Sepolia 测试 ETH**
   - 访问：https://www.alchemy.com/faucets/base-sepolia
   - 输入钱包地址
   - 获取测试 ETH（足够部署 3 个合约）

2. **配置环境变量**

编辑根目录 `.env` 文件：

```env
# Base Sepolia RPC URL
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# 部署账户私钥（从 MetaMask 导出）
PRIVATE_KEY=你的私钥

# Basescan API Key（用于验证合约，可选）
BASESCAN_API_KEY=你的Basescan_API_Key
```

---

### 步骤 1: 编译合约

```bash
npx hardhat compile
```

**预期输出**:
```
Compiled 3 Solidity files successfully
```

---

### 步骤 2: 部署到 Base Sepolia

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**预期输出**:
```
==================================================
EverEcho 合约部署
==================================================

部署账户: 0x...
账户余额: X.XXX ETH

[1/3] 部署 EOCHOToken...
✓ EOCHOToken 部署成功: 0x...

[2/3] 部署 Register...
✓ Register 部署成功: 0x...

[3/5] 配置 EOCHOToken (Register)...
✓ EOCHOToken Register 地址配置完成

[4/5] 部署 TaskEscrow...
✓ TaskEscrow 部署成功: 0x...

[5/5] 配置 EOCHOToken (TaskEscrow)...
✓ EOCHOToken TaskEscrow 地址配置完成

==================================================
部署完成！
==================================================

合约地址：
--------------------------------------------------
EOCHOToken:   0x...
Register:     0x...
TaskEscrow:   0x...

前端配置（frontend/.env）：
--------------------------------------------------
VITE_EOCHO_TOKEN_ADDRESS=0x...
VITE_REGISTER_ADDRESS=0x...
VITE_TASK_ESCROW_ADDRESS=0x...
VITE_CHAIN_ID=84532
VITE_NETWORK_NAME=Base Sepolia

后端配置（backend/.env）：
--------------------------------------------------
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0x...
CHAIN_ID=84532

提示：在 Basescan 上验证合约
--------------------------------------------------
npx hardhat verify --network baseSepolia 0x...
npx hardhat verify --network baseSepolia 0x... 0x...
npx hardhat verify --network baseSepolia 0x... 0x... 0x...

✓ 部署信息已保存到 deployment.json
```

---

### 步骤 3: 验证部署结果

#### 3.1 检查 deployment.json

```bash
cat deployment.json
```

**预期内容**:
```json
{
  "network": "Base Sepolia",
  "chainId": 84532,
  "deployer": "0x...",
  "timestamp": "2025-11-25T...",
  "contracts": {
    "EOCHOToken": "0x...",
    "Register": "0x...",
    "TaskEscrow": "0x..."
  }
}
```

#### 3.2 在 Basescan 上验证

访问：`https://sepolia.basescan.org/address/[合约地址]`

**检查项**:
- ✅ 合约已部署
- ✅ 可以看到交易记录
- ✅ 合约余额为 0

#### 3.3 验证 Token 名称

在 Basescan 上查看 EOCHOToken 合约：
- ✅ Name: `ECHO Token`
- ✅ Symbol: `ECHO`
- ✅ Decimals: `18`

---

### 步骤 4: 配置前端

编辑 `frontend/.env` 文件：

```env
# Backend API
VITE_BACKEND_BASE_URL=http://localhost:3001

# Network
VITE_CHAIN_ID=84532

# Contract Addresses (从 deployment.json 复制)
VITE_EOCHO_TOKEN_ADDRESS=0x...
VITE_REGISTER_ADDRESS=0x...
VITE_TASK_ESCROW_ADDRESS=0x...
```

---

### 步骤 5: 配置后端

编辑 `backend/.env` 文件：

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3001

# Blockchain
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0x...
CHAIN_ID=84532

# Event Listener (可选)
ENABLE_EVENT_LISTENER=true
ENABLE_CHAIN_SYNC=true
SYNC_FROM_BLOCK=0
```

---

### 步骤 6: 启动服务

#### 6.1 启动后端

```bash
cd backend
npm run dev
```

**预期输出**:
```
Server running on http://localhost:3001
[EventListener] Initializing event listener service...
[ChainSync] Initializing chain sync service...
```

#### 6.2 启动前端

```bash
cd frontend
npm run dev
```

**预期输出**:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### 步骤 7: 配置 MetaMask

1. 打开 MetaMask
2. 点击网络下拉菜单
3. 点击 "添加网络"
4. 选择 "手动添加网络"
5. 填入以下信息：

```
网络名称: Base Sepolia
RPC URL: https://sepolia.base.org
链 ID: 84532
货币符号: ETH
区块浏览器: https://sepolia.basescan.org
```

6. 点击 "保存"
7. 切换到 Base Sepolia 网络

---

### 步骤 8: 验证合约（可选）

如果有 Basescan API Key，可以验证合约源码：

```bash
# 验证 EOCHOToken
npx hardhat verify --network baseSepolia <EOCHO_TOKEN_ADDRESS>

# 验证 Register
npx hardhat verify --network baseSepolia <REGISTER_ADDRESS> <EOCHO_TOKEN_ADDRESS>

# 验证 TaskEscrow
npx hardhat verify --network baseSepolia <TASK_ESCROW_ADDRESS> <EOCHO_TOKEN_ADDRESS> <REGISTER_ADDRESS>
```

---

## ✅ 部署验证清单

### 合约部署
- [ ] EOCHOToken 部署成功
- [ ] Register 部署成功
- [ ] TaskEscrow 部署成功
- [ ] EOCHOToken.registerAddress 已设置
- [ ] EOCHOToken.taskEscrowAddress 已设置

### Token 名称
- [ ] EOCHOToken.name() 返回 "ECHO Token"
- [ ] EOCHOToken.symbol() 返回 "ECHO"
- [ ] 合约名称仍为 EOCHOToken

### 配置文件
- [ ] deployment.json 已生成
- [ ] frontend/.env 已配置
- [ ] backend/.env 已配置
- [ ] MetaMask 已添加 Base Sepolia 网络

### 服务启动
- [ ] 后端服务正常启动
- [ ] 前端服务正常启动
- [ ] 可以访问 http://localhost:5173

---

## 🔍 常见问题

### Q1: 部署失败，提示 "insufficient funds"
**A**: 确保钱包有足够的 Base Sepolia ETH，访问 Alchemy Faucet 获取。

### Q2: 部署成功但前端连接失败
**A**: 检查：
1. frontend/.env 中的合约地址是否正确
2. VITE_CHAIN_ID 是否为 84532
3. MetaMask 是否切换到 Base Sepolia 网络

### Q3: 后端无法读取链上数据
**A**: 检查：
1. backend/.env 中的 RPC_URL 是否正确
2. TASK_ESCROW_ADDRESS 是否正确
3. CHAIN_ID 是否为 84532

### Q4: 合约验证失败
**A**: 确保：
1. BASESCAN_API_KEY 已配置
2. 验证命令中的构造函数参数正确
3. 使用的 Solidity 版本与编译时一致（0.8.20）

---

## 📝 下一步

部署完成后，继续执行：
1. **运行回归测试**：参考 `docs/STEP2_REGRESSION_REPORT.md`
2. **测试三条 Demo Journeys**
3. **验证所有冻结点保持不变**

---

## 🔗 相关链接

- **Base Sepolia Faucet**: https://www.alchemy.com/faucets/base-sepolia
- **Basescan**: https://sepolia.basescan.org
- **Base 官方文档**: https://docs.base.org
- **Hardhat 文档**: https://hardhat.org/docs

---

**部署指南版本**: v1.0  
**目标网络**: Base Sepolia (Chain ID: 84532)  
**Token 名称**: ECHO Token (ECHO)  
**合约版本**: 与 A4 验收版本一致（仅改 name/symbol）
