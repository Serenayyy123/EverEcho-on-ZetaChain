# 🚀 EverEcho 部署指南

**快速访问所有部署相关文档**

---

## ⚡ 快速开始

### 首次部署到 Staging？
👉 **[STAGING_QUICK_START.md](STAGING_QUICK_START.md)** - 5 分钟完成部署

### 只是更新 UI？
👉 **[docs/QUICK_UPDATE_CHEATSHEET.md](docs/QUICK_UPDATE_CHEATSHEET.md)** - 一页搞定

### 需要完整指南？
👉 **[docs/STAGING_DEPLOYMENT_GUIDE.md](docs/STAGING_DEPLOYMENT_GUIDE.md)** - 详细步骤

---

## 📚 所有部署文档

### 核心文档（必读）
1. **[STAGING_QUICK_START.md](STAGING_QUICK_START.md)** ⭐⭐⭐
   - 首次部署快速指南
   - 5 分钟上手

2. **[docs/STAGING_DEPLOYMENT_GUIDE.md](docs/STAGING_DEPLOYMENT_GUIDE.md)** ⭐⭐⭐
   - 完整部署流程
   - UI 更新方法
   - 常见问题解答

3. **[docs/QUICK_UPDATE_CHEATSHEET.md](docs/QUICK_UPDATE_CHEATSHEET.md)** ⭐⭐⭐
   - 日常更新速查表
   - 最常用命令
   - 快速故障排查

### 辅助文档
4. **[docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)**
   - 部署检查清单
   - 确保部署质量

5. **[docs/DEPLOYMENT_INDEX.md](docs/DEPLOYMENT_INDEX.md)**
   - 文档导航中心
   - 按场景查找

6. **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)**
   - 部署资源包总结
   - 完整概览

---

## 🛠️ 工具和配置

### 配置文件
- **[frontend/vercel.json](frontend/vercel.json)** - Vercel 部署配置
- **[frontend/.env](frontend/.env)** - 前端环境变量
- **[backend/.env](backend/.env)** - 后端环境变量

### 脚本工具
- **[scripts/pre-deploy-check.ps1](scripts/pre-deploy-check.ps1)** - 部署前检查

---

## 🎯 常见场景

### 场景 1: 首次部署
```bash
# 1. 运行检查
.\scripts\pre-deploy-check.ps1

# 2. 提交代码
git add .
git commit -m "ready for deployment"
git push origin main

# 3. 在 Vercel 和 Railway 配置部署
# 详见 STAGING_QUICK_START.md
```

### 场景 2: 修改 UI 后更新
```bash
# 方法 1: 自动部署（推荐）
git add .
git commit -m "ui: your changes"
git push origin staging

# 方法 2: 快速部署
cd frontend
vercel --prod
```

### 场景 3: 环境变量修改
1. 在 Vercel/Railway Dashboard 修改
2. 重新部署（必须！）

### 场景 4: 回滚
```bash
# Git 回滚
git revert HEAD
git push origin staging

# 或在 Vercel Dashboard 选择之前的版本
```

---

## 📋 快速命令

```bash
# 部署前检查
.\scripts\pre-deploy-check.ps1

# 本地开发
cd frontend && npm run dev

# 本地构建测试
cd frontend && npm run build && npm run preview

# 提交推送（触发自动部署）
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

## 🆘 遇到问题？

### 查找答案的顺序
1. [QUICK_UPDATE_CHEATSHEET.md](docs/QUICK_UPDATE_CHEATSHEET.md) - 快速故障排查
2. [STAGING_DEPLOYMENT_GUIDE.md](docs/STAGING_DEPLOYMENT_GUIDE.md) - 常见问题
3. [DEPLOYMENT_INDEX.md](docs/DEPLOYMENT_INDEX.md) - 按场景查找
4. 查看云平台部署日志
5. 查看浏览器控制台

---

## 📞 外部资源

- **Vercel 文档**: https://vercel.com/docs
- **Railway 文档**: https://docs.railway.app
- **Vite 文档**: https://vitejs.dev

---

## 🎓 学习路径

### 新手（第 1 天）
1. 阅读 [STAGING_QUICK_START.md](STAGING_QUICK_START.md)
2. 完成首次部署
3. 验证功能

### 进阶（第 2-3 天）
1. 尝试修改 UI 并更新
2. 学习 [QUICK_UPDATE_CHEATSHEET.md](docs/QUICK_UPDATE_CHEATSHEET.md)
3. 熟悉 Vercel CLI

### 专家（第 4+ 天）
1. 深入学习 [STAGING_DEPLOYMENT_GUIDE.md](docs/STAGING_DEPLOYMENT_GUIDE.md)
2. 掌握多环境配置
3. 优化部署流程

---

## ✅ 最佳实践

- ✅ 部署前运行检查脚本
- ✅ 本地测试后再推送
- ✅ 使用清晰的 commit 消息
- ✅ 小步快跑，频繁部署
- ✅ 部署后立即验证

---

## 🎉 开始部署

**准备好了？** 从 [STAGING_QUICK_START.md](STAGING_QUICK_START.md) 开始吧！

**需要帮助？** 查看 [DEPLOYMENT_INDEX.md](docs/DEPLOYMENT_INDEX.md) 找到你需要的文档。

---

**祝部署顺利！** 🚀
