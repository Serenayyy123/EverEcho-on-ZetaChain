# Chain Isolation - 前端测试指南

## 🎯 测试目标

验证 Chain Isolation Root Fix 后，前端显示和功能是否正常。

---

## ⚡ 快速测试（5 分钟）

### Step 1: 清空缓存（必须！）
```
1. 打开浏览器（Chrome/Edge）
2. 按 Ctrl+Shift+Delete
3. 选择：
   - 时间范围：全部
   - 勾选：缓存、Cookie、本地存储
4. 点击"清除数据"
5. 关闭浏览器
6. 重新打开
```

### Step 2: 访问 TaskSquare
```
1. 访问：http://localhost:5173/task-square
2. 连接钱包
3. 观察任务列表
```

### Step 3: 验证 Task 3
```
1. 找到 Task 3："Seeking Accommodation in Guangzhou for 2 Nights"
2. 检查 category badge：
   ✅ 应该显示：🏠 Hosting / 借宿
   ❌ 不应该显示：其他 category 或无 badge
3. 点击进入详情页
4. 验证所有信息正确
```

### Step 4: 创建新任务
```
1. 点击"Publish Task"
2. 填写任务信息
3. 选择 category（例如：Hosting）
4. 发布任务
5. 返回 TaskSquare
6. 验证新任务显示正确
```

---

## 🔍 详细测试（15 分钟）

### Test Case 1: TaskSquare 显示

**测试步骤**：
1. 访问 TaskSquare
2. 连接钱包
3. 等待任务加载

**预期结果**：
- ✅ 显示任务数量：3-13 个（取决于数据库）
- ✅ 所有任务都是 Base Sepolia 的
- ✅ 没有旧 Sepolia 的任务混入
- ✅ 每个任务的 title、description、category 正确

**验证方法**：
```javascript
// 打开浏览器控制台
// 检查 API 响应
// 应该看到所有任务的 chainId = "84532"
```

---

### Test Case 2: Task 3 Category 显示

**测试步骤**：
1. 在 TaskSquare 找到 Task 3
2. 观察 category badge

**预期结果**：
- ✅ Title: "Seeking Accommodation in Guangzhou for 2 Nights"
- ✅ Badge: 🏠 Hosting / 借宿（紫色）
- ✅ Description: 包含住宿相关内容

**失败情况**：
- ❌ 显示其他 category
- ❌ 没有 badge
- ❌ title 和 category 不匹配

---

### Test Case 3: 任务详情页

**测试步骤**：
1. 点击 Task 3 进入详情页
2. 检查所有信息

**预期结果**：
- ✅ Title 正确
- ✅ Description 正确
- ✅ Category badge 正确
- ✅ Creator 信息正确
- ✅ Status 正确
- ✅ Contacts 显示正确（如果已 accept）

---

### Test Case 4: 创建新任务

**测试步骤**：
1. 点击"Publish Task"
2. 填写表单：
   - Title: "Test Task - Chain Isolation"
   - Description: "Testing chain isolation fix"
   - Category: 选择 "Hosting"
   - Contacts: 填写联系方式
3. 点击"Publish"
4. 等待交易确认
5. 返回 TaskSquare

**预期结果**：
- ✅ 任务创建成功
- ✅ TaskSquare 显示新任务
- ✅ Category badge 显示 "Hosting / 借宿"
- ✅ 所有信息正确

**验证数据库**：
```bash
cd backend
npx ts-node scripts/check-environment.ts
# 应该看到新任务，chainId = 84532
```

---

### Test Case 5: Accept 任务

**测试步骤**：
1. 选择一个 Open 状态的任务
2. 点击"Accept"
3. 确认交易
4. 等待状态更新

**预期结果**：
- ✅ 任务状态变为 Ongoing
- ✅ Helper 信息显示
- ✅ Contacts 解密成功
- ✅ 可以看到联系方式

---

### Test Case 6: Submit 任务

**测试步骤**：
1. 作为 Helper，在已 Accept 的任务上
2. 点击"Submit"
3. 确认交易
4. 等待状态更新

**预期结果**：
- ✅ 任务状态变为 Submitted
- ✅ 等待 Creator 确认
- ✅ 所有信息正确

---

### Test Case 7: Confirm Complete

**测试步骤**：
1. 作为 Creator，在 Submitted 状态的任务上
2. 点击"Confirm Complete"
3. 确认交易
4. 等待状态更新

**预期结果**：
- ✅ 任务状态变为 Completed
- ✅ Token 转账成功
- ✅ 任务从 Open-only 池中移除（如果开启）

---

### Test Case 8: UI 功能

