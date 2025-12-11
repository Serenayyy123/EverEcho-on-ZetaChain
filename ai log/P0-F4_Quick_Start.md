# P0-F4 快速开始指南

## 🚀 5 分钟启动

### 1. 确保前置条件

```bash
# Backend 运行中
cd backend
npm run dev

# 合约已部署（TaskEscrow, EOCHOToken）
# 用户已注册且有 EOCHO 余额
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173/publish

### 3. 测试流程

#### 场景 1：成功发布任务

1. **连接钱包**（确保有 EOCHO 余额）
2. **填写表单**：
   - Title: "Need help with React project"
   - Description: "Looking for a React developer to help build a dashboard"
   - Reward: "50" EOCHO
   - Contacts: "email@example.com, WeChat: user123"
3. **点击 "Publish Task"**
4. **观察状态提示**：
   - ✅ Validating input...
   - ✅ Checking balance...
   - ✅ Uploading task metadata...
   - ✅ Creating task on blockchain...
   - ✅ Waiting for confirmation...
   - ✅ Task created successfully!
5. **自动跳转**到任务广场
6. **验证**：在任务广场看到新任务（Open 状态）

#### 场景 2：必填字段校验

1. **留空 Title**
2. **点击 "Publish Task"**
3. **预期**：显示红色错误提示 "Title is required"
4. **测试其他字段**：description, reward, contacts

#### 场景 3：Reward 范围校验

**测试 1：Reward = 0**
- 输入 "0"
- 点击提交
- 预期：提示 "Reward must be a positive number"

**测试 2：Reward > 1000**
- 输入 "1001"
- 点击提交
- 预期：提示 "Reward cannot exceed 1000 EOCHO"

**测试 3：Reward 非数字**
- 输入 "abc"
- 点击提交
- 预期：提示 "Reward must be a positive number"

#### 场景 4：余额不足

1. **查看当前余额**（假设余额 = 100 EOCHO）
2. **输入 Reward = 150**
3. **点击 "Publish Task"**
4. **预期**：提示 "Insufficient balance. You need at least 150 EOCHO"

---

## 📋 功能清单

### 表单字段
- ✅ Title（必填）
- ✅ Description（必填）
- ✅ Reward（必填、数字、单位 EOCHO）
- ✅ Contacts（必填）

### 表单校验
- ✅ 必填字段校验
- ✅ Reward 范围校验（0 < reward <= 1000）
- ✅ 余额前置检查
- ✅ 实时错误提示

### 发布流程
- ✅ 先上传到 Backend（获取 taskURI）
- ✅ 后调用链上 createTask
- ✅ 分步状态提示
- ✅ 成功后自动跳转

### 错误处理
- ✅ Backend 上传失败 → 不上链
- ✅ 链上交易失败 → 保留表单数据
- ✅ 友好的错误提示

---

## 🎯 关键设计点

### 1. 流程固定（冻结点 2.3-P0-F4）

```
用户填写表单
    ↓
前端校验（必填、范围、余额）
    ↓
POST /api/task → 获取 taskURI
    ↓
createTask(reward, taskURI) → 链上交易
    ↓
成功 → 跳转任务广场
```

### 2. 字段命名（冻结点 3.2）

POST 到 backend 的 JSON：
```json
{
  "title": "...",
  "description": "...",
  "contactsEncryptedPayload": "...",
  "createdAt": 1234567890
}
```

**严格禁止**：contactsEncrypted, contact, created_at 等变体

### 3. MAX_REWARD 限制（冻结点 1.2-10）

- 前端校验：0 < reward <= 1000 EOCHO
- 超出时阻止提交并提示

### 4. 余额检查（冻结点 1.3-14）

- 提交前检查：balance >= reward
- 余额不足时阻止提交

---

## 🔧 故障排查

### 问题：点击 "Publish Task" 无反应
- 检查是否填写了所有必填字段
- 查看浏览器控制台错误
- 确认钱包已连接

### 问题：提示 "Insufficient balance"
- 检查当前 EOCHO 余额
- 确认 reward 金额是否超过余额
- 可以通过 Profile 页面查看余额

### 问题：Backend 上传失败
- 检查 Backend 是否运行（http://localhost:3000）
- 查看 Backend 日志
- 确认 API 端点正确

### 问题：链上交易失败
- 检查合约地址是否正确
- 确认网络是否匹配
- 查看 MetaMask 错误信息
- 确认 Gas 费用充足

### 问题：成功后没有跳转
- 检查路由配置
- 查看浏览器控制台错误
- 手动访问 `/tasks` 查看新任务

---

## 📚 相关文档

- 完整实现总结：`P0-F4_Implementation_Summary.md`
- 薄片验收报告：（已通过验收）
- P0-F1 注册流程：`P0-F1_实现总结.md`
- P0-F2 任务广场：`P0-F2_实现总结.md`
- P0-F3 Profile 页面：`P0-F3_Implementation_Summary.md`
- PRD 文档：`PRD.md`

---

## 🎉 MVP 核心功能已完成

P0-F4 完成后，EverEcho MVP 的核心功能已全部实现：

- ✅ **P0-F1**：钱包连接与注册
- ✅ **P0-F2**：任务广场与详情
- ✅ **P0-F3**：Profile 页面
- ✅ **P0-F4**：发布任务

用户现在可以：
1. 注册账号
2. 发布任务
3. 浏览任务广场
4. 查看任务详情
5. 接受任务
6. 提交任务
7. 确认完成
8. 查看个人 Profile 和任务历史

**MVP 可以投入使用了！** 🚀
