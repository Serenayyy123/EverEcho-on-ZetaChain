# Token Symbol Patch - Code Diff

## 新增文件

### `frontend/src/constants/token.ts`
```typescript
/**
 * Token Display Constants
 * 
 * 单一来源：所有 UI 展示的 token 名称/符号
 * 冻结点保持：不影响合约调用、状态机、资金流
 */

export const TOKEN_SYMBOL = 'ECHO';
export const TOKEN_NAME = 'ECHO Token';

/**
 * 最大奖励限制（链上硬限制）
 */
export const MAX_REWARD = 1000;
```

---

## 修改文件

### `frontend/src/pages/Home.tsx`
```diff
- Earn EOCHO tokens by completing tasks
+ Earn ECHO tokens by completing tasks
```

### `frontend/src/pages/Profile.tsx`
```diff
- * - EOCHO 余额来自链上 Token 合约
+ * - ECHO 余额来自链上 Token 合约

- <div style={styles.balanceLabel}>EOCHO</div>
+ <div style={styles.balanceLabel}>ECHO</div>
```

### `frontend/src/pages/Register.tsx`
```diff
- Registration successful! Minted 100 EOCHO.
+ Registration successful! Minted 100 ECHO.

- CAP reached, no EOCHO minted. Please earn EOCHO by completing tasks.
+ CAP reached, no ECHO minted. Please earn ECHO by completing tasks.
```

### `frontend/src/pages/PublishTask.tsx`
```diff
- const { createTask, loading, error, txHash, step, MAX_REWARD_EOCHO } = useCreateTask(signer, provider);
+ const { createTask, loading, error, txHash, step, MAX_REWARD } = useCreateTask(signer, provider);

- label="Reward (EOCHO) *"
+ label="Reward (ECHO) *"

- hint={`Maximum: ${MAX_REWARD_EOCHO} EOCHO`}
+ hint={`Maximum: ${MAX_REWARD} ECHO`}

- max={MAX_REWARD_EOCHO}
+ max={MAX_REWARD}

- errors.reward = `Reward cannot exceed ${MAX_REWARD_EOCHO} EOCHO`;
+ errors.reward = `Reward cannot exceed ${MAX_REWARD} ECHO`;
```

### `frontend/src/pages/TaskDetail.tsx`
```diff
- <div style={styles.rewardLabel}>EOCHO</div>
+ <div style={styles.rewardLabel}>ECHO</div>

- setError(`Approving ${task.reward} EOCHO for TaskEscrow contract...`);
+ setError(`Approving ${task.reward} ECHO for TaskEscrow contract...`);

- errorMessage = `❌ Failed to accept task. Most likely cause:\n\n🔑 You need to APPROVE the TaskEscrow contract to spend your EOCHO tokens first!\n\nRequired amount: ${task.reward} EOCHO\n\nPlease go to your Profile page and approve the contract, then try again.`;
+ errorMessage = `❌ Failed to accept task. Most likely cause:\n\n🔑 You need to APPROVE the TaskEscrow contract to spend your ECHO tokens first!\n\nRequired amount: ${task.reward} ECHO\n\nPlease go to your Profile page and approve the contract, then try again.`;

- <strong>{(parseFloat(task.reward) * 0.98).toFixed(2)} EOCHO</strong>
+ <strong>{(parseFloat(task.reward) * 0.98).toFixed(2)} ECHO</strong>

- <strong>{(parseFloat(task.reward) * 0.02).toFixed(2)} EOCHO</strong>
+ <strong>{(parseFloat(task.reward) * 0.02).toFixed(2)} ECHO</strong>

- <strong>{parseFloat(task.reward).toFixed(2)} EOCHO</strong>
+ <strong>{parseFloat(task.reward).toFixed(2)} ECHO</strong>
```

### `frontend/src/components/TaskHistory.tsx`
```diff
- return `Deposited ${reward} EOCHO`;
+ return `Deposited ${reward} ECHO`;

- return `Deposited ${reward} EOCHO (locked)`;
+ return `Deposited ${reward} ECHO (locked)`;

- return `Deposited ${reward} EOCHO (under review)`;
+ return `Deposited ${reward} ECHO (under review)`;

- return `Paid ${helperPaid} EOCHO to Helper (Fee ${feeBurned} burned)`;
+ return `Paid ${helperPaid} ECHO to Helper (Fee ${feeBurned} burned)`;

- return `Refunded ${reward} EOCHO`;
+ return `Refunded ${reward} ECHO`;

- return `Received ${helperReward} EOCHO + Deposit ${reward} refunded (Fee ${feeBurned} burned)`;
+ return `Received ${helperReward} ECHO + Deposit ${reward} refunded (Fee ${feeBurned} burned)`;
```

### `frontend/src/hooks/useProfile.ts`
```diff
- * - EOCHO 余额来自链上 Token 合约
+ * - ECHO 余额来自链上 Token 合约
```

### `frontend/src/hooks/useWallet.ts`
```diff
- console.log('[useWallet] Balance:', formattedBalance, 'EOCHO');
+ console.log('[useWallet] Balance:', formattedBalance, 'ECHO');
```

### `frontend/src/hooks/useRegister.ts`
```diff
- console.warn('CAP reached: no EOCHO minted');
+ console.warn('CAP reached: no ECHO minted');
```

### `frontend/src/hooks/useTasks.ts`
```diff
- export const MAX_REWARD_EOCHO = 1000;
+ export const MAX_REWARD = 1000;

- throw new Error('Reward must be between 0 and 1000 EOCHO');
+ throw new Error('Reward must be between 0 and 1000 ECHO');
```

### `frontend/src/hooks/useCreateTask.ts`
```diff
- const MAX_REWARD_EOCHO = 1000;
+ const MAX_REWARD = 1000;

- reward: string; // EOCHO 单位
+ reward: string; // ECHO 单位

- if (rewardNum > MAX_REWARD_EOCHO) {
-   throw new Error(`Reward cannot exceed ${MAX_REWARD_EOCHO} EOCHO`);
+ if (rewardNum > MAX_REWARD) {
+   throw new Error(`Reward cannot exceed ${MAX_REWARD} ECHO`);

- MAX_REWARD_EOCHO,
+ MAX_REWARD,
```

### `frontend/src/utils/formatters.ts`
```diff
- * 格式化 EOCHO 数量
+ * 格式化 ECHO 数量
```

### `frontend/src/utils/demoSeed.ts`
```diff
- lines.push(`  Task #${task.taskId} - ${task.statusLabel} - ${task.reward} EOCHO`);
+ lines.push(`  Task #${task.taskId} - ${task.statusLabel} - ${task.reward} ECHO`);

- lines.push(`${index + 1}. ${task.title} - ${task.reward} EOCHO`);
+ lines.push(`${index + 1}. ${task.title} - ${task.reward} ECHO`);
```

### `frontend/src/mock/types.ts`
```diff
- balance: string; // EOCHO balance
+ balance: string; // ECHO balance

- export const MAX_REWARD = "1000"; // 1000 EOCHO
+ export const MAX_REWARD = "1000"; // 1000 ECHO
```

---

## 统计

- **新增文件**: 1
- **修改文件**: 13
- **修改行数**: ~25 处
- **影响范围**: 仅前端展示层
- **业务逻辑**: 无变更
- **冻结点**: 全部保持
