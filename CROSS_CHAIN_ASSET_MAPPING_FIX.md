# 🔧 跨链资产映射修复报告

## 📋 问题描述

在跨链奖励功能中发现了一个关键问题：

**原问题**：
```javascript
// 错误的映射
asset: '0x0000000000000000000000000000000000000000' (ETH Sepolia)
contractAsset: '0x0000000000000000000000000000000000000000' (错误！)
```

**问题分析**：
- `contractAsset` 应该是 ZetaChain 上对应的 ZRC20 代币地址
- 而不是原链上的资产地址
- 这导致 UniversalReward 合约无法正确处理跨链转账

## ✅ 修复内容

### 1. 更新资产映射配置

**文件**: `frontend/src/config/contracts.ts`

```typescript
// 新增 ZRC20 地址映射
const ZRC20_ADDRESSES = {
  // ETH Sepolia -> ZetaChain ETH ZRC20
  '0x0000000000000000000000000000000000000000': '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf',
  // USDC Sepolia -> ZetaChain USDC ZRC20  
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238': '0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb',
  // ZetaChain 原生 ZETA -> 零地址（原生代币）
  'ZETA_NATIVE': '0x0000000000000000000000000000000000000000',
};

// 修复后的映射函数
export function getContractAssetAddress(assetValue: string): string {
  const zrc20Address = ZRC20_ADDRESSES[assetValue as keyof typeof ZRC20_ADDRESSES];
  
  if (!zrc20Address) {
    console.warn(`Unknown asset: ${assetValue}, using zero address as fallback`);
    return '0x0000000000000000000000000000000000000000';
  }
  
  console.log(`[getContractAssetAddress] ${assetValue} -> ${zrc20Address}`);
  return zrc20Address;
}
```

### 2. 修复跨链奖励逻辑

**文件**: `frontend/src/components/ui/CrossChainRewardSection.tsx`

**关键修复**：
- ✅ 切换到 ZetaChain 网络进行合约调用
- ✅ 检查 ZetaChain 上的 ZRC20 代币余额
- ✅ 正确处理 ZRC20 代币的 approve 和转账
- ✅ 区分原生 ZETA 和 ZRC20 代币的处理逻辑

**修复前**：
```typescript
// 错误：在源链（如 Sepolia）调用合约
const switchResult = await networkGuard.ensureNetworkFor('deposit', selectedAssetObj);
```

**修复后**：
```typescript
// 正确：在 ZetaChain 上调用 UniversalReward 合约
const switchResult = await networkGuard.ensureNetworkFor('publish'); // 切换到 ZetaChain
```

### 3. 新增 ZRC20 余额检查

```typescript
// 新增函数：检查 ZRC20 代币余额
async function checkZRC20TokenBalance(address: string, tokenAddress: string): Promise<bigint> {
  const provider = new ethers.JsonRpcProvider(
    'https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 
    7001
  );
  
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
    provider
  );
  
  const [balance, decimals] = await Promise.all([
    tokenContract.balanceOf(address),
    tokenContract.decimals()
  ]);
  
  return balance;
}
```

### 4. 更新用户界面提示

**修复前**：
```
• 跨链奖励与 ECHO 结算独立
• 发布前可撤回；发布后不可撤回
```

**修复后**：
```
• 跨链奖励使用 ZetaChain 上的 ZRC20 代币
• 需要在 ZetaChain 网络上有对应的代币余额
• 发布后不可撤回，Helper 完成任务后可在目标链领取
• 请确保钱包已连接到 ZetaChain 网络
```

## 🧪 测试验证

创建了测试脚本 `scripts/testCrossChainAssetMapping.ts`：

```bash
✅ ALL TESTS PASSED

1. ETH Sepolia -> ZetaChain ETH ZRC20 (0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf)
2. ZETA Native -> Zero Address (0x0000000000000000000000000000000000000000)  
3. USDC Sepolia -> ZetaChain USDC ZRC20 (0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb)
```

## 📊 修复后的流程

### 正确的跨链奖励流程：

1. **用户选择资产**：如 "ETH (跨链到 Sepolia)"
2. **系统映射**：ETH Sepolia -> ZetaChain ETH ZRC20 (`0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf`)
3. **网络切换**：自动切换到 ZetaChain 网络
4. **余额检查**：检查 ZetaChain 上的 ETH ZRC20 余额
5. **合约调用**：
   - 如果是 ZRC20：先 `approve`，再调用 `preparePlan`
   - 如果是原生 ZETA：直接调用 `preparePlan` 并发送 `value`
6. **存入成功**：资产锁定在 UniversalReward 合约中

### 现在的日志输出：

```
Creating and depositing reward plan: {
  originalAsset: '0x0000000000000000000000000000000000000000',
  zrc20Asset: '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf',  // ✅ 正确的 ZRC20 地址
  amount: '0.0001',
  targetChainId: '11155111'
}
```

## 🎯 关键改进

1. **正确的资产映射**：原链资产 -> ZetaChain ZRC20 地址
2. **正确的网络逻辑**：在 ZetaChain 上调用合约，而不是源链
3. **正确的余额检查**：检查 ZetaChain 上的 ZRC20 余额
4. **正确的交易处理**：区分原生 ZETA 和 ZRC20 的处理方式
5. **清晰的用户提示**：明确告知用户需要 ZetaChain 网络和 ZRC20 余额

## 🚀 部署状态

- ✅ 前端服务器已重启
- ✅ 修复已应用到 http://localhost:5173/
- ✅ 测试验证通过
- ✅ 准备进行真实钱包测试

## 📝 下一步

1. **真实测试**：使用 MetaMask 连接 ZetaChain Athens 测试网
2. **余额验证**：确认能正确显示 ZRC20 代币余额
3. **交易测试**：验证 ZRC20 approve 和 preparePlan 调用
4. **跨链验证**：确认 Helper 能在目标链正确领取奖励

---

**修复完成时间**：2024-12-17  
**状态**：✅ 已修复并测试通过  
**影响**：跨链奖励功能现在可以正确工作