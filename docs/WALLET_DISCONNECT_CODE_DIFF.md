# 钱包断开修复 - 代码差异

## 修改概览

在 5 个需要认证的页面组件中添加钱包断开监听逻辑。

---

## 1. frontend/src/pages/Register.tsx

### 导入修改
```diff
- import { useState } from 'react';
+ import { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
```

### 添加监听逻辑
```diff
  const [nickname, setNickname] = useState('');
  const [city, setCity] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

+ // 监听钱包断开，自动返回首页
+ useEffect(() => {
+   if (!address) {
+     navigate('/');
+   }
+ }, [address, navigate]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
```

---

## 2. frontend/src/pages/Profile.tsx

### 导入修改
```diff
- import { useState } from 'react';
+ import { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
```

### 添加监听逻辑
```diff
  const {
    tasks,
    loading: historyLoading,
    error: historyError,
    refresh: refreshHistory
  } = useTaskHistory(address, provider, activeTab);

+ // 监听钱包断开，自动返回首页
+ useEffect(() => {
+   if (!address) {
+     navigate('/');
+   }
+ }, [address, navigate]);

  // 编辑模式初始化
  useEffect(() => {
```

---

## 3. frontend/src/pages/TaskSquare.tsx

### 导入修改
```diff
- import { useState, useMemo } from 'react';
+ import { useState, useMemo, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
```

### 添加监听逻辑
```diff
  // 检查是否有元数据错误
  const hasMetadataErrors = useMemo(() => {
    return filteredTasks.some(task => task.metadataError);
  }, [filteredTasks]);

+ // 监听钱包断开，自动返回首页
+ useEffect(() => {
+   if (!address) {
+     navigate('/');
+   }
+ }, [address, navigate]);

  if (!address) {
    return (
```

---

## 4. frontend/src/pages/PublishTask.tsx

### 导入修改
```diff
- import { useState } from 'react';
+ import { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
```

### 添加监听逻辑
```diff
  const [contacts, setContacts] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

+ // 监听钱包断开，自动返回首页
+ useEffect(() => {
+   if (!address) {
+     navigate('/');
+   }
+ }, [address, navigate]);

  // 表单验证
  const validateForm = (): boolean => {
```

---

## 5. frontend/src/pages/TaskDetail.tsx

### 导入修改
```diff
  import { useEffect, useState } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
```
*注: TaskDetail 已经导入了 useEffect，无需修改*

### 添加监听逻辑
```diff
  const [actionLoading, setActionLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

+ // 监听钱包断开，自动返回首页
+ useEffect(() => {
+   if (!address) {
+     navigate('/');
+   }
+ }, [address, navigate]);

  // 加载任务详情
  useEffect(() => {
    if (!provider || !taskId || !chainId) return;
```

---

## 修改统计

- **修改文件数**: 5
- **新增代码行**: 每个文件 +7 行（包括注释和空行）
- **总新增行数**: ~35 行
- **修改类型**: 添加功能（非破坏性修改）

## 测试覆盖

所有修改的文件都通过了：
- ✅ TypeScript 类型检查
- ✅ 语法验证
- ✅ 自动化验证脚本

## 风险评估

- **风险等级**: 低
- **影响范围**: 仅影响页面导航逻辑
- **业务逻辑**: 无变化
- **冻结点**: 无影响
- **向后兼容**: 完全兼容

## 回滚方案

如需回滚，只需删除添加的 `useEffect` 代码块即可：

```typescript
// 删除这段代码
useEffect(() => {
  if (!address) {
    navigate('/');
  }
}, [address, navigate]);
```

同时恢复导入语句（如果之前没有导入 `useEffect`）。
