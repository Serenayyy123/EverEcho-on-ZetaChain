# Base Sepolia 网络切换配置清单

## 📋 网络信息

### Base Sepolia Testnet
- **Chain ID**: `84532` (十六进制: `0x14a34`)
- **RPC URL**: `https://sepolia.base.org`
- **Block Explorer**: `https://sepolia.basescan.org`
- **Native Currency**: ETH
- **Faucet**: https://www.alchemy.com/faucets/base-sepolia

---

## 🔧 配置变更清单

### 1. 根目录配置

#### `.env.example`
```env
# Base Sepolia 测试网配置
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here

# Basescan API Key (用于验证合约)
BASESCAN_API_KEY=your_basescan_api_key_here
```

**变更说明**：
- `SEPOLIA_RPC_URL` → `BASE_SEPOLIA_RPC_URL`
- RPC URL: `https://rpc.sepolia.org` → `https://sepolia.base.org`
- `ETHERSCAN_API_KEY` → `BASESCAN_API_KEY`

---

### 2. 前端配置

#### `frontend/.env.example`
```env
# Network Configuration
VITE_CHAIN_ID=84532

# Contract Addresses (填入部署后的地址)
VITE_EOCHO_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
VITE_REGISTER_ADDRESS=0x0000000000000000000000000000000000000000
VITE_TASK_ESCROW_ADDRESS=0x0000000000000000000000000000000000000000
```

**变更说明**：
- `VITE_CHAIN_ID`: `11155111` → `84532`
- 注释更新: `Sepolia Testnet: 11155111` → `Base Sepolia Testnet: 84532`

#### `frontend/src/contracts/addresses.ts`
```typescript
// Base Sepolia Testnet (84532)
const BASE_SEPOLIA_ADDRESSES: ContractAddresses = {
  echoToken: import.meta.env.VITE_EOCHO_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
  register: import.meta.env.VITE_REGISTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  taskEscrow: import.meta.env.VITE_TASK_ESCROW_ADDRESS || '0x0000000000000000000000000000000000000000',
};

export function getContractAddresses(chainId: number): ContractAddresses {
  switch (chainId) {
    case 84532: // Base Sepolia
      return BASE_SEPOLIA_ADDRESSES;
    case 31337: // Hardhat Local
      return HARDHAT_ADDRESSES;
    default:
      console.warn(`Unknown chainId ${chainId}, using Base Sepolia addresses`);
      return BASE_SEPOLIA_ADDRESSES;
  }
}

export const SUPPORTED_CHAIN_IDS = [84532, 31337];
export const DEFAULT_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '84532');
```

**变更说明**：
- `SEPOLIA_ADDRESSES` → `BASE_SEPOLIA_ADDRESSES`
- Chain ID: `11155111` → `84532`
- `SUPPORTED_CHAIN_IDS`: `[11155111, 31337]` → `[84532, 31337]`
- `DEFAULT_CHAIN_ID`: `'11155111'` → `'84532'`

#### `frontend/src/hooks/useWallet.ts`
```typescript
const networkConfigs: Record<number, any> = {
  84532: {
    chainId: '0x14a34',
    chainName: 'Base Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
  },
};
```

**变更说明**：
- Chain ID: `11155111` → `84532`
- Chain ID (hex): `'0xaa36a7'` → `'0x14a34'`
- Chain Name: `'Sepolia'` → `'Base Sepolia'`
- RPC URL: `['https://rpc.sepolia.org']` → `['https://sepolia.base.org']`
- Explorer: `['https://sepolia.etherscan.io']` → `['https://sepolia.basescan.org']`

---

### 3. 后端配置

#### `backend/.env.example`
```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3000

# Blockchain
RPC_URL="https://sepolia.base.org"
TASK_ESCROW_ADDRESS="0x..."
CHAIN_ID=84532
```

**变更说明**：
- `RPC_URL`: `"http://localhost:8545"` → `"https://sepolia.base.org"`
- 新增 `CHAIN_ID=84532`

#### `backend/src/index.ts`
```typescript
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
```

**变更说明**：
- 默认 RPC: `'https://ethereum-sepolia-rpc.publicnode.com'` → `'https://sepolia.base.org'`

#### `backend/src/services/chainService.ts`
```typescript
const rpcUrls = [
  rpcUrl,
  'https://sepolia.base.org',
  'https://base-sepolia-rpc.publicnode.com',
];
```

**变更说明**：
- 移除 Ethereum Sepolia RPC 端点
- 添加 Base Sepolia RPC 端点

---

### 4. 部署脚本

#### `scripts/deployTaskEscrowOnly.ts`
```typescript
const deploymentInfo = {
  network: "base-sepolia",
  chainId: 84532,
  deployer: deployer.address,
  timestamp: new Date().toISOString(),
```

