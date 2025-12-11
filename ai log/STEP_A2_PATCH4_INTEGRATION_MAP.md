# Step A2 Patch-4 集成对照表

## 页面 → Real Hooks 映射

### ✅ TaskSquare.tsx
**使用的 Real Hooks**：
- `useWallet()` → 获取 address, provider, disconnect
- `useTasks(provider, chainId)` → 获取任务列表

**问题**：
- ❌ `useTasks` 缺少 `chainId` 参数
- ❌ 使用了不存在的 `reload` 方法（应该是 `refresh`）

---

### ✅ TaskDetail.tsx
**使用的 Real Hooks**：
- `useWallet()` → 获取 address, provider, signer
- 直接使用 Contract 读取链上数据

**状态**：✅ 已正确集成

---

### ✅ PublishTask.tsx
**使用的 Real Hooks**：
- `useWallet()` → 获取 address, signer, provider, disconnect
- `useCreateTask(signer, provider)` → 创建任务

**状态**：✅ 已正确集成

---

### ✅ Register.tsx
**使用的 Real Hooks**：
- `useWallet()` → 获取 address, signer
- `useRegister(signer)` → 注册用户

**状态**：✅ 已正确集成

---

### ✅ Home.tsx
**使用的 Real Hooks**：
- `useWallet()` → 获取 address, signer, connect
- `useRegister(signer)` → 检查注册状态

**状态**：✅ 已正确集成

---

### ✅ Profile.tsx
**使用的 Real Hooks**：
- `useWallet()` → 获取 address, provider, disconnect
- `useProfile(address, provider)` → 获取用户资料
- `useTaskHistory(provider, filter)` → 获取任务历史

**状态**：✅ 已正确集成

---

## ✅ 已修复的问题

### 1. TaskSquare.tsx ✅
```typescript
// ✅ 已修复：添加 chainId 参数
const { address, chainId, provider, disconnect } = useWallet();
const { tasks, loading, error, refresh } = useTasks(provider, chainId);

// ✅ 已修复：reload → refresh
<button onClick={refresh} style={styles.reloadButton}>
```

### 2. TaskDetail.tsx ✅
```typescript
// ✅ 已修复：使用 getContractAddresses
const { address, chainId, provider, signer } = useWallet();
const addresses = getContractAddresses(chainId);
const contract = new Contract(addresses.taskEscrow, TaskEscrowABI.abi, provider);
```

### 3. Register.tsx ✅
```typescript
// ✅ 已修复：添加 chainId 和回调
const { address, chainId, signer } = useWallet();
const { isRegistering, error, txHash, register } = useRegister(
  signer,
  chainId,
  (mintedAmount) => {
    console.log('Registration successful, minted:', mintedAmount);
  }
);

// ✅ 已修复：ProfileData 类型匹配
const profileData: ProfileData = {
  nickname,
  city,
  skills: selectedSkills.join(', '),
  encryptionPubKey: `0x04${address?.slice(2)}`,
};
```

### 4. Home.tsx ✅
```typescript
// ✅ 已修复：直接调用合约检查注册
const { address, chainId, signer, isConnecting, error, connect } = useWallet();

const addresses = getContractAddresses(chainId);
const registerContract = new ethers.Contract(
  addresses.register,
  RegisterABI.abi,
  signer
);
const isRegistered = await registerContract.isRegistered(address);
```

### 5. TaskCard.tsx ✅
```typescript
// ✅ 已修复：使用正确的 Task 类型
import { Task } from '../hooks/useTasks';
import { TaskStatusLabels } from '../types/task';
```

---

## 冻结点验证

### ✅ 冻结点 1.3-13~18：状态机与按钮显示规则不变
- TaskDetail.tsx 的 `renderActions()` 保持原有逻辑
- 按钮显示条件未改变

### ✅ 冻结点 2.2：流程固定
- PublishTask：POST backend → createTask
- Register：POST backend → register
- 流程未改变

### ✅ 冻结点 3.4：函数名与合约一致
- acceptTask, submitWork, confirmComplete 等函数名保持一致

---

## 总结

**已完成集成的页面**：6/6
- ✅ TaskSquare.tsx（已修复）
- ✅ TaskDetail.tsx（已修复）
- ✅ PublishTask.tsx
- ✅ Register.tsx（已修复）
- ✅ Home.tsx（已修复）
- ✅ Profile.tsx

**已修复的问题**：5 个
- ✅ TaskSquare.tsx 的参数和方法名问题
- ✅ TaskDetail.tsx 的合约地址问题
- ✅ Register.tsx 的类型和参数问题
- ✅ Home.tsx 的注册检查问题
- ✅ TaskCard.tsx 的类型问题

**编译状态**：✅ 无错误

**验收结果**：✅ 通过
