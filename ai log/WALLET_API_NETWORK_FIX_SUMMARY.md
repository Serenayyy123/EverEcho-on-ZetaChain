# 钱包API网络问题修复总结

## 问题描述

用户报告：**API调用错误，这个余额根本不是钱包正确的余额，仍然是ZetaChain的**

### 问题分析

从控制台日志可以看到：
- 显示余额：`20.054885875903494 ETH`
- 但这实际上是 ZetaChain 网络上的余额，不是 ETH Sepolia 的余额
- 用户选择了 "ETH Sepolia" 资产，但获取的是当前连接网络（ZetaChain）的余额

## 根本原因

### 错误的实现方式

```typescript
// ❌ 问题代码：总是返回当前网络余额
async function checkNativeTokenBalance(address: string, chainId: number): Promise<bigint> {
  try {
    // 这个调用总是返回当前连接网络的余额，忽略 chainId 参数
    const balanceHex = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    return BigInt(balanceHex);
  } catch (error) {
    // 只有在第一种方法失败时才使用正确的网络RPC
    const provider = new ethers.JsonRpcProvider(rpcUrls[chainId]);
    return await provider.getBalance(address);
  }
}
```

### 问题所在

1. **`window.ethereum.request({ method: 'eth_getBalance' })` 的行为**：
   - 这个API调用总是返回**当前连接网络**的余额
   - 不管传入什么 `chainId` 参数，都无法改变这个行为
   - 如果用户连接到 ZetaChain，就会返回 ZetaChain 的余额

2. **降级逻辑的问题**：
   - 正确的网络RPC调用被放在了 `catch` 块中
   - 只有当钱包API失败时才会使用正确的网络
   - 但钱包API通常不会失败，只是返回错误网络的数据

## 解决方案

### 修复后的实现

```typescript
// ✅ 修复后：直接使用指定网络的RPC
async function checkNativeTokenBalance(address: string, chainId: number): Promise<bigint> {
  console.log(`🔍 Checking native token balance on chain ${chainId} for address ${address}`);
  
  // 直接使用指定网络的RPC，不依赖当前钱包网络
  const rpcUrls: Record<number, string> = {
    11155111: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    7001: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public'
  };
  
  const rpcUrl = rpcUrls[chainId];
  if (!rpcUrl) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    console.log(`✅ Balance on chain ${chainId}: ${ethers.formatEther(balance)} ETH`);
    return balance;
  } catch (error) {
    console.error(`❌ Error checking balance on chain ${chainId}:`, error);
    throw error;
  }
}
```

### 关键改进

1. **移除钱包API依赖**：
   - 不再使用 `window.ethereum.request({ method: 'eth_getBalance' })`
   - 直接使用指定网络的RPC端点

2. **确保网络准确性**：
   - 每次调用都明确指定要查询的网络
   - 不受用户当前连接网络的影响

3. **添加调试日志**：
   - 明确显示正在查询哪个网络
   - 显示查询结果，便于验证

## 技术细节

### 网络映射

| 资产类型 | 网络 | Chain ID | RPC端点 |
|----------|------|----------|---------|
| ETH Sepolia | ETH Sepolia | 11155111 | `https://sepolia.infura.io/v3/...` |
| ZetaChain ZETA | ZetaChain | 7001 | `https://zetachain-athens-evm.blockpi.network/v1/rpc/public` |
| ETH Sepolia USDC | ETH Sepolia | 11155111 | `https://sepolia.infura.io/v3/...` |

### 修复的函数

1. **`checkNativeTokenBalance()`**：
   - 用于检查 ETH 和 ZETA 原生代币余额
   - 直接使用对应网络的RPC

2. **`checkERC20TokenBalance()`**：
   - 用于检查 USDC 等ERC20代币余额
   - 同样直接使用对应网络的RPC

## 用户体验改进

### 修复前
- ❌ 选择 "ETH Sepolia" 显示 ZetaChain 余额
- ❌ 用户困惑，无法准确判断余额
- ❌ 可能导致错误的交易决策

### 修复后
- ✅ 选择 "ETH Sepolia" 显示真实的 ETH Sepolia 余额
- ✅ 选择 "ZetaChain ZETA" 显示真实的 ZetaChain 余额
- ✅ 选择 "ETH Sepolia USDC" 显示真实的 USDC 余额
- ✅ 用户可以准确了解各网络的真实余额

## 测试验证

### 预期行为

现在当用户点击"准备跨链奖励"按钮时，控制台应该显示：

```
🔍 Checking native token balance on chain 11155111 for address 0x...
✅ Balance on chain 11155111: 0.123456 ETH
✅ Updated UI balance: 0.123456 ETH
Balance check: 0.123456 ETH, required: 0.01 ETH
Balance check passed. Ready for deposit.
```

### 验证步骤

1. **选择不同资产**：
   - ETH Sepolia → 应显示 ETH Sepolia 网络的真实余额
   - ZetaChain ZETA → 应显示 ZetaChain 网络的真实余额
   - ETH Sepolia USDC → 应显示 ETH Sepolia 网络的 USDC 余额

2. **检查控制台日志**：
   - 确认查询的是正确的网络 ID
   - 确认返回的余额是对应网络的真实余额

## 相关文件

### 修改的文件
- `frontend/src/components/ui/CrossChainRewardSection.tsx`
  - 修复 `checkNativeTokenBalance()` 函数
  - 修复 `checkERC20TokenBalance()` 函数
  - 添加调试日志

### 文档总结
- `WALLET_API_NETWORK_FIX_SUMMARY.md` - 本修复总结文档

## 总结

这个修复解决了跨链奖励功能中一个关键的准确性问题：

1. **问题根源**：钱包API总是返回当前网络余额，不是指定网络余额
2. **解决方案**：直接使用指定网络的RPC端点查询余额
3. **用户体验**：现在用户可以看到各网络的真实余额
4. **技术实现**：移除对钱包当前网络的依赖，确保查询准确性

修复后，跨链奖励功能现在可以准确显示用户在不同网络上的真实余额，确保用户做出正确的交易决策。