# EverEcho MVP 工程草案

**基于 PRD v1.2 最终冻结版**  
**生成日期**：2024-11-23  
**状态**：待开发对齐

---

## 1. PRD 核心冻结点摘要（25 条）

### 架构与合约依赖
1. 采用独立 Register 合约，TaskEscrow 构造函数传入 Register 地址
2. EOCHO Token 继承 OpenZeppelin ERC20，不重复声明标准变量
3. mintInitial() 仅允许 Register 合约调用（onlyRegister modifier）
4. burn() 仅允许 TaskEscrow 合约调用，EOCHO 存储 taskEscrowAddress
5. TaskEscrow 通过 registerContract.isRegistered(address) 验证用户

### Token 经济与参数
6. INITIAL_MINT = 100 * 10**18（每个新用户）
7. CAP = 10_000_000 * 10**18（总量上限）
8. FEE_BPS = 200（2%），计算公式：fee = reward * 200 / 10000（uint256 下取整）
9. MAX_REWARD = 1000 * 10**18（合约硬限制）
10. CAP 已满时 register() 仍成功，mintedAmount=0，触发 CapReached 事件
11. CapReached 事件仅由 EOCHO Token 合约在 mintInitial() 内触发

### 状态机与资金流
12. 任务状态：Open → InProgress → Submitted → Completed/Cancelled
13. Creator 发布任务抵押 R，Helper 接受任务抵押 R
14. 完成时：Helper 得 0.98R，0.02R burn，Helper 保证金 R 退回
15. burn 从 TaskEscrow 托管余额执行：_burn(address(this), amount)
16. InProgress 状态 Creator 不可单方面取消
17. Submitted 状态 Creator 不可取消

### 超时规则
18. T_OPEN = 7 days，T_PROGRESS = 14 days，T_REVIEW = 3 days
19. T_TERMINATE_RESPONSE = 48 hours，T_FIX_EXTENSION = 3 days
20. Request Fix 后 submittedAt 不刷新，验收截止 = submittedAt + T_REVIEW + T_FIX_EXTENSION
21. agreeTerminate 仅在 block.timestamp <= terminateRequestedAt + T_TERMINATE_RESPONSE 时可调用
22. terminateTimeout 重置字段后不限制再次 requestTerminate 次数

### 链下存储与加密
23. profileURI 和 taskURI 采用 HTTP(S) 或 IPFS，MVP 不做 hash 校验
24. profile JSON 必填：nickname, city, skills[], encryptionPubKey
25. task JSON 必填：title, description, contactsEncryptedPayload, createdAt；MVP 使用 contactsEncryptedPayload 直存，contactRef 为 V2 预留

---

## 2. P0/P1/P2 工程任务树

### 2.1 Contracts（智能合约）

#### P0-C1: EOCHO Token 合约
- **任务目标**：实现 ERC20 Token，支持 cap、mintInitial、burn
- **依赖输入**：
  - OpenZeppelin ERC20 库
  - Register 合约地址（构造函数或 setter）
  - TaskEscrow 合约地址（构造函数或 setter）
- **产出物**：
  - `contracts/EOCHOToken.sol`
  - 状态变量：CAP, hasMintedInitial, registerAddress, taskEscrowAddress
  - 函数：mintInitial, burn, 标准 ERC20 函数
  - 事件：InitialMinted, CapReached, Burned
- **验收标准**：
  - PRD 1.4 Token 参数表所有常量正确
  - mintInitial 仅 Register 可调用
  - burn 仅 TaskEscrow 可调用
  - CAP 已满时 mint 0 但不 revert
  - 所有事件正确触发

#### P0-C2: Register 合约
- **任务目标**：实现用户注册，存储 profileURI，触发 mintInitial
- **依赖输入**：
  - EOCHO Token 合约地址
  - 链下 profileURI（HTTP(S) 或 IPFS）
- **产出物**：
  - `contracts/Register.sol`
  - 状态变量：echoToken, isRegistered, profileURI
  - 函数：register(string profileURI)
  - 事件：UserRegistered(address, profileURI, mintedAmount)
