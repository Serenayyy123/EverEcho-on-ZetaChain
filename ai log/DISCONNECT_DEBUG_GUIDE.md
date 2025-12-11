# Disconnect 调试指南

## 问题描述
点击 Disconnect 按钮后，页面没有反应，仍然显示任务列表和用户信息。

## 已修复的问题

### 修复 1: useTasks 清空逻辑
**文件**: `frontend/src/hooks/useTasks.ts`

**问题**: 当 `provider` 为 null 时，`tasks` 数组没有被清空，导致页面仍然显示旧的任务列表。

**修复**:
```typescript
useEffect(() => {
  if (provider && chainId) {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  } else {
    // 清空任务列表当 provider 为 null 时（断开钱包）
    setTasks([]);
    setLoading(false);
    setError(null);
  }
}, [provider, chainId]);
```

### 修复 2: useWallet disconnect 日志
**文件**: `frontend/src/hooks/useWallet.ts`

**问题**: 没有日志输出，难以调试。

**修复**:
```typescript
const disconnect = () => {
  console.log('Disconnecting wallet...');
  setAddress(null);
  setChainId(null);
  setProvider(null);
  setSigner(null);
  setIsRegistered(false);
  setBalance('0');
  setError(null);
  console.log('Wallet disconnected, state cleared');
};
```

---

## 调试步骤

### 步骤 1: 打开浏览器控制台
按 `F12` 打开开发者工具，切换到 "Console" 标签。

### 步骤 2: 清除控制台
点击控制台左上角的 🚫 图标清除所有日志。

### 步骤 3: 点击 Disconnect
点击页面右上角的 "Disconnect" 按钮。

### 步骤 4: 检查控制台输出
应该看到以下日志：
```
Disconnecting wallet...
Wallet disconnected, state cleared
```

### 步骤 5: 检查页面状态
页面应该显示：
- ✅ "Please connect your wallet to view tasks" 提示
- ✅ 任务列表消失
- ✅ 导航栏只显示 "EverEcho" logo
- ✅ 没有 "Tasks", "Publish", "Profile" 按钮
- ✅ 没有地址显示
- ✅ 没有 "Disconnect" 按钮

---

## 如果仍然有问题

### 检查 1: React DevTools
1. 安装 React DevTools 浏览器扩展
2. 打开 React DevTools
3. 选择 `TaskSquare` 组件
4. 查看 Props 中的 `address` 值
5. 点击 Disconnect 后，`address` 应该变为 `null`

### 检查 2: 强制刷新
1. 点击 Disconnect
2. 按 `Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac) 强制刷新
3. 检查页面是否显示正确

### 检查 3: 清除浏览器缓存
1. 按 `Ctrl + Shift + Delete` 打开清除浏览器数据
2. 选择 "缓存的图片和文件"
3. 点击 "清除数据"
4. 刷新页面

### 检查 4: 检查 useWallet 状态
在控制台运行以下代码：
```javascript
// 获取 React 内部状态（需要 React DevTools）
$r.props // 查看当前组件的 props
```

---

## 手动测试脚本

在浏览器控制台运行以下代码来模拟 disconnect：

```javascript
// 1. 获取当前 address
console.log('Current address:', window.ethereum?.selectedAddress);

// 2. 触发 accountsChanged 事件（模拟 disconnect）
window.ethereum?.emit('accountsChanged', []);

// 3. 等待 1 秒后检查状态
setTimeout(() => {
  console.log('Address after disconnect:', window.ethereum?.selectedAddress);
}, 1000);
```

---

## 预期行为

### Disconnect 前
```
TaskSquare 页面:
- 显示任务列表
- 显示 "Refresh" 和 "Publish Task" 按钮
- 导航栏显示 "Tasks", "Publish", "Profile" 按钮
- 显示钱包地址
- 显示 "Disconnect" 按钮
```

### Disconnect 后
```
TaskSquare 页面:
- 显示 "Please connect your wallet to view tasks"
- 不显示任务列表
- 不显示 "Refresh" 和 "Publish Task" 按钮
- 导航栏只显示 "EverEcho" logo
- 不显示钱包地址
- 不显示 "Disconnect" 按钮
```

---

## 如果问题持续存在

### 可能的原因

1. **React 状态更新延迟**
   - React 的状态更新是异步的
   - 可能需要等待下一次渲染

2. **MetaMask 事件未触发**
   - MetaMask 的 `accountsChanged` 事件可能没有触发
   - 尝试在 MetaMask 中手动断开连接

3. **浏览器缓存**
   - 浏览器可能缓存了旧的状态
   - 尝试使用无痕模式

4. **代码未重新编译**
   - Vite 可能没有检测到文件变化
   - 尝试重启开发服务器

### 终极解决方案：重启开发服务器

```bash
# 停止当前服务器（Ctrl + C）

# 清除 node_modules 缓存
cd frontend
rm -rf node_modules/.vite

# 重新启动
npm run dev
```

---

## 验证修复

运行以下测试序列：

### 测试 1: 基本 Disconnect
1. 连接钱包
2. 访问 TaskSquare 页面
3. 点击 Disconnect
4. 验证：显示 "Please connect your wallet"

### 测试 2: Disconnect 后重新连接
1. 在测试 1 的基础上
2. 点击 "Connect Wallet"（如果有）或刷新页面
3. 重新连接钱包
4. 验证：任务列表恢复显示

### 测试 3: 在不同页面 Disconnect
1. 连接钱包
2. 依次访问 Profile、PublishTask、TaskDetail 页面
3. 在每个页面点击 Disconnect
4. 验证：每个页面都显示相应的 "Please connect your wallet" 提示

### 测试 4: MetaMask 手动断开
1. 连接钱包
2. 访问 TaskSquare 页面
3. 在 MetaMask 中点击 "Disconnect"
4. 验证：页面自动更新，显示 "Please connect your wallet"

---

## 联系支持

如果以上所有方法都无法解决问题，请提供以下信息：

1. 浏览器控制台的完整日志
2. React DevTools 中的组件状态截图
3. Network 标签中的请求列表
4. 浏览器版本和 MetaMask 版本
5. 操作系统版本

---

**最后更新**: 2024-11-24  
**相关文件**:
- `frontend/src/hooks/useWallet.ts`
- `frontend/src/hooks/useTasks.ts`
- `frontend/src/pages/TaskSquare.tsx`
- `frontend/src/components/layout/PageLayout.tsx`