**变更说明**：
- `network`: `"sepolia"` → `"base-sepolia"`
- `chainId`: `11155111` → `84532`

---

## 📝 部署步骤

### 1. 获取 Base Sepolia 测试 ETH
访问 Alchemy Faucet: https://www.alchemy.com/faucets/base-sepolia

### 2. 配置环境变量

**根目录 `.env`**:
```env
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=你的私钥
BASESCAN_API_KEY=你的Basescan_API_Key
```

**前端 `frontend/.env`**:
```env
VITE_BACKEND_BASE_URL=http://localhost:3001
VITE_CHAIN_ID=84532
VITE_EOCHO_TOKEN_ADDRESS=部署后填入
VITE_REGISTER_ADDRESS=部署后填入
VITE_TASK_ESCROW_ADDRESS=部署后填入
```

**后端 `backend/.env`**:
```env
DATABASE_URL="file:./dev.db"
PORT=3001
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=部署后填入
CHAIN_ID=84532
ENABLE_EVENT_LISTENER=true
ENABLE_CHAIN_SYNC=true
```

### 3. 部署合约

```bash
# 编译合约
npx hardhat compile

# 部署到 Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**注意**: 需要在 `hardhat.config.ts` 中添加 `baseSepolia` 网络配置：
```typescript
baseSepolia: {
  url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 84532,
}
```

### 4. 更新合约地址

部署完成后，将三个合约地址填入：
- `frontend/.env` 的 `VITE_*_ADDRESS`
- `backend/.env` 的 `TASK_ESCROW_ADDRESS`

### 5. 启动服务

```bash
# 后端
cd backend
npm run dev

# 前端
cd frontend
npm run dev
```

### 6. 配置 MetaMask

1. 打开 MetaMask
2. 添加网络
3. 填入以下信息：
   - 网络名称: `Base Sepolia`
   - RPC URL: `https://sepolia.base.org`
   - 链 ID: `84532`
   - 货币符号: `ETH`
   - 区块浏览器: `https://sepolia.basescan.org`

---

## ✅ 验证清单

### 前端验证
- [ ] `SUPPORTED_CHAIN_IDS` 包含 `84532`
- [ ] `DEFAULT_CHAIN_ID` 为 `84532`
- [ ] NetworkGuard 在 Base Sepolia 上不阻断
- [ ] 合约地址正确配置
- [ ] MetaMask 可以连接到 Base Sepolia

### 后端验证
- [ ] RPC URL 指向 Base Sepolia
- [ ] `CHAIN_ID` 环境变量为 `84532`
- [ ] chainService 使用 Base Sepolia RPC
- [ ] eventListener 可以监听 Base Sepolia 事件
- [ ] healthz 检查目标链为 Base Sepolia

### 合约验证
- [ ] 合约成功部署到 Base Sepolia
- [ ] 可以在 Basescan 上查看合约
- [ ] 合约地址已更新到配置文件

---

## 🔗 相关链接

- **Base Sepolia Explorer**: https://sepolia.basescan.org
- **Base Sepolia Faucet**: https://www.alchemy.com/faucets/base-sepolia
- **Base 官方文档**: https://docs.base.org
- **Base RPC 端点**: https://docs.base.org/docs/network-information

---

## 📊 网络对比

| 项目 | Ethereum Sepolia | Base Sepolia |
|------|------------------|--------------|
| Chain ID | 11155111 | 84532 |
| RPC URL | https://rpc.sepolia.org | https://sepolia.base.org |
| Explorer | https://sepolia.etherscan.io | https://sepolia.basescan.org |
| Faucet | https://sepoliafaucet.com | https://www.alchemy.com/faucets/base-sepolia |
| Gas Token | ETH | ETH |
| 区块时间 | ~12s | ~2s |
| Gas 费用 | 较高 | 较低 |

---

## ⚠️ 重要提醒

1. **不要修改业务逻辑**: 本次切换只改配置，不改任何 hooks、组件、合约逻辑
2. **保持冻结点不变**: 所有冻结点语义保持 100% 不变
3. **合约需要重新部署**: Base Sepolia 是独立网络，需要重新部署所有合约
4. **测试 ETH 获取**: 使用 Alchemy Faucet 获取 Base Sepolia 测试 ETH
5. **RPC 稳定性**: Base Sepolia 官方 RPC 较稳定，如需备用可使用 Alchemy

---

**切换完成日期**: 2025-11-25  
**切换版本**: v1.0 → v1.1 (Base Sepolia)  
**业务逻辑版本**: 保持不变 (A4 验收版本)
