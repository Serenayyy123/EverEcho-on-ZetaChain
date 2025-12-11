# Token Symbol Display Patch: EOCHO → ECHO

**日期**: 2025-11-25  
**类型**: 展示层修复  
**影响范围**: 前端 UI 文案

---

## 📋 修复目标

链上合约 `EOCHOToken` 的 `name()` / `symbol()` 已返回 **"ECHO Token" / "ECHO"**，但前端 UI 仍显示 **EOCHO**。本次修复将所有展示层的 token 名称统一为 **ECHO**。

---

## ✅ 修改清单

### 1. 新增文件

**`frontend/src/constants/token.ts`**
- 建立单一 token 展示源
- 导出 `TOKEN_SYMBOL = 'ECHO'`
- 导出 `TOKEN_NAME = 'ECHO Token'`
- 导出 `MAX_REWARD = 1000`

### 2. 修改文件（25 处）

| 文件 | 修改内容 | 行数 |
|------|---------|------|
| `frontend/src/pages/Home.tsx` | "Earn EOCHO" → "Earn ECHO" | 58 |
| `frontend/src/pages/Profile.tsx` | 余额标签 "EOCHO" → "ECHO" | 290 |
| `frontend/src/pages/Profile.tsx` | 注释 "EOCHO 余额" → "ECHO 余额" | 23 |
| `frontend/src/pages/Register.tsx` | "Minted 100 EOCHO" → "Minted 100 ECHO" | 296 |
| `frontend/src/pages/Register.tsx` | CAP 提示 "EOCHO" → "ECHO" (2处) | 312 |
| `frontend/src/pages/PublishTask.tsx` | 表单标签 "Reward (EOCHO)" → "Reward (ECHO)" | 142 |
| `frontend/src/pages/PublishTask.tsx` | 提示 "Maximum: X EOCHO" → "Maximum: X ECHO" | 152 |
| `frontend/src/pages/PublishTask.tsx` | 错误 "exceed X EOCHO" → "exceed X ECHO" | 57 |
| `frontend/src/pages/PublishTask.tsx` | `MAX_REWARD_EOCHO` → `MAX_REWARD` | 25 |
| `frontend/src/pages/TaskDetail.tsx` | 奖励标签 "EOCHO" → "ECHO" | 382 |
| `frontend/src/pages/TaskDetail.tsx` | 授权提示 "Approving X EOCHO" → "Approving X ECHO" | 120 |
| `frontend/src/pages/TaskDetail.tsx` | 错误提示 "Required amount: X EOCHO" → "X ECHO" | 203 |
| `frontend/src/pages/TaskDetail.tsx` | 结算明细 "EOCHO" → "ECHO" (3处) | 430-438 |
| `frontend/src/components/TaskHistory.tsx` | 金额变动文案 "EOCHO" → "ECHO" (8处) | 114-145 |
| `frontend/src/hooks/useProfile.ts` | 注释 "EOCHO 余额" → "ECHO 余额" | 14 |
| `frontend/src/hooks/useWallet.ts` | 日志 "EOCHO" → "ECHO" | 272 |
| `frontend/src/hooks/useRegister.ts` | 日志 "no EOCHO minted" → "no ECHO minted" | 90 |
| `frontend/src/hooks/useTasks.ts` | 错误 "1000 EOCHO" → "1000 ECHO" | 270 |
| `frontend/src/hooks/useTasks.ts` | `MAX_REWARD_EOCHO` → `MAX_REWARD` | 12 |
| `frontend/src/hooks/useCreateTask.ts` | 注释 "EOCHO 单位" → "ECHO 单位" | 27 |
| `frontend/src/hooks/useCreateTask.ts` | `MAX_REWARD_EOCHO` → `MAX_REWARD` (3处) | 21, 95, 97, 205 |
| `frontend/src/utils/formatters.ts` | 注释 "格式化 EOCHO" → "格式化 ECHO" | 17 |
| `frontend/src/utils/demoSeed.ts` | Demo 数据 "EOCHO" → "ECHO" (2处) | 161, 323 |
| `frontend/src/mock/types.ts` | 注释 "EOCHO balance" → "ECHO balance" | 19 |
| `frontend/src/mock/types.ts` | 注释 "1000 EOCHO" → "1000 ECHO" | 60 |

---

## 🔒 冻结点保持

### 不变项（强约束）

1. **合约调用逻辑**：
   - 所有 `EOCHOToken.json` ABI 引用不变
   - 合约地址 `VITE_EOCHO_TOKEN_ADDRESS` 环境变量名不变
   - `ethers.Contract` 调用参数不变

2. **状态机与资金流**：
   - TaskStatus 枚举不变
   - 双向抵押逻辑不变
   - 2% 手续费计算不变
   - 结算公式不变

3. **API 字段名**：
   - Backend API 接口字段名不变
   - 数据库字段名不变
   - 链上事件监听不变

4. **已修复功能**：
   - disconnect / reconnect 状态机
   - task sync / contacts decrypt
   - requestFix / terminate / timeout

---

## 🧪 回归测试清单

### Journey 1: 注册流程
- [ ] 注册成功提示显示 "Minted 100 ECHO"
- [ ] CAP 满提示显示 "no ECHO minted...earn ECHO"
- [ ] Profile 余额单位显示 "ECHO"

### Journey 2: 创建任务
- [ ] PublishTask 表单标签显示 "Reward (ECHO) *"
- [ ] 表单提示显示 "Maximum: 1000 ECHO"
- [ ] 验证错误显示 "cannot exceed 1000 ECHO"
- [ ] 创建成功后 TaskSquare 显示 "X ECHO"

### Journey 3: 接受任务
- [ ] TaskDetail 奖励标签显示 "ECHO"
- [ ] 授权提示显示 "Approving X ECHO"
- [ ] 错误提示显示 "Required amount: X ECHO"

### Journey 4: 完成任务
- [ ] 结算明细显示 "Helper received: X ECHO"
- [ ] 结算明细显示 "Burned (2% fee): X ECHO"
- [ ] 结算明细显示 "Deposit returned: X ECHO"

### Journey 5: 任务历史
- [ ] TaskHistory 金额变动显示 "Deposited X ECHO"
- [ ] TaskHistory 金额变动显示 "Paid X ECHO to Helper"
- [ ] TaskHistory 金额变动显示 "Received X ECHO + Deposit X refunded"
- [ ] TaskHistory 金额变动显示 "Refunded X ECHO"

### Journey 6: 异常路径
- [ ] RequestFix 流程不受影响
- [ ] Terminate 流程不受影响
- [ ] Timeout 流程不受影响

### Journey 7: 钱包状态
- [ ] Disconnect → Reconnect 不受影响
- [ ] 余额刷新显示 "ECHO"
- [ ] 控制台日志显示 "ECHO"

---

## 📊 测试结果

### 编译检查
```bash
✅ frontend/src/pages/PublishTask.tsx - No diagnostics
✅ frontend/src/pages/TaskDetail.tsx - No diagnostics
✅ frontend/src/pages/Profile.tsx - No diagnostics
✅ frontend/src/pages/Register.tsx - No diagnostics
✅ frontend/src/hooks/useCreateTask.ts - No errors (1 warning: unused import)
✅ frontend/src/hooks/useTasks.ts - No diagnostics
✅ frontend/src/components/TaskHistory.tsx - No diagnostics
```

### 热更新检查
```bash
✅ Vite HMR 正常
✅ 前端服务运行正常 (localhost:5173)
✅ 后端服务运行正常 (localhost:3001)
```

---

## 🎯 验收标准

1. **展示层完全统一**：
   - 所有 UI 文案显示 "ECHO"
   - 所有余额/奖励单位显示 "ECHO"
   - 所有提示/错误信息显示 "ECHO"

2. **业务逻辑不变**：
   - 合约调用正常
   - 状态机流程正常
   - 资金流计算正确

3. **已修复功能不受影响**：
   - disconnect / reconnect 正常
   - task sync 正常
   - contacts decrypt 正常

---

## 📝 注意事项

1. **环境变量名不变**：
   - `VITE_EOCHO_TOKEN_ADDRESS` 保持不变（避免破坏现有配置）
   - 只修改展示层文案

2. **ABI 文件名不变**：
   - `EOCHOToken.json` 保持不变（避免破坏导入路径）
   - 只修改展示层文案

3. **合约名称不变**：
   - 链上合约名称仍为 `EOCHOToken`
   - 只修改 UI 展示为 "ECHO"

---

## ✅ 验收完成

- [x] 所有文件修改完成
- [x] 编译检查通过
- [x] 热更新正常
- [ ] 回归测试通过（待用户验证）

**下一步**：用户在浏览器中验证所有 Journey 的 UI 展示
