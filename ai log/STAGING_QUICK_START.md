# 🚀 Staging 部署快速开始

**5 分钟完成首次部署！**

---

## 📋 准备工作（5 分钟）

### 1. 注册账号
- [ ] GitHub 账号
- [ ] Vercel 账号（用 GitHub 登录）：https://vercel.com
- [ ] Railway 账号（用 GitHub 登录）：https://railway.app

### 2. 获取测试币
- [ ] Sepolia 测试 ETH：https://sepoliafaucet.com/

---

## 🎯 部署步骤

### 步骤 1: 部署前端（Vercel）

```bash
# 1. 推送代码到 GitHub
git add .
git commit -m "ready for staging deployment"
git push origin main

# 2. 访问 Vercel
# https://vercel.com → New Project → Import 你的仓库

# 3. 配置项目
Root Directory: frontend
Framework: Vite
Build Command: npm run build
Output Directory: dist

# 4. 添加环境变量（见下方）

# 5. 点击 Deploy
```

#### 环境变量配置

```env
VITE_BACKEND_BASE_URL=https://your-backend.railway.app
VITE_EOCHO_TOKEN_ADDRESS=0xYourTokenAddress
VITE_REGISTER_ADDRESS=0xYourRegisterAddress
VITE_TASK_ESCROW_ADDRESS=0xYourTaskEscrowAddress
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia
VITE_RPC_URL=https://rpc.sepolia.org
VITE_ETHERSCAN_URL=https://sepolia.etherscan.io
```

---

### 步骤 2: 部署后端（Railway）

```bash
# 1. 访问 Railway
# https://railway.app → New Project → Deploy from GitHub

# 2. 选择你的仓库

# 3. 配置
Root Directory: backend
Start Command: npm run start

# 4. 添加 PostgreSQL 数据库
# New → Database → PostgreSQL

# 5. 添加环境变量（见下方）

# 6. 初始化数据库（在 Railway 控制台）
npx prisma migrate deploy
```

#### 环境变量配置

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
TASK_ESCROW_ADDRESS=0xYourTaskEscrowAddress
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-app.vercel.app
CHAIN_ID=11155111
```

---

### 步骤 3: 验证部署

```bash
# 1. 检查后端健康
curl https://your-backend.railway.app/healthz

# 2. 访问前端
https://your-app.vercel.app

# 3. 测试功能
- 连接钱包（MetaMask 切换到 Sepolia）
- 注册账号
- 查看 Profile（验证 Stats 显示正确）
```

---

## 🔄 日常更新流程

### 修改 UI 后更新

```bash
# 1. 本地修改并测试
cd frontend
npm run dev

# 2. 提交代码
git add .
git commit -m "ui: your changes"

# 3. 推送（自动触发部署）
git push origin main

# 4. 等待 2-3 分钟，访问 Vercel URL 查看更新
```

---

## 📚 详细文档

- **完整部署指南**: `docs/STAGING_DEPLOYMENT_GUIDE.md`
- **更新速查表**: `docs/QUICK_UPDATE_CHEATSHEET.md`
- **部署前检查**: 运行 `.\scripts\pre-deploy-check.ps1`

---

## 🐛 遇到问题？

### 前端部署失败
```bash
# 检查构建日志
# Vercel Dashboard → Deployments → 点击失败的部署 → 查看日志
```

### 后端连接失败
```bash
# 检查 CORS 配置
# backend/.env 中的 CORS_ORIGIN 是否包含前端域名
```

### 环境变量不生效
```bash
# 确认变量名以 VITE_ 开头
# 修改后需要重新部署
```

---

## ✅ 部署成功！

现在你可以：
- ✅ 分享 Staging URL 给测试用户
- ✅ 随时修改 UI 并自动部署
- ✅ 在真实环境中测试功能

---

**祝部署顺利！** 🎉

有问题查看详细文档或联系技术支持。
