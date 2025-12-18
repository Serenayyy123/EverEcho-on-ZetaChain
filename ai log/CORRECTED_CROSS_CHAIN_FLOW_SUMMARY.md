# 修正后的跨链奖励流程 - 完成

## 问题分析

用户指出了我之前实现的错误：我在prepare阶段就切换回了ZetaChain并调用了合约，但正确的流程应该是：

1. **Prepare阶段**：只检查余额，留在源网络
2. **Deposit阶段**：从源网络调用Universal Reward合约存入资金
3. **Publish Task阶段**：在ZetaChain上与TaskEscrow合约交互

## 修正后的正确流程

### 1. 用户选择资产
- ETH Sepolia (源网络: 11155111)
- ZetaChain Testnet (源网络: 7001) 
- ETH Sepolia USDC (源网络: 11155111)

### 2. 准备跨链奖励 (Prepare Phase)
**用户点击"准备跨链奖励"按钮**

```typescript
const handlePrepareReward = async () => {
  // 1. 获取资产对应的源网络
  const sourceChainId = getSourceNetworkForAsset(rewardPlan.asset);
  
  // 2. 切换到源网络检查余额
  if (currentNetwork !== sourceChainId) {
    await switchToNetwork(sourceChainId);
  }
  
  // 3. 检查余额
  const balance = await provider.getBalance(address);
  if (balance < requiredAmount) {
    throw new Error('余额不足');
  }
  
  // 4. 余额检查通过，状态设为prepared，留在源网络
  setRewardPlan(prev => ({ ...prev, status: 'prepared' }));
}
```

**关键点**：
- ✅ 只检查余额，不调用合约
- ✅ 留在源网络，不切换回ZetaChain
- ✅ 状态变为"prepared"，显示"存入资金"按钮

### 3. 存入资金 (Deposit Phase)
**用户点击"存入资金"按钮**

```typescript
const handleDeposit = async () => {
  // 1. 确保在源网络上
  const sourceChainId = getSourceNetworkForAsset(rewardPlan.asset);
  if (currentNetwork !== sourceChainId) {
    await switchToNetwork(sourceChainId);
  }
  
  // 2. 从源网络调用ZetaChain上的Universal Reward合约
  const contract = createUniversalRewardContract(signer, 7001);
  
  // 3. 创建并存入奖励计划
  const tx = await contract.preparePlan(asset, amount, targetChain, { value: amount });
  const receipt = await tx.wait();
  
  // 4. 获取rewardId
  const rewardId = parseEventForRewardId(receipt);
  setRewardPlan(prev => ({ ...prev, status: 'deposited', rewardId }));
}
```

**关键点**：
- ✅ 从源网络调用合约（跨链调用）
- ✅ 一次性完成创建和存入
- ✅ 获得rewardId用于后续TaskEscrow调用

### 4. 发布任务 (Publish Task Phase)
**用户点击"Publish Task"按钮**

```typescript
const proceedWithSubmission = async () => {
  // 1. 确保在ZetaChain网络上
  if (chainId !== 7001) {
    await switchToNetwork(7001);
  }
  
  // 2. 授权ECHO代币
  // 3. 调用TaskEscrow合约，传入rewardId
  const txHash = await createTask({
    ...taskParams,
    crossChainRewardId: crossChainRewardId
  });
}
```

**关键点**：
- ✅ 确保在ZetaChain网络上
- ✅ 与TaskEscrow合约交互
- ✅ 传入之前获得的rewardId

## 代码修改总结

### 1. CrossChainRewardSection.tsx 修改

**handlePrepareReward函数**：
- ❌ 移除：切换回ZetaChain的逻辑
- ❌ 移除：调用preparePlan合约的逻辑
- ✅ 保留：切换到源网络检查余额
- ✅ 新增：留在源网络，状态设为prepared

**handleDeposit函数**：
- ✅ 新增：确保在源网络上
- ✅ 新增：从源网络调用Universal Reward合约
- ✅ 新增：创建reward plan并存入资金
- ✅ 新增：解析rewardId并更新状态

**UI更新**：
- ✅ prepared状态显示"存入资金"按钮和提示
- ✅ 移除prepared状态的"取消计划"按钮
- ✅ 移除未使用的handleRefund函数

### 2. 网络切换逻辑优化

**ETH Sepolia流程**：
1. 切换到ETH Sepolia (11155111) → 检查ETH余额
2. 留在ETH Sepolia → 调用ZetaChain合约存入ETH
3. 切换到ZetaChain (7001) → 发布任务

**ZetaChain流程**：
1. 留在ZetaChain (7001) → 检查ZETA余额
2. 留在ZetaChain → 调用本地合约存入ZETA
3. 留在ZetaChain → 发布任务

**USDC流程**：
1. 切换到ETH Sepolia (11155111) → 检查USDC余额
2. 留在ETH Sepolia → 调用ZetaChain合约存入USDC
3. 切换到ZetaChain (7001) → 发布任务

## 用户体验改进

### 1. 更清晰的状态提示
- **准备阶段**：显示"余额检查通过，可以存入资金"
- **存入阶段**：显示"跨链奖励已准备就绪"
- **发布阶段**：正常的任务发布流程

### 2. 减少不必要的网络切换
- **之前**：源网络 → ZetaChain → 源网络 → ZetaChain
- **现在**：源网络 → ZetaChain（仅在必要时）

### 3. 更符合用户预期
- 用户在源网络上有资金
- 从源网络直接存入跨链合约
- 在ZetaChain上发布任务

## 技术实现细节

### 1. 资产配置
```typescript
export const SUPPORTED_ASSETS = [
  { value: '0x0000000000000000000000000000000000000000', label: 'ETH Sepolia', symbol: 'ETH' },
  { value: 'ZETA_NATIVE', label: 'ZetaChain Testnet', symbol: 'ZETA' },
  { value: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', label: 'ETH Sepolia USDC', symbol: 'USDC' }
];
```

### 2. 网络映射
```typescript
export function getSourceNetworkForAsset(assetValue: string): number {
  switch (assetValue) {
    case '0x0000000000000000000000000000000000000000': return 11155111; // ETH Sepolia
    case 'ZETA_NATIVE': return 7001; // ZetaChain
    case '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238': return 11155111; // ETH Sepolia USDC
    default: return 7001;
  }
}
```

### 3. 合约地址转换
```typescript
export function getContractAssetAddress(assetValue: string): string {
  if (assetValue === 'ZETA_NATIVE') {
    return '0x0000000000000000000000000000000000000000';
  }
  return assetValue;
}
```

## 测试验证

创建了完整的测试脚本 `scripts/testCorrectedCrossChainFlow.ts` 验证：
- ✅ 资产到网络的映射正确
- ✅ 网络切换逻辑符合要求
- ✅ 用户流程符合预期
- ✅ 所有三种资产类型都能正确处理

## 总结

修正后的跨链奖励流程现在完全符合用户的要求：

1. **准备阶段**：切换到源网络检查余额，留在源网络
2. **存入阶段**：从源网络调用Universal Reward合约存入资金
3. **发布阶段**：在ZetaChain上与TaskEscrow合约交互

这个流程更加合理，减少了不必要的网络切换，提供了更好的用户体验，并且符合跨链操作的实际需求。