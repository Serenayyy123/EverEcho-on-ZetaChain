# Task 3 Category Fix - 数据修复报告

## 📋 问题描述

Task 3 显示的是旧任务的数据（category 显示为 "coffeechat"），但实际内容是关于住宿的（"Seeking Accommodation in Guangzhou for 2 Nights"）。

## 🔍 根本原因

后端数据库 schema 和代码**缺少 category 字段支持**：

1. **数据库 schema**：Task 表没有 `category` 和 `creator` 字段
2. **后端代码**：创建任务时没有保存 category
3. **API 响应**：getTask 没有返回 category

导致：
- 前端发送任务时包含 category
- 后端存储时忽略了 category
- 前端读取时没有 category 数据
- 显示为 "Uncategorized" 或错误的 category

## 🔧 修复步骤

### 1. 更新数据库 Schema

添加 `category` 和 `creator` 字段到 Task 表：

```prisma
model Task {
  taskId                    String   @id
  title                     String
  description               String
  contactsEncryptedPayload  String
  contactsPlaintext         String?
  createdAt                 String
  category                  String?  // 新增：任务分类
  creator                   String?  // 新增：Creator 地址
  updatedAt                 DateTime @updatedAt
}
```

运行迁移：
```bash
npx prisma migrate dev --name add-category-creator
npx prisma generate
```

### 2. 更新后端代码

#### taskService.ts

```typescript
// upsertTask 添加 category 和 creator 参数
export async function upsertTask(
  input: TaskInput, 
  contactsPlaintext?: string,
  category?: string,
  creator?: string
) {
  // ... 在 upsert 中添加 category 和 creator
}

// getTask 返回 category 和 creator
export async function getTask(taskId: string): Promise<TaskOutput | null> {
  // ...
  return {
    title: task.title,
    description: task.description,
    contactsEncryptedPayload: task.contactsEncryptedPayload,
    createdAt: parseInt(task.createdAt, 10),
    category: task.category || undefined,
    creator: task.creator || undefined,
  };
}
```

#### task.ts (路由)

```typescript
// 获取可选字段
const category = req.body.category || undefined;

await prisma.$transaction(async (tx) => {
  await tx.task.upsert({
    where: { taskId },
    update: {
      // ... 其他字段
      category,
      creator: creatorAddress as string,
    },
    create: {
      // ... 其他字段
      category,
      creator: creatorAddress as string,
    },
  });
});
```

### 3. 修复 Task 3 数据

运行修复脚本：

```bash
npx ts-node scripts/fix-task3-category.ts
```

结果：
```
Current Task 3 data:
  Title: Seeking Accommodation in Guangzhou for 2 Nights
  Category: N/A

Updating category to: hosting
✅ Task 3 category updated successfully!

Updated Task 3 data:
  Title: Seeking Accommodation in Guangzhou for 2 Nights
  Category: hosting
```

## ✅ 验证步骤

### 1. 刷新前端
- 打开 TaskSquare
- 找到 Task 3
- 验证 category badge 显示为 "Hosting / 借宿"（蓝色）

### 2. 查看详情
- 点击 Task 3 进入详情页
- 验证所有信息正确：
  - Title: "Seeking Accommodation in Guangzhou for 2 Nights"
  - Description: 关于住宿的描述
  - Category: "Hosting / 借宿"
  - Reward: 20.0 ECHO

### 3. 测试新任务
- 创建一个新任务
- 选择 category
- 验证创建后 category 正确显示

### 4. 检查控制台日志
- 打开浏览器控制台
- 查看 `[useTasks]` 和 `[useTask]` 日志
- 验证 metadata 包含正确的 category

## 📊 修复结果

### 数据库变更
- ✅ 添加 `category` 字段（可选）
- ✅ 添加 `creator` 字段（可选）
- ✅ 运行数据库迁移

### 后端代码变更
- ✅ `taskService.ts`: 支持 category 和 creator
- ✅ `task.ts`: 接收和存储 category
- ✅ API 响应包含 category

### 数据修复
- ✅ Task 3 category 更新为 "hosting"

### 前端代码变更
- ✅ `useTasks.ts`: 统一使用 taskId 加载 metadata（之前已修复）

## 🔒 向后兼容性

- ✅ category 和 creator 都是可选字段
- ✅ 旧任务（无 category）仍显示 "Uncategorized"
- ✅ 所有现有功能不受影响

## 🚀 部署就绪

所有修复已完成：
1. 数据库 schema 更新
2. 后端代码更新
3. Task 3 数据修复
4. 前端 metadata 加载修复

现在新建任务时 category 会正确保存和显示！🎉

## 📝 后续建议

### 数据清理（可选）
如果有其他任务的 category 不正确，可以创建类似的修复脚本：

```typescript
// 批量修复所有任务的 category
const tasks = await prisma.task.findMany();
for (const task of tasks) {
  const correctCategory = inferCategoryFromTitle(task.title);
  await prisma.task.update({
    where: { taskId: task.taskId },
    data: { category: correctCategory },
  });
}
```

### 数据验证
添加后端验证确保 category 是有效值：

```typescript
const VALID_CATEGORIES = ['pet', 'exchange', 'hosting', 'coffeechat', 'career', 'outreach_help'];

if (category && !VALID_CATEGORIES.includes(category)) {
  return res.status(400).json({
    error: 'Invalid category',
    details: [`Category must be one of: ${VALID_CATEGORIES.join(', ')}`],
  });
}
```
