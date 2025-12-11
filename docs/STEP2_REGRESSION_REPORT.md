# Step 2: Base Sepolia 回归测试报告

## 📋 测试环境

**网络**: Base Sepolia (Chain ID: 84532)  
**Token 名称**: ECHO Token (ECHO)  
**测试日期**: ________________  
**测试人员**: ________________  

### 合约地址
```
EOCHOToken:  ________________
Register:    ________________
TaskEscrow:  ________________
```

### 测试账户
```
Creator:  ________________
Helper:   ________________
```

---

## 🧪 Journey 1: 新用户注册流程

### 目标
验证新用户可以在 Base Sepolia 上完成注册并获得 100 ECHO Token

### 测试步骤

#### 1.1 连接钱包
- [ ] 访问 http://localhost:5173
- [ ] 点击 "Connect Wallet"
- [ ] MetaMask 显示 Base Sepolia 网络
- [ ] 确认连接

**预期结果**: ✅ 钱包成功连接，自动跳转到注册页面  
**实际结果**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

---

#### 1.2 填写注册信息
- [ ] Nickname: `TestUser1`
- [ ] City: `TestCity`
- [ ] Skills: `Testing, Development`
- [ ] Telegram: `@testuser1`

**预期结果**: ✅ 表单验证通过，Register 按钮可点击  
**实际结果**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

---

#### 1.3 提交注册
- [ ] 点击 "Register" 按钮
- [ ] MetaMask 弹出交易确认
- [ ] 确认交易

**预期结果**: ✅ 交易成功，跳转到 Task Square  
**实际结果**: ________________  
**交易 Hash**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

---

#### 1.4 验证余额
- [ ] 进入 Profile 页面
- [ ] 检查余额显示

**预期结果**: ✅ 余额显示 `100.0 ECHO`（注意：现在是 ECHO 不是 EOCHO）  
**实际结果**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

---

#### 1.5 链上验证
- [ ] 访问 Basescan 查看地址
- [ ] 检查 Token 余额

**预期结果**: ✅ Token 余额为 100 ECHO  
**Basescan 链接**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

---

### Journey 1 结果
**总体状态**: ⬜ 通过 / ⬜ 失败  
**问题记录**: ________________

---

## 🧪 Journey 2: 完整任务流程

### 目标
验证 Create → Accept → Submit → Confirm Complete 流程

### 前置条件
- [ ] Creator 和 Helper 都已注册
- [ ] Creator 余额 ≥ 20 ECHO
- [ ] Helper 余额 ≥ 20 ECHO

---

### 2.1 Creator: 发布任务

#### 2.1.1 填写任务信息
- [ ] Title: `Test Task on Base Sepolia`
- [ ] Description: `Testing ECHO token`
- [ ] Reward: `20`
- [ ] Contacts: `@creator_telegram`

**预期结果**: ✅ 表单验证通过  
**实际结果**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

---

#### 2.1.2 Approve + Create
- [ ] 点击 "Publish Task"
- [ ] 确认 Approve 交易（20 ECHO）
- [ ] 确认 CreateTask 交易

**预期结果**: ✅ 任务创建成功，状态为 "Open"  
**实际结果**: ________________  
**Task ID**: ________________  
**Approve Tx**: ________________  
**Create Tx**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

---

### 2.2 Helper: 接受任务

#### 2.2.1 Accept Task
- [ ] Helper 登录
- [ ] 查看任务详情
- [ ] 点击 "Accept Task"
- [ ] 确认 Approve 交易（20 ECHO）
- [ ] 确认 AcceptTask 交易

**预期结果**: ✅ 任务状态变为 "In Progress"，可以看到 Creator 联系方式  
**实际结果**: ________________  
**Accept Tx**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

---

### 2.3 Helper: 提交任务

#### 2.3.1 Submit Work
- [ ] 点击 "Submit Work"
- [ ] 确认交易

