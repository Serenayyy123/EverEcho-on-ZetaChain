# 事件监听服务使用指南

## 📋 概述

事件监听服务自动监听链上的任务创建和接受事件，并同步数据到后端数据库。这确保了链上和链下数据的一致性。

---

## 🎯 功能

### 1. 实时监听
- 监听 `TaskCreated` 事件 → 自动创建任务记录和 ContactKey
- 监听 `TaskAccepted` 事件 → 自动更新 helper 的 wrappedDEK

### 2. 历史同步
- 启动时自动同步历史事件
- 补充遗漏的任务数据

### 3. 容错机制
- 自动跳过已存在的任务
- 验证 creator 的加密公钥
- 详细的错误日志

---

## ⚙️ 配置

### 环境变量

在 `backend/.env` 中添加：

```env
# 启用事件监听服务
ENABLE_EVENT_LISTENER=true

# 从哪个区块开始同步历史事件（0 = 从头开始）
SYNC_FROM_BLOCK=0

# RPC URL（已有）
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# 合约地址（已有）
TASK_ESCROW_ADDRESS=0xC71040C8916E145f937Da3D094323C8f136c2E2F
```

---

## 🚀 使用方法

### 方法 1：自动启动（推荐）

事件监听服务会在后端启动时自动运行：

```bash
cd backend
npm run dev
```

你会看到日志：
```
[EventListener] Initializing event listener service...
[EventListener] Starting event listener service...
[EventListener] Event listener started successfully
[EventListener] Syncing historical events from block 0...
```

### 方法 2：手动同步历史数据

如果需要手动补充历史数据：

```bash
cd backend
npx ts-node scripts/sync-all-tasks.ts
```

---

## 📊 工作流程

### 任务创建流程

```
用户创建任务
    ↓
前端调用后端 API (可能失败)
    ↓
前端调用链上合约 ✅
    ↓
链上触发 TaskCreated 事件
    ↓
事件监听服务捕获事件
    ↓
自动创建数据库记录 ✅
```

**结果：** 即使前端 API 调用失败，数据也会被事件监听服务补充。

### 任务接受流程

```
Helper 接受任务
    ↓
链上触发 TaskAccepted 事件
    ↓
事件监听服务捕获事件
    ↓
自动生成 helper 的 wrappedDEK ✅
```

---

## 🔍 监控和调试

### 查看日志

事件监听服务会输出详细日志：

```
[EventListener] TaskCreated event: taskId=5, creator=0x123...
[EventListener] Syncing task 5 to database...
[EventListener] ✅ Task 5 synced successfully
```

### 检查同步状态

运行脚本查看数据库中的任务：

```bash
npx ts-node backend/scripts/list-tasks.ts
```

### 手动补充单个任务

如果某个任务没有同步，可以手动补充：

```bash
# 修改 taskId
npx ts-node backend/scripts/sync-task4.ts
```

---

## ⚠️ 注意事项

### 1. Creator 必须先注册

事件监听服务需要 creator 的 profile 和加密公钥。如果 creator 未注册，任务无法同步。

**解决方案：**
- 确保用户在创建任务前先注册
- 或者在 creator 注册后手动运行同步脚本

### 2. RPC 稳定性

事件监听依赖 RPC 节点。如果 RPC 不稳定：
- 使用 Alchemy 或 Infura（推荐）
- 配置多个备用 RPC

### 3. 区块重组

在极少数情况下，区块链可能发生重组。事件监听服务会重新处理事件。

---

## 🛠️ 故障排查

### 问题：事件监听服务没有启动

**检查：**
1. `ENABLE_EVENT_LISTENER=true` 是否设置
2. `TASK_ESCROW_ADDRESS` 是否配置
3. 查看后端启动日志

### 问题：任务没有同步

**检查：**
1. Creator 是否已注册
2. Creator 的 encryptionPubKey 是否有效（32 字节）
3. 查看事件监听日志中的错误

**手动修复：**
```bash
# 1. 修复 creator 的公钥
npx ts-node backend/scripts/fix-tina-pubkey.ts

# 2. 重新同步
npx ts-node backend/scripts/sync-all-tasks.ts
```

### 问题：RPC 连接失败

**解决方案：**
1. 使用 Alchemy RPC（推荐）
2. 检查网络连接
3. 尝试其他公共 RPC

---

## 📈 性能优化

### 1. 调整同步起始区块

如果链上有大量历史任务，可以设置起始区块：

```env
# 只同步最近的任务（从区块 5000000 开始）
SYNC_FROM_BLOCK=5000000
```

### 2. 禁用历史同步

如果不需要历史数据：

```env
# 设置为 -1 禁用历史同步
SYNC_FROM_BLOCK=-1
```

### 3. 使用专用 RPC

生产环境建议使用 Alchemy 或 Infura 的专用 RPC，提供更好的性能和稳定性。

---

## 🎉 总结

事件监听服务提供了：
- ✅ 自动数据同步
- ✅ 容错机制
- ✅ 历史数据补充
- ✅ 详细日志

这确保了即使前端 API 调用失败，数据也能最终同步到数据库。
