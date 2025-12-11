# 🚀 立即部署到 Staging - 快速开始

**按照以下步骤在 30 分钟内完成部署**

---

## 📦 你要部署什么

- **后端**: Render Web Service + PostgreSQL
- **前端**: Vercel
- **网络**: Base Sepolia (chainId 84532)

---

## ⚡ 快速部署（30 分钟）

### 步骤 1: 提交代码（2 分钟）

```bash
# 验证 vercel.json 是否存在
ls frontend/vercel.json

# 如果不存在，说明刚刚创建 - 提交它
git add frontend/vercel.json
git commit -m "feat: add Vercel SPA routing configuration"
git push origin main
```

---

### 步骤 2: 在 Render 上部署后端（10 分钟）

#### 2.1 创建数据库
1. 访问 https://dashboard.render.com
2. 点击 "New +" → "PostgreSQL"
3. 名称: `everecho-staging-db`
4. 点击 "Create Database"
5. **复制 Internal Database URL**（保存好！）

#### 2.2 创建 Web Service
1. 点击 "New +" → "Web Service"
2. 连接你的 GitHub 仓库
3. 配置:
   - 名称: `everecho-staging-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && node dist/index.js`

#### 2.3 添加环境变量
```bash
DATABASE_URL=<粘贴步骤 2.1 中的 Internal Database URL>
PORT=3001
NODE_ENV=production
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
CHAIN_ID=84532
ENABLE_EVENT_LISTENER=false
ENABLE_CHAIN_SYNC=true
CORS_ORIGIN=*
```

#### 2.4 部署
1. 点击 "Create Web Service"
2. 等待 5-10 分钟完成部署
3. **复制后端 URL**: `https://everecho-staging-backend.onrender.com`

#### 2.5 验证
```bash
curl https://你的后端URL/healthz
# 应该返回: {"status":"ok",...}
```

---

### 步骤 3: 在 Vercel 上部署前端（10 分钟）

#### 3.1 创建项目
1. 访问 https://vercel.com/dashboard
2. 点击 "Add New..." → "Project"
3. 导入你的 GitHub 仓库
4. 配置:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### 3.2 添加环境变量
```bash
VITE_BACKEND_BASE_URL=<粘贴你的 Render 后端 URL>
VITE_CHAIN_ID=84532
VITE_EOCHO_TOKEN_ADDRESS=0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
VITE_REGISTER_ADDRESS=0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
VITE_TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

#### 3.3 部署
1. 点击 "Deploy"
2. 等待 2-3 分钟
3. **复制前端 URL**: `https://your-app.vercel.app`

---

### 步骤 4: 更新 CORS（2 分钟）

1. 返回 Render 后端
2. Environment 标签
3. 更新 `CORS_ORIGIN` 为你的 Vercel URL
4. 保存（自动重新部署）

---

### 步骤 5: 测试（5 分钟）

#### 快速测试
1. 打开你的 Vercel URL
2. 连接 MetaMask（Base Sepolia）
3. 注册测试账号
4. 创建测试任务
5. 检查 Profile 统计数据显示是否正确

#### 如果一切正常
✅ **部署完成！**

#### 如果出现问题
📖 查看详细指南: `docs/RENDER_VERCEL_STAGING_DEPLOYMENT.md`

---

## 📋 环境变量参考

### 后端（Render）
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
PORT=3001
NODE_ENV=production
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
CHAIN_ID=84532
ENABLE_EVENT_LISTENER=false
ENABLE_CHAIN_SYNC=true
CORS_ORIGIN=https://your-app.vercel.app
```

### 前端（Vercel）
```bash
VITE_BACKEND_BASE_URL=https://everecho-staging-backend.onrender.com
VITE_CHAIN_ID=84532
VITE_EOCHO_TOKEN_ADDRESS=0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
VITE_REGISTER_ADDRESS=0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
VITE_TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

---

## 🆘 快速故障排查

### 后端健康检查失败
```bash
# 检查 Render 日志查找错误
# 常见问题:
# - DATABASE_URL 格式错误
# - Prisma 迁移失败
# - RPC 连接失败
```

### 前端显示空白页
```bash
# 检查浏览器控制台
# 常见问题:
# - 环境变量缺少 VITE_ 前缀
# - CORS 错误（更新后端 CORS_ORIGIN）
# - 后端 URL 错误
```

### CORS 错误
```bash
# 更新后端 CORS_ORIGIN 使其完全匹配前端 URL
# 不要有尾部斜杠！
# 必须是 HTTPS
```

---

## 📚 完整文档

- **完整指南**: `docs/RENDER_VERCEL_STAGING_DEPLOYMENT.md`
- **检查清单**: `docs/STAGING_DEPLOYMENT_CHECKLIST.md`
- **代码变更**: `docs/STAGING_CODE_CHANGES_REQUIRED.md`

---

## ✅ 成功检查清单

- [ ] 后端已部署且健康检查通过
- [ ] 前端已部署且可以加载
- [ ] 可以连接钱包
- [ ] 可以注册账号
- [ ] 可以创建任务
- [ ] Profile 统计数据显示正确
- [ ] 没有控制台错误

---

**准备好了吗？开始部署吧！** 🚀

从上面的步骤 1 开始。
