# P1-C5 薄片验收清单（Request Fix 机制）

**对应节点**：P1-C5  
**验收对象**：`contracts/TaskEscrow.sol` + Request Fix 相关测试  
**验收依据**：PRD v1.2 + 薄片校准定稿 v1.0 冻结点

---

## 1. 冻结点逐条验收（必须 100% 命中）

### 1.1 Submitted 状态不可取消（冻结点 1.3-17）

- [x] `cancelTask(taskId)` 前置条件严格限制为 `status == Open`
  - 证据：L133 `if (task.status != TaskStatus.Open) revert InvalidStatus();`

- [x] 当 `status == Submitted` 时：
  - [x] `cancelTask` 必须 revert ✅（L133 状态检查）
  - [x] 已存在可行路径仅有：
    - [x] `confirmComplete`（L217）✅
    - [x] `requestFix`（且仅一次）（L388）✅
    - [x] `completeTimeout`（L244）✅

### 1.2 Request Fix 常量值（冻结点 1.4-19）

- [x] 合约中存在 `T_FIX_EXTENSION`
  - 证据：L45 `uint256 public constant T_FIX_EXTENSION = 3 days;`

- [x] 取值为 `3 days` ✅

- [x] 命名与薄片一致：`T_FIX_EXTENSION` ✅

### 1.3 Request Fix 计时语义（冻结点 1.4-20）

- [x] `requestFix()` **不修改 `submittedAt`**
  - 证据：L388-397 函数中无 `task.submittedAt = ...` 语句 ✅
  - 测试验证：test/TaskEscrow.requestFix.test.ts:L107-119 ✅

- [x] 验收截止时间计算为：`submittedAt + T_REVIEW + (fixRequested ? T_FIX_EXTENSION : 0)`
  - 证据：L254-258
  ```solidity
  uint256 deadline = task.submittedAt + T_REVIEW;
  if (task.fixRequested) {
      deadline += T_FIX_EXTENSION;
  }
  ```

- [x] `completeTimeout()` 使用上述截止时间（而不是老的 `submittedAt + T_REVIEW`）
  - 证据：L254-258（已在 P0-C3 实现，P1-C5 未修改）✅

### 1.4 资金流不变（冻结点 1.3-15）

- [x] `requestFix()` 不产生任何资金移动
  - 证据：L388-397 函数中无 `transfer` 或 `burn` 调用 ✅

- [x] `confirmComplete()` 与 `completeTimeout()` 的结算仍为：
  - [x] Helper 得 `reward - fee`（0.98R）
    - confirmComplete：L229 ✅
    - completeTimeout：L267 ✅
  - [x] `fee = reward * FEE_BPS / 10000`（下取整）
    - confirmComplete：L221 ✅
    - completeTimeout：L263 ✅
  - [x] `fee` 被 burn
    - confirmComplete：L231 ✅
    - completeTimeout：L269 ✅
  - [x] Helper 保证金 `reward` 全额退回
    - confirmComplete：L234 ✅
    - completeTimeout：L270 ✅

- [x] Request Fix 不改变上述结算逻辑 ✅

### 1.5 命名一致性（冻结点 3.1 / 3.3 / 3.4）

- [x] Task 字段名必须为：
  - [x] `fixRequested: bool`（L36）✅
  - [x] `fixRequestedAt: uint256`（L37）✅

- [x] 函数名必须为：
  - [x] `requestFix(uint256 taskId)`（L388）✅

- [x] 事件名必须为：
  - [x] `FixRequested(uint256 indexed taskId)`（L64）✅

- [x] 任何地方不得出现改名/别名/拼写变体 ✅

---

## 2. 功能级验收（实现正确性）

### 2.1 requestFix() 前置条件与状态更新

- [x] 仅 **Creator** 可调用：`msg.sender == task.creator`
  - 证据：L390 `if (msg.sender != task.creator) revert Unauthorized();`

- [x] 仅 **Submitted** 状态可调用：`task.status == Submitted`
  - 证据：L393 `if (task.status != TaskStatus.Submitted) revert InvalidStatus();`

- [x] 仅允许一次：`task.fixRequested == false`
  - 证据：L396 `if (task.fixRequested) revert AlreadyRequested();`

- [x] 调用成功后：
  - [x] `task.fixRequested == true`（L399）✅
  - [x] `task.fixRequestedAt == block.timestamp`（L400）✅
  - [x] `task.submittedAt` 保持不变 ✅
  - [x] `task.status` 保持 `Submitted` ✅

