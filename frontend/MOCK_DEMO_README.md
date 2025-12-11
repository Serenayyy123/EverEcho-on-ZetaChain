# EverEcho MVP - Mock Demo (Step A1)

## 概述

这是 EverEcho MVP 的 Mock 演示版本，使用完全模拟的数据和状态，不接入任何真实的钱包、合约或后端。

## 目录结构

```
frontend/src/
├── mock/
│   ├── types.ts           # 类型定义
│   ├── profiles.ts        # Mock 用户数据
│   ├── tasks.ts           # Mock 任务数据
│   └── contacts.ts        # Mock 联系方式数据
├── hooks/
│   ├── useMockWallet.ts          # Mock 钱包 Hook
│   ├── useMockRegister.ts        # Mock 注册 Hook
│   ├── useMockTasks.ts           # Mock 任务列表 Hook
│   ├── useMockTaskActions.ts     # Mock 任务操作 Hook
│   ├── useMockTimeout.ts         # Mock 超时计算 Hook
│   └── useMockContacts.ts        # Mock 联系方式 Hook
├── pages/
│   ├── Home.tsx           # 首页（已存在）
│   ├── TaskSquare.tsx     # 任务广场（已存在）
│   ├── TaskDetail.tsx     # 任务详情（已存在）
│   ├── Profile.tsx        # 个人资料（已存在）
│   └── PublishTask.tsx    # 发布任务（已存在）
└── components/
    ├── TaskCard.tsx       # 任务卡片（已存在）
    ├── ContactsDisplay.tsx    # 联系方式显示（已存在）
    ├── TimeoutIndicator.tsx   # 超时指示器（已存在）
    ├── TerminateRequest.tsx   # 协商终止（已存在）
    └── RequestFixUI.tsx       # Request Fix（已存在）
```

## 运行方式

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

## Mock 数据说明

### 预置用户
- **0xAlice**: 已注册，余额 100 EOCHO
- **0xBob**: 已注册，余额 100 EOCHO
- **0xCharlie**: 已注册，余额 100 EOCHO

### 预置任务
1. **Task #1** (Open): Alice 创建，等待接单
2. **Task #2** (InProgress): Alice 创建，Bob 接单
3. **Task #3** (Submitted): Bob 创建，Charlie 提交
4. **Task #4** (Completed): Charlie 创建，Alice 完成
5. **Task #5** (Cancelled): Bob 创建，已取消

## 演示流程

### 1. 连接钱包
- 点击 "Connect Wallet"
- 选择一个 Mock 地址（0xAlice / 0xBob / 0xCharlie）
- 可以随时切换账户

### 2. 注册（如果需要）
- 如果使用新地址，会提示注册
- 输入 Profile URI 并提交

### 3. 浏览任务广场
- 查看所有任务列表
- 按状态筛选任务
- 点击任务查看详情

### 4. 创建任务（Creator 流程）
- 进入 "Publish Task" 页面
- 填写任务标题、描述、奖励
- 提交创建任务
- 任务进入 Open 状态

### 5. 接受任务（Helper 流程）
- 切换到另一个账户
- 在任务详情页点击 "Accept Task"
- 任务进入 InProgress 状态
- 双方可以看到联系方式

### 6. 提交工作（Helper）
- 在 InProgress 状态下点击 "Submit Work"
- 任务进入 Submitted 状态

### 7. 确认完成（Creator）
- 在 Submitted 状态下点击 "Confirm Complete"
- 任务进入 Completed 状态
- 显示资金结算信息（0.98R / 0.02R burn / 保证金退回）

### 8. Request Fix（Creator）
- 在 Submitted 状态下点击 "Request Fix"
- fixRequested 变为 true
- 验收期延长 3 天
- 只能请求一次

### 9. 协商终止（InProgress）
- 任一方点击 "Request Terminate"
- 对方点击 "Agree to Terminate"
- 任务进入 Cancelled 状态
- 双方各拿回抵押

### 10. 超时处理
- Open 超时（7 天）→ 可取消
- InProgress 超时（14 天）→ 可关闭
- Submitted 超时（3 天 + fix 扩展）→ 自动完成

## 状态机验证

### 状态流转
```
Open → InProgress → Submitted → Completed
  ↓         ↓           ↓
Cancelled  Cancelled  Completed (timeout)
```

### 按钮显示规则
- **Open**: Creator 可取消，Helper 可接单
- **InProgress**: 不可单方取消，只能协商终止或 Helper 提交
- **Submitted**: 不可取消，Creator 可确认/Request Fix，或超时自动完成
- **Completed/Cancelled**: 无操作按钮

## 注意事项

1. **所有数据都在内存中**：刷新页面会重置（除了当前连接的地址）
2. **时间是模拟的**：可以通过修改 mock 数据中的时间戳来测试超时场景
3. **无真实交易**：所有操作都是即时的，没有 gas 费用
4. **接口形状保持一致**：便于后续替换为真实的合约/后端调用

## 下一步

完成 Step A1 后，可以：
1. 接入真实钱包（MetaMask）
2. 接入真实合约（Hardhat 本地网络或测试网）
3. 接入真实后端（Profile/Task 元数据存储）
4. 添加加密功能（联系方式加密）

---

**Mock Demo 已就绪，可以开始演示完整的用户旅程！** ✅
