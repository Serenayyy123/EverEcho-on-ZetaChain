# 联系方式乱码问题 - 紧急修复

## 问题描述
在 staging 环境中，Helper 接受任务后查看联系方式时显示为乱码（加密的 hex 字符串）。

## 根本原因
数据库中 `Task.contactsPlaintext` 字段错误地存储了加密数据，而不是明文。

## 修复方案
在 `/api/contacts/decrypt` 路由中添加回退逻辑：
- 检测 `contactsPlaintext` 是否为加密数据（长 hex 字符串）
- 如果是，从 Creator 的 Profile 中获取原始明文联系方式
- 返回明文给前端

## 部署状态
✅ 代码已提交：commit `896cc09`
✅ 已推送到 GitHub：`main` 分支
⏳ Render 自动部署中...

## 验证步骤
1. 等待 Render 部署完成（约 2-3 分钟）
2. 访问 https://everecho-backend.onrender.com/healthz 确认服务正常
3. 在 staging 前端测试：
   - Helper 接受任务
   - 查看联系方式
   - 应该显示明文（如 "WeChat: xxx, Email: xxx"）

## 监控 Render 部署
访问：https://dashboard.render.com/web/srv-ctbbqhij1k6c73fvvvfg

## 修改文件
- `backend/src/routes/contacts.ts` - 添加回退逻辑（35 行新增）

## 技术细节
```typescript
// 检查 contactsPlaintext 是否是加密数据
if (/^[0-9a-f]{64,}$/i.test(plaintext)) {
  // 从 Creator Profile 获取明文
  const creatorProfile = await prisma.profile.findUnique({
    where: { address: taskWithCreator.creator },
    select: { contacts: true },
  });
  if (creatorProfile?.contacts) {
    plaintext = creatorProfile.contacts;
  }
}
```

## 后续优化
- [ ] 修复创建任务时的存储逻辑，确保 `contactsPlaintext` 始终存储明文
- [ ] 添加数据迁移脚本，修复历史数据
- [ ] 添加自动化测试覆盖此场景