### 2.2 completeTimeout() 截止计算

- [x] fix 未请求时，截止为：`submittedAt + T_REVIEW`
  - 证据：L254 `uint256 deadline = task.submittedAt + T_REVIEW;`
  - 测试验证：test/TaskEscrow.requestFix.test.ts:L123-138 ✅

- [x] fix 已请求时，截止为：`submittedAt + T_REVIEW + T_FIX_EXTENSION`
  - 证据：L255-257
  ```solidity
  if (task.fixRequested) {
      deadline += T_FIX_EXTENSION;
  }
  ```
  - 测试验证：test/TaskEscrow.requestFix.test.ts:L140-167 ✅

- [x] fixRequestedAt 仅用于记录，不参与截止计算 ✅

---

## 3. 测试验收（Hardhat + TS）

### 3.1 必测通过路径

- [x] **路径 A：正常 Request Fix**
  - [x] Creator 在 Submitted 状态调用 requestFix 成功
    - 测试：test/TaskEscrow.requestFix.test.ts:L52-61 ✅
  - [x] FixRequested 事件正确触发 ✅
  - [x] fixRequested / fixRequestedAt 更新正确 ✅
  - [x] submittedAt 不刷新
    - 测试：test/TaskEscrow.requestFix.test.ts:L107-119 ✅

### 3.2 必测 revert 路径

- [x] 非 Creator 调用 requestFix → revert
  - 测试：test/TaskEscrow.requestFix.test.ts:L63-71 ✅

- [x] 非 Submitted 状态调用 requestFix → revert
  - 测试：test/TaskEscrow.requestFix.test.ts:L73-93 ✅
  - 覆盖：Open, InProgress, Completed 状态 ✅

- [x] 已经 requestFix 过再次调用 → revert
  - 测试：test/TaskEscrow.requestFix.test.ts:L95-101 ✅

### 3.3 completeTimeout 计时覆盖

- [x] fixRequested=false 时：
  - [x] 未过期调用 completeTimeout → revert
    - 测试：test/TaskEscrow.requestFix.test.ts:L126-130 ✅
  - [x] 过期后 completeTimeout 成功，并按 0.98R/0.02R 结算
    - 测试：test/TaskEscrow.requestFix.test.ts:L132-138 ✅

- [x] fixRequested=true 时：
  - [x] 在 T_REVIEW 内调用 completeTimeout → revert
    - 测试：test/TaskEscrow.requestFix.test.ts:L145-151 ✅
  - [x] 在 T_REVIEW + T_FIX_EXTENSION 内调用 completeTimeout → revert
    - 测试：test/TaskEscrow.requestFix.test.ts:L153-161 ✅
  - [x] 超过 T_REVIEW + T_FIX_EXTENSION 后成功结算
    - 测试：test/TaskEscrow.requestFix.test.ts:L163-167 ✅
  - [x] 两种分支都验证 TaskCompleted 事件参数正确
    - 测试：test/TaskEscrow.requestFix.test.ts:L169-189 ✅

### 3.4 完整流程测试

- [x] Submitted -> requestFix -> 延长期内 confirmComplete
  - 测试：test/TaskEscrow.requestFix.test.ts:L193-208 ✅

- [x] Submitted -> requestFix -> 延长期后 completeTimeout
  - 测试：test/TaskEscrow.requestFix.test.ts:L210-224 ✅

- [x] Submitted -> 3天内 confirmComplete（未使用 requestFix）
  - 测试：test/TaskEscrow.requestFix.test.ts:L226-239 ✅

### 3.5 边界条件测试

- [x] requestFix 后 fixRequestedAt 应该正确记录
  - 测试：test/TaskEscrow.requestFix.test.ts:L243-252 ✅

- [x] 多个任务的 fixRequested 应该独立
  - 测试：test/TaskEscrow.requestFix.test.ts:L254-274 ✅

---

## 4. 输出物检查

- [x] `contracts/TaskEscrow.sol` 已包含 requestFix
  - 证据：L377-402 ✅

- [x] completeTimeout 已在 P0-C3 实现，包含 fixRequested 判断
  - 证据：L254-258（未修改）✅

- [x] 对应测试文件已新增，路径清晰
  - 文件：test/TaskEscrow.requestFix.test.ts ✅

- [x] 无额外改动 P0 已冻结逻辑
  - 验证：仅新增 requestFix 函数，其他函数未修改 ✅

