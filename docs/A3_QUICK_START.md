# A3 快速开始：5 分钟上手 EverEcho

**目标**: 最快速度体验 EverEcho 核心功能

**时间**: 5-10 分钟

---

## 🚀 三步开始

### 步骤 1: 准备钱包（2 分钟）

#### 1.1 安装 MetaMask

如果还没有 MetaMask：
1. 访问 https://metamask.io/
2. 点击 "Download"
3. 选择你的浏览器（Chrome/Firefox/Edge）
4. 安装插件
5. 创建钱包（保存助记词！）

#### 1.2 添加 Sepolia 网络

1. 打开 MetaMask
2. 点击顶部网络下拉菜单
3. 点击 "添加网络"
4. 选择 "Sepolia 测试网络"

或手动添加：
- 网络名称: `Sepolia`
- RPC URL: `https://rpc.sepolia.org`
- 链 ID: `11155111`
- 货币符号: `ETH`

#### 1.3 获取测试 ETH

1. 复制你的钱包地址
2. 访问 https://sepoliafaucet.com/
3. 粘贴地址，点击 "Send Me ETH"
4. 等待 1-2 分钟
5. 确认收到 0.5 ETH

---

### 步骤 2: 注册账户（2 分钟）

#### 2.1 连接钱包

1. 访问 http://localhost:5173
2. 点击 "Connect Wallet"
3. 选择 MetaMask
4. 点击 "下一步" → "连接"

#### 2.2 填写注册表单

1. 自动跳转到注册页面
2. 填写信息：
   - Nickname: `你的昵称`
   - City: `你的城市`
   - Skills: 选择 2-3 个技能
3. 点击 "Register"
4. 在 MetaMask 中确认交易
5. 等待 15-30 秒

#### 2.3 验证注册成功

✅ 显示 "Registration successful! Minted 100 EOCHO"  
✅ 自动跳转到 TaskSquare  
✅ 右上角显示余额: 100 EOCHO

---

### 步骤 3: 体验核心功能（3 分钟）

#### 选项 A: 发布任务（Creator 角色）

1. 点击 "Publish Task"
2. 填写任务信息：
   - Title: `测试任务`
   - Description: `这是一个测试任务`
   - Reward: `10`
   - Contacts: `test@example.com`
3. 点击 "Publish Task"
4. 确认交易
5. 等待确认
6. 任务出现在 TaskSquare

#### 选项 B: 接受任务（Helper 角色）

1. 在 TaskSquare 中找到一个 Open 状态的任务
2. 点击 "View Details"
3. 点击 "Accept Task"
4. 确认交易
5. 等待确认
6. 状态变为 "In Progress"

---

## ✅ 完成检查

- [ ] MetaMask 已安装并配置
- [ ] 获得 Sepolia 测试 ETH
- [ ] 成功注册账户
- [ ] 收到 100 EOCHO
- [ ] 发布或接受了一个任务

---

## 🎯 下一步

### 完整体验

想要完整体验任务流程？查看 `A3_DEMO_GUIDE.md`

### 遇到问题？

1. 查看 [常见问题](#常见问题)
2. 加入支持群组
3. 提交问题反馈

---

## ❓ 常见问题

### Q1: MetaMask 连接失败

**原因**: 网络未切换到 Sepolia

**解决**: 
1. 打开 MetaMask
2. 切换到 Sepolia 网络
3. 刷新页面

---

### Q2: 没有收到测试 ETH

**原因**: 水龙头限制或网络延迟

**解决**:
1. 等待 5 分钟
2. 尝试其他水龙头：
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://faucet.quicknode.com/ethereum/sepolia
3. 联系支持获取测试 ETH

---

### Q3: 注册交易失败

**原因**: Gas 不足或网络拥堵

**解决**:
1. 确认有足够的 ETH（至少 0.01 ETH）
2. 增加 Gas Limit
3. 等待网络不拥堵时重试

---

### Q4: 余额显示 0 EOCHO

**原因**: CAP 已满或交易未确认

**解决**:
1. 等待交易确认（15-30 秒）
2. 刷新页面
3. 如果显示 "CAP reached"，这是正常的
4. 可以通过完成任务获得 EOCHO

---

### Q5: 页面显示错误

**原因**: 后端服务未启动或网络问题

**解决**:
1. 确认后端服务正在运行
2. 检查浏览器控制台错误
3. 刷新页面
4. 清除浏览器缓存

---

## 📞 获取帮助

### 支持渠道

- **微信群**: [群二维码]
- **Telegram**: [群链接]
- **Email**: support@everecho.io

### 工作时间

- 周一至周五: 10:00-22:00
- 周末: 14:00-20:00
- 响应时间: <2 小时

---

## 🎉 开始使用！

现在你已经准备好了，开始探索 EverEcho 吧！

**提示**: 建议准备两个账户（Creator 和 Helper）以体验完整流程。
