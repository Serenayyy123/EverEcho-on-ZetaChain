# 🌉 EverEchoGateway 接口文档

## 📋 接口概览

基于 `contracts/zeta/EverEchoGateway.sol` 和 `frontend/src/contracts/EverEchoGateway.json` 的实际接口分析。

## 🔧 核心函数

### 1. 存入跨链奖励
```solidity
function depositReward(uint256 taskId, address asset, uint256 amount) external
```

**参数**:
- `taskId`: 任务 ID（必须已存在于 TaskEscrow）
- `asset`: ZRC20 代币地址
- `amount`: 奖励数量（wei 单位）

**前置条件**:
- 调用者必须是任务的 Creator
- 任务必须存在（`taskEscrow.getTaskCreator(taskId) != address(0)`）
- `asset != address(0)` 且 `amount > 0`
- 该任务尚未存入过跨链奖励（`!deposits[taskId].deposited`）
- Creator 必须先 approve Gateway 合约转移 `amount` 数量的 `asset`

**执行流程**:
1. 验证权限和参数
2. 执行 `IERC20(asset).transferFrom(creator, gateway, amount)`
3. 记录 `deposits[taskId]` 状态
4. 触发 `RewardDeposited` 事件

### 2. 领取跨链奖励
```solidity
function claimReward(uint256 taskId) external
```

**参数**:
- `taskId`: 任务 ID

**前置条件**:
- 调用者必须是任务的 Helper
- 任务状态必须为 `Completed`
- 该任务已存入跨链奖励（`deposits[taskId].deposited == true`）
- 尚未领取过（`!deposits[taskId].claimed`）

**执行流程**:
1. 验证权限和状态
2. 标记 `deposits[taskId].claimed = true`
3. 执行 `IERC20(asset).transfer(helper, amount)`
4. 触发 `RewardClaimed` 事件

### 3. 查询跨链奖励信息
```solidity
function getRewardInfo(uint256 taskId) external view returns (
    address asset, 
    uint256 amount, 
    bool deposited, 
    bool claimed, 
    address depositor
)
```

**返回值**:
- `asset`: ZRC20 代币地址
- `amount`: 奖励数量
- `deposited`: 是否已存入
- `claimed`: 是否已领取
- `depositor`: 存入者地址（Creator）

### 4. 检查是否有跨链奖励
```solidity
function hasReward(uint256 taskId) external view returns (bool exists)
```

### 5. 查询 Gateway 代币余额
```solidity
function getTokenBalance(address asset) external view returns (uint256 balance)
```

## 📊 状态映射

```solidity
mapping(uint256 => RewardDeposit) public deposits;

struct RewardDeposit {
    address asset;       // ZRC20 token address
    uint256 amount;      // amount locked
    bool deposited;      // has deposit happened
    bool claimed;        // has claim happened
    address depositor;   // creator address snapshot
}
```

## 🚨 重要发现

### ❌ 缺失的退款功能
**问题**: Gateway 合约中 **没有 `refundReward` 函数**！

原需求中提到的取消任务后退回跨链奖励的功能在当前合约中不存在。

### 🔄 实际可用的流程

#### 正常流程:
1. **Creator 存入**: `depositReward(taskId, asset, amount)`
2. **Helper 领取**: `claimReward(taskId)` (仅当任务 Completed)

#### 问题场景:
- **任务被取消**: 跨链奖励会永久锁定在 Gateway 中，无法退回给 Creator
- **任务超时**: 同样无法退回

## 🛠️ 实施方案调整

由于合约接口限制，需要调整原计划：

### 方案 A: 接受限制（推荐）
- **明确告知用户**: 跨链奖励一旦存入，只有任务完成后 Helper 才能领取
- **UI 警告**: 在存入前显示明确的风险提示
- **建议流程**: 
  1. 先发布任务（不存入跨链奖励）
  2. 等 Helper 接受后再存入跨链奖励
  3. 降低任务取消的风险

### 方案 B: 合约升级（不可行）
- 需要添加 `refundReward` 函数
- 但约束明确禁止修改合约

## 📝 接口总结

### ✅ 可用功能:
- `depositReward(taskId, asset, amount)` - 存入跨链奖励
- `claimReward(taskId)` - 领取跨链奖励（仅 Completed 状态）
- `getRewardInfo(taskId)` - 查询奖励信息
- `hasReward(taskId)` - 检查是否有奖励
- `getTokenBalance(asset)` - 查询 Gateway 余额

### ❌ 缺失功能:
- `refundReward(taskId)` - **不存在**，无法退回跨链奖励

### 🎯 UX 设计建议:
1. **存入前警告**: 明确告知跨链奖励无法退回
2. **分步流程**: 建议先发布任务，Helper 接受后再存入
3. **状态显示**: 清晰展示奖励状态（Locked/Claimable/Claimed）
4. **风险提示**: 强调跨链奖励的不可逆性

---

**状态**: ✅ 接口分析完成  
**关键限制**: ❌ 无退款功能  
**建议**: 调整 UX 流程，接受合约限制