**测试步骤**：
1. 测试 Open-only toggle
2. 测试 Show ongoing toggle
3. 测试 Category filter
4. 测试 Search

**预期结果**：
- ✅ Open-only：只显示 Open 状态任务
- ✅ Show ongoing：显示/隐藏 Ongoing 任务
- ✅ Category filter：正确过滤任务
- ✅ Search：正确搜索任务

---

## 🐛 常见问题排查

### 问题 1: Task 3 仍显示错误 category

**可能原因**：
- 浏览器缓存未清空
- 后端未重启
- 数据库未更新

**解决方法**：
```bash
# 1. 清空浏览器缓存（Ctrl+Shift+Delete）
# 2. 重启后端
cd backend
# 停止后端，然后：
npm run dev

# 3. 验证数据库
npx ts-node scripts/check-task3-data.ts
```

---

### 问题 2: 任务数量不对

**可能原因**：
- chainId 过滤未生效
- 数据库迁移失败

**解决方法**：
```bash
cd backend

# 检查环境
npx ts-node scripts/check-environment.ts

# 检查 chainId 过滤
npx ts-node scripts/test-chainid-filtering.ts

# 应该看到：
# - 所有任务都有 chainId = 84532
# - 当前链任务数量正确
```

---

### 问题 3: 新任务 category 不正确

**可能原因**：
- 前端发送的 category 不正确
- 后端保存逻辑有问题

**解决方法**：
```bash
# 1. 检查浏览器控制台
# 查看 POST /api/task 请求
# 确认 category 字段正确

# 2. 检查后端日志
# 查看任务创建日志

# 3. 检查数据库
cd backend
npx ts-node scripts/check-latest-task.ts
```

---

### 问题 4: Contacts 解密失败

**可能原因**：
- ContactKey 没有 chainId
- 查询条件不正确

**解决方法**：
```bash
cd backend

# 检查 ContactKey
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.contactKey.findMany().then(keys => {
  console.log('ContactKeys:', keys);
  prisma.\$disconnect();
});
"

# 应该看到所有 ContactKey 都有 chainId
```

---

## ✅ 验收标准

### 必须通过（P0）
- ✅ Task 3 显示正确的 category badge
- ✅ 所有任务都是当前链的
- ✅ 创建新任务功能正常
- ✅ Category 正确保存和显示

### 应该通过（P1）
- ✅ Accept 任务功能正常
- ✅ Submit 任务功能正常
- ✅ Confirm Complete 功能正常
- ✅ Contacts 解密正常

### 可选通过（P2）
- ✅ UI 功能（toggle, filter, search）正常
- ✅ 链切换测试通过

---

## 📊 测试报告模板

```markdown
# Chain Isolation 前端测试报告

## 测试环境
- 浏览器：Chrome/Edge
- 前端：http://localhost:5173
- 后端：http://localhost:3001
- 链：Base Sepolia (84532)

## 测试结果

### Test Case 1: TaskSquare 显示
- 状态：✅ Pass / ❌ Fail
- 任务数量：X 个
- 备注：

### Test Case 2: Task 3 Category
- 状态：✅ Pass / ❌ Fail
- Category：Hosting / 其他
- 备注：

### Test Case 3: 任务详情页
- 状态：✅ Pass / ❌ Fail
- 备注：

### Test Case 4: 创建新任务
- 状态：✅ Pass / ❌ Fail
- 备注：

### Test Case 5-8: 其他功能
- Accept：✅ Pass / ❌ Fail
- Submit：✅ Pass / ❌ Fail
- Confirm：✅ Pass / ❌ Fail
- UI 功能：✅ Pass / ❌ Fail

## 问题记录
1. 问题描述
2. 复现步骤
3. 预期结果
4. 实际结果

## 总体评价
- ✅ 通过验收 / ❌ 需要修复
```

---

## 🚀 测试完成后

### 如果全部通过
1. ✅ 标记验收 checklist 为完成
2. ✅ 更新执行报告
3. ✅ 通知团队修复完成

### 如果有问题
1. ❌ 记录问题详情
2. ❌ 提供复现步骤
3. ❌ 等待修复后重新测试

---

## 📞 支持

**后端验证脚本**：
```bash
cd backend
npx ts-node scripts/check-environment.ts
npx ts-node scripts/test-chainid-filtering.ts
npx ts-node scripts/check-task3-data.ts
```

**文档**：
- 验收 Checklist：`docs/CHAIN_ISOLATION_ACCEPTANCE_CHECKLIST.md`
- 执行报告：`docs/CHAIN_ISOLATION_EXECUTION_REPORT.md`
- 根治方案：`docs/CHAIN_ISOLATION_ROOT_FIX.md`
