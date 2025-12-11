# Step A2 Patch-4 快速启动指南

## 🎯 目标

所有页面已完成 Mock → Real hooks 集成，可以在 Testnet 上运行完整用户旅程。

---

## 📋 前置条件

### 1. 合约已部署
确保以下合约已部署到 Sepolia 或 Hardhat 本地网络：
- ✅ EOCHOToken
- ✅ Register
- ✅ TaskEscrow

### 2. 后端服务运行
```bash
cd backend
npm install
npm run dev
# 应该在 http://localhost:3001 运行
```

### 3. MetaMask 配置
- 安装 MetaMask 浏览器扩展
- 切换到 Sepolia 测试网（或 Hardhat 本地网络）
- 确保账户有足够的 ETH 用于 gas

---

## 🚀 启动步骤

### Step 1: 配置环境变量

```bash
cd frontend
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 后端 API
VITE_BACKEND_BASE_URL=http://localhost:3001

# 合约地址（填入你部署的地址）
VITE_EOCHO_TOKEN_ADDRESS=0x...
VITE_REGISTER_ADDRESS=0x...
VITE_TASK_ESCROW_ADDRESS=0x...

# 网络配置
VITE_CHAIN_ID=11155111  # Sepolia
# VITE_CHAIN_ID=31337   # Hardhat Local
```

### Step 2: 安装依赖

```bash
cd frontend
npm install
```

### Step 3: 启动前端

```bash
npm run dev
```

前端应该在 http://localhost:5173 运行。

---

## 🧪 测试完整用户旅程

### 旅程 1: 新用户注册

1. **打开首页**
   - 访问 http://localhost:5173
   - 点击 "Connect Wallet"
   - 在 MetaMask 中确认连接

2. **自动跳转到注册页**
   - 系统检测到未注册，自动跳转到 `/register`
   - 填写表单：
     - Nickname: `Alice`
     - City: `Shanghai`
     - Skills: 选择 1-3 个技能

3. **提交注册**
   - 点击 "Register"
   - 在 MetaMask 中确认交易
   - 等待交易确认（约 15 秒）
   - 注册成功后自动跳转到任务广场

4. **验证注册**
   - 检查控制台日志：`Registration successful, minted: 100.0`
   - 如果 CAP 满，会显示：`CAP reached: no EOCHO minted`

---

### 旅程 2: 发布任务

1. **进入发布页面**
   - 在任务广场点击 "Publish Task"（或访问 `/publish`）

2. **填写任务信息**
   - Title: `Build a landing page`
   - Description: `Need a responsive landing page with modern design`
   - Reward: `50` EOCHO
   - Contacts: `alice@example.com`

3. **提交任务**
   - 点击 "Publish Task"
   - 等待后端上传（约 1-2 秒）
   - 在 MetaMask 中确认交易
   - 等待交易确认（约 15 秒）
   - 创建成功后自动跳转到任务广场

4. **验证任务**
   - 在任务广场看到新创建的任务
   - 状态显示为 "Open"

---

### 旅程 3: 接受任务

1. **切换账户**
   - 在 MetaMask 中切换到另一个账户（Bob）
   - 刷新页面，系统会提示未注册
   - 完成注册流程

2. **浏览任务**
   - 在任务广场找到 Alice 发布的任务
   - 点击任务卡片进入详情页

3. **接受任务**
   - 点击 "Accept Task"
   - 在 MetaMask 中确认交易
   - 等待交易确认
   - 页面刷新，状态变为 "In Progress"

4. **查看联系方式**
   - 接受任务后，可以看到 "Contacts" 部分
   - 显示 Creator 的联系方式（MVP：明文显示）

---

### 旅程 4: 提交工作

1. **提交工作**
   - 在任务详情页点击 "Submit Work"
   - 在 MetaMask 中确认交易
   - 等待交易确认
   - 页面刷新，状态变为 "Submitted"

2. **等待审核**
   - Helper 看到 "Waiting for Creator to review..."
   - Creator 可以看到 "Confirm Complete" 按钮

---

### 旅程 5: 确认完成

