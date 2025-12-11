# V2 实验功能：Profile 可编辑

## 功能说明

这是一个 V2 实验功能，允许用户在 Profile 页面编辑个人信息（nickname、city、skills），但**不会自动更新链上数据**。

## 开关控制

### 启用功能
在 `frontend/.env` 中设置：
```
VITE_ENABLE_PROFILE_EDIT=true
```

### 禁用功能
```
VITE_ENABLE_PROFILE_EDIT=false
```
或删除该环境变量（默认禁用）

## 使用流程

### 1. 进入编辑模式
- 在 Profile 页面，点击 "✏️ Edit Profile" 按钮
- 进入编辑模式，显示输入表单

### 2. 编辑信息
- **Nickname**：文本输入框，必填
- **City**：文本输入框，必填
- **Skills**：动态数组输入
  - 在输入框中输入技能名称
  - 点击 "➕ Add" 或按 Enter 键添加
  - 点击技能标签上的 "✖" 删除
  - 支持中英文、空格等任意字符

### 3. 保存或取消
- **💾 Save**：保存修改到后端（不上链）
  - 调用 `POST /api/profile` 更新后端数据
  - 返回新的 profileURI
  - 页面自动刷新显示新数据
  - 提示："Profile updated off-chain successfully! Re-register to update on-chain."
- **✖️ Cancel**：放弃修改，返回只读视图

## 技术实现

### 数据流
```
Edit → 本地 state → Save → POST /api/profile → 新 profileURI → 刷新 UI
```

### 不触碰链上
- ✅ 仅调用后端 API
- ✅ 不调用任何合约方法
- ✅ 不修改链上 profileURI
- ✅ 保持 MVP 冻结语义

### API 复用
使用现有的 `apiClient.createProfile()` 方法，该方法支持幂等更新（同 address 覆盖）。

## 验证清单

- [ ] 功能开关生效（VITE_ENABLE_PROFILE_EDIT=false 时不显示 Edit 按钮）
- [ ] 点击 Edit 进入编辑模式
- [ ] Nickname 和 City 输入正常
- [ ] Skills 可以添加（输入 + Add 或 Enter）
- [ ] Skills 可以删除（点击 ✖）
- [ ] Skills 支持中英文、空格等字符
- [ ] 必填验证生效（空 nickname/city/skills 提示错误）
- [ ] Save 成功后页面刷新，显示新数据
- [ ] Cancel 放弃修改，返回原数据
- [ ] 保存后提示用户需要重新注册才能上链

## 限制说明

### MVP 冻结点保护
1. **不修改链上数据**：Profile 更新仅在后端生效
2. **需要重新注册**：如果用户想更新链上 profileURI，需要重新调用 Register.register()
3. **Schema 不变**：保持 nickname/city/skills/encryptionPubKey 字段不变

### 为什么不自动上链？
根据薄片 v1.0 的 5.1 决策，Profile 更新功能被降级到 V2，因为：
- MVP 中 Register 合约的 profileURI 是不可变的
- 没有提供链上更新 profileURI 的方法
- 这是设计决策，不是 bug

## 未来改进方向（V3+）

如果需要支持链上 Profile 更新，需要：
1. 在 Register 合约中添加 `updateProfile(string newProfileURI)` 方法
2. 添加权限验证（只有 profile owner 可以更新）
3. 前端在保存后自动调用合约更新方法
4. 考虑是否需要收取更新费用

---

**当前版本**：V2 实验功能
**状态**：可用（需手动开启）
**冻结点**：全部保持
