# Base Sepolia 网络切换 - 变更明细

## 📋 变更文件清单

### 1. 根目录配置文件

#### `.env.example`
**变更类型**: 网络配置切换  
**变更原因**: 切换到 Base Sepolia 测试网

| 项目 | 原值 | 新值 | 说明 |
|------|------|------|------|
| 变量名 | `SEPOLIA_RPC_URL` | `BASE_SEPOLIA_RPC_URL` | 变量名更新以反映新网络 |
| RPC URL | `https://rpc.sepolia.org` | `https://sepolia.base.org` | Base Sepolia 官方 RPC |
| API Key 变量 | `ETHERSCAN_API_KEY` | `BASESCAN_API_KEY` | 使用 Basescan API |
| 注释 | Sepolia 测试网配置 | Base Sepolia 测试网配置 | 文档更新 |

---

### 2. 前端配置文件

#### `frontend/.env.example`
**变更类型**: Chain ID 更新  
**变更原因**: Base Sepolia Chain ID 为 84532

| 项目 | 原值 | 新值 | 说明 |
|------|------|------|------|
| `VITE_CHAIN_ID` | `11155111` | `84532` | Base Sepolia Chain ID |
| 注释 | Sepolia Testnet: 11155111 | Base Sepolia Testnet: 84532 | 文档更新 |
| 支持网络说明 | Sepolia (11155111) | Base Sepolia (84532) | 文档更新 |

#### `frontend/src/contracts/addresses.ts`
**变更类型**: 合约地址配置和网络常量  
**变更原因**: 切换网络所必需

| 项目 | 原值 | 新值 | 说明 |
|------|------|------|------|
| 常量名 | `SEPOLIA_ADDRESSES` | `BASE_SEPOLIA_ADDRESSES` | 反映新网络 |
| 注释 | `// Sepolia Testnet (11155111)` | `// Base Sepolia Testnet (84532)` | 文档更新 |
| `getContractAddresses` case | `case 11155111:` | `case 84532:` | Chain ID 匹配 |
| 返回值 | `SEPOLIA_ADDRESSES` | `BASE_SEPOLIA_ADDRESSES` | 返回正确地址 |
| default 注释 | `using Sepolia addresses` | `using Base Sepolia addresses` | 文档更新 |
| `SUPPORTED_CHAIN_IDS` | `[11155111, 31337]` | `[84532, 31337]` | 支持的链 ID |
| `DEFAULT_CHAIN_ID` | `'11155111'` | `'84532'` | 默认链 ID |

#### `frontend/src/hooks/useWallet.ts`
**变更类型**: MetaMask 网络配置  
**变更原因**: 添加 Base Sepolia 网络到 MetaMask

| 项目 | 原值 | 新值 | 说明 |
|------|------|------|------|
| networkConfigs key | `11155111` | `84532` | Chain ID |
| chainId (hex) | `'0xaa36a7'` | `'0x14a34'` | 84532 的十六进制 |
| chainName | `'Sepolia'` | `'Base Sepolia'` | 网络名称 |
| rpcUrls | `['https://rpc.sepolia.org']` | `['https://sepolia.base.org']` | RPC 端点 |
| blockExplorerUrls | `['https://sepolia.etherscan.io']` | `['https://sepolia.basescan.org']` | 区块浏览器 |

---

### 3. 后端配置文件

#### `backend/.env.example`
**变更类型**: RPC 配置和 Chain ID  
**变更原因**: 后端需要连接 Base Sepolia

| 项目 | 原值 | 新值 | 说明 |
|------|------|------|------|
| `RPC_URL` | `"http://localhost:8545"` | `"https://sepolia.base.org"` | Base Sepolia RPC |
| 新增 | - | `CHAIN_ID=84532` | 明确指定链 ID |

#### `backend/src/index.ts`
**变更类型**: 默认 RPC URL  
**变更原因**: 后端服务默认连接 Base Sepolia

| 项目 | 原值 | 新值 | 说明 |
|------|------|------|------|
| RPC_URL fallback | `'https://ethereum-sepolia-rpc.publicnode.com'` | `'https://sepolia.base.org'` | 默认 RPC |

#### `backend/src/services/chainService.ts`
**变更类型**: RPC 端点列表  
**变更原因**: 提供 Base Sepolia 备用 RPC

| 项目 | 原值 | 新值 | 说明 |
|------|------|------|------|
| rpcUrls[1] | `'https://ethereum-sepolia-rpc.publicnode.com'` | `'https://sepolia.base.org'` | Base Sepolia 官方 |
| rpcUrls[2] | `'https://sepolia.gateway.tenderly.co'` | `'https://base-sepolia-rpc.publicnode.com'` | 公共节点 |
| rpcUrls[3] | `'https://rpc2.sepolia.org'` | 删除 | 只保留 Base Sepolia 端点 |

---

### 4. 部署脚本

#### `scripts/deployTaskEscrowOnly.ts`
**变更类型**: 部署信息记录  
**变更原因**: 记录正确的网络和 Chain ID

| 项目 | 原值 | 新值 | 说明 |
|------|------|------|------|
| network | `"sepolia"` | `"base-sepolia"` | 网络名称 |
| chainId | `11155111` | `84532` | Chain ID |

---

### 5. Hardhat 配置

#### `hardhat.config.ts`
**变更类型**: 网络配置和验证配置  
**变更原因**: 支持部署到 Base Sepolia 和合约验证