- **验收标准**：
  - PRD 钉子 1：register() 是唯一入口
  - 防重复注册（isRegistered 检查）
  - 成功后调用 echoToken.mintInitial()
  - 事件记录 mintedAmount（可能为 0）

#### P0-C3: TaskEscrow 合约核心流程
- **任务目标**：实现任务创建、接受、提交、完成、取消
- **依赖输入**：
  - EOCHO Token 合约地址
  - Register 合约地址
  - 链下 taskURI
- **产出物**：
  - `contracts/TaskEscrow.sol`
  - Task 结构体（13 个字段）
  - 函数：createTask, acceptTask, submitWork, confirmComplete, cancelTask
  - 超时函数：cancelTaskTimeout, completeTimeout, progressTimeout
  - 事件：TaskCreated, TaskAccepted, TaskSubmitted, TaskCompleted, TaskCancelled
- **验收标准**：
  - PRD 5.2 所有函数前置条件、资金变化、事件正确
  - 状态机流转严格遵循 PRD 1.2 模块 3
  - 手续费计算：fee = reward * 200 / 10000
  - MAX_REWARD 硬限制生效

#### P1-C4: TaskEscrow 协商终止机制
- **任务目标**：实现 requestTerminate, agreeTerminate, terminateTimeout
- **依赖输入**：
  - Task 结构体中的 terminateRequestedBy, terminateRequestedAt
- **产出物**：
  - 函数：requestTerminate, agreeTerminate, terminateTimeout
  - 事件：TerminateRequested, TerminateAgreed
- **验收标准**：
  - PRD 2.11 协商终止流程完整实现
  - agreeTerminate 时间检查：<= terminateRequestedAt + 48 hours
  - terminateTimeout 重置字段后可再次请求

#### P1-C5: TaskEscrow Request Fix 机制
- **任务目标**：实现 requestFix，延长验收期
- **依赖输入**：
  - Task 结构体中的 fixRequested, fixRequestedAt
- **产出物**：
  - 函数：requestFix
  - 事件：FixRequested
- **验收标准**：
  - PRD 2.12 请求修正流程完整实现
  - fixRequested 仅允许一次
  - submittedAt 不刷新
  - completeTimeout 计算包含 T_FIX_EXTENSION

---

### 2.2 Backend（后端服务）

#### P0-B1: Profile 存储服务
- **任务目标**：存储和查询用户 profile JSON
- **依赖输入**：
  - 链上 Register 合约的 profileURI
  - 用户提交的 profile 数据（nickname, city, skills, encryptionPubKey）
- **产出物**：
  - `backend/services/profileService.ts`
  - API: POST /api/profile, GET /api/profile/:address
  - 数据库表：profiles (address, nickname, city, skills, encryptionPubKey, createdAt)
- **验收标准**：
  - PRD 4.3 Profile JSON schema 必填字段验证
  - encryptionPubKey 缺失时返回 400 错误
  - 返回的 profileURI 格式：https://api.everecho.io/profile/{address}.json

#### P0-B2: Task Metadata 存储服务
- **任务目标**：存储和查询任务 JSON
- **依赖输入**：
  - 链上 TaskEscrow 合约的 taskURI
  - Creator 提交的任务数据（title, description, contacts）
- **产出物**：
  - `backend/services/taskService.ts`
  - API: POST /api/task, GET /api/task/:taskId
  - 数据库表：tasks (taskId, title, description, contactsEncrypted, createdAt)
- **验收标准**：
  - PRD 4.3 Task JSON schema 必填字段验证
  - 返回的 taskURI 格式：https://api.everecho.io/task/{taskId}.json
  - contactsEncryptedPayload 字段存在

#### P1-B3: 联系方式加密服务
- **任务目标**：实现 DEK 生成、加密、包裹、解密流程
- **依赖输入**：
  - Creator 和 Helper 的 encryptionPubKey（从 profile）
  - 任务状态（从链上 TaskEscrow）
  - 用户钱包签名（taskId）
- **产出物**：
  - `backend/services/encryptionService.ts`
  - API: POST /api/contacts/encrypt, POST /api/contacts/decrypt
  - 数据库表：contact_keys (taskId, creatorWrappedDEK, helperWrappedDEK)
