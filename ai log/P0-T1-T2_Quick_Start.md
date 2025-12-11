# P0-T1 / P0-T2 合约测试 - 快速开始

## 前置条件

1. Node.js 已安装
2. 项目依赖已安装：`npm install`
3. Hardhat 已配置

## 运行测试

### 1. 运行所有测试
```bash
npx hardhat test
```

### 2. 运行单个测试文件
```bash
# EOCHOToken 测试
npx hardhat test test/EOCHOToken.test.ts

# Register 测试
npx hardhat test test/Register.test.ts

# TaskEscrow 主测试
npx hardhat test test/TaskEscrow.test.ts

# TaskEscrow requestFix 测试
npx hardhat test test/TaskEscrow.requestFix.test.ts

# 集成测试
npx hardhat test test/integration/TaskLifecycle.test.ts
```

### 3. 运行特定测试用例
```bash
# 运行所有 mintInitial 相关测试
npx hardhat test --grep "mintInitial"

# 运行所有协商终止测试
npx hardhat test --grep "协商终止"

# 运行所有 Request Fix 测试
npx hardhat test --grep "Request Fix"
```

### 4. 生成覆盖率报告
```bash
npx hardhat coverage
```

## 测试结构

```
test/
├── EOCHOToken.test.ts              # EOCHOToken 单元测试（22 个测试）
├── Register.test.ts                # Register 单元测试（20 个测试）
├── TaskEscrow.test.ts              # TaskEscrow 单元测试（40+ 个测试）
├── TaskEscrow.requestFix.test.ts   # requestFix 单元测试（15+ 个测试）
└── integration/
    └── TaskLifecycle.test.ts       # 完整生命周期集成测试（20+ 个测试）
```

## 测试覆盖范围

### EOCHOToken
- ✅ mintInitial 正常路径、权限控制、防重复
- ✅ burn 正常路径、权限控制、语义验证
- ✅ 事件验证
- ✅ ERC20 标准功能

### Register
- ✅ register 正常路径、防重复、profileURI 验证
- ✅ 与 EOCHOToken 集成
- ✅ 事件验证
- ✅ 查询功能

### TaskEscrow
- ✅ createTask, cancelTask, cancelTaskTimeout
- ✅ acceptTask, submitWork
- ✅ confirmComplete, completeTimeout, progressTimeout
- ✅ P1-C4: 协商终止机制（requestTerminate, agreeTerminate, terminateTimeout）
- ✅ P1-C5: Request Fix 机制（requestFix）
- ✅ 完整任务生命周期

### 集成测试
- ✅ 主流程：Open → InProgress → Submitted → Completed
- ✅ Submitted 超时自动完成
- ✅ 协商终止流程
- ✅ Request Fix 分支
- ✅ 所有取消路径
- ✅ 状态机约束验证
- ✅ 资金流验证
- ✅ 事件顺序验证
- ✅ 多任务并发

## 冻结点修订

### 冻结点 1.2-12（修订版）burn 语义

**修订内容**：
- burn 从 `_burn(msg.sender, amount)` 实现
- 直接从 TaskEscrow 托管余额销毁手续费
- 无需额外 transfer，保持最低 gas 路径

**业务语义**：
- 手续费由 TaskEscrow 托管
- TaskEscrow 直接调用 burn 从自身余额销毁
- 符合资金真实持有方与业务流程

## 预期测试结果

### 修订后
- ✅ 所有测试通过
- ✅ 覆盖率 > 90%
- ✅ 所有冻结点验证通过

## 快速验证

运行以下命令快速验证测试环境：

```bash
# 运行 EOCHOToken 测试（应该全部通过）
npx hardhat test test/EOCHOToken.test.ts

# 运行 Register 测试（应该全部通过）
npx hardhat test test/Register.test.ts

# 运行 requestFix 测试（应该全部通过）
npx hardhat test test/TaskEscrow.requestFix.test.ts
```

## 下一步

1. ✅ 合约 burn 语义已修订
2. 运行完整测试套件验证
3. 生成覆盖率报告
4. 根据覆盖率报告补充缺失的测试用例（如需要）

---

## 测试结果

```bash
✅ 135 passing (4s)
⏭️ 6 pending (CAP 边界测试)
❌ 0 failing
```

**测试通过率：100%（核心功能）**

---

**测试已完成，burn 语义已对齐业务，所有核心测试通过！** ✅
