# STAGE_4.9_DUAL_PROVIDER_MANUAL_TEST.md

## 🎯 测试目标
验证双 Provider 架构解决方案，确保存入跨链资产切到 Sepolia 后，系统不再报错"Wrong Network"，并且发布流程正常工作。

## 📋 测试环境准备
- ✅ MetaMask 钱包已安装并解锁
- ✅ 已添加 ZetaChain Athens Testnet (chainId: 7001)
- ✅ 已添加 ETH Sepolia Testnet (chainId: 11155111)  
- ✅ 钱包中有足够的测试 ETH 和 ZETA 代币
- ✅ 前端应用已启动 (localhost:5173)
- ✅ 后端服务已启动 (localhost:3001)

---

## 🧪 Case 1: Zeta → 存入 Sepolia → 不手动切链直接 Publish
**目标**: 验证双 Provider 架构的核心功能

**起始状态**: 
- 钱包连接 ZetaChain Athens (7001)
- 无跨链奖励已存入

**操作步骤**:
1. 访问 PublishTask 页面
2. 填写任务基本信息（标题、描述、奖励等）
3. 启用跨链奖励，选择资产: "ETH Sepolia"
4. 输入存入金额: 0.001 ETH
5. 点击 "存入资金" 按钮
6. **确认钱包弹出切链请求** → 点击确认切到 Sepolia
7. **确认钱包弹出存入交易** → 点击确认
8. 等待存入交易确认
9. **观察页面状态** - 关键验收点
10. **不做任何手动操作**，直接点击 "Publish Task"
11. **确认钱包弹出切链请求**（切回ZetaChain）→ 点击确认
12. **确认钱包弹出发布交易** → 点击确认

**预期结果**:
- ✅ 步骤6后：钱包自动切换到 ETH Sepolia (11155111)
- ✅ 步骤8后：存入交易成功确认
- ✅ **步骤9后（关键）：页面不显示"Wrong Network"错误**
- ✅ **步骤9后：任务列表、余额显示等功能正常工作**
- ✅ 步骤9后：NetworkStatusIndicator 显示：
  - 系统网络（读）: ZetaChain Athens ✅
  - 钱包网络（写）: Sepolia test network
  - 提示："发布任务时将自动切回 ZetaChain，无需手动操作"
- ✅ 步骤11后：钱包自动切换回 ZetaChain Athens (7001)
- ✅ 步骤12后：任务发布成功，TaskEscrow 合约调用正常
- ✅ 全程用户只需确认钱包弹窗，无需理解网络概念

**关键验收点**:
- 存入后钱包在 Sepolia，但页面功能完全正常
- 任务广场可以正常浏览
- 余额显示正常
- 无任何"Wrong Network"提示

---

## 🧪 Case 2: 存入时用户拒绝切链
**目标**: 验证错误处理和状态恢复

**操作步骤**:
1. 钱包连接 ZetaChain Athens (7001)
2. 在 PublishTask 页面启用跨链奖励
3. 选择 "ETH Sepolia"，点击 "存入资金"
4. 钱包弹出切链请求
5. **点击 "拒绝" 或 "取消"**

**预期结果**:
- ✅ 显示明确提示: "用户取消了网络切换，存入未执行"
- ✅ 存入按钮恢复可点击状态
- ✅ 无假成功状态（跨链奖励未被标记为已存入）
- ✅ 可重试：再次点击 "存入资金" 重新触发切链
- ✅ NetworkGuard 模式重置为 'idle'

---

## 🧪 Case 3: 钱包初始在 Sepolia，直接进入 PublishTask
**目标**: 验证从任意网络的系统稳定性

**起始状态**: 
- 钱包连接 ETH Sepolia (11155111)
- 无跨链奖励存入

**操作步骤**:
1. **不做任何手动网络切换**
2. 直接访问 PublishTask 页面
3. 观察页面功能是否正常
4. 填写任务信息，点击 "Publish Task"
5. 确认钱包切链请求（切回ZetaChain）
6. 确认发布交易

**预期结果**:
- ✅ **步骤2后：页面完全正常显示，无"Wrong Network"错误**
- ✅ **步骤3后：任务列表、AI功能、Beta reward 等功能正常**
- ✅ 步骤3后：NetworkStatusIndicator 显示：
  - 系统网络（读）: ZetaChain Athens ✅
  - 钱包网络（写）: Sepolia test network
- ✅ 步骤5后：系统自动弹钱包切回 ZetaChain Athens (7001)
- ✅ 步骤6后：发布成功
- ✅ 用户体验：页面功能不受钱包网络影响

---

