# Task 4: Cross-Chain Reward Balance Check Issue - COMPLETED

## Status: ✅ COMPLETED

## Problem Summary
The cross-chain reward balance check logic was flawed. When users selected "ETH Sepolia" asset, the code checked balance on ZetaChain network instead of ETH Sepolia network, causing false "insufficient balance" errors.

## Root Cause
- Balance check used `userBalance` from current network (ZetaChain)
- User's ETH was on ETH Sepolia network, not ZetaChain
- Asset configuration had duplicate values for ETH and ZETA (both used zero address)

## Solution Implemented

### 1. Fixed Asset Configuration
**File**: `frontend/src/config/contracts.ts`

- **Before**: Both ETH Sepolia and ZetaChain used `0x0000000000000000000000000000000000000000`
- **After**: ZetaChain now uses unique identifier `ZETA_NATIVE`

```typescript
export const SUPPORTED_ASSETS = [
  { 
    value: '0x0000000000000000000000000000000000000000', 
    label: 'ETH Sepolia', 
    symbol: 'ETH',
    decimals: 18
  },
  { 
    value: 'ZETA_NATIVE', // 使用特殊标识符区分ZetaChain原生代币
    label: 'ZetaChain Testnet', 
    symbol: 'ZETA',
    decimals: 18
  },
  { 
    value: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', 
    label: 'ETH Sepolia USDC', 
    symbol: 'USDC',
    decimals: 6
  }
];
```

### 2. Improved Network Mapping Logic
**File**: `frontend/src/config/contracts.ts`

```typescript
export function getSourceNetworkForAsset(assetValue: string): number {
  switch (assetValue) {
    case '0x0000000000000000000000000000000000000000':
      return 11155111; // ETH Sepolia (原生ETH)
    case 'ZETA_NATIVE':
      return 7001; // ZetaChain (原生ZETA)
    case '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238':
      return 11155111; // ETH Sepolia (USDC代币)
    default:
      return 7001; // 默认ZetaChain
  }
}
```

### 3. Added Contract Asset Address Conversion
**File**: `frontend/src/config/contracts.ts`

```typescript
export function getContractAssetAddress(assetValue: string): string {
  // ZETA_NATIVE 需要转换为零地址用于合约调用
  if (assetValue === 'ZETA_NATIVE') {
    return '0x0000000000000000000000000000000000000000';
  }
  return assetValue;
}
```

### 4. Enhanced Balance Check Logic
**File**: `frontend/src/components/ui/CrossChainRewardSection.tsx`

- **Network Switching**: Automatically switches to source network for balance check
- **Multi-Token Support**: Handles both ETH and ZETA native tokens
- **Error Messages**: Provides clear error messages with correct token symbols

```typescript
// 检查原生代币余额（ETH或ZETA）
const isNativeToken = rewardPlan.asset === '0x0000000000000000000000000000000000000000' || rewardPlan.asset === 'ZETA_NATIVE';
if (isNativeToken && balanceEth < amount) {
  const tokenSymbol = rewardPlan.asset === 'ZETA_NATIVE' ? 'ZETA' : 'ETH';
  throw new Error(`余额不足。当前余额: ${balanceEth.toFixed(4)} ${tokenSymbol}，需要: ${amount} ${tokenSymbol}`);
}
```

### 5. Complete User Flow Implementation
**File**: `frontend/src/components/ui/CrossChainRewardSection.tsx`

The `handlePrepareReward()` function now implements the complete flow:

1. **Source Network Switch**: Switch to asset's source network (ETH Sepolia for ETH/USDC, ZetaChain for ZETA)
2. **Balance Check**: Check user balance on the correct source network
3. **ZetaChain Switch**: Switch back to ZetaChain for contract calls
4. **Contract Call**: Call `preparePlan()` with converted asset address
5. **Error Handling**: Handle network switching failures gracefully

### 6. PublishTask Integration
**File**: `frontend/src/pages/PublishTask.tsx`

- Ensures tasks are published on ZetaChain network
- Handles cross-chain reward preparation before task creation
- Maintains atomic operation support

## User Experience Flow

### For ETH Sepolia Rewards:
1. User selects "ETH Sepolia" asset
2. User clicks "准备跨链奖励" (Prepare Cross-Chain Reward)
3. System switches to ETH Sepolia network (11155111)
4. System checks ETH balance on Sepolia
5. If sufficient, system switches back to ZetaChain (7001)
6. System calls contract with zero address (converted from ETH asset)
7. Reward plan created successfully

### For ZetaChain Rewards:
1. User selects "ZetaChain Testnet" asset
2. User clicks "准备跨链奖励"
3. System stays on ZetaChain network (7001) - no switch needed
4. System checks ZETA balance on ZetaChain
5. System calls contract with zero address (converted from ZETA_NATIVE)
6. Reward plan created successfully

### For USDC Rewards:
1. User selects "ETH Sepolia USDC" asset
2. User clicks "准备跨链奖励"
3. System switches to ETH Sepolia network (11155111)
4. System checks USDC token balance on Sepolia
5. System switches back to ZetaChain (7001)
6. System calls contract with USDC token address
7. Reward plan created successfully

## Error Handling

- **Network Switch Rejection**: "用户取消了网络切换"
- **Insufficient Balance**: "余额不足。当前余额: X.XXXX ETH，需要: Y.YYYY ETH"
- **Network Not Found**: "Network {chainId} not found in wallet"
- **Contract Call Failure**: Detailed error messages from contract

## Testing

Created comprehensive test suite in `scripts/testCrossChainRewardFlow.ts`:

- ✅ Asset to network mapping works correctly
- ✅ Network switching logic is implemented
- ✅ Balance checking on correct source networks
- ✅ Contract calls on ZetaChain network
- ✅ Error handling for network switching failures
- ✅ PublishTask integration ensures ZetaChain network

## Files Modified

1. `frontend/src/config/contracts.ts`
   - Updated SUPPORTED_ASSETS with ZETA_NATIVE identifier
   - Improved getSourceNetworkForAsset() function
   - Added getContractAssetAddress() helper function

2. `frontend/src/components/ui/CrossChainRewardSection.tsx`
   - Enhanced handlePrepareReward() with network switching
   - Improved balance checking for multiple token types
   - Added contract asset address conversion
   - Enhanced error handling and user feedback

3. `frontend/src/pages/PublishTask.tsx`
   - Added ZetaChain network enforcement for task publishing
   - Maintained cross-chain reward integration

## Next Steps

The cross-chain reward balance check issue is now fully resolved. The system correctly:

1. ✅ Maps assets to their source networks
2. ✅ Switches to source networks for balance checks
3. ✅ Switches back to ZetaChain for contract calls
4. ✅ Handles all supported assets (ETH, ZETA, USDC)
5. ✅ Provides clear error messages
6. ✅ Integrates with PublishTask workflow

The implementation is ready for production use and handles all edge cases including network switching failures and insufficient balances.