1. **切换回 Creator 账户**
   - 在 MetaMask 中切换回 Alice 账户
   - 刷新页面

2. **确认完成**
   - 在任务详情页点击 "Confirm Complete"
   - 在 MetaMask 中确认交易
   - 等待交易确认
   - 页面刷新，状态变为 "Completed"

3. **验证奖励**
   - Bob 的 EOCHO 余额增加 50
   - 在 Profile 页面可以看到任务历史

---

### 旅程 6: 查看个人资料

1. **进入 Profile 页面**
   - 点击 "Profile" 按钮

2. **查看信息**
   - 显示 Nickname, City, Skills
   - 显示 EOCHO 余额
   - 显示任务历史（分为 "Tasks I Created" 和 "Tasks I Helped"）

---

## 🐛 常见问题

### 问题 1: 连接钱包失败

**症状**：点击 "Connect Wallet" 没有反应

**解决方案**：
1. 确保已安装 MetaMask
2. 刷新页面重试
3. 检查浏览器控制台错误

---

### 问题 2: 交易失败

**症状**：MetaMask 显示交易失败

**可能原因**：
1. Gas 不足 → 在 Sepolia 水龙头获取测试 ETH
2. 合约地址错误 → 检查 `.env` 配置
3. 网络不匹配 → 确保 MetaMask 和配置使用相同网络

---

### 问题 3: 任务列表为空

**症状**：任务广场显示 "No tasks found"

**解决方案**：
1. 检查合约地址是否正确
2. 检查网络是否正确
3. 尝试发布一个新任务
4. 检查浏览器控制台错误

---

### 问题 4: 后端 API 错误

**症状**：发布任务或注册时显示 "Failed to upload"

**解决方案**：
1. 确保后端服务正在运行（http://localhost:3001）
2. 检查 `VITE_BACKEND_BASE_URL` 配置
3. 查看后端日志

---

### 问题 5: 注册后没有收到 EOCHO

**症状**：注册成功但余额为 0

**可能原因**：
1. CAP 已满 → 这是正常的，会显示提示
2. 交易未确认 → 等待更长时间
3. 合约配置错误 → 检查 Register 合约的 CAP 设置

---

## 📊 验证清单

### 功能验证
- [ ] 钱包连接成功
- [ ] 新用户自动跳转到注册页
- [ ] 已注册用户自动跳转到任务广场
- [ ] 注册成功并收到 EOCHO（或 CAP 满提示）
- [ ] 发布任务成功
- [ ] 任务列表显示正确
- [ ] 任务详情显示正确
- [ ] 接受任务成功
- [ ] 提交工作成功
- [ ] 确认完成成功
- [ ] 奖励转账成功
- [ ] Profile 显示正确

### 状态机验证
- [ ] Open → InProgress（接受任务）
- [ ] InProgress → Submitted（提交工作）
- [ ] Submitted → Completed（确认完成）
- [ ] Open → Cancelled（取消任务）

### 超时验证
- [ ] Open 超时显示倒计时
- [ ] InProgress 超时显示倒计时
- [ ] Submitted 超时显示倒计时
- [ ] 超时后可以调用超时函数

---

## 🎉 成功标志

如果你能完成以下操作，说明集成成功：

1. ✅ 两个账户都能成功注册
2. ✅ Creator 能发布任务
3. ✅ Helper 能接受任务
4. ✅ Helper 能提交工作
5. ✅ Creator 能确认完成
6. ✅ 奖励正确转账
7. ✅ Profile 显示正确的任务历史

---

## 📝 下一步

完成测试后，可以：

1. **优化 UI**：改进加载状态、错误提示
2. **添加功能**：实现真实的加密、分页、搜索
3. **性能优化**：减少轮询、添加缓存
4. **部署到生产**：配置生产环境变量

---

**祝测试顺利！** 🚀

如有问题，请查看：
- `STEP_A2_PATCH4_FINAL_REPORT.md` - 完整验收报告
- `STEP_A2_PATCH4_CODE_DIFF.md` - 代码修改详情
- `STEP_A2_PATCH4_INTEGRATION_MAP.md` - 集成对照表
