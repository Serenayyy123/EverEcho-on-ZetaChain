# 基于资产地址的余额检查解决方案

## 问题分析

您提出了一个很好的问题：**为什么创建一个指定网络的provider来检查余额，而不是根据奖励资产的地址去调用API查询呢？**

这确实是一个更合理和更智能的方法！

## 两种方法对比

### ❌ 之前的方法：创建指定网络Provider
```typescript
// 硬编码RPC端点
const rpcUrl = sourceChainId === 11155111 
  ? 'https://sepolia.infura.io/v3/...' 
  : 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';

const networkProvider = new ethers.JsonRpcProvider(rpcUrl);
const balance = await networkProvider.getBalance(address);
```

**问题：**
- 需要硬编码RPC端点
- 依赖外部RPC服务可用性
- 需要维护不同网络的RPC配置
- 可能有API限制和延迟问题
- 不够灵活，难以扩展

### ✅ 新方法：基于资产地址的智能查询
```typescript
// 根据资产类型智能选择查询方法
if (rewardPlan.asset === '0x0000000000000000000000000000000000000000') {
  // ETH Sepolia 原生代币
  balance = await checkNativeTokenBalance(address, 11155111);
} else if (rewardPlan.asset === 'ZETA_NATIVE') {
  // ZetaChain 原生代币  
  balance = await checkNativeTokenBalance(address, 7001);
} else {
  // ERC20代币 (如USDC)
  balance = await checkERC20TokenBalance(address, rewardPlan.asset, 11155111);
}
```

## 技术实现

### 1. 智能余额检查函数

```typescript
// 原生代币余额检查
async function checkNativeTokenBalance(address: string, chainId: number): Promise<bigint> {
  try {
    // 方法1：优先使用钱包API
    const balanceHex = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    return BigInt(balanceHex);
  } catch (error) {
    // 方法2：降级到公共RPC
    const rpcUrls = {
      11155111: 'https://sepolia.infura.io/v3/...',
      7001: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public'
    };
    const provider = new ethers.JsonRpcProvider(rpcUrls[chainId]);
    return await provider.getBalance(address);
  }
}

// ERC20代币余额检查
async function checkERC20TokenBalance(address: string, tokenAddress: string, chainId: number): Promise<bigint> {
  try {
    // 方法1：优先使用当前provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );
    return await tokenContract.balanceOf(address);
  } catch (error) {
    // 方法2：降级到指定网络RPC
    const provider = new ethers.JsonRpcProvider(rpcUrls[chainId]);
    const tokenContract = new ethers.Contract(tokenAddress, abi, provider);
    return await tokenContract.balanceOf(address);
  }
}
```

### 2. 主要余额检查逻辑

```typescript
const handlePrepareReward = async () => {
  // 根据资产类型智能检查余额
  const selectedAsset = getSelectedAsset();
  let balance: bigint;
  
  if (rewardPlan.asset === '0x0000000000000000000000000000000000000000') {
    // ETH Sepolia 原生代币
    balance = await checkNativeTokenBalance(address, 11155111);
  } else if (rewardPlan.asset === 'ZETA_NATIVE') {
    // ZetaChain 原生代币
    balance = await checkNativeTokenBalance(address, 7001);
  } else {
    // ERC20代币 (如USDC)
    balance = await checkERC20TokenBalance(address, rewardPlan.asset, 11155111);
  }
  
  const balanceFormatted = parseFloat(ethers.formatUnits(balance, selectedAsset.decimals));
  
  // 检查余额是否充足
  if (balanceFormatted < amount) {
    throw new Error(`余额不足。当前余额: ${balanceFormatted.toFixed(4)} ${selectedAsset.symbol}，需要: ${amount} ${selectedAsset.symbol}`);
  }
  
  // 余额检查通过
  setRewardPlan(prev => ({ ...prev, status: 'prepared' }));
};
```

## 优势分析

### 1. 更智能的资产识别
- ✅ **原生代币识别**：自动识别ETH和ZETA原生代币
- ✅ **ERC20代币支持**：通过合约地址调用balanceOf
- ✅ **精确的小数位处理**：根据代币decimals正确格式化余额

### 2. 多重降级策略
- ✅ **优先钱包API**：首先尝试使用用户钱包的API
- ✅ **降级到RPC**：如果钱包API失败，使用公共RPC
- ✅ **错误处理**：清晰的错误信息和降级机制

### 3. 更好的用户体验
- ✅ **自动适配**：根据资产类型自动选择最佳查询方法
- ✅ **准确显示**：正确显示代币符号和小数位
- ✅ **快速响应**：优先使用最快的查询方法

### 4. 更易维护
- ✅ **模块化设计**：独立的函数处理不同类型的资产
- ✅ **易于扩展**：添加新资产类型只需扩展判断逻辑
- ✅ **配置集中**：RPC配置集中管理

## 资产类型处理

### 原生代币 (Native Tokens)
```typescript
// ETH Sepolia
asset: '0x0000000000000000000000000000000000000000'
→ checkNativeTokenBalance(address, 11155111)

// ZetaChain ZETA  
asset: 'ZETA_NATIVE'
→ checkNativeTokenBalance(address, 7001)
```

### ERC20代币
```typescript
// USDC on ETH Sepolia
asset: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
→ checkERC20TokenBalance(address, tokenAddress, 11155111)
```

## 错误处理策略

### 1. 分层错误处理
```typescript
try {
  // 方法1：钱包API
  return await walletAPI();
} catch (error) {
  try {
    // 方法2：公共RPC
    return await publicRPC();
  } catch (fallbackError) {
    // 最终错误
    throw new Error('无法检查余额，请检查网络连接');
  }
}
```

### 2. 用户友好的错误信息
- **网络问题**：提示检查网络连接
- **钱包问题**：提示检查钱包配置
- **代币问题**：提示确认代币地址和网络

## 扩展性

### 添加新资产类型
```typescript
// 只需在主逻辑中添加新的判断分支
if (rewardPlan.asset === 'NEW_TOKEN_ADDRESS') {
  balance = await checkERC20TokenBalance(address, rewardPlan.asset, CHAIN_ID);
}
```

### 添加新网络
```typescript
// 只需在RPC配置中添加新网络
const rpcUrls: Record<number, string> = {
  11155111: 'https://sepolia.infura.io/v3/...',
  7001: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
  // 新网络
  80001: 'https://polygon-mumbai.infura.io/v3/...'
};
```

## 总结

基于资产地址的余额检查方法确实比创建指定网络provider的方法更优秀：

1. **更智能**：根据资产类型自动选择最佳查询方法
2. **更可靠**：多重降级策略确保查询成功
3. **更准确**：正确处理不同代币的小数位和符号
4. **更易维护**：模块化设计，易于扩展和维护
5. **更好的UX**：快速响应，清晰的错误提示

这种方法体现了"根据数据特征选择处理方式"的设计思想，比"根据网络配置硬编码处理方式"更加灵活和智能。

感谢您的建议，这确实是一个更好的解决方案！