- **验收标准**：
  - PRD 模块 3 加密方案完整实现
  - 使用 AES-256-GCM 加密联系方式
  - DEK 用双方 encryptionPubKey 分别包裹
  - 仅 InProgress/Submitted/Completed 状态允许解密
  - 签名验证包含 taskId

#### P0-B4: 签名验证服务
- **任务目标**：验证用户钱包签名
- **依赖输入**：
  - 用户地址
  - 签名消息（包含 taskId）
  - 签名
- **产出物**：
  - `backend/services/authService.ts`
  - 中间件：verifySignature
- **验收标准**：
  - 使用 ethers.js 验证签名
  - 签名消息格式统一
  - 验证失败返回 401

---

### 2.3 Frontend（前端）

#### P0-F1: 钱包连接与注册
- **任务目标**：实现钱包连接、注册流程
- **依赖输入**：
  - MetaMask 等 Web3 钱包
  - Register 合约地址
  - Backend profile API
- **产出物**：
  - `frontend/pages/Home.tsx`
  - `frontend/pages/Register.tsx`
  - `frontend/hooks/useWallet.ts`
  - `frontend/hooks/useRegister.ts`
- **验收标准**：
  - PRD 2.1/2.2 用户流程完整实现
  - 连接钱包后检查 isRegistered
  - 注册表单包含：nickname, city, skills（多选）
  - 生成 encryptionPubKey 并上传
  - 调用 register() 合约函数
  - 成功后跳转任务广场

#### P0-F2: 任务广场与详情页
- **任务目标**：展示任务列表、详情、操作按钮
- **依赖输入**：
  - TaskEscrow 合约事件（TaskCreated）
  - Backend task API
  - 链上任务状态
- **产出物**：
  - `frontend/pages/TaskSquare.tsx`
  - `frontend/pages/TaskDetail.tsx`
  - `frontend/components/TaskCard.tsx`
  - `frontend/hooks/useTasks.ts`
- **验收标准**：
  - PRD 3.1 Task Square 和 Task Detail 功能完整
  - 任务卡片显示：title, reward, creator tags, status
  - 详情页按钮根据状态和角色动态显示（PRD 3.1 Task Detail）
  - 搜索/过滤功能（关键词、城市、技能、状态）

#### P0-F3: Profile 页面
- **任务目标**：展示用户信息和历史记录
- **依赖输入**：
  - EOCHO Token 余额（链上）
  - 用户创建/接受的任务列表（链上事件）
  - Backend profile API
- **产出物**：
  - `frontend/pages/Profile.tsx`
  - `frontend/components/TaskHistory.tsx`
- **验收标准**：
  - PRD 模块 2 Profile 功能完整
  - 显示：nickname, city, skills, EOCHO 余额
  - 两个标签页：我发布的任务、我接受的任务
  - 每条记录显示：title, status, 金额变动, 时间戳

#### P0-F4: 发布任务页面
- **任务目标**：实现任务发布表单
- **依赖输入**：
  - EOCHO Token 余额（链上）
  - TaskEscrow createTask 函数
  - Backend task API
- **产出物**：
  - `frontend/pages/PublishTask.tsx`
  - `frontend/hooks/useCreateTask.ts`
- **验收标准**：
  - PRD 2.3 Creator 发布任务流程完整
  - 表单：title, description, reward（数字输入）
  - 前端检查余额 >= reward
  - 调用 createTask() 合约函数
  - 上传 task JSON 到 backend

#### P1-F5: 联系方式显示与解密
- **任务目标**：InProgress 后显示对方联系方式
- **依赖输入**：
  - 任务状态（链上）
  - Backend contacts decrypt API
  - 用户钱包签名
- **产出物**：
  - `frontend/components/ContactsDisplay.tsx`
  - `frontend/hooks/useContacts.ts`
- **验收标准**：
  - PRD 模块 3 联系方式显示功能
  - 仅 InProgress/Submitted/Completed 状态显示
  - 前端签名包含 taskId
  - 解密 DEK 并显示联系方式

