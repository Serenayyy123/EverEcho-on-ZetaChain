# Step A2 快速开始指南 - 真实链上/后端接入版

## 概述

Step A2 将 A1 的 Mock 实现替换为真实的钱包、合约和后端接入，使应用在测试网（Sepolia）可用。

## 前置条件

### 1. MetaMask 钱包
- 安装 MetaMask 浏览器扩展
- 切换到 Sepolia 测试网
- 获取测试 ETH（从 Sepolia Faucet）

### 2. 合约部署
```bash
# 部署到 Sepolia
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia

# 或部署到本地 Hardhat 网络
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

### 3. 后端服务
```bash
# 启动后端服务
cd backend
npm install
npm run dev
```

## 环境配置

### 1. 复制环境变量文件
```bash
cd frontend
cp .env.example .env
```

### 2. 配置 .env 文件
```env
# Network Configuration
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia
VITE_RPC_URL=https://rpc.sepolia.org

# Contract Addresses (从部署输出中获取)
VITE_EOCHO_TOKEN_ADDRESS=0x...
VITE_REGISTER_ADDRESS=0x...
VITE_TASK_ESCROW_ADDRESS=0x...

# Backend API
VITE_BACKEND_BASE_URL=http://localhost:3001

# Feature Flags
VITE_ENABLE_DEMO_MODE=true
VITE_POLL_INTERVAL=5000
```

### 3. 更新合约地址
编辑 `frontend/src/contracts/addresses.ts`，填入部署的合约地址。

## 运行应用

### 1. 安装依赖
```bash
cd frontend
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问应用
打开浏览器访问 `http://localhost:5173`

## 真实用户旅程

### 1. 连接钱包
- 点击 "Connect MetaMask"
- MetaMask 弹出授权请求
- 确认连接
- 检查网络（应该是 Sepolia）

### 2. 注册用户
- 填写 Profile 信息（name, bio, contacts）
- 点击 "Register"
- 后端上传 profile → 返回 profileURI
- MetaMask 弹出交易确认
- 确认交易
- 等待交易确认（约 15 秒）
- 注册成功，余额 +100 EOCHO

### 3. 创建任务（Creator）
- 进入 "Publish Task" 页面
- 填写任务信息（title, description, reward）
- 点击 "Create Task"
- 后端上传 task → 返回 taskURI
- MetaMask 弹出交易确认（需要 approve EOCHO）
- 确认交易
- 等待交易确认
- 任务创建成功，状态 Open

### 4. 接受任务（Helper）
- 切换到另一个 MetaMask 账户
- 刷新页面，连接新账户
- 如果未注册，先注册
- 进入任务详情页
- 点击 "Accept Task"
- MetaMask 弹出交易确认
- 确认交易
- 任务状态变为 InProgress

### 5. 查看联系方式
- 在 InProgress 状态下
- 点击 "View Contacts"
- MetaMask 弹出签名请求
- 确认签名
- 后端验证签名并返回解密后的联系方式
- 显示 Creator 和 Helper 的联系方式

### 6. 提交工作（Helper）
- 点击 "Submit Work"
- MetaMask 弹出交易确认
- 确认交易
- 任务状态变为 Submitted

### 7. 确认完成（Creator）
- 切换回 Creator 账户
- 点击 "Confirm Complete"
- MetaMask 弹出交易确认
- 确认交易
- 任务状态变为 Completed
- 显示资金结算信息

### 8. Request Fix（Creator）
- 在 Submitted 状态下
- 点击 "Request Fix"
- MetaMask 弹出交易确认
- 确认交易
- fixRequested 变为 true
- 验收期延长 3 天

### 9. 协商终止（InProgress）
- 任一方点击 "Request Terminate"
- MetaMask 弹出交易确认
- 确认交易
- 切换到另一方账户
- 点击 "Agree to Terminate"
- MetaMask 弹出交易确认
- 确认交易
- 任务状态变为 Cancelled

### 10. 超时处理
- 等待超时（或修改合约时间常量测试）
- 点击对应的超时按钮
- MetaMask 弹出交易确认
- 确认交易
- 任务状态更新

## 与 A1 的区别

### A1 (Mock)
- 数据在内存中
- 操作即时完成
- 无需钱包
- 无需等待确认

### A2 (Real)
- 数据在链上和后端
- 操作需要交易确认（15-30 秒）
- 需要 MetaMask 钱包
- 需要测试 ETH 和 EOCHO
- 需要签名和授权

## 常见问题

### 1. MetaMask 未安装
- 访问 https://metamask.io 安装

### 2. 没有测试 ETH
- 访问 Sepolia Faucet 获取测试 ETH
- https://sepoliafaucet.com

### 3. 交易失败
- 检查余额是否足够
- 检查是否已注册
- 检查网络是否正确
- 查看 MetaMask 错误信息

### 4. 合约地址未配置
- 确保 .env 文件中的合约地址正确
- 确保合约已部署到对应网络

### 5. 后端连接失败
- 确保后端服务已启动
- 检查 VITE_BACKEND_BASE_URL 配置

### 6. 余额不足
- 确保有足够的 ETH 支付 gas
- 确保有足够的 EOCHO 创建/接受任务

## 调试技巧

### 1. 查看交易
- 复制交易哈希
- 访问 https://sepolia.etherscan.io
- 粘贴交易哈希查看详情

### 2. 查看合约
- 访问 Etherscan
- 输入合约地址
- 查看合约状态和事件

### 3. 查看控制台
- 打开浏览器开发者工具
- 查看 Console 标签
- 所有交易和错误都会记录

### 4. 查看网络请求
- 打开浏览器开发者工具
- 查看 Network 标签
- 查看后端 API 请求和响应

## 性能优化

### 1. 轮询间隔
- 默认 5 秒轮询一次
- 可以在 .env 中调整 VITE_POLL_INTERVAL

### 2. 缓存
- 任务列表和详情会缓存
- 切换页面时会刷新

### 3. 事件监听
- 可以监听合约事件实时更新
- 目前使用轮询（简化实现）

## 下一步

- 优化事件监听（替换轮询）
- 添加交易历史
- 添加通知系统
- 优化 UI/UX
- 添加更多错误处理

---

**Step A2 真实链上/后端接入版已就绪！** ✅
