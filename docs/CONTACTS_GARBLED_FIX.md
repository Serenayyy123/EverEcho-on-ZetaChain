# Contacts 显示乱码问题修复

## 🔍 问题现象

```
{telegram: null, email: null, raw: 'a0cd83feb5a8cf0acdb778750a4bb657bf82ed7917c6fc9806…'}
```

联系方式显示为十六进制字符串（乱码）。

## 📊 问题分析

### 根本原因

数据库中 `contactsPlaintext` 字段存储的是**加密数据**，而不是明文。

### 为什么会这样？

历史原因：
1. 早期版本中，前端传递 `contactsEncryptedPayload`（加密数据）
2. 后端直接将其存储为 `contactsPlaintext`
3. 字段命名不匹配导致混淆

### 当前流程（正确的）

```
前端 → contactsEncryptedPayload (明文) → 后端 → contactsPlaintext (明文) → 返回给前端
```

### 历史数据（错误的）

```
前端 → contactsEncryptedPayload (加密) → 后端 → contactsPlaintext (加密) → 返回给前端 ❌
```

## 🎯 解决方案

### 方案 A: 重新创建任务（推荐）

**最简单的方法**：删除旧任务，创建新任务。

1. 新创建的任务会正确存储明文
2. 不需要修改代码或数据库
3. 适合测试环境

### 方案 B: 修复历史数据

如果有重要的历史任务需要保留：

#### 步骤 1: 识别问题任务

```sql
-- 查找 contactsPlaintext 看起来像十六进制的任务
SELECT taskId, contactsPlaintext
FROM Task
WHERE contactsPlaintext LIKE '%a0cd83%' 
   OR LENGTH(contactsPlaintext) > 100;
```

#### 步骤 2: 手动更新

对于每个问题任务，需要：
1. 找到原始的明文联系方式
2. 更新数据库

```sql
UPDATE Task
SET contactsPlaintext = '@telegram_username, email@example.com'
WHERE taskId = '2';
```

### 方案 C: 修改后端解密逻辑

如果无法获取原始明文，可以修改后端来解密这些数据。

**注意**: 这需要实现完整的解密流程（使用 wrappedDEK）。

## 🔧 立即修复（测试环境）

### 对于 Task ID 2

根据你的截图，Task 2 的联系方式是乱码。

**最快的解决方案**:
1. 在 UI 中删除 Task 2（如果可以）
2. 重新创建一个新任务
3. 输入明文联系方式（例如：`@myTelegram, my@email.com`）
4. 新任务会正确存储和显示

### 验证修复

创建新任务后：
1. 进入任务详情页
2. 点击 "View Contacts"
3. 应该看到：
   ```
   Telegram: @myTelegram
   Email: my@email.com
   ```

## 📋 预防措施

### 1. 统一字段命名

建议重命名字段以避免混淆：
- `contactsEncryptedPayload` → `contactsInput`（前端传递的数据）
- `contactsPlaintext` → `contactsPlaintext`（数据库存储的明文）

### 2. 添加验证

在后端添加验证，确保存储的是明文：

```typescript
// 检查是否看起来像加密数据
if (/^[0-9a-f]{64,}$/i.test(contactsPlaintext)) {
  return res.status(400).json({
    error: 'contactsPlaintext appears to be encrypted data',
  });
}
```

### 3. 添加测试

```typescript
describe('POST /api/task', () => {
  it('should store plaintext contacts', async () => {
    const response = await request(app)
      .post('/api/task')
      .send({
        title: 'Test',
        description: 'Test',
        contactsEncryptedPayload: '@telegram, email@test.com',
        createdAt: Date.now(),
      });
    
    // 验证存储的是明文
    const task = await prisma.task.findUnique({
      where: { taskId: response.body.taskId }
    });
    
    expect(task.contactsPlaintext).toContain('@telegram');
    expect(task.contactsPlaintext).not.toMatch(/^[0-9a-f]+$/);
  });
});
```

## 🔍 诊断步骤

### 1. 检查 Render 日志

部署完成后，在 Render Dashboard 中查看日志：

```
[/decrypt] Contacts from DB: a0cd83feb5a8cf0acdb778750a4bb657...
[/decrypt] Contacts length: 256
[/decrypt] Contacts looks like hex: true
```

如果看到 `Contacts looks like hex: true`，说明存储的是加密数据。

### 2. 检查数据库

如果有数据库访问权限：

```sql
SELECT 
  taskId,
  SUBSTRING(contactsPlaintext, 1, 50) as contacts_preview,
  LENGTH(contactsPlaintext) as contacts_length,
  CASE 
    WHEN contactsPlaintext REGEXP '^[0-9a-f]+$' THEN 'encrypted'
    ELSE 'plaintext'
  END as data_type
FROM Task;
```

## 📊 总结

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 联系方式显示乱码 | 数据库存储了加密数据 | 重新创建任务 |
| 历史任务无法查看 | 缺少原始明文 | 手动更新或实现解密 |
| 新任务也乱码 | 前端传递了加密数据 | 检查前端代码 |

## 🎯 下一步

1. ✅ 等待 Render 部署完成（约 5-10 分钟）
2. ✅ 查看 Render 日志确认问题
3. ✅ 重新创建测试任务
4. ✅ 验证新任务的联系方式显示正常

---

**快速修复**: 删除旧任务，创建新任务，输入明文联系方式。新任务会正确显示。