#### P1-F6: 倒计时与超时提示
- **任务目标**：显示剩余时间和超时操作按钮
- **依赖输入**：
  - 任务时间戳（createdAt, acceptedAt, submittedAt）
  - 超时阈值（T_OPEN, T_PROGRESS, T_REVIEW）
- **产出物**：
  - `frontend/components/TimeoutIndicator.tsx`
  - `frontend/hooks/useTimeout.ts`
- **验收标准**：
  - PRD 3.1 Task Detail 超时提示功能
  - 显示剩余时间或"已超时"
  - 超时后显示"触发超时操作"按钮
  - 调用对应超时函数（cancelTaskTimeout, progressTimeout, completeTimeout）

#### P1-F7: 协商终止与 Request Fix UI
- **任务目标**：实现协商终止和请求修正按钮
- **依赖输入**：
  - 任务状态和字段（terminateRequestedBy, fixRequested）
  - TaskEscrow 相关函数
- **产出物**：
  - `frontend/components/TerminateRequest.tsx`
  - `frontend/components/RequestFix.tsx`
- **验收标准**：
  - PRD 2.11/2.12 流程完整实现
  - InProgress 状态显示"请求终止任务"按钮
  - 有请求时对方显示"同意终止"按钮
  - Submitted 状态 Creator 显示"Request Fix"（未使用过）

---

### 2.4 QA/Test（测试）

#### P0-T1: 合约单元测试
- **任务目标**：测试所有合约函数
- **依赖输入**：
  - Hardhat 测试框架
  - 部署的合约实例
- **产出物**：
  - `test/EOCHOToken.test.ts`
  - `test/Register.test.ts`
  - `test/TaskEscrow.test.ts`
- **验收标准**：
  - 覆盖所有函数的正常路径和异常路径
  - 测试所有前置条件（require/revert）
  - 验证所有事件触发
  - 验证资金流正确性
  - 测试覆盖率 > 90%

#### P0-T2: 状态机集成测试
- **任务目标**：测试完整任务生命周期
- **依赖输入**：
  - 部署的所有合约
  - 多个测试账户
- **产出物**：
  - `test/integration/TaskLifecycle.test.ts`
- **验收标准**：
  - 测试 Open → InProgress → Submitted → Completed 完整流程
  - 测试所有取消/超时路径
  - 测试协商终止流程
  - 测试 Request Fix 流程
  - 验证每个状态的资金锁定和结算

#### P1-T3: Backend API 测试
- **任务目标**：测试所有 API 端点
- **依赖输入**：
  - 运行的 backend 服务
  - 测试数据库
- **产出物**：
  - `backend/test/profile.test.ts`
  - `backend/test/task.test.ts`
  - `backend/test/encryption.test.ts`
- **验收标准**：
  - 测试所有 CRUD 操作
  - 测试签名验证
  - 测试加密/解密流程
  - 测试错误处理（400, 401, 404, 500）

#### P1-T4: E2E 验收测试
- **任务目标**：模拟完整用户流程
- **依赖输入**：
  - 部署的合约（测试网）
  - 运行的 backend 和 frontend
  - Playwright 或 Cypress
- **产出物**：
  - `e2e/register.spec.ts`
  - `e2e/createTask.spec.ts`
  - `e2e/acceptTask.spec.ts`
  - `e2e/completeTask.spec.ts`
- **验收标准**：
  - PRD 第 2 章所有用户流程可执行
  - 测试钱包连接和签名
  - 测试合约交互
  - 测试 UI 状态更新
  - 测试错误提示

---

## 3. 最小 Repo 目录结构

