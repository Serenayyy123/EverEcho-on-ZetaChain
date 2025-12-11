# Token Symbol Patch - 回归测试清单

**测试日期**: 2025-11-25  
**测试环境**: Base Sepolia  
**前端**: http://localhost:5173  
**后端**: http://localhost:3001

---

## 🎯 测试目标

验证所有 UI 展示已从 "EOCHO" 更新为 "ECHO"，且不影响任何业务逻辑和已修复功能。

---

## ✅ Journey 1: 注册流程

### 测试步骤
1. 打开 http://localhost:5173
2. 连接 MetaMask（Base Sepolia）
3. 点击 "Register" 进入注册页面
4. 填写 nickname、city、skills、contacts
5. 点击 "Register" 提交

### 验收标准
- [ ] 注册成功提示显示 **"Registration successful! Minted 100 ECHO."**
- [ ] 如果 CAP 满，提示显示 **"CAP reached, no ECHO minted. Please earn ECHO by completing tasks."**
- [ ] 注册后跳转到 Profile 页面
- [ ] Profile 余额单位显示 **"ECHO"**（不是 "EOCHO"）

### 业务逻辑验证
- [ ] 链上 mint 100 ECHO 成功（如果未达 CAP）
- [ ] 余额正确显示（例如 100.0 ECHO）
- [ ] 注册状态正确（isRegistered = true）

---

## ✅ Journey 2: 创建任务

### 测试步骤
1. 在 Profile 页面，点击 "Publish Task"
2. 填写任务信息：
   - Title: "Test Task"
   - Description: "Test description"
   - Reward: 10
3. 点击 "Create Task"

### 验收标准
- [ ] 表单标签显示 **"Reward (ECHO) *"**（不是 "Reward (EOCHO) *"）
- [ ] 表单提示显示 **"Maximum: 1000 ECHO"**（不是 "1000 EOCHO"）
- [ ] 如果输入 > 1000，错误显示 **"Reward cannot exceed 1000 ECHO"**
- [ ] 创建成功后，TaskSquare 显示 **"10 ECHO"**

### 业务逻辑验证
- [ ] 链下 API 创建任务成功
- [ ] 链上 createTask 成功
- [ ] 余额扣除正确（-10 ECHO）
- [ ] 任务状态为 Open

---

## ✅ Journey 3: 接受任务

### 测试步骤
1. 切换到另一个账户（Helper）
2. 在 TaskSquare 找到刚创建的任务
3. 点击任务卡片进入 TaskDetail
4. 点击 "Accept Task"

### 验收标准
- [ ] TaskDetail 奖励标签显示 **"ECHO"**（不是 "EOCHO"）
- [ ] 如果需要授权，提示显示 **"Approving 10 ECHO for TaskEscrow contract..."**
- [ ] 如果授权失败，错误显示 **"Required amount: 10 ECHO"**
- [ ] 接受成功后，状态变为 "In Progress"

### 业务逻辑验证
- [ ] 链上 approve 成功（如果需要）
- [ ] 链上 acceptTask 成功
- [ ] Helper 余额扣除正确（-10 ECHO）
- [ ] 任务状态为 InProgress

---

## ✅ Journey 4: 提交与完成任务

### 测试步骤
1. Helper 点击 "Submit Work"
2. Creator 点击 "Confirm Complete"

### 验收标准
- [ ] 提交成功后，状态变为 "Submitted"
- [ ] 确认完成后，结算明细显示：
  - **"Helper received: 9.8 ECHO"**（不是 "9.8 EOCHO"）
  - **"Burned (2% fee): 0.2 ECHO"**（不是 "0.2 EOCHO"）
  - **"Deposit returned: 10 ECHO"**（不是 "10 EOCHO"）
- [ ] 任务状态变为 "Completed"

### 业务逻辑验证
- [ ] 链上 submitWork 成功
- [ ] 链上 confirmComplete 成功
- [ ] Helper 余额增加 19.8 ECHO（9.8 奖励 + 10 押金）
- [ ] Creator 余额不变（押金已扣除）
- [ ] 2% 手续费正确燃烧

---

## ✅ Journey 5: 任务历史

