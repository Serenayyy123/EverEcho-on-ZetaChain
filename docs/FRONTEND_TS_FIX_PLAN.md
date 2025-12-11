# Frontend TypeScript 修复计划

## 修复清单

### 1. ✅ TimeoutIndicator + useTimeout 字段对齐
- 文件：`frontend/src/hooks/useTimeout.ts`
- 文件：`frontend/src/components/TimeoutIndicator.tsx`
- 问题：字段不匹配（旧版 label/deadline vs 新版 timeoutType/formatTimeLeft）
- 修复：对齐字段使用

### 2. ✅ WalletConnector onClick 事件绑定
- 文件：`frontend/src/components/WalletConnector.tsx`
- 问题：TS2322 函数签名不匹配 MouseEventHandler
- 修复：包装为箭头函数

### 3. ✅ ToastContainer useEffect cleanup
- 文件：`frontend/src/components/ui/ToastContainer.tsx`
- 问题：TS2345 cleanup 返回 boolean
- 修复：包装为 void 函数

### 4. ✅ useContacts 字段和未使用变量
- 文件：`frontend/src/hooks/useContacts.ts`
- 问题：TS6133 未使用变量 + TS2339 字段不存在
- 修复：重命名未使用变量 + 对齐字段名

### 5. ✅ useRegister bigint 比较
- 文件：`frontend/src/hooks/useRegister.ts`
- 问题：TS2367 number vs bigint
- 修复：使用 bigint 字面量或 Number() 转换

### 6. ✅ useWallet 未使用变量
- 文件：`frontend/src/hooks/useWallet.ts`
- 问题：TS6133 未使用变量
- 修复：重命名或删除

## 执行状态
- [ ] 所有修复已完成
- [ ] 本地 tsc 通过
- [ ] 提交并推送
