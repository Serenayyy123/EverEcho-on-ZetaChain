# 🔧 PublishTask Creator Address 修复

## 问题描述

发布任务时出现错误：
```
Creator address is required
```

**原因：** 后端 `/api/task` 接口需要 `creatorAddress` 参数，但前端没有传递。

---

## 解决方案

### 修改文件：`frontend/src/hooks/useCreateTask.ts`

**修改位置：** 上传任务元数据部分

**修改内容：**
```typescript
// 5. 上传任务元数据到 backend（冻结点 2.2-P0-F4）
setStep('Uploading task metadata...');
const taskData: any = {
  taskId: nextTaskId,
  title: params.title,
  description: params.description,
  contactsEncryptedPayload: params.contactsPlaintext,
  createdAt: Math.floor(Date.now() / 1000),
  creatorAddress: address, // 新增：添加 creator 地址
};

const taskURI = await uploadTask(taskData);
```

---

## 无需重启

这是前端代码修改，Vite 会自动热更新。

---

## 测试步骤

### 1. 刷新浏览器
在浏览器中按 `F5` 刷新页面

### 2. 重新发布任务
1. 打开 http://localhost:5173/publish
2. 填写任务信息：
   - Title: "Test Task"
   - Description: "Test Description"  
   - Reward: "10"
3. 确认看到联系方式预览：📱 @serena_369y
4. 点击 "Publish Task"
5. MetaMask 弹出授权请求 → 确认
6. 等待上传元数据
7. MetaMask 弹出交易请求 → 确认
8. ✅ 应该成功创建任务

---

## 预期结果

- ✅ 不再出现 "Creator address is required" 错误
- ✅ 任务元数据成功上传到后端
- ✅ 后端成功加密联系方式
- ✅ 合约成功创建任务
- ✅ 跳转到 Task Square

---

## 数据流

```
1. 前端收集任务信息
   ↓
2. 前端调用 uploadTask({
     taskId,
     title,
     description,
     contactsEncryptedPayload: "@serena_369y",
     createdAt,
     creatorAddress: "0x..." // 新增
   })
   ↓
3. 后端接收并验证 creatorAddress
   ↓
4. 后端获取 Creator 公钥
   ↓
5. 后端加密联系方式
   ↓
6. 后端存储到数据库
   ↓
7. 后端返回 taskURI
   ↓
8. 前端调用合约 createTask(reward, taskURI)
   ↓
9. 成功！
```

---

**状态：** ✅ 已修复
**日期：** 2024-11-25
