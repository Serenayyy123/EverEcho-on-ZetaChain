# 跨链奖励交易哈希显示修复需求

## 介绍

当前跨链奖励系统中，用户在Helper领取奖励后无法看到交易哈希，这影响了用户体验和交易透明度。

**问题分析**：
- 当前部署的UniversalReward合约是简化版本，不是完整的跨链实现
- `claimToHelper`函数没有正确记录交易哈希到`lastTxHash`字段
- 即使已领取的奖励（状态3）也没有交易哈希记录

需要修复合约中的交易哈希记录功能，让用户能够查看和跟踪交易。

## 术语表

- **UniversalReward合约**: 处理跨链奖励的智能合约
- **交易哈希**: 区块链交易的唯一标识符
- **Helper**: 完成任务并领取跨链奖励的用户
- **lastTxHash**: 合约中存储最后一次交易哈希的字段
- **claimToHelper**: Helper领取奖励的合约函数

## 需求

### 需求 1

**用户故事**: 作为Helper，我想要在领取跨链奖励后看到交易哈希，以便我可以在区块链浏览器中跟踪交易状态。

#### 验收标准

1. WHEN Helper调用claimToHelper函数 THEN 系统SHALL在合约中记录实际的交易哈希
2. WHEN 交易哈希被记录 THEN 系统SHALL将交易哈希存储在RewardPlan的lastTxHash字段中
3. WHEN 前端查询奖励信息 THEN 系统SHALL返回有效的交易哈希而不是空值
4. WHEN 用户点击交易哈希链接 THEN 系统SHALL打开ZetaChain Athens浏览器显示交易详情
5. WHEN 交易哈希为空 THEN 系统SHALL不显示交易哈希链接



### 需求 2

**用户故事**: 作为开发者，我想要确保合约正确记录所有跨链交易的哈希，以便提供完整的交易审计跟踪。

#### 验收标准

1. WHEN claimToHelper函数执行成功 THEN 系统SHALL将当前交易的哈希存储在lastTxHash字段
2. WHEN RewardClaimed事件被触发 THEN 系统SHALL包含实际的交易哈希而不是零值
3. WHEN 查询RewardPlan THEN 系统SHALL返回包含有效交易哈希的完整数据结构
4. WHEN 合约状态更新 THEN 系统SHALL确保lastTxHash字段与实际交易哈希一致

### 需求 3

**用户故事**: 作为用户，我想要在UI中看到清晰的交易状态指示，以便我了解跨链转账的进度。

#### 验收标准

1. WHEN 奖励状态为已领取且有交易哈希 THEN 系统SHALL显示可点击的交易哈希链接
2. WHEN 奖励状态为已领取但无交易哈希 THEN 系统SHALL显示"处理中"状态
3. WHEN 用户查看交易详情 THEN 系统SHALL提供ZetaChain浏览器的正确链接
4. WHEN 交易哈希加载失败 THEN 系统SHALL显示友好的错误提示