- [x] 如有任何"顺手优化/重构"，必须在 PR 描述中逐条解释为何不违反薄片冻结点
  - 验证：无任何优化/重构，仅增量实现 ✅

---

## 5. 验收结论

- **通过项**：**28 / 28**
- **偏差项**：**0 / 28**
- **偏差列表**：无

---

## 6. 详细验收记录

### 6.1 合约实现验收

| 验收项 | 行号 | 状态 |
|--------|------|------|
| T_FIX_EXTENSION 常量 | L45 | ✅ |
| fixRequested 字段 | L36 | ✅ |
| fixRequestedAt 字段 | L37 | ✅ |
| FixRequested 事件 | L64 | ✅ |
| requestFix 函数 | L388-402 | ✅ |
| requestFix 权限检查 | L390 | ✅ |
| requestFix 状态检查 | L393 | ✅ |
| requestFix 防重复检查 | L396 | ✅ |
| requestFix 字段更新 | L399-400 | ✅ |
| requestFix 不刷新 submittedAt | L388-402 | ✅ |
| completeTimeout 截止计算 | L254-258 | ✅ |
| cancelTask 状态限制 | L133 | ✅ |

### 6.2 测试覆盖验收

| 测试场景 | 行号 | 状态 |
|---------|------|------|
| Creator 正常 requestFix | L52-61 | ✅ |
| 非 Creator revert | L63-71 | ✅ |
| 非 Submitted revert | L73-93 | ✅ |
| 第二次 requestFix revert | L95-101 | ✅ |
| submittedAt 不刷新 | L107-119 | ✅ |
| fixRequested=false 超时 | L123-138 | ✅ |
| fixRequested=true 超时 | L140-167 | ✅ |
| 资金流验证 | L169-189 | ✅ |
| 完整流程 1 | L193-208 | ✅ |
| 完整流程 2 | L210-224 | ✅ |
| 完整流程 3 | L226-239 | ✅ |
| fixRequestedAt 记录 | L243-252 | ✅ |
| 多任务独立性 | L254-274 | ✅ |

---

## 7. 冻结点命中率总结

### 冻结点 100% 命中

- ✅ **1.3-17**：Submitted 状态不可取消，仅支持 confirmComplete/requestFix/completeTimeout
- ✅ **1.4-19**：T_FIX_EXTENSION = 3 days
- ✅ **1.4-20**：Request Fix 不刷新 submittedAt，验收截止计算正确
- ✅ **1.3-15**：资金流不变（0.98R + burn + 保证金退回）
- ✅ **3.1/3.3/3.4**：字段/事件/函数命名完全一致

### 功能实现 100% 正确

- ✅ requestFix 前置条件完整（Creator + Submitted + 仅一次）
- ✅ requestFix 状态更新正确（fixRequested + fixRequestedAt）
- ✅ requestFix 不刷新 submittedAt
- ✅ completeTimeout 截止计算包含 fixRequested 判断
- ✅ 资金流与 confirmComplete 完全一致

### 测试覆盖 100% 完整

- ✅ 正常路径（Creator requestFix）
- ✅ 所有 revert 路径（权限、状态、防重复）
- ✅ completeTimeout 计时（两种分支）
- ✅ 完整流程（3 种场景）
- ✅ 边界条件（时间戳、多任务独立性）

---

## 8. 最终结论

✅ **P1-C5 Request Fix 机制完全通过薄片验收**

所有 28 项验收点 100% 命中，无偏差项。合约实现严格遵守 PRD v1.2 和薄片校准定稿 v1.0 的所有冻结点，测试覆盖完整，可直接进入下一阶段开发。

### 增量实现验证

- ✅ 仅新增 requestFix 函数（L388-402）
- ✅ 未修改任何 P0-C3 已有逻辑
- ✅ completeTimeout 的 fixRequested 判断在 P0-C3 已实现
- ✅ 与 P1-C4 协商终止机制无冲突
- ✅ 代码风格与 P0-C3 完全一致

### 后续建议

P1-C5 Request Fix 机制已完全符合薄片要求，TaskEscrow 合约核心功能（P0-C3 + P1-C4 + P1-C5）已全部实现并通过验收，可进入：

1. **集成测试**：测试 requestFix 与其他机制的交互
2. **前端集成**：实现 Request Fix UI
3. **部署准备**：准备合约部署脚本和配置
