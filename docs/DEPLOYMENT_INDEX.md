# 📚 部署文档索引

**所有部署相关文档的导航中心**

---

## 🚀 快速开始

### 新手入门（推荐从这里开始）
1. **[Staging 快速开始](../STAGING_QUICK_START.md)** ⭐
   - 5 分钟完成首次部署
   - 最简化的步骤
   - 适合快速上手

2. **[更新速查表](QUICK_UPDATE_CHEATSHEET.md)** ⭐
   - 一页纸搞定日常更新
   - 最常用命令
   - 快速故障排查

---

## 📖 详细指南

### 完整部署流程
- **[Staging 部署指南](STAGING_DEPLOYMENT_GUIDE.md)**
  - 详细的部署步骤
  - 环境配置说明
  - UI 更新流程
  - 常见问题解答

### 历史部署文档
- **[A4 Beta 部署指南](A4_DEPLOYMENT.md)**
  - Sepolia 测试网部署
  - 合约部署流程
  - Beta 测试准备

- **[联系方式功能部署](DEPLOYMENT_INSTRUCTIONS.md)**
  - Prisma 迁移步骤
  - 数据库配置
  - 功能测试

---

## ✅ 检查工具

### 部署前检查
- **[部署检查清单](DEPLOYMENT_CHECKLIST.md)**
  - 完整的检查项
  - 部署前/中/后验证
  - 安全检查
  - 回滚准备

### 自动化检查
- **[部署前检查脚本](../scripts/pre-deploy-check.ps1)**
  ```bash
  # 运行检查
  .\scripts\pre-deploy-check.ps1
  ```

---

## 🎯 按场景查找

### 场景 1: 首次部署到 Staging
**推荐阅读顺序：**
1. [Staging 快速开始](../STAGING_QUICK_START.md)
2. [部署检查清单](DEPLOYMENT_CHECKLIST.md)
3. [Staging 部署指南](STAGING_DEPLOYMENT_GUIDE.md)（详细参考）

**预计时间**: 30-60 分钟

---

### 场景 2: 修改 UI 后更新
**推荐阅读：**
- [更新速查表](QUICK_UPDATE_CHEATSHEET.md) ⭐

**快速流程：**
```bash
# 1. 本地测试
npm run dev

# 2. 提交推送
git add .
git commit -m "ui: your changes"
git push origin staging

# 3. 等待自动部署（2-3 分钟）
```

**预计时间**: 10-30 分钟

---

### 场景 3: 紧急修复
**推荐方法：**
```bash
# 跳过 git，直接部署
cd frontend
vercel --prod
```

**参考文档：**
- [更新速查表 - 紧急快速部署](QUICK_UPDATE_CHEATSHEET.md#🚀-紧急快速部署跳过-git)

**预计时间**: 5 分钟

---

### 场景 4: 环境变量修改
**步骤：**
1. 在 Vercel/Railway Dashboard 修改环境变量
2. 重新部署（必须！）

**参考文档：**
- [Staging 部署指南 - 环境配置](STAGING_DEPLOYMENT_GUIDE.md#⚙️-环境配置)

---

### 场景 5: 部署失败排查
**排查顺序：**
1. 查看 [更新速查表 - 快速故障排查](QUICK_UPDATE_CHEATSHEET.md#🐛-快速故障排查)
2. 查看 [Staging 部署指南 - 常见问题](STAGING_DEPLOYMENT_GUIDE.md#🐛-常见问题)
3. 查看云平台部署日志
4. 查看浏览器控制台错误

---

### 场景 6: 回滚到上一个版本
**方法 1: Git 回滚**
```bash
git revert HEAD
git push origin staging
```

**方法 2: Vercel Dashboard**
- Deployments → 选择之前的版本 → Promote to Production

**参考文档：**
- [更新速查表 - 回滚](QUICK_UPDATE_CHEATSHEET.md#🔄-回滚到上一个版本)

---

## 🛠️ 工具和配置

### 配置文件
- **[frontend/vercel.json](../frontend/vercel.json)**
  - Vercel 部署配置
  - 路由重写规则
  - 缓存策略

- **[frontend/.env](../frontend/.env)**
  - 前端环境变量
  - 合约地址配置
  - 网络配置

- **[backend/.env](../backend/.env)**
  - 后端环境变量
  - 数据库配置
  - RPC 配置

### 脚本工具
- **[pre-deploy-check.ps1](../scripts/pre-deploy-check.ps1)**
  - 部署前自动检查
  - 验证配置完整性
  - 测试构建

---

## 📊 部署平台文档

### Vercel（前端）
- **官方文档**: https://vercel.com/docs
- **CLI 文档**: https://vercel.com/docs/cli
- **环境变量**: https://vercel.com/docs/concepts/projects/environment-variables

### Railway（后端）
- **官方文档**: https://docs.railway.app
- **数据库**: https://docs.railway.app/databases/postgresql
- **环境变量**: https://docs.railway.app/develop/variables

### Netlify（备选前端）
- **官方文档**: https://docs.netlify.com
- **部署配置**: https://docs.netlify.com/configure-builds/overview

---

## 🎓 学习路径

### 初学者路径
1. 阅读 [Staging 快速开始](../STAGING_QUICK_START.md)
2. 跟随步骤完成首次部署
3. 尝试修改 UI 并更新
4. 熟悉 [更新速查表](QUICK_UPDATE_CHEATSHEET.md)

### 进阶路径
1. 深入学习 [Staging 部署指南](STAGING_DEPLOYMENT_GUIDE.md)
2. 了解环境变量管理
3. 掌握多环境配置
4. 学习 CI/CD 自动化

### 专家路径
1. 优化部署流程
2. 自定义构建配置
3. 性能监控和优化
4. 安全加固

---

## 📞 获取帮助

### 文档内查找
1. 使用 Ctrl+F 搜索关键词
2. 查看相关场景的推荐文档
3. 参考常见问题部分

### 外部资源
- **Vercel 社区**: https://github.com/vercel/vercel/discussions
- **Railway 社区**: https://discord.gg/railway
- **Stack Overflow**: 搜索相关错误信息

### 团队支持
- 查看项目 README
- 联系技术负责人
- 提交 Issue 到 GitHub

---

## 🔄 文档更新

### 最近更新
- **2024-11-26**: 添加 useTaskStats 相关部署说明
- **2024-11-26**: 创建 Staging 部署指南
- **2024-11-26**: 添加更新速查表

### 贡献指南
如果你发现文档问题或有改进建议：
1. 直接修改相关文档
2. 提交 Pull Request
3. 或联系文档维护者

---

## 📋 快速命令参考

```bash
# 部署前检查
.\scripts\pre-deploy-check.ps1

# 本地开发
cd frontend && npm run dev

# 本地构建测试
cd frontend && npm run build && npm run preview

# Git 提交推送（触发自动部署）
git add .
git commit -m "your message"
git push origin staging

# Vercel CLI 快速部署
cd frontend && vercel --prod

# 查看部署日志
vercel logs

# 查看环境变量
vercel env ls
```

---

## 🎯 最佳实践

### 部署前
- ✅ 运行部署前检查脚本
- ✅ 本地测试所有改动
- ✅ 确认环境变量正确
- ✅ 查看部署检查清单

### 部署中
- ✅ 监控构建日志
- ✅ 注意错误和警告
- ✅ 验证部署成功

### 部署后
- ✅ 测试核心功能
- ✅ 检查浏览器控制台
- ✅ 验证环境变量生效
- ✅ 监控错误日志

---

## 📌 收藏此页面

将此文档加入书签，作为部署工作的导航中心！

**快速访问**: `docs/DEPLOYMENT_INDEX.md`

---

**祝部署顺利！** 🚀
