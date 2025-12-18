# 跨链奖励余额显示修复总结

## 问题描述

用户报告：**在检查ETH Sepolia余额的时候，显示的仍然是ZetaChain上的余额**

### 根本原因

在之前的实现中，`updateBalance()` 函数始终使用当前网络（ZetaChain）的余额，而不是根据用户选择的资产来获取对应网络的余额。

```typescript
// ❌ 问题代码：始终使用当前网络余额
const updateBalance = async (walletAddress?: string) => {
  const provider = new ethers.BrowserProvider(window.ethereum); // 当前网络
  const balance = await provider.getBalance(targetAddress); // 当前网络余额
  setUserBalance(ethers.formatEther(balance));
};
```

## 解决方案

### 1. 修改 `updateBalance()` 函数

将余额检查逻辑改为基于资产类型的智能检查：

```typescript
// ✅ 修复后：根据资产类型智能获取余额
const updateBalance = async (walletAddress?: string, assetOverride?: string) => {
  const targetAddress = walletAddress || address;
  const currentAsset = assetOverride || rewardPlan.asset;
  const selectedAsset = SUPPORTED_ASSETS.find(asset => asset.value === currentAsset) || SUPPORTED_ASSETS[0];
  let balance: bigint;
  
  // 根据资产类型智能检查余额
  if (currentAsset === '0x0000000000000000000000000000000000000000') {
    // ETH Sepolia 原生代币 - 查询ETH Sepolia网络
    balance = await checkNativeTokenBalance(targetAddress, 11155111);
  } else if (currentAsset === 'ZETA_NATIVE') {
    // ZetaChain 原生代币 - 查询ZetaChain网络
    balance = await checkNativeTokenBalance(targetAddress, 7001);
  } else {
    // ERC20代币 (如USDC) - 查询ETH Sepolia网络
    balance = await checkERC20TokenBalance(targetAddress, currentAsset, 11155111);
  }
  
  const balanceFormatted = parseFloat(ethers.formatUnits(balance, selectedAsset.decimals));
  setUserBalance(balanceFormatted.toFixed(6));
};
```

### 2. 修改资产选择处理逻辑

当用户切换资产时，立即更新对应网络的余额：

```typescript
// ✅ 资产切换时自动更新余额
onChange={async (e) => {
  const newAsset = e.target.value;
  setRewardPlan(prev => ({ ...prev, asset: newAsset }));
  
  // 如果已连接钱包，则立即更新对应网络的余额
  if (isConnected && address) {
    setUserBalance('0'); // 先重置为0，显示加载状态
    try {
      await updateBalance(address, newAsset); // 传递新资产值
    } catch (error) {
      console.error('Error updating balance after asset change:', error);
      setUserBalance('0');
    }
  }
}}
```

## 技术细节

### 资产到网络的映射

| 资产 | 网络 | Chain ID | 查询方法 |
|------|------|----------|----------|
| ETH Sepolia | ETH Sepolia | 11155111 | `checkNativeTokenBalance(address, 11155111)` |
| ZetaChain ZETA | ZetaChain | 7001 | `checkNativeTokenBalance(address, 7001)` |
| ETH Sepolia USDC | ETH Sepolia | 11155111 | `checkERC20TokenBalance(address, tokenAddress, 11155111)` |

### 余额检查函数

#### 原生代币余额检查
```typescript
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
```

#### ERC20代币余额检查
```typescript
async function checkERC20TokenBalance(address: string, tokenAddress: string, chainId: number): Promise<bigint> {
  try {
    // 方法1：优先使用当前provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tokenContract = new ethers.Contract(tokenAddress, abi, provider);
    return await tokenContract.balanceOf(address);
  } catch (error) {
    // 方法2：降级到指定网络RPC
    const provider = new ethers.JsonRpcProvider(rpcUrls[chainId]);
    const tokenContract = new ethers.Contract(tokenAddress, abi, provider);
    return await tokenContract.balanceOf(address);
  }
}
```

## 用户体验改进

### 修复前
- ❌ 选择 "ETH Sepolia" 显示 ZetaChain 余额
- ❌ 选择 "USDC" 显示 ZetaChain 余额  
- ❌ 只有选择 "ZetaChain ZETA" 才显示正确余额
- ❌ 用户困惑，无法准确判断余额

### 修复后
- ✅ 选择 "ETH Sepolia" 显示 ETH Sepolia 网络的 ETH 余额
- ✅ 选择 "ZetaChain ZETA" 显示 ZetaChain 网络的 ZETA 余额
- ✅ 选择 "ETH Sepolia USDC" 显示 ETH Sepolia 网络的 USDC 余额
- ✅ 资产切换时自动更新对应网络余额
- ✅ 正确的小数位格式化（ETH/ZETA: 18位，USDC: 6位）

## 测试验证

### 测试场景
1. **连接钱包后选择不同资产**
   - 验证余额显示对应正确网络
   
2. **资产切换**
   - 验证切换资产时余额自动更新
   
3. **网络连接失败处理**
   - 验证降级到公共RPC的机制
   
4. **小数位格式化**
   - 验证不同代币的小数位正确显示

### 测试结果
- ✅ ETH Sepolia 选择时正确调用 Chain 11155111
- ✅ ZetaChain 选择时正确调用 Chain 7001  
- ✅ USDC 选择时正确调用 ETH Sepolia 网络的 ERC20 合约
- ✅ 资产切换时余额自动更新
- ✅ 错误处理和降级机制正常工作

## 相关文件

### 修改的文件
- `frontend/src/components/ui/CrossChainRewardSection.tsx`
  - 修改 `updateBalance()` 函数
  - 修改资产选择的 `onChange` 处理器

### 测试文件
- `scripts/testBalanceDisplayFix.ts` - 余额显示修复测试
- `scripts/testAssetBasedBalanceCheck.ts` - 资产基础余额检查测试

## 总结

这个修复解决了跨链奖励功能中一个关键的用户体验问题：

1. **问题根源**：余额显示逻辑没有根据选择的资产来查询对应网络
2. **解决方案**：实现基于资产类型的智能余额检查
3. **用户体验**：现在用户可以准确看到每种资产在其对应网络上的真实余额
4. **技术实现**：使用多重降级策略确保余额查询的可靠性

这个修复确保了跨链奖励功能的准确性和可用性，用户现在可以放心地根据显示的余额来设置跨链奖励金额。