**预期结果**: ✅ 任务状态变为 "Submitted"  
**实际结果**: ________________  
**Submit Tx**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

---

### 2.4 Creator: 确认完成

#### 2.4.1 Confirm Complete
- [ ] Creator 登录
- [ ] 查看任务详情
- [ ] 点击 "Confirm Complete"
- [ ] 确认交易

**预期结果**: ✅ 任务状态变为 "Completed"，显示结算详情  
**实际结果**: ________________  
**Complete Tx**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

---

### 2.5 验证最终余额

#### 2.5.1 Creator 余额
**初始余额**: ________________  
**最终余额**: ________________  
**预期变化**: -20 ECHO  
**实际变化**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

#### 2.5.2 Helper 余额
**初始余额**: ________________  
**最终余额**: ________________  
**预期变化**: +19.6 ECHO (收到 98% 奖励)  
**实际变化**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败

---

### Journey 2 结果
**总体状态**: ⬜ 通过 / ⬜ 失败  
**问题记录**: ________________

---

## 🧪 Journey 3: 异常流程测试

### 选择测试场景
⬜ 3A: Request Fix  
⬜ 3B: Terminate  
⬜ 3C: Timeout  

### 测试结果
**场景**: ________________  
**状态**: ⬜ 通过 / ⬜ 失败  
**详细记录**: ________________

---

## ✅ 冻结点验证

### 1.1 架构与权限边界
- [ ] Register 仅负责注册与 mintInitial
- [ ] TaskEscrow 仅负责任务状态机与资金托管
- [ ] 前端未直接调用 mintInitial/burn
- [ ] mintInitial 仅 Register 可调用
- [ ] burn 仅 TaskEscrow 可调用

### 1.2 Token 经济与常量
- [ ] INITIAL_MINT = 100e18 (100 ECHO)
- [ ] CAP = 10_000_000e18
- [ ] FEE_BPS = 200 (2%)
- [ ] MAX_REWARD = 1000e18
- [ ] Helper 收 0.98R，0.02R burn

### 1.3 状态机与资金流
- [ ] 状态流转：Open → InProgress → Submitted → Completed
- [ ] InProgress 不可单方 cancel
- [ ] Submitted 不可 cancel
- [ ] 协商终止正常工作
- [ ] Request Fix 正常工作

### 1.4 超时常量
- [ ] T_OPEN = 7 days
- [ ] T_PROGRESS = 14 days
- [ ] T_REVIEW = 3 days
- [ ] T_TERMINATE_RESPONSE = 48 hours
- [ ] T_FIX_EXTENSION = 3 days

### 3.x 命名一致
- [ ] 所有变量名未改变
- [ ] 所有函数名未改变
- [ ] 所有事件名未改变
- [ ] 仅 Token name/symbol 改变

---

## 📊 总体测试结果

| Journey | 状态 | 备注 |
|---------|------|------|
| Journey 1: 注册 | ⬜ 通过 / ⬜ 失败 | |
| Journey 2: 主流程 | ⬜ 通过 / ⬜ 失败 | |
| Journey 3: 异常流程 | ⬜ 通过 / ⬜ 失败 | |

**冻结点验证**: ⬜ 全部通过 / ⬜ 有问题

---

## 🐛 问题汇总

### 发现的问题

#### 问题 1
- **严重程度**: ⬜ 阻塞 / ⬜ 严重 / ⬜ 一般 / ⬜ 轻微
- **问题描述**: ________________
- **是否为 Step 2 引入**: ⬜ 是 / ⬜ 否

---

## ✅ 验收结论

### 最终结论
⬜ **通过验收** - 可以发布  
⬜ **有条件通过** - 有轻微问题但不影响主流程  
⬜ **不通过** - 发现阻塞性问题

**验收意见**: ________________

---

**测试完成日期**: ________________  
**测试环境**: Base Sepolia (84532)  
**Token 版本**: ECHO Token (ECHO)  
**合约版本**: A4 验收版本 + name/symbol 变更
