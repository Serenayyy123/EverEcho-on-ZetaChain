# EverEcho Beta 试用指南

**版本**: Beta v1.0  
**更新日期**: 2024-XX-XX  
**试用时长**: 30-60 分钟

---

## 🎯 欢迎参与 EverEcho Beta 试用

感谢您参与 EverEcho 的 Beta 测试！EverEcho 是一个去中心化的任务市场平台，让您可以发布任务或帮助他人完成任务，并获得 EOCHO 代币奖励。

### 试用目标

通过本次试用，您将体验：
1. **注册成为用户** - 获得 100 EOCHO 初始代币
2. **发布任务** - 作为 Creator 发布一个任务
3. **接受任务** - 作为 Helper 完成任务流程
4. **异常处理** - 体验 Request Fix 或协商终止

---

## 🚀 快速开始（5 分钟）

### 准备工作

1. **安装 MetaMask**
   - 访问 https://metamask.io/
   - 安装浏览器插件
   - 创建钱包（请保存助记词！）

2. **添加 Sepolia 测试网**
   - 打开 MetaMask
   - 点击网络下拉菜单
   - 选择 "Sepolia 测试网络"

3. **获取测试 ETH**
   - 复制您的钱包地址
   - 访问 https://sepoliafaucet.com/
   - 粘贴地址，获取 0.5 ETH

### 开始试用

1. **访问应用**
   - 打开 http://localhost:5173
   - 点击 "Connect Wallet"
   - 连接 MetaMask

2. **注册账户**
   - 填写昵称、城市、技能
   - 确认交易
   - 获得 100 EOCHO 代币

3. **开始体验**
   - 浏览任务广场
   - 发布或接受任务
   - 完成任务流程

---

## 📖 详细试用流程

### 旅程 1: 新用户注册（5 分钟）

#### 步骤 1: 连接钱包
1. 访问 EverEcho 首页
2. 点击 "Connect Wallet" 按钮
3. 在 MetaMask 中确认连接
4. 确认显示您的钱包地址

**预期结果**: 页面显示钱包地址，自动跳转到注册页面

#### 步骤 2: 填写注册信息
1. 填写昵称（例如：BetaTester）
2. 填写城市（例如：Beijing）
3. 选择技能（至少选择 2 个）
4. 点击 "Register" 按钮

**预期结果**: 弹出 MetaMask 交易确认窗口

#### 步骤 3: 确认注册交易
1. 在 MetaMask 中查看交易详情
2. 点击 "确认" 按钮
3. 等待交易确认（约 15-30 秒）

**预期结果**: 
- 显示 "Registration successful! Minted 100 EOCHO"
- 自动跳转到任务广场
- 右上角显示余额：100 EOCHO

**如果 CAP 已满**: 显示 "CAP reached, no EOCHO minted"，这是正常的

---

### 旅程 2: 任务主流程（15-20 分钟）

#### 阶段 A: 发布任务（Creator 角色）

**步骤 A1: 发布任务**
1. 点击 "Publish Task" 按钮
2. 填写任务信息：
   - 标题：`Beta Test Task`
   - 描述：`This is a test task for Beta trial`
   - 奖励：`10` EOCHO
   - 联系方式：`test@example.com`
3. 点击 "Publish Task"
4. 确认交易

**预期结果**: 
- 任务发布成功
- 跳转到任务广场
- 新任务显示为 "Open" 状态

#### 阶段 B: 接受任务（Helper 角色）

**准备**: 您需要第二个账户来体验 Helper 角色
- 在 MetaMask 中创建第二个账户
- 或使用朋友的账户
- 确保第二个账户也有测试 ETH

**步骤 B1: 切换账户**
1. 在 MetaMask 中切换到第二个账户
2. 刷新页面
3. 连接钱包（如果需要注册，请先注册）

**步骤 B2: 接受任务**
1. 在任务广场找到刚发布的任务
2. 点击 "View Details"
3. 点击 "Accept Task"
4. 确认交易

**预期结果**:
- 任务状态变为 "In Progress"
- 显示 Creator 的联系方式
- 显示 "Submit Work" 按钮

#### 阶段 C: 提交工作（Helper 角色）

**步骤 C1: 提交工作**
1. 点击 "Submit Work" 按钮
2. 确认交易
3. 等待确认

**预期结果**:
- 任务状态变为 "Submitted"
- Helper 视角：显示 "Waiting for Creator to review..."

#### 阶段 D: 确认完成（Creator 角色）

**步骤 D1: 切换回 Creator 账户**
1. 在 MetaMask 中切换回第一个账户
2. 刷新页面
3. 进入任务详情页面

**步骤 D2: 确认完成**
1. 查看任务状态："Submitted"
2. 点击 "✓ Confirm Complete"
3. 确认交易
4. 等待确认

**预期结果**:
- 任务状态变为 "Completed"
- 显示结算明细：
  ```
  💰 Settlement Completed
  Helper received: 9.80 EOCHO
  Burned (2% fee): 0.20 EOCHO
  Deposit returned: 10.00 EOCHO
  ```

#### 验证余额变化

**Creator 账户**:
- 初始：100 EOCHO
- 发布任务：-10 EOCHO（锁定）
- 任务完成：+10 EOCHO（保证金退回）
- 最终：100 EOCHO

**Helper 账户**:
- 初始：100 EOCHO
- 接受任务：-10 EOCHO（锁定）
- 任务完成：+10 EOCHO（保证金退回）+ 9.8 EOCHO（奖励）
- 最终：109.8 EOCHO

---

### 旅程 3: 异常处理（10-15 分钟）

选择以下任一场景体验：

#### 选项 A: Request Fix 流程

**前提**: 任务状态为 "Submitted"

1. **Creator 请求修复**
   - 切换到 Creator 账户
   - 进入任务详情
   - 点击 "Request Fix"
   - 确认交易

2. **验证效果**
   - 显示 "Fix requested. Review period has been extended by 3 days."
   - 倒计时重新开始
   - "Request Fix" 按钮消失

3. **Helper 查看**
   - 切换到 Helper 账户
   - 查看任务详情
   - 显示 "Creator has requested a fix. Please update your submission."

#### 选项 B: 协商终止流程

**前提**: 任务状态为 "In Progress"

1. **一方请求终止**
   - 任意账户进入任务详情
   - 找到 "Terminate Task" 区块
   - 点击 "Request Terminate"
   - 确认交易

2. **另一方同意终止**
   - 切换到另一个账户
   - 进入任务详情
   - 点击 "Agree to Terminate"
   - 确认交易

3. **验证效果**
   - 任务状态变为 "Cancelled"
   - 双方保证金全额退回

---

## 🔧 Demo Seed 工具使用

为了方便演示，我们提供了 Demo Seed 工具：

### 使用方法

1. **进入 Profile 页面**
   - 连接钱包并注册
   - 点击右上角 "Profile"
   - 找到 "Demo Seed" 按钮

2. **查看演示数据**
   - 点击 "Show Demo Seed"
   - 查看 5 个预设任务模板
   - 查看当前账户信息

3. **使用任务模板**
   - 复制模板内容
   - 进入 "Publish Task" 页面
   - 粘贴到表单中
   - 快速创建演示任务

---

## ❓ 常见问题

### Q1: MetaMask 连接失败
**解决**: 
1. 确认 MetaMask 已安装
2. 切换到 Sepolia 网络
3. 刷新页面重试

### Q2: 没有收到测试 ETH
**解决**:
1. 等待 5 分钟
2. 尝试其他水龙头：
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://faucet.quicknode.com/ethereum/sepolia

### Q3: 交易失败
**解决**:
1. 检查余额是否足够
2. 增加 Gas Limit
3. 等待网络不拥堵时重试

### Q4: 页面显示错误
**解决**:
1. 刷新页面
2. 清除浏览器缓存
3. 检查控制台错误信息

### Q5: 任务状态不更新
**解决**:
1. 等待交易确认（15-30 秒）
2. 手动刷新页面
3. 检查交易是否成功

---

## 📝 反馈收集

### 遇到问题？

请记录以下信息：
1. **操作步骤**：您在做什么时遇到问题
2. **预期结果**：您期望发生什么
3. **实际结果**：实际发生了什么
4. **截图**：问题界面的截图
5. **交易哈希**：如果涉及区块链交易

### 反馈渠道

- **问题收集表**: 见 `A4_TRIAL_ISSUES.md`
- **Email**: beta@everecho.io

### 反馈模板

```
问题描述：[简短描述问题]

复现步骤：
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]

预期结果：[应该发生什么]
实际结果：[实际发生了什么]

环境信息：
- 浏览器：[Chrome/Firefox/Safari]
- MetaMask 版本：[版本号]
- 账户地址：[0x...]
- 交易哈希：[0x...]

截图：[附上截图]
```

---

## 🎉 试用完成

恭喜您完成了 EverEcho Beta 试用！

### 您体验了：
- ✅ 去中心化身份注册
- ✅ 任务发布与接受
- ✅ 智能合约自动结算
- ✅ 异常情况处理
- ✅ 代币经济系统

### 下一步

1. **填写反馈表单**
2. **分享试用体验**
3. **关注项目进展**

---

**感谢您的参与！您的反馈对我们非常重要！** 💙