### 测试步骤
1. 在 Profile 页面查看 "Task History"
2. 查看不同状态的任务

### 验收标准

#### Creator 视角
- [ ] Open: **"Deposited 10 ECHO"**
- [ ] InProgress: **"Deposited 10 ECHO (locked)"**
- [ ] Submitted: **"Deposited 10 ECHO (under review)"**
- [ ] Completed: **"Paid 9.8 ECHO to Helper (Fee 0.2 burned)"**
- [ ] Cancelled: **"Refunded 10 ECHO"**

#### Helper 视角
- [ ] Open: **"-"**
- [ ] InProgress: **"Deposited 10 ECHO (locked)"**
- [ ] Submitted: **"Deposited 10 ECHO (under review)"**
- [ ] Completed: **"Received 9.8 ECHO + Deposit 10 refunded (Fee 0.2 burned)"**
- [ ] Cancelled: **"Refunded 10 ECHO"**

### 业务逻辑验证
- [ ] 任务历史正确显示
- [ ] 金额计算正确
- [ ] 状态标签正确

---

## ✅ Journey 6: 异常路径

### 6.1 RequestFix
1. Helper 提交后，Creator 点击 "Request Fix"
2. 验证：
   - [ ] 流程正常
   - [ ] 状态变为 "InProgress"
   - [ ] 金额显示 "ECHO"

### 6.2 Terminate
1. 在 InProgress 状态，Creator 点击 "Terminate"
2. 验证：
   - [ ] 流程正常
   - [ ] 状态变为 "Cancelled"
   - [ ] 双方押金退回
   - [ ] 金额显示 "ECHO"

### 6.3 Timeout
1. 等待任务超时（或手动触发）
2. 验证：
   - [ ] 流程正常
   - [ ] 状态变为 "Cancelled"
   - [ ] 金额显示 "ECHO"

---

## ✅ Journey 7: 钱包状态

### 7.1 Disconnect
1. 点击 "Disconnect Wallet"
2. 验证：
   - [ ] 断开连接正常
   - [ ] 不触发无限循环
   - [ ] 页面状态正确

### 7.2 Reconnect
1. 点击 "Connect Wallet"
2. 验证：
   - [ ] 重新连接正常
   - [ ] 余额刷新显示 **"ECHO"**
   - [ ] Profile 数据正确加载

### 7.3 控制台日志
1. 打开浏览器控制台
2. 验证：
   - [ ] 余额日志显示 **"Balance: X ECHO"**（不是 "X EOCHO"）
   - [ ] 注册日志显示 **"no ECHO minted"**（如果 CAP 满）

---

## ✅ Journey 8: 其他功能

### 8.1 TaskSquare
- [ ] 任务卡片显示 **"X ECHO"**
- [ ] 筛选功能正常
- [ ] 分页功能正常

### 8.2 Contacts Decrypt
- [ ] 联系方式解密正常
- [ ] 显示正确的联系方式

### 8.3 Task Sync
- [ ] 链上任务同步正常
- [ ] 数据库任务正确

---

## 📊 测试结果汇总

### 编译检查
- [x] 无编译错误
- [x] 无类型错误
- [x] 热更新正常

### UI 展示检查
- [ ] 所有 "EOCHO" 已替换为 "ECHO"
- [ ] 所有 "MAX_REWARD_EOCHO" 已替换为 "MAX_REWARD"
- [ ] 所有余额/奖励单位显示 "ECHO"

### 业务逻辑检查
- [ ] 合约调用正常
- [ ] 状态机流程正常
- [ ] 资金流计算正确
- [ ] 已修复功能不受影响

---

## 🚨 发现的问题

| 问题编号 | 描述 | 严重程度 | 状态 |
|---------|------|---------|------|
| - | - | - | - |

---

## ✅ 验收结论

- [ ] **通过**：所有测试项通过，可以部署
- [ ] **不通过**：存在问题，需要修复

**测试人员签名**: _______________  
**测试日期**: _______________

---

## 📝 备注

- 本次修复仅涉及展示层，不影响任何业务逻辑
- 所有冻结点保持不变
- 已修复功能（disconnect/reconnect、task sync、contacts decrypt）不受影响
