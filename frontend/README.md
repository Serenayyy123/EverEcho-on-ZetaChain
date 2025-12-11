# EverEcho Frontend - P0-F1 钱包连接与注册

## 功能概述

P0-F1 实现了 EverEcho MVP 的钱包连接和用户注册功能。

### 已实现功能

- ✅ MetaMask 钱包连接
- ✅ 注册状态检查（Register.isRegistered）
- ✅ 用户注册表单（nickname, city, skills）
- ✅ 加密密钥对生成（encryptionPubKey）
- ✅ Profile 上传到 backend
- ✅ 调用 Register.register(profileURI)
- ✅ 注册成功后跳转任务广场

### 未实现功能（后续薄片）

- ❌ 任务广场业务逻辑
- ❌ Profile 更新
- ❌ 任务发布/接取
- ❌ Contacts 加密/解密

---

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入实际的合约地址：

```env
VITE_API_URL=http://localhost:3000
VITE_REGISTER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_EOCHO_TOKEN_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_TASK_ESCROW_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
VITE_CHAIN_ID=31337
VITE_NETWORK_NAME=Localhost
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 4. 确保 Backend 运行

```bash
cd backend
npm run dev
```

Backend 应该运行在 http://localhost:3000

---

## 项目结构

```
frontend/
├── src/
│   ├── contracts/          # 合约 ABI 和地址
│   │   ├── Register.json   # Register 合约 ABI
│   │   └── addresses.ts    # 合约地址配置
│   ├── hooks/              # React Hooks
│   │   ├── useWallet.ts    # 钱包连接 Hook
│   │   └── useRegister.ts  # 注册 Hook
│   ├── pages/              # 页面组件
│   │   ├── Home.tsx        # 首页（钱包连接）
│   │   ├── Register.tsx    # 注册页
│   │   └── TaskSquare.tsx  # 任务广场（占位）
│   ├── utils/              # 工具函数
│   │   ├── api.ts          # Backend API 调用
│   │   └── encryption.ts   # 加密密钥生成
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 入口文件
│   └── index.css           # 全局样式
├── package.json
├── vite.config.ts
└── README.md
```

---

## 关键设计

### 1. 钱包连接流程

```
用户访问首页 → 点击 "Connect Wallet"
→ MetaMask 弹窗授权
→ 获取地址和 signer
→ 检查 Register.isRegistered(address)
→ 已注册：跳转 /tasks
→ 未注册：跳转 /register
```

### 2. 注册流程（严格遵守冻结点 2.2-P0-F1）

```
1. 用户填写表单（nickname, city, skills）
2. 前端生成加密密钥对（tweetnacl）
3. 构造 Profile 数据（包含 encryptionPubKey）
4. POST /api/profile → 获得 profileURI
5. 调用 Register.register(profileURI)
6. 等待交易确认
7. 保存加密私钥到 localStorage
8. 跳转 /tasks
```

### 3. 加密密钥生成

使用 **tweetnacl** (x25519) 生成密钥对：

```typescript
const keyPair = nacl.box.keyPair();
const publicKey = Buffer.from(keyPair.publicKey).toString('hex');
const privateKey = Buffer.from(keyPair.secretKey).toString('hex');
```

- publicKey 上传到 backend（Profile.encryptionPubKey）
- privateKey 保存到 localStorage（MVP 简化实现）

### 4. Profile 数据结构

```typescript
interface ProfileData {
  address: string;
  nickname: string;
  city: string;
  skills: string[];
  encryptionPubKey: string;
}
```

冻结点 1.4-22：所有字段必填

---

## 冻结点遵守

### 冻结点 1.1-1 / 1.1-4 / 1.1-5：三合约分层

✅ 前端只调用 `Register.register(profileURI)`
✅ 不直接调用 EOCHOToken.mintInitial
✅ 合约地址通过配置文件管理

### 冻结点 1.4-22：Profile JSON schema

✅ 必填字段：nickname, city, skills, encryptionPubKey
✅ POST /api/profile 前保证字段齐全

### 冻结点 2.2-P0-F1：流程固定

✅ 1) 连接钱包 → 检查 isRegistered
✅ 2) 未注册 → 填表 → 先上传 profile 到 backend
✅ 3) backend 返回 profileURI
✅ 4) 前端调用 Register.register(profileURI)
✅ 5) 成功后跳转 TaskSquare

### 冻结点 3.2：JSON 字段命名一致

✅ 使用标准字段名，无变体

---

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **React Router v6** - 路由管理
- **ethers.js v6** - 以太坊交互
- **tweetnacl** - 加密密钥生成

---

## 环境要求

- Node.js >= 18
- MetaMask 浏览器扩展
- Backend 服务运行在 http://localhost:3000
- 合约已部署到本地网络或测试网

---

## 常见问题

### 1. MetaMask 未安装

错误：`Please install MetaMask`

解决：安装 MetaMask 浏览器扩展

### 2. 合约地址未配置

错误：`Contract call failed`

解决：在 `.env` 中配置正确的合约地址

### 3. Backend 未运行

错误：`Failed to fetch`

解决：启动 backend 服务（`cd backend && npm run dev`）

### 4. 网络不匹配

错误：`Wrong network`

解决：在 MetaMask 中切换到正确的网络（Localhost 或测试网）

---

## 下一步

P0-F1 完成后，后续薄片将实现：

- P0-F2：任务广场（浏览任务）
- P0-F3：发布任务
- P0-F4：接取任务
- P1-F5：Contacts 加密/解密

---

## 验收清单

- [x] Home 页可连接 MetaMask
- [x] 连接后读取地址并检查 Register.isRegistered(address)
- [x] 已注册：直接跳转 /tasks
- [x] 未注册：跳转 /register
- [x] Register 页表单字段完整（nickname, city, skills）
- [x] 注册时生成 encryptionPubKey
- [x] 提交链路：POST /api/profile → Register.register(profileURI)
- [x] 任一环节失败有明确错误提示
- [x] 不实现 profile 更新入口
- [x] 不实现其它页面业务（TaskSquare 只需跳转占位）
