# ⚡ UI 更新速查表

**最常用的更新流程 - 一页搞定！**

---

## 🎯 标准更新流程（3 步）

```bash
# 1️⃣ 本地修改并测试
cd frontend
npm run dev
# 访问 http://localhost:5173 确认效果

# 2️⃣ 提交代码
git add .
git commit -m "ui: your change description"

# 3️⃣ 推送触发自动部署
git push origin staging
# Vercel 自动部署，2-3 分钟后生效
```

---

## 🚀 紧急快速部署（跳过 git）

```bash
cd frontend
vercel --prod
# 直接部署当前代码，约 1 分钟
```

---

## 📝 常用 Commit 消息模板

```bash
# UI 样式修改
git commit -m "style: improve profile card layout"

# 新功能
git commit -m "feat: add task filter dropdown"

# 文案修改
git commit -m "i18n: update button text to Chinese"

# Bug 修复
git commit -m "fix: correct stats display on profile page"

# 性能优化
git commit -m "perf: optimize task list rendering"
```

---

## 🔍 检查部署状态

```bash
# 方法 1: 访问 Vercel Dashboard
https://vercel.com/your-team/your-project/deployments

# 方法 2: CLI 查看日志
vercel logs

# 方法 3: 检查 Git 提交
git log --oneline -5
```

---

## ⚙️ 环境变量快速修改

```bash
# 查看当前环境变量
vercel env ls

# 添加新变量
vercel env add VITE_NEW_FEATURE production

# 修改后必须重新部署！
vercel --prod
```

---

## 🐛 快速故障排查

### 问题：推送后没有自动部署
```bash
# 解决：手动触发
# 访问 Vercel Dashboard → Deployments → Redeploy
```

### 问题：部署后看不到更新
```bash
# 解决：清除浏览器缓存
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### 问题：环境变量不生效
```bash
# 解决：确认变量名以 VITE_ 开头，然后重新部署
vercel --prod
```

### 问题：CORS 错误
```bash
# 解决：更新后端 CORS_ORIGIN
# backend/.env
CORS_ORIGIN=https://your-app.vercel.app
```

---

## 📦 本地构建测试

```bash
# 在推送前本地测试构建
cd frontend
npm run build
npm run preview
# 访问 http://localhost:4173
```

---

## 🔄 回滚到上一个版本

```bash
# 方法 1: Git 回滚
git revert HEAD
git push origin staging

# 方法 2: Vercel Dashboard
# Deployments → 选择之前的版本 → Promote to Production
```

---

## 📱 移动端测试

```bash
# 获取本地 IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# 访问
http://YOUR_IP:5173

# 或使用 Vercel Preview URL
https://your-app-git-staging-your-team.vercel.app
```

---

## 🎨 常见 UI 修改位置

```
样式修改：
frontend/src/pages/Profile.tsx → styles 对象

组件修改：
frontend/src/components/ui/*.tsx

页面布局：
frontend/src/pages/*.tsx

全局样式：
frontend/src/index.css
```

---

## ⏱️ 预计时间

| 操作 | 时间 |
|------|------|
| 本地修改 + 测试 | 5-30 分钟 |
| Git 提交推送 | 10 秒 |
| Vercel 自动部署 | 2-3 分钟 |
| 浏览器缓存刷新 | 5 秒 |
| **总计** | **约 10-35 分钟** |

---

## 🎯 最佳实践

✅ **DO**
- 本地测试后再推送
- 使用清晰的 commit 消息
- 小步快跑，频繁部署
- 检查浏览器控制台错误

❌ **DON'T**
- 不要直接在生产环境测试
- 不要跳过本地测试
- 不要一次修改太多文件
- 不要忘记清除浏览器缓存

---

## 📞 需要帮助？

1. 查看完整文档：`docs/STAGING_DEPLOYMENT_GUIDE.md`
2. 查看 Vercel 日志：`vercel logs`
3. 查看浏览器控制台：F12

---

**保存此文件，随时查阅！** 📌
