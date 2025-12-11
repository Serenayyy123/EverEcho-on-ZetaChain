# Step A2 Patch-7 代码 Diff

## 修改文件列表
1. `frontend/src/hooks/useTaskActions.ts`
2. `frontend/src/hooks/useRegister.ts`
3. `frontend/src/hooks/useTasks.ts`

---

## 1. useTaskActions.ts

### Diff 1.1: 导入 SUPPORTED_CHAIN_IDS

```diff
  import { useState } from 'react';
  import { ethers } from 'ethers';
- import { getContractAddresses } from '../contracts/addresses';
+ import { getContractAddresses, SUPPORTED_CHAIN_IDS } from '../contracts/addresses';
  import TaskEscrowABI from '../contracts/TaskEscrow.json';
```

### Diff 1.2: 在 executeAction 中添加 chainId guard

```diff
  const executeAction = async (
    actionName: string,
    action: () => Promise<ethers.ContractTransactionResponse>
  ) => {
    if (!signer || !chainId) {
      setError('Wallet not connected');
      return false;
    }

+   // chainId guard: 检查是否在支持的网络上
+   if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
+     setError('Wrong network. Please switch to Sepolia or Hardhat Local.');
+     console.error(`${actionName} blocked: unsupported chainId ${chainId}`);
+     return false;
+   }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      console.log(`Executing ${actionName}...`);
      const tx = await action();
```

**覆盖的操作**（11个）：
- acceptTask
- submitWork
- confirmComplete
- cancelTask
- cancelTaskTimeout
- progressTimeout
- completeTimeout
- requestTerminate
- agreeTerminate
- terminateTimeout
- requestFix

---

## 2. useRegister.ts

### Diff 2.1: 导入 SUPPORTED_CHAIN_IDS

```diff
  import { useState } from 'react';
  import { ethers } from 'ethers';
  import { apiClient, ProfileData } from '../api/client';
- import { getContractAddresses } from '../contracts/addresses';
+ import { getContractAddresses, SUPPORTED_CHAIN_IDS } from '../contracts/addresses';
  import RegisterABI from '../contracts/Register.json';
  import EOCHOTokenABI from '../contracts/EOCHOToken.json';
```

### Diff 2.2: 在 register 函数中添加 chainId guard

```diff
  const register = async (profileData: ProfileData) => {
    if (!signer || !chainId) {
      setError('Wallet not connected');
      return false;
    }

+   // chainId guard: 检查是否在支持的网络上
+   if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
+     setError('Wrong network. Please switch to Sepolia or Hardhat Local.');
+     console.error(`register blocked: unsupported chainId ${chainId}`);
+     return false;
+   }

    setIsRegistering(true);
    setError(null);
    setTxHash(null);
    setCapReached(false);

    try {
      const addresses = getContractAddresses(chainId);
```

**覆盖的操作**（1个）：
- register

---

## 3. useTasks.ts

### Diff 3.1: 导入 SUPPORTED_CHAIN_IDS

```diff
  import { useState, useEffect } from 'react';
  import { ethers } from 'ethers';
  import { apiClient, TaskData } from '../api/client';
- import { getContractAddresses } from '../contracts/addresses';
+ import { getContractAddresses, SUPPORTED_CHAIN_IDS } from '../contracts/addresses';
  import TaskEscrowABI from '../contracts/TaskEscrow.json';
```

### Diff 3.2: 在 createTask 函数中添加 chainId guard

```diff
  const createTask = async (reward: string, taskData: TaskData) => {
    if (!signer || !chainId) {
      setError('Wallet not connected');
      return null;
    }

+   // chainId guard: 检查是否在支持的网络上
+   if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
+     setError('Wrong network. Please switch to Sepolia or Hardhat Local.');
+     console.error(`createTask blocked: unsupported chainId ${chainId}`);
+     return null;
+   }

    setIsCreating(true);
    setError(null);
    setTxHash(null);

    try {
      // 预检查余额
```

**覆盖的操作**（1个）：
- createTask

---

## Guard 覆盖总结

### 写操作总计：13 个

**useTaskActions.ts**（11个）：
1. acceptTask
2. submitWork
3. confirmComplete
4. cancelTask
5. cancelTaskTimeout
6. progressTimeout
7. completeTimeout
8. requestTerminate
9. agreeTerminate
10. terminateTimeout
11. requestFix

**useRegister.ts**（1个）：
12. register

**useTasks.ts**（1个）：
13. createTask

---

## Guard 逻辑

### 检查条件

```typescript
if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
  // 阻止操作
}
```

### SUPPORTED_CHAIN_IDS

```typescript
export const SUPPORTED_CHAIN_IDS = [11155111, 31337];
// 11155111 = Sepolia Testnet
// 31337 = Hardhat Local
```

### 错误处理

**错误信息**：
```
"Wrong network. Please switch to Sepolia or Hardhat Local."
```

**控制台日志**：
```
${actionName} blocked: unsupported chainId ${chainId}
```

**返回值**：
- useTaskActions: `false`
- useRegister: `false`
- useCreateTask: `null`

---

## 修改统计

**新增代码**：
- 导入语句：3 处
- Guard 检查：3 处（覆盖 13 个操作）

**修改代码**：
- 导入语句：3 行

**总计**：
- 新增行数：~15 行
- 修改行数：~3 行
- 修改文件：3 个

---

## 验收结果

✅ **通过**

- 编译无新增错误
- 所有 13 个写操作都有 guard
- 错误信息统一
- 读操作不受影响
