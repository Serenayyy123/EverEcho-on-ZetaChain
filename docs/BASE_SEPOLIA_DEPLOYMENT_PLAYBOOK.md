# Base Sepolia 部署 Playbook

## 📋 总览

**目标**: 将 EverEcho 三合约部署到 Base Sepolia 并完成前后端联通  
**网络**: Base Sepolia (Chain ID: 84532)  
**预计时间**: 30-45 分钟  
**风险等级**: 低（纯部署，不改业务逻辑）

---

## ✅ 阶段 0: 部署前检查（5 分钟）

### 0.1 检查 Hardhat 配置

```bash
# 查看 hardhat.config.ts
cat hardhat.config.ts | grep -A 5 "baseSepolia"
```

**预期输出**:
```typescript
baseSepolia: {
  url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 84532,
},
```

**✅ 通过条件**: 配置存在且 chainId 为 84532  
**❌ 失败处理**: 如果不存在，告诉我，我会提供 patch

---

### 0.2 获取 Base Sepolia 测试 ETH

1. 访问 Alchemy Faucet: https://www.alchemy.com/faucets/base-sepolia
2. 输入你的钱包地址
3. 完成验证并领取

**需要数量**: 至少 0.01 ETH（部署 3 个合约 + 配置）

**验证余额**:
```bash
# 在 MetaMask 中切换到 Base Sepolia 网络查看余额
```

**✅ 通过条件**: 余额 > 0.01 ETH  
**❌ 失败处理**: 如果 Faucet 失败，可以尝试其他 Base Sepolia Faucet

---

### 0.3 配置环境变量

创建根目录 `.env` 文件：

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env
# Windows: notepad .env
# Mac/Linux: nano .env
```

**填入以下内容**:
```env
# Base Sepolia RPC URL
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# 你的钱包私钥（从 MetaMask 导出）
PRIVATE_KEY=你的私钥（不要有0x前缀）

# Basescan API Key（可选，用于验证合约）
BASESCAN_API_KEY=你的API_Key（可以先留空）
```

**⚠️ 安全提醒**:
- 不要提交 `.env` 到 Git
- 使用测试钱包，不要用主钱包
- 私钥不要有 `0x` 前缀

**验证配置**:
```bash
# 检查 .env 文件存在
ls -la .env

# 检查私钥格式（应该是 64 个十六进制字符）
# 不要直接 cat .env（避免泄露）
```

**✅ 通过条件**: .env 文件存在且包含 PRIVATE_KEY  
**❌ 失败处理**: 如果私钥格式错误，Hardhat 会报错

---

### 0.4 编译合约

```bash
npx hardhat compile
```

**预期输出**:
```
Compiled 3 Solidity files successfully (evm target: paris).
```

**✅ 通过条件**: 编译成功，无错误  
**❌ 失败处理**:
- 如果报错 "Cannot find module"，运行 `npm install`
- 如果报错 Solidity 版本，检查 hardhat.config.ts 中的版本是否为 0.8.20

---

## 🚀 阶段 1: 合约部署（10 分钟）

### 1.1 执行部署脚本

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**预期输出**（完整流程）:
```
==================================================
EverEcho 合约部署
==================================================

部署账户: 0x...
账户余额: 0.XXX ETH

[1/3] 部署 EOCHOToken...
✓ EOCHOToken 部署成功: 0xABCD...1234

[2/3] 部署 Register...
✓ Register 部署成功: 0xEFGH...5678

[3/5] 配置 EOCHOToken (Register)...
✓ EOCHOToken Register 地址配置完成

[4/5] 部署 TaskEscrow...
✓ TaskEscrow 部署成功: 0xIJKL...9012

[5/5] 配置 EOCHOToken (TaskEscrow)...
✓ EOCHOToken TaskEscrow 地址配置完成

==================================================
部署完成！
==================================================

合约地址：
--------------------------------------------------
EOCHOToken:   0xABCD...1234
Register:     0xEFGH...5678
TaskEscrow:   0xIJKL...9012

前端配置（frontend/.env）：
--------------------------------------------------
VITE_EOCHO_TOKEN_ADDRESS=0xABCD...1234
VITE_REGISTER_ADDRESS=0xEFGH...5678
VITE_TASK_ESCROW_ADDRESS=0xIJKL...9012
VITE_CHAIN_ID=84532
VITE_NETWORK_NAME=Base Sepolia

后端配置（backend/.env）：
--------------------------------------------------
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0xIJKL...9012
CHAIN_ID=84532

✓ 部署信息已保存到 deployment.json
```

**✅ 通过条件**: 
- 所有 5 个步骤都显示 ✓
- 输出了 3 个合约地址
- 生成了 deployment.json

**❌ 失败处理**:

#### 错误 1: "insufficient funds"
```
Error: insufficient funds for intrinsic transaction cost
```
**原因**: 钱包余额不足  
**解决**: 从 Faucet 获取更多测试 ETH

#### 错误 2: "nonce too low"
```
Error: nonce has already been used
```
**原因**: 交易 nonce 冲突  
**解决**: 等待 1-2 分钟后重试，或在 MetaMask 中重置账户

#### 错误 3: "network does not support ENS"
```
Error: network does not support ENS
```
**原因**: RPC 配置问题  
**解决**: 检查 .env 中的 BASE_SEPOLIA_RPC_URL 是否正确

#### 错误 4: "replacement fee too low"
```
Error: replacement transaction underpriced
```
**原因**: Gas 价格设置过低  
**解决**: 等待几分钟后重试

---

### 1.2 验证部署结果

#### 1.2.1 检查 deployment.json

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

**✅ 通过条件**: 文件存在且包含 3 个合约地址

---

#### 1.2.2 在 Basescan 上验证

访问以下链接（替换为你的合约地址）:
```
https://sepolia.basescan.org/address/[EOCHOToken地址]
https://sepolia.basescan.org/address/[Register地址]
https://sepolia.basescan.org/address/[TaskEscrow地址]
```

**检查项**:
- ✅ 合约已部署（显示 Contract）
- ✅ 可以看到部署交易
- ✅ 合约余额为 0

**✅ 通过条件**: 三个合约都能在 Basescan 上找到

---

#### 1.2.3 验证 Token 名称

在 Basescan 上查看 EOCHOToken 合约，点击 "Read Contract"：

**检查项**:
- `name()` 返回: `ECHO Token`
- `symbol()` 返回: `ECHO`
- `decimals()` 返回: `18`
- `CAP()` 返回: `10000000000000000000000000` (10M * 10^18)

**✅ 通过条件**: name 和 symbol 正确

---

### 1.3 保存部署地址

**创建部署记录文件**:

```bash
mkdir -p deployments
cp deployment.json deployments/baseSepolia.json
```

**备份到文档**:
```bash
echo "# Base Sepolia 部署地址" > deployments/BASE_SEPOLIA_ADDRESSES.md
echo "" >> deployments/BASE_SEPOLIA_ADDRESSES.md
echo "部署日期: $(date)" >> deployments/BASE_SEPOLIA_ADDRESSES.md
echo "" >> deployments/BASE_SEPOLIA_ADDRESSES.md
cat deployment.json >> deployments/BASE_SEPOLIA_ADDRESSES.md
```

**✅ 通过条件**: 部署地址已保存

---

## 🔧 阶段 2: 合约验证（可选，5 分钟）

### 2.1 获取 Basescan API Key

1. 访问: https://basescan.org/myapikey
2. 注册/登录账号
3. 创建新的 API Key
4. 复制 API Key 到 `.env` 文件

```env
BASESCAN_API_KEY=你的API_Key
```

---

### 2.2 验证合约源码

```bash
# 验证 EOCHOToken
npx hardhat verify --network baseSepolia <EOCHO_TOKEN_ADDRESS>

# 验证 Register
npx hardhat verify --network baseSepolia <REGISTER_ADDRESS> <EOCHO_TOKEN_ADDRESS>

# 验证 TaskEscrow
npx hardhat verify --network baseSepolia <TASK_ESCROW_ADDRESS> <EOCHO_TOKEN_ADDRESS> <REGISTER_ADDRESS>
```

**预期输出**（每个合约）:
```
Successfully submitted source code for contract
contracts/EOCHOToken.sol:EOCHOToken at 0x...
for verification on the block explorer. Waiting for verification result...

Successfully verified contract EOCHOToken on the block explorer.
https://sepolia.basescan.org/address/0x...#code
```

**✅ 通过条件**: 三个合约都显示 "Successfully verified"

**❌ 失败处理**:

#### 错误: "Already Verified"
```
Error: Contract source code already verified
```
**原因**: 合约已经验证过  
**解决**: 跳过，这不是问题

#### 错误: "Invalid API Key"
```
Error: Invalid API Key
```
**原因**: API Key 错误或未配置  
**解决**: 检查 .env 中的 BASESCAN_API_KEY

---

## 🎨 阶段 3: 前端配置（5 分钟）

### 3.1 配置前端环境变量

```bash
cd frontend

# 复制示例文件（如果还没有 .env）
cp .env.example .env

# 编辑 .env
# Windows: notepad .env
# Mac/Linux: nano .env
```

**填入以下内容**（使用 deployment.json 中的地址）:
```env
# Backend API
VITE_BACKEND_BASE_URL=http://localhost:3001

# Network
VITE_CHAIN_ID=84532

# Contract Addresses
VITE_EOCHO_TOKEN_ADDRESS=0x...（从 deployment.json 复制）
VITE_REGISTER_ADDRESS=0x...（从 deployment.json 复制）
VITE_TASK_ESCROW_ADDRESS=0x...（从 deployment.json 复制）
```

**✅ 通过条件**: .env 文件存在且包含 3 个合约地址

---

### 3.2 验证前端配置

```bash
# 检查配置文件
cat .env | grep VITE_

# 返回根目录
cd ..
```

**预期输出**:
```
VITE_BACKEND_BASE_URL=http://localhost:3001
VITE_CHAIN_ID=84532
VITE_EOCHO_TOKEN_ADDRESS=0x...
VITE_REGISTER_ADDRESS=0x...
VITE_TASK_ESCROW_ADDRESS=0x...
```

**✅ 通过条件**: 所有地址都不是 0x0000...

---

### 3.3 启动前端（测试）

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

**测试步骤**:
1. 访问 http://localhost:5173
2. 打开浏览器控制台
3. 检查是否有错误

**✅ 通过条件**: 
- 前端启动成功
- 控制台无 "Contract address not configured" 错误
- 可以看到 "Connect Wallet" 按钮

**暂时停止前端**:
```bash
# 按 Ctrl+C 停止
cd ..
```

---

## 🔌 阶段 4: 后端配置（5 分钟）

### 4.1 配置后端环境变量

```bash
cd backend

# 复制示例文件（如果还没有 .env）
cp .env.example .env

# 编辑 .env
# Windows: notepad .env
# Mac/Linux: nano .env
```

**填入以下内容**:
```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3001

# Blockchain
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0x...（从 deployment.json 复制 TaskEscrow 地址）
CHAIN_ID=84532

# Event Listener (可选)
ENABLE_EVENT_LISTENER=true
ENABLE_CHAIN_SYNC=true
SYNC_FROM_BLOCK=0

# CORS
CORS_ORIGIN=http://localhost:5173
```

**✅ 通过条件**: .env 文件存在且包含 TASK_ESCROW_ADDRESS

---

### 4.2 初始化数据库（如果需要）

```bash
# 如果 dev.db 不存在，Prisma 会自动创建
# 检查数据库文件
ls -la dev.db
```

**如果数据库不存在**:
```bash
# Prisma 会在首次启动时自动创建
# 无需手动操作
```

---

### 4.3 启动后端（测试）

```bash
npm run dev
```

**预期输出**:
```
Server running on http://localhost:3001
[EventListener] Initializing event listener service...
[EventListener] Event listener disabled (set ENABLE_EVENT_LISTENER=true to enable)
[ChainSync] Initializing chain sync service...
[ChainSync] Chain sync started, interval: 30000ms
```

**测试步骤**:
1. 访问 http://localhost:3001/healthz
2. 检查响应

**预期响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-25T...",
  "services": {
    "database": "connected",
    "blockchain": "connected"
  }
}
```

**✅ 通过条件**: 
- 后端启动成功
- healthz 返回 "ok"
- 无 RPC 连接错误

**暂时停止后端**:
```bash
# 按 Ctrl+C 停止
cd ..
```

---

## 🦊 阶段 5: MetaMask 配置（3 分钟）

### 5.1 添加 Base Sepolia 网络

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

**✅ 通过条件**: MetaMask 显示 "Base Sepolia" 网络

---

### 5.2 验证网络连接

1. 在 MetaMask 中查看余额
2. 确认余额 > 0（应该还剩一些测试 ETH）

**✅ 通过条件**: 可以看到余额

---

## 🧪 阶段 6: 三条 Journey 回归测试（15 分钟）

### 6.1 启动前后端服务

**终端 1 - 后端**:
```bash
cd backend
npm run dev
```

**终端 2 - 前端**:
```bash
cd frontend
npm run dev
```

**✅ 通过条件**: 两个服务都正常启动

---

### 6.2 Journey 1: 新用户注册

#### 步骤 1: 连接钱包
1. 访问 http://localhost:5173
2. 点击 "Connect Wallet"
3. MetaMask 弹出，确认连接
4. 确认 MetaMask 显示 "Base Sepolia"

**✅ 预期**: 钱包成功连接，自动跳转到注册页面

---

#### 步骤 2: 填写注册信息
1. Nickname: `TestUser1`
2. City: `TestCity`
3. Skills: 添加 `Testing`, `Development`
4. Telegram: `@testuser1`

**✅ 预期**: 表单验证通过，Register 按钮可点击

---

#### 步骤 3: 提交注册
1. 点击 "Register" 按钮
2. MetaMask 弹出交易确认
3. 确认交易
4. 等待交易确认（约 2-5 秒）

**✅ 预期**: 
- 交易成功
- 自动跳转到 Task Square
- 控制台显示 "Registration successful"

---

#### 步骤 4: 验证余额
1. 点击 "Profile"
2. 查看余额

**✅ 预期**: 余额显示 `100.0 ECHO`

**📝 记录**:
- 注册交易 Hash: ________________
- 余额: ________________
- 状态: ⬜ 通过 / ⬜ 失败

---

### 6.3 Journey 2: 完整任务流程

#### 前置条件
- 需要两个账户（Creator 和 Helper）
- 两个账户都已注册
- 两个账户都有 ≥ 20 ECHO

---

#### 步骤 1: Creator 发布任务
1. Creator 登录
2. 进入 "Publish Task"
3. 填写：
   - Title: `Test Task on Base Sepolia`
   - Description: `Testing ECHO token`
   - Reward: `20`
   - Contacts: `@creator_telegram`
4. 点击 "Publish Task"
5. 确认 Approve 交易（20 ECHO）
6. 确认 CreateTask 交易

**✅ 预期**: 
- 任务创建成功
- 任务出现在 Task Square
- 状态为 "Open"

**📝 记录**:
- Task ID: ________________
- Create Tx: ________________
- 状态: ⬜ 通过 / ⬜ 失败

---

#### 步骤 2: Helper 接受任务
1. Helper 登录
2. 在 Task Square 找到任务
3. 点击 "View Details"
4. 点击 "Accept Task"
5. 确认 Approve 交易（20 ECHO）
6. 确认 AcceptTask 交易

**✅ 预期**: 
- 任务状态变为 "In Progress"
- 可以看到 Creator 联系方式

**📝 记录**:
- Accept Tx: ________________
- 状态: ⬜ 通过 / ⬜ 失败

---

#### 步骤 3: Helper 提交任务
1. 点击 "Submit Work"
2. 确认交易

**✅ 预期**: 任务状态变为 "Submitted"

**📝 记录**:
- Submit Tx: ________________
- 状态: ⬜ 通过 / ⬜ 失败

---

#### 步骤 4: Creator 确认完成
1. Creator 登录
2. 查看任务详情
3. 点击 "Confirm Complete"
4. 确认交易

**✅ 预期**: 
- 任务状态变为 "Completed"
- 显示结算详情：
  - Helper received: 19.6 ECHO
  - Burned: 0.4 ECHO
  - Deposit returned: 20 ECHO

**📝 记录**:
- Complete Tx: ________________
- Creator 余额变化: ________________
- Helper 余额变化: ________________
- 状态: ⬜ 通过 / ⬜ 失败

---

### 6.4 Journey 3: 异常流程（选一个测试）

#### 选项 A: Request Fix
1. 创建任务并接受
2. Helper 提交
3. Creator 点击 "Request Fix"
4. Helper 重新提交
5. Creator 确认完成

**✅ 预期**: 流程正常完成

---

#### 选项 B: 协商终止
1. 创建任务并接受
2. 一方点击 "Request Terminate"
3. 另一方点击 "Confirm Terminate"

**✅ 预期**: 
- 任务状态变为 "Cancelled"
- 双方各拿回 20 ECHO

---

#### 选项 C: 超时（需要修改合约常量或等待）
**建议**: 跳过此项，因为需要等待较长时间

---

**📝 记录**:
- 测试场景: ________________
- 状态: ⬜ 通过 / ⬜ 失败

---

## 📊 阶段 7: 回归测试总结

### 7.1 填写测试报告

编辑 `docs/STEP2_REGRESSION_REPORT.md`，填入：
- 合约地址
- 测试账户
- 各 Journey 的交易 Hash
- 测试结果

---

### 7.2 验收清单

- [ ] EOCHOToken.name() 返回 "ECHO Token"
- [ ] EOCHOToken.symbol() 返回 "ECHO"
- [ ] 三合约部署到 Base Sepolia
- [ ] 前端可以连接 Base Sepolia
- [ ] 后端可以读取链上数据
- [ ] Journey 1: 注册通过
- [ ] Journey 2: 主流程通过
- [ ] Journey 3: 异常流程通过（至少一个）
- [ ] 所有冻结点保持不变

---

## 🔧 阶段 8: 常见故障快速定位

### 问题 1: 前端连接钱包后显示 "Wrong Network"

**原因**: MetaMask 未切换到 Base Sepolia  
**解决**: 
1. 打开 MetaMask
2. 切换到 Base Sepolia 网络
3. 刷新页面

---

### 问题 2: 注册时提示 "Contract not deployed"

**原因**: 前端配置的合约地址错误  
**解决**:
1. 检查 `frontend/.env` 中的地址
2. 对比 `deployment.json` 中的地址
3. 确保地址正确且不是 0x0000...

---

### 问题 3: 后端启动报错 "Cannot connect to RPC"

**原因**: RPC URL 错误或网络问题  
**解决**:
1. 检查 `backend/.env` 中的 RPC_URL
2. 尝试备用 RPC: `https://base-sepolia-rpc.publicnode.com`
3. 检查网络连接

---

### 问题 4: 交易一直 Pending

**原因**: Gas 价格过低或网络拥堵  
**解决**:
1. 在 MetaMask 中加速交易
2. 或等待 5-10 分钟
3. 如果超过 10 分钟，取消交易并重试

---

### 问题 5: 余额显示 0 ECHO

**原因**: 
- 注册交易未确认
- 前端未刷新
- 合约地址错误

**解决**:
1. 在 Basescan 上检查注册交易是否成功
2. 刷新页面
3. 检查合约地址配置

---

### 问题 6: Contacts 无法解密

**原因**: 
- Helper 未正确接受任务
- 后端未更新 Helper DEK

**解决**:
1. 检查任务状态是否为 "In Progress"
2. 检查后端日志是否有错误
3. 重新接受任务

---

## ✅ 部署完成检查清单

### 合约部署
- [ ] EOCHOToken 部署成功
- [ ] Register 部署成功
- [ ] TaskEscrow 部署成功
- [ ] EOCHOToken.registerAddress 已设置
- [ ] EOCHOToken.taskEscrowAddress 已设置
- [ ] deployment.json 已生成

### 配置文件
- [ ] 根目录 .env 已配置
- [ ] frontend/.env 已配置
- [ ] backend/.env 已配置
- [ ] MetaMask 已添加 Base Sepolia

### 服务启动
- [ ] 后端服务正常启动
- [ ] 前端服务正常启动
- [ ] healthz 返回 ok

### 功能测试
- [ ] Journey 1: 注册通过
- [ ] Journey 2: 主流程通过
- [ ] Journey 3: 异常流程通过

### 验收标准
- [ ] 所有冻结点保持不变
- [ ] Token name/symbol 为 ECHO
- [ ] 无新 bug 引入

---

## 📝 部署记录

**部署日期**: ________________  
**部署人员**: ________________  
**网络**: Base Sepolia (84532)  
**合约地址**: 见 deployment.json  
**测试状态**: ⬜ 全部通过 / ⬜ 部分通过 / ⬜ 失败  

**备注**: ________________

---

**Playbook 版本**: v1.0  
**最后更新**: 2025-11-25  
**适用版本**: EverEcho A4 验收版本 + ECHO Token