## 🧪 Case 4: 切链后 signer 失效回归验证
**目标**: 验证 signer 刷新机制

**操作步骤**:
1. 重复 Case 1 的完整流程
2. 在发布成功后，再次创建一个新任务
3. 重复存入 → 发布流程
4. 观察是否出现 signer 相关错误

**预期结果**:
- ✅ 每次切链后都使用新鲜的 signer
- ✅ 不出现 "call revert" / "wrong network" / "signer mismatch" 错误
- ✅ 多次操作都能成功完成
- ✅ 合约调用正常，交易成功

---

## 🧪 Case 5: 系统读取功能验证
**目标**: 验证 ZetaReadProvider 的稳定性

**操作步骤**:
1. 钱包连接到 Sepolia (11155111)
2. 访问任务广场页面
3. 查看任务列表
4. 点击进入任务详情页面
5. 查看余额显示
6. 测试 AI 功能
7. 测试 Beta reward 功能

**预期结果**:
- ✅ **所有读取功能正常工作**
- ✅ 任务列表正确显示
- ✅ 任务详情正确加载
- ✅ 余额显示正确
- ✅ AI 功能正常
- ✅ Beta reward 功能正常
- ✅ 无任何网络相关错误

---

## 🧪 Case 6: 网络状态指示器验证
**目标**: 验证双状态显示的准确性

**操作步骤**:
1. 钱包在 ZetaChain，观察 NetworkStatusIndicator
2. 切换到 Sepolia，观察变化
3. 进行存入操作，观察状态变化
4. 完成存入后，观察提示信息
5. 进行发布操作，观察状态变化

**预期结果**:
- ✅ 系统网络（读）始终显示 "ZetaChain Athens ✅"
- ✅ 钱包网络（写）准确反映当前钱包网络
- ✅ 存入过程中显示正确的状态提示
- ✅ 存入完成后显示 "发布任务时将自动切回 ZetaChain"
- ✅ 发布过程中显示正确的状态提示

---

## 📊 成功标准总结

### 🎯 核心解决目标
- ✅ **存入切链后不报错**: 钱包切到 Sepolia 后，页面功能完全正常
- ✅ **读写分离生效**: 系统读取走 ZetaReadProvider，写入走钱包 signer
- ✅ **双状态显示**: NetworkStatusIndicator 正确显示系统链和钱包链

### 🔒 稳定性目标  
- ✅ **无假成功**: 所有失败都有明确提示，不产生假成功状态
- ✅ **signer 刷新**: 切链后必须使用新鲜的 signer，避免失效问题
- ✅ **状态管理**: NetworkGuard 模式正确管理，错误时正确重置

### 🚀 功能完整性
- ✅ **现有功能不受影响**: 任务浏览、AI、Beta reward 等功能正常
- ✅ **跨链奖励流程**: 存入 → 发布的完整流程正常工作
- ✅ **用户体验**: 操作简单，提示清晰

---

## 🔧 测试工具和验证方法

### 浏览器开发者工具验证
```javascript
// 在浏览器控制台验证双 Provider 状态
// 1. 检查 ZetaReadProvider 连接
window.zetaReadProvider = (await import('/src/services/zetaReadProvider.ts')).zetaReadProvider;
await window.zetaReadProvider.checkConnection();

// 2. 检查钱包网络
ethereum.request({ method: 'eth_chainId' }).then(console.log);

// 3. 检查 NetworkGuard 状态
window.networkGuard = (await import('/src/services/networkGuard.ts')).default.getInstance();
console.log('NetworkGuard mode:', window.networkGuard.getMode());
```

### 网络状态验证
- 检查钱包显示的网络名称
- 验证任务列表是否正常加载（走 ZetaReadProvider）
- 确认合约写入是否在正确网络执行（走钱包 signer）
- 验证 NetworkStatusIndicator 显示是否准确

### 错误日志检查
- 控制台不应出现 "Wrong Network" 错误
- 不应出现 signer 相关错误
- 不应出现合约调用失败（除用户拒绝外）

---

## 🎉 验收完成标准

**所有测试用例通过后，双 Provider 架构方案验收完成！**

**核心成果**:
- 用户存入跨链资产后，钱包可以停留在任意网络
- 系统功能（任务浏览、余额显示等）不受钱包网络影响
- 发布任务时自动切回 ZetaChain，用户体验丝滑
- 读写分离架构稳定可靠，为未来扩展提供良好基础

**技术价值**:
- 解决了单 Provider 架构的根本问题
- 提供了稳定的系统读取能力
- 保持了灵活的钱包写入能力
- 实现了真正的网络无感操作