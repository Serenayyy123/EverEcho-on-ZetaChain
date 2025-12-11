# 钱包 Disconnect 修复报告

## 问题描述

**Bug**: 用户在 Profile、TaskSquare、PublishTask、TaskDetail 页面时，如果在 MetaMask 中断开钱包连接，页面不会自动返回首页，而是停留在当前页面显示空数据或错误提示。

**根因**: 虽然 `useWallet` hook 正确监听了钱包断开事件并清空了状态，但各个需要认证的页面没有监听 `address` 变化并自动导航回首页。

## 修复方案

在所有需要认证的页面添加 `useEffect` 监听 `address` 变化，当 `address` 为空时自动导航回首页。

## 修改的文件

### 1. `frontend/src/pages/Profile.tsx`
- ✅ 添加 `useEffect` 导入
- ✅ 添加钱包断开监听逻辑

### 2. `frontend/src/pages/TaskSquare.tsx`
- ✅ 添加 `useEffect` 导入
- ✅ 添加钱包断开监听逻辑

### 3. `frontend/src/pages/PublishTask.tsx`
- ✅ 添加 `useEffect` 导入
- ✅ 添加钱包断开监听逻辑

### 4. `frontend/src/pages/TaskDetail.tsx`
- ✅ 已有 `useEffect` 导入
- ✅ 添加钱包断开监听逻辑

### 5. `frontend/src/pages/Register.tsx`
- ✅ 添加 `useEffect` 导入
- ✅ 添加钱包断开监听逻辑

## 修改内容

在每个页面添加以下代码：

```typescript
// 1. 导入 useRef
import { useState, useEffect, useRef } from 'react';

// 2. 创建 ref 跟踪前一个地址
const prevAddressRef = useRef<string | null>(address);

// 3. 监听钱包断开，自动返回首页
useEffect(() => {
  // 只在从有地址变为无地址时导航（真正的断开）
  if (prevAddressRef.current && !address) {
    navigate('/');
  }
  prevAddressRef.current = address;
}, [address, navigate]);
```

**重要**: 使用 `useRef` 跟踪前一个地址值，避免初始渲染时的无限循环问题。详见 [WALLET_DISCONNECT_LOOP_FIX.md](./WALLET_DISCONNECT_LOOP_FIX.md)

## 验收清单

### 基本功能测试

- [ ] **Profile 页面断连测试**
  1. 连接钱包并访问 Profile 页面
  2. 在 MetaMask 中点击 "Disconnect"
  3. 验证页面自动跳转到首页

- [ ] **TaskSquare 页面断连测试**
  1. 连接钱包并访问 TaskSquare 页面
  2. 在 MetaMask 中点击 "Disconnect"
  3. 验证页面自动跳转到首页

- [ ] **PublishTask 页面断连测试**
  1. 连接钱包并访问 PublishTask 页面
  2. 在 MetaMask 中点击 "Disconnect"
  3. 验证页面自动跳转到首页

- [ ] **TaskDetail 页面断连测试**
  1. 连接钱包并访问某个任务详情页
  2. 在 MetaMask 中点击 "Disconnect"
  3. 验证页面自动跳转到首页

- [ ] **Register 页面断连测试**
  1. 连接钱包并访问 Register 页面
  2. 在 MetaMask 中点击 "Disconnect"
  3. 验证页面自动跳转到首页

### 数据清空测试

- [ ] **旧数据被清空**
  - Profile 页面不再显示旧的 balance/nickname/skills
  - TaskSquare 不再显示旧的任务列表
  - 所有 hooks 返回初始状态（loading: false, data: null）

### 重连测试

- [ ] **重新连接恢复正常**
  1. 断连后重新连接钱包
  2. 访问 Profile/TaskSquare 等页面
  3. 验证数据正常加载显示

### 冻结点保护

- [ ] **不破坏冻结点**
  - 注册状态仍来自 `registerContract.isRegistered(address)`
  - Profile/Task 的 POST→URI→合约调用顺序不变
  - 所有字段/函数/事件名保持不变
  - 业务语义完全不变

## 测试步骤

### 1. 启动开发环境

```bash
# 启动后端
cd backend
npm run dev

# 启动前端
cd frontend
npm run dev
```

### 2. 测试断连行为

1. 在浏览器中打开应用
2. 连接 MetaMask 钱包
3. 依次访问以下页面并测试断连：
   - `/profile` - Profile 页面
   - `/tasks` - TaskSquare 页面
   - `/publish` - PublishTask 页面
   - `/tasks/:id` - TaskDetail 页面
4. 在每个页面上，打开 MetaMask 并点击 "Disconnect"
5. 验证页面立即跳转到首页 (`/`)

### 3. 测试重连行为

1. 在首页重新连接钱包
2. 访问各个需要认证的页面
3. 验证功能恢复正常，数据正常加载

## 技术细节

### 为什么选择这个方案？

1. **最小侵入性**: 只在页面层添加监听，不修改 `useWallet` 核心逻辑
2. **符合 React 最佳实践**: 使用 `useEffect` 监听依赖变化
3. **保持冻结点不变**: 不修改任何合约调用、数据流或业务逻辑
4. **用户体验友好**: 断连后立即返回首页，避免停留在空数据页面

### 为什么不在 useWallet 中处理？

- `useWallet` 是一个纯数据 hook，不应该包含导航逻辑
- 导航逻辑应该由页面组件控制，保持关注点分离
- 这样更容易测试和维护

### 为什么不使用路由守卫？

- React Router v6 没有内置的路由守卫机制
- 自定义路由守卫会增加复杂度
- 页面级监听更直观、更容易理解

## 不变的保证

✅ 不修改 `useWallet` 的核心逻辑
✅ 不引入新的依赖或复杂架构
✅ 保持所有冻结点语义不变
✅ 保持现有的错误提示作为后备

## 验证结果

✅ **所有修改已正确应用**

运行验证脚本：
```bash
# Windows
.\scripts\verify-disconnect-fix.ps1

# Linux/Mac
bash scripts/verify-disconnect-fix.sh
```

验证结果：
- ✅ Profile.tsx - useEffect 导入、断开监听、导航调用
- ✅ TaskSquare.tsx - useEffect 导入、断开监听、导航调用
- ✅ PublishTask.tsx - useEffect 导入、断开监听、导航调用
- ✅ TaskDetail.tsx - useEffect 导入、断开监听、导航调用
- ✅ Register.tsx - useEffect 导入、断开监听、导航调用

## 总结

这是一个最小且最直接的修复方案，通过在需要认证的页面添加 `useEffect` 监听 `address` 变化，当钱包断开时自动导航回首页，提供更好的用户体验。

修复完成后，请按照验收清单进行测试，确保所有功能正常工作。

## 快速测试

1. 启动开发服务器：
```bash
# 后端
cd backend
npm run dev

# 前端（新终端）
cd frontend
npm run dev
```

2. 在浏览器中测试：
   - 访问 http://localhost:5173
   - 连接 MetaMask 钱包
   - 访问 Register、Profile、TaskSquare、PublishTask、TaskDetail 页面
   - 在每个页面上断开钱包
   - 验证自动跳转到首页