```
everecho-mvp/
├── contracts/                      # 智能合约
│   ├── EOCHOToken.sol             # ERC20 Token 合约
│   ├── Register.sol               # 用户注册合约
│   ├── TaskEscrow.sol             # 任务托管合约
│   └── interfaces/                # 合约接口
│       ├── IEOCHOToken.sol
│       ├── IRegister.sol
│       └── ITaskEscrow.sol
│
├── scripts/                        # 部署脚本
│   ├── deploy.ts                  # 主部署脚本
│   ├── verify.ts                  # 合约验证脚本
│   └── config.ts                  # 部署配置（地址、参数）
│
├── test/                           # 合约测试
│   ├── EOCHOToken.test.ts
│   ├── Register.test.ts
│   ├── TaskEscrow.test.ts
│   └── integration/
│       └── TaskLifecycle.test.ts
│
├── backend/                        # 后端服务
│   ├── src/
│   │   ├── services/              # 业务逻辑
│   │   │   ├── profileService.ts  # Profile 存储服务
│   │   │   ├── taskService.ts     # Task 存储服务
│   │   │   ├── encryptionService.ts # 加密服务
│   │   │   └── authService.ts     # 签名验证服务
│   │   ├── routes/                # API 路由
│   │   │   ├── profile.ts
│   │   │   ├── task.ts
│   │   │   └── contacts.ts
│   │   ├── models/                # 数据模型
│   │   │   ├── Profile.ts
│   │   │   ├── Task.ts
│   │   │   └── ContactKey.ts
│   │   ├── middleware/            # 中间件
│   │   │   ├── verifySignature.ts
│   │   │   └── errorHandler.ts
│   │   ├── utils/                 # 工具函数
│   │   │   ├── crypto.ts          # 加密工具
│   │   │   └── validation.ts      # 数据验证
│   │   └── index.ts               # 入口文件
│   ├── test/                      # 后端测试
│   │   ├── profile.test.ts
│   │   ├── task.test.ts
│   │   └── encryption.test.ts
│   ├── prisma/                    # 数据库 schema
│   │   └── schema.prisma
│   └── package.json
│
├── frontend/                       # 前端应用
│   ├── src/
│   │   ├── pages/                 # 页面组件
│   │   │   ├── Home.tsx           # 首页
│   │   │   ├── Register.tsx       # 注册页
│   │   │   ├── TaskSquare.tsx     # 任务广场
│   │   │   ├── TaskDetail.tsx     # 任务详情
│   │   │   ├── Profile.tsx        # 用户信息页
│   │   │   └── PublishTask.tsx    # 发布任务页
│   │   ├── components/            # 可复用组件
│   │   │   ├── WalletConnect.tsx  # 钱包连接按钮
│   │   │   ├── TaskCard.tsx       # 任务卡片
│   │   │   ├── TaskHistory.tsx    # 任务历史列表
│   │   │   ├── ContactsDisplay.tsx # 联系方式显示
│   │   │   ├── TimeoutIndicator.tsx # 倒计时组件
│   │   │   ├── TerminateRequest.tsx # 协商终止组件
│   │   │   └── RequestFix.tsx     # 请求修正组件
│   │   ├── hooks/                 # 自定义 Hooks
│   │   │   ├── useWallet.ts       # 钱包连接
│   │   │   ├── useRegister.ts     # 注册逻辑
│   │   │   ├── useTasks.ts        # 任务列表
│   │   │   ├── useTaskDetail.ts   # 任务详情
│   │   │   ├── useCreateTask.ts   # 创建任务
│   │   │   ├── useContacts.ts     # 联系方式解密
│   │   │   └── useTimeout.ts      # 超时计算
│   │   ├── contracts/             # 合约 ABI 和地址
│   │   │   ├── EOCHOToken.json
│   │   │   ├── Register.json
│   │   │   ├── TaskEscrow.json
│   │   │   └── addresses.ts       # 合约地址配置
│   │   ├── utils/                 # 工具函数
│   │   │   ├── formatters.ts      # 格式化工具
│   │   │   ├── validation.ts      # 表单验证
│   │   │   └── crypto.ts          # 前端加密工具
│   │   ├── types/                 # TypeScript 类型
│   │   │   ├── task.ts
│   │   │   ├── profile.ts
│   │   │   └── contract.ts
│   │   └── App.tsx                # 根组件
│   ├── public/                    # 静态资源
│   └── package.json
│
├── e2e/                            # E2E 测试
│   ├── register.spec.ts
│   ├── createTask.spec.ts
│   ├── acceptTask.spec.ts
│   └── completeTask.spec.ts
│
├── docs/                           # 文档
│   ├── PRD.md                     # 产品需求文档
│   ├── 工程草案_EverEcho_MVP.md   # 本文档
│   └── API.md                     # API 文档
│
├── hardhat.config.ts               # Hardhat 配置
├── tsconfig.json                   # TypeScript 配置
├── .env.example                    # 环境变量示例
└── README.md                       # 项目说明
```

---

## 4. 风险/歧义扫描

### 风险 1：encryptionPubKey 生成与验证
**位置**：PRD 模块 3 联系方式加密方案  
**风险描述**：PRD 要求 profile JSON 必须包含 encryptionPubKey，但未明确：
- 前端如何生成 encryptionPubKey（使用哪个库？x25519 还是 secp256k1？）
- 后端如何验证 encryptionPubKey 的合法性（格式、长度）
- 如果用户钱包不支持加密密钥派生，如何处理？

**建议**：在实现前明确加密库选型（推荐 tweetnacl 或 @noble/curves）和密钥格式（hex 或 base64）。

### 风险 2：profileURI 和 taskURI 的生成时机
**位置**：PRD 4.3 混合方案  
**风险描述**：PRD 给出了 URI 示例格式，但未明确：
- 前端调用 register() 前是否需要先上传 profile 到 backend 获取 URI？
- 还是前端先调用 register()，backend 监听事件后生成 URI？
- 如果 backend 服务挂了，register() 已成功但 profile 未存储，如何处理？

**建议**：明确流程为"前端先上传 → backend 返回 URI → 前端调用 register(URI)"，并在 backend 实现幂等性。

### 风险 3：超时函数的 Gas 费承担
**位置**：PRD 1.3 超时规则  
**风险描述**：PRD 规定"任何人可触发超时"，但未明确：
- 触发超时的 Gas 费由谁承担？
- 是否需要激励机制鼓励第三方触发？
- Helper 失踪时，Creator 是否愿意支付 Gas 触发 progressTimeout？

**建议**：MVP 阶段接受"触发者自付 Gas"，V2 考虑从合约余额补偿或引入 Keeper 网络。

### 风险 4：Request Fix 的链下更新验证
**位置**：PRD 2.12 请求修正流程  
**风险描述**：PRD 规定"Helper 链下更新工作内容，链上不重复调用 submitWork"，但未明确：
- 链下更新如何通知 Creator？
- Creator 如何验证 Helper 确实更新了内容？
- 如果 Helper 不更新，Creator 只能等待延长期结束吗？

**建议**：backend 提供 task update API，前端显示"已更新"标记，但不强制验证（信任 Helper 诚信）。

### 风险 5：合约部署顺序与地址依赖
**位置**：PRD 钉子 1、钉子 2、5.2 架构依赖  
**风险描述**：三个合约互相依赖：
- EOCHO 需要 Register 和 TaskEscrow 地址
- Register 需要 EOCHO 地址
- TaskEscrow 需要 EOCHO 和 Register 地址

**建议**：部署顺序为：
1. 部署 EOCHO（构造函数暂不传地址，或使用 setter）
2. 部署 Register（传入 EOCHO 地址）
3. 部署 TaskEscrow（传入 EOCHO 和 Register 地址）
4. 调用 EOCHO.setRegisterAddress() 和 setTaskEscrowAddress()

---

## 5. 下一步行动

### 立即行动（本周）
1. **合约开发**：按 P0-C1/C2/C3 顺序实现三个核心合约
2. **测试编写**：同步编写 P0-T1 合约单元测试
3. **Backend 搭建**：实现 P0-B1/B2 profile 和 task 存储服务
4. **Frontend 框架**：搭建 React + ethers.js 项目，实现 P0-F1 钱包连接

### 短期目标（2 周内）
1. 完成所有 P0 任务（核心功能）
2. 部署到测试网（Sepolia 或 Mumbai）
3. 完成 P0-T2 状态机集成测试
4. 前端实现任务广场和详情页（P0-F2）

### 中期目标（1 个月内）
1. 完成所有 P1 任务（重要体验）
2. 完成 P1-T3/T4 API 测试和 E2E 测试
3. 内部测试和 Bug 修复
4. 准备主网部署

---

**工程草案状态**：✅ 已完成，待团队评审  
**下次更新**：开发启动后根据实际情况调整任务优先级
