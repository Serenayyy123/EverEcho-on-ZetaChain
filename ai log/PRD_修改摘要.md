# EverEcho MVP PRD 修改摘要

**修改日期**：2024-11-23
**文档版本**：v1.0 → v1.1（评审后定版）
**修改标记**：共 29 处 `<!-- UPDATED -->` 标记

---

## 修改概览

本次修改根据评审意见，系统性地解决了 PRD 中的逻辑冲突、实现缺口和模糊描述，使文档可直接进入实现阶段。

---

## P0 级修改（必须修复的冲突与缺口）

### 1. ✅ ERC20 冲突修复

**问题**：钉子 2 要求使用 OpenZeppelin ERC20，但 5.1 章节重复声明了 `balanceOf` 和 `totalSupply`。

**修复**：
- 删除重复的状态变量声明
- 明确仅继承 OZ ERC20，只额外定义 `hasMintedInitial`、`CAP` 等必要扩展
- 添加 `burn` 函数用于手续费销毁

**位置**：5.1 EOCHO Token 合约

---

### 2. ✅ 注册与资料存储边界定稿

**问题**："链上或链下存储，必须可查询验证"过于模糊。

**修复**：
- **链上**：`isRegistered[address] = true` + `profileURI[address]`
- **链下**：完整 profile JSON（昵称、城市、技能 tags）
- **MVP 不支持修改 profile**：简化实现
- **不做 hash 校验**：信任链下服务，V2 可升级

**位置**：模块 1、4.3 混合方案、5.3 Register 合约

---

### 3. ✅ Token 上限后的注册策略定稿

**问题**：当前描述可能导致上限后无法注册。

**修复**：
- 达到 CAP 后**仍允许注册**
- `mintInitial` 数量变为 0（不报错）
- 触发 `CapReached` 事件，前端提示用户
- 新用户可通过接受低门槛任务开始参与

**位置**：模块 1.5、5.1 EOCHO Token 合约

---

### 4. ✅ 2% burn 手续费的扣法定稿

**问题**：未明确"在哪一步扣/扣谁的"。

**修复**：
- 完成结算时，从 **Creator 抵押的 R** 中扣除
- Helper 实际收到：`0.98R`
- 平台手续费（销毁）：`0.02R`
- Helper 保证金 R **全额退回**
- 例如：任务奖励 100 EOCHO，Helper 收到 98，2 被销毁，保证金 100 退回

**位置**：模块 1.5、模块 3 Completed 状态、用户流程 2.6/2.7、5.2 TaskEscrow 合约

---

### 5. ✅ 协商终止机制补齐 on-chain 字段/函数

**问题**："48h 无响应视为拒绝"需要链上记录和触发函数。

**修复**：
- **新增字段**：
  - `terminateRequestedBy`（address）：记录谁发起请求
  - `terminateRequestedAt`（uint256）：请求时间戳
- **新增函数**：
  - `requestTerminate(taskId)`：发起终止请求
  - `agreeTerminate(taskId)`：对方同意终止
  - `terminateTimeout(taskId)`：48h 超时，请求失效
- **资金流**：双方同意后，各自拿回 R，任务关闭为 Cancelled

**位置**：模块 3 InProgress 状态、1.3 超时规则、4.1 任务核心状态、5.2 TaskEscrow 合约、用户流程 2.11

---

### 6. ✅ 链下联系方式加密方案安全化

**问题**：密钥由 taskId+地址派生会被公开推导，不安全。

**修复**：
- **加密方案**：服务端生成随机 DEK（Data Encryption Key）
- DEK 分别用 Creator 和 Helper 的以太坊公钥包裹后存储
- **解密流程**：
  1. 前端用户通过钱包签名验证身份
  2. 后端验证签名 + 检查任务状态（必须 >= InProgress）
  3. 后端返回该用户对应的包裹 DEK
  4. 前端用私钥解包 DEK，再解密联系方式
- **访问控制**：仅在 InProgress/Submitted/Completed 状态允许解密
- **信任假设**：服务端可解密联系方式，MVP 阶段接受此假设

**位置**：钉子 3

---

## P1 级修改（重要一致性与体验修订）

### 7. ✅ 超时资金流表述统一

**问题**：InProgress 超时处与取消规则处描述不一致。

**修复**：
- 统一为：InProgress 超时 → Creator 拿回 R，Helper 拿回 R
- 无资金转移，双方各自取回抵押

**位置**：1.3 超时规则、模块 3 InProgress 状态、用户流程 2.10

---

### 8. ✅ 最小争议/修正路径（不做仲裁）

**问题**：MVP 无 Reject 路径会造成质量争议风险。

**修复**：
- **新增 Request Fix 机制**：
  - Submitted 阶段 Creator 可点击一次"Request Fix"
  - `T_review` 延长 3 天
  - `fixRequested = true`（仅允许一次）
  - Helper 可重新提交工作（链下更新）
- **新增字段**：
  - `fixRequested`（bool）
  - `fixRequestedAt`（uint256）
- **新增函数**：
  - `requestFix(taskId)`

**位置**：模块 3 Submitted 状态、1.3 超时规则、4.1 任务核心状态、5.2 TaskEscrow 合约、用户流程 2.12、前端页面 Task Detail

---

### 9. ✅ 冷启动/新用户可参与性说明

**问题**：新用户 100 代币可能不足以参与任务。

**修复**：
- 新增 MVP 参数：`recommendedMaxReward = 50 EOCHO`
- 推荐初期任务奖励上限，便于新用户参与
- 前端可提示 Creator 发布低门槛任务

**位置**：1.4 MVP 参数表

---

## P2 级修改（实现所需的参数冻结）

### 10. ✅ 新增 "MVP 参数表" 小节

**新增内容**：
- 1.4 MVP 参数表（冻结定版）
- 包含所有确定常量：
  - Token 参数：`INITIAL_MINT`、`CAP`、`FEE_BPS`
  - 超时参数：`T_OPEN`、`T_PROGRESS`、`T_REVIEW`、`T_TERMINATE_RESPONSE`、`T_FIX_EXTENSION`
  - 存储参数：`profileStorage`、`taskMetadataStorage`、`profileUpdateAllowed`
  - 争议处理参数：`maxFixRequests`
  - 冷启动参数：`recommendedMaxReward`

**位置**：1.4 章节（新增）

---

## 其他重要补充

### 11. ✅ 完善合约接口

**新增内容**：
- 5.2 TaskEscrow 合约完整接口（状态变量、函数、事件）
- 5.3 Register 合约完整接口
- Task 结构体定义
- TaskStatus 枚举定义

**位置**：第 5 章

---

### 12. ✅ 新增用户流程

**新增内容**：
- 2.11 协商终止流程（InProgress 状态）
- 2.12 Creator 请求修正流程（Submitted 状态）

**位置**：第 2 章

---

### 13. ✅ 新增验收清单

**新增内容**：
- 第 6 章：验收清单（自检）
- 所有 9 项检查点均已完成 ✅

**位置**：第 6 章（新增）

---

### 14. ✅ 新增实现优先级建议

**新增内容**：
- 附录：MVP 实现优先级建议
- 分为 P0（核心功能）、P1（重要体验）、P2（可后续迭代）

**位置**：附录（新增）

---

## 修改统计

- **新增章节**：2 个（1.4 MVP 参数表、第 6 章验收清单）
- **新增用户流程**：2 个（2.11、2.12）
- **新增合约接口**：2 个完整接口（5.2 TaskEscrow、5.3 Register）
- **新增字段**：4 个（terminateRequestedBy/At、fixRequested/At）
- **新增函数**：6 个（requestTerminate、agreeTerminate、terminateTimeout、requestFix、burn、CapReached 事件）
- **修改标记**：29 处 `<!-- UPDATED -->`

---

## 验收结果

✅ **所有 P0 级问题已修复**
✅ **所有 P1 级问题已修复**
✅ **所有 P2 级问题已修复**
✅ **PRD 可直接进入实现阶段**

---

## 下一步建议

1. **合约开发**：按照 5.1-5.3 接口草案实现智能合约
2. **前端开发**：按照第 3 章页面模块清单实现前端
3. **后端开发**：实现 profile/task metadata/联系方式加密存储服务
4. **测试**：按照第 2 章用户流程编写测试用例
5. **部署**：优先考虑 Layer 2（Polygon/Arbitrum）降低 Gas 费用

---

**文档状态**：✅ 可进入实现阶段
**最后更新**：2024-11-23