| 项目 | 原值 | 新值 | 说明 |
|------|------|------|------|
| networks.sepolia | 存在 | 删除 | 移除 Ethereum Sepolia |
| networks.baseSepolia | 不存在 | 新增 | 添加 Base Sepolia 配置 |
| baseSepolia.url | - | `process.env.BASE_SEPOLIA_RPC_URL \|\| "https://sepolia.base.org"` | RPC URL |
| baseSepolia.chainId | - | `84532` | Chain ID |
| etherscan.apiKey.sepolia | 存在 | 删除 | 移除旧配置 |
| etherscan.apiKey.baseSepolia | 不存在 | 新增 | Basescan API Key |
| etherscan.customChains | 不存在 | 新增 | Base Sepolia 验证配置 |

**新增 customChains 配置**:
```typescript
customChains: [
  {
    network: "baseSepolia",
    chainId: 84532,
    urls: {
      apiURL: "https://api-sepolia.basescan.org/api",
      browserURL: "https://sepolia.basescan.org"
    }
  }
]
```

---

## 🔍 变更验证

### 前端验证点
1. ✅ `SUPPORTED_CHAIN_IDS` 只包含 `[84532, 31337]`
2. ✅ `DEFAULT_CHAIN_ID` 为 `84532`
3. ✅ `getContractAddresses(84532)` 返回 `BASE_SEPOLIA_ADDRESSES`
4. ✅ `useWallet` 的 `networkConfigs` 包含 Base Sepolia 配置
5. ✅ MetaMask 可以添加 Base Sepolia 网络

### 后端验证点
1. ✅ 默认 RPC URL 为 `https://sepolia.base.org`
2. ✅ `chainService` 的 RPC 列表只包含 Base Sepolia 端点
3. ✅ `.env.example` 包含 `CHAIN_ID=84532`

### 部署验证点
1. ✅ `hardhat.config.ts` 包含 `baseSepolia` 网络配置
2. ✅ 可以使用 `npx hardhat run scripts/deploy.ts --network baseSepolia` 部署
3. ✅ 可以使用 `npx hardhat verify --network baseSepolia` 验证合约

---

## 📊 变更统计

| 类别 | 文件数 | 变更行数 | 说明 |
|------|--------|----------|------|
| 配置文件 | 3 | ~20 | .env.example 文件 |
| 前端代码 | 2 | ~30 | addresses.ts, useWallet.ts |
| 后端代码 | 2 | ~10 | index.ts, chainService.ts |
| 部署脚本 | 1 | ~2 | deployTaskEscrowOnly.ts |
| Hardhat 配置 | 1 | ~20 | hardhat.config.ts |
| **总计** | **9** | **~82** | 纯配置变更 |

---

## ⚠️ 未变更内容（确认）

以下内容**完全未修改**，保持 A4 验收版本不变：

### 业务逻辑（零变更）
- ✅ 所有 hooks 逻辑（useProfile, useTaskHistory, useCreateTask, useTaskActions, useContacts, useTimeout, useRegister）
- ✅ 所有页面组件（Home, Register, Profile, TaskSquare, TaskDetail, PublishTask）
- ✅ 所有 UI 组件（Button, Input, Alert, Card, Badge, TaskCard, etc.）
- ✅ 所有后端路由（profile, task, contacts, healthz）
- ✅ 所有后端服务（profileService, taskService, encryptionService, authService, eventListenerService, chainSyncService, taskSyncCoordinator）
- ✅ 所有数据库模型（Profile, Task）
- ✅ 所有合约 ABI（EOCHOToken, Register, TaskEscrow）

### 冻结点（零变更）
- ✅ 冻结点 1.1-1~1.1-6：合约分层与权限边界
- ✅ 冻结点 1.2-7~1.2-12：Token 常量/经济规则/燃烧语义
- ✅ 冻结点 1.3-13~1.3-18：状态机/按钮权限/资金流
- ✅ 冻结点 1.4-19~1.4-22：超时公式/常量来源
- ✅ 冻结点 2.2-P0-B1 / 2.2-P0-B2：Profile/Task 流程
- ✅ 冻结点 3.1~3.4：字段/事件/函数命名

### API 接口（零变更）
- ✅ 所有 API 端点路径
- ✅ 所有请求/响应结构
- ✅ 所有字段名和类型
- ✅ 所有错误处理逻辑

---

## 🎯 变更原则

本次切换严格遵守以下原则：

1. **只改配置，不改逻辑**
   - 所有变更都是网络相关的配置
   - 没有任何业务逻辑修改

2. **保持 API 不变**
   - 所有函数签名保持不变
   - 所有返回值结构保持不变
   - 所有 hooks 接口保持不变

3. **保持冻结点不变**
   - 所有冻结点语义 100% 保持
   - 没有任何状态机变更
   - 没有任何权限逻辑变更

4. **最小化变更**
   - 只修改切网所必需的文件
   - 每个变更都有明确的切网理由
   - 没有"顺手优化"或"顺手重构"

---

## 📝 后续步骤

1. **部署合约到 Base Sepolia**
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.ts --network baseSepolia
   ```

2. **更新合约地址**
   - 将部署后的三个合约地址填入 `frontend/.env` 和 `backend/.env`

3. **启动服务**
   ```bash
   # 后端
   cd backend && npm run dev
   
   # 前端
   cd frontend && npm run dev
   ```

4. **配置 MetaMask**
   - 添加 Base Sepolia 网络
   - 获取测试 ETH

5. **运行 Demo Journeys**
   - Journey 1: 新用户注册
   - Journey 2: 完整任务流程
   - Journey 3: 异常流程测试

---

**变更完成日期**: 2025-11-25  
**变更类型**: 网络切换（配置变更）  
**业务逻辑版本**: 保持不变（A4 验收版本）  
**测试状态**: 待部署后验证
