# 🚀 Staging 环境部署与更新指南

**版本**: v1.0  
**更新日期**: 2024-11-26  
**适用场景**: Vercel/Netlify 等云平台部署

---

## 📋 目录

1. [首次部署 Staging](#首次部署-staging)
2. [后续 UI 更新流程](#后续-ui-更新流程)
3. [环境配置](#环境配置)
4. [常见问题](#常见问题)

---

## 🎯 首次部署 Staging

### 前提条件

- [ ] GitHub 账号
- [ ] Vercel/Netlify 账号
- [ ] 已部署的合约地址（Sepolia）
- [ ] 后端服务器（Railway/Render/自建）

---

### 步骤 1: 准备代码

#### 1.1 确认代码状态

```bash
# 确保所有改动已提交
git status

# 如果有未提交的改动
git add .
git commit -m "feat: add useTaskStats for profile stats fix"
git push origin main
```

#### 1.2 创建 Staging 分支（推荐）

```bash
# 创建并切换到 staging 分支
git checkout -b staging

# 推送到远程
git push origin staging
```

---

### 步骤 2: 部署前端到 Vercel

#### 2.1 登录 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"

#### 2.2 导入项目

1. 选择你的 GitHub 仓库
2. 点击 "Import"
3. 配置项目：
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### 2.3 配置环境变量

在 Vercel 项目设置中添加环境变量：

```env
# 后端 API URL（你的后端服务地址）
VITE_BACKEND_BASE_URL=https://your-backend.railway.app

# 合约地址（Sepolia）
VITE_EOCHO_TOKEN_ADDRESS=0xYourTokenAddress
VITE_REGISTER_ADDRESS=0xYourRegisterAddress
VITE_TASK_ESCROW_ADDRESS=0xYourTaskEscrowAddress

# 网络配置
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia
VITE_RPC_URL=https://rpc.sepolia.org
VITE_ETHERSCAN_URL=https://sepolia.etherscan.io

# 功能开关（可选）
VITE_ENABLE_PROFILE_EDIT=true
```

#### 2.4 部署

1. 点击 "Deploy"
2. 等待构建完成（约 2-3 分钟）
3. 获取部署 URL：`https://your-app.vercel.app`

---

### 步骤 3: 部署后端（Railway 示例）

#### 3.1 登录 Railway

1. 访问 https://railway.app
2. 使用 GitHub 账号登录
3. 点击 "New Project"

#### 3.2 部署后端

1. 选择 "Deploy from GitHub repo"
2. 选择你的仓库
3. 配置：
   - **Root Directory**: `backend`
   - **Start Command**: `npm run start`

#### 3.3 配置环境变量

```env
# 数据库（Railway 自动提供 PostgreSQL）
DATABASE_URL=postgresql://user:pass@host:port/db

# Sepolia RPC
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# 合约地址
TASK_ESCROW_ADDRESS=0xYourTaskEscrowAddress

# 服务器配置
PORT=3001
NODE_ENV=production

# CORS（允许你的前端域名）
CORS_ORIGIN=https://your-app.vercel.app

# 链 ID
CHAIN_ID=11155111
```

#### 3.4 初始化数据库

```bash
# 在 Railway 控制台执行
npx prisma migrate deploy
npx prisma generate
```

---

### 步骤 4: 验证部署

#### 4.1 检查后端健康

```bash
curl https://your-backend.railway.app/healthz
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-11-26T10:00:00.000Z",
  "checks": {
    "database": "ok",
    "rpc": "ok"
  }
}
```

#### 4.2 测试前端

1. 访问 `https://your-app.vercel.app`
2. 连接 MetaMask（切换到 Sepolia）
3. 测试基本功能：
   - 注册
   - 发布任务
   - 查看 Profile
   - 验证 Stats 显示正确

---

## 🔄 后续 UI 更新流程

### 场景：本地修改 UI 后更新到 Staging

#### 方法 1: Git Push 自动部署（推荐）

```bash
# 1. 本地修改 UI 代码
# 例如：修改 frontend/src/pages/Profile.tsx

# 2. 测试本地效果
cd frontend
npm run dev
# 访问 http://localhost:5173 确认修改正确

# 3. 提交代码
git add frontend/src/pages/Profile.tsx
git commit -m "ui: update profile page layout"

# 4. 推送到 staging 分支
git push origin staging

# 5. Vercel 自动检测并部署
# 等待 2-3 分钟，访问 https://your-app.vercel.app 查看更新
```

**优点**：
- ✅ 自动化，无需手动操作
- ✅ 有版本记录
- ✅ 可以回滚

---

#### 方法 2: Vercel CLI 快速部署

```bash
# 1. 安装 Vercel CLI（首次）
npm install -g vercel

# 2. 登录
vercel login

# 3. 本地修改后，直接部署
cd frontend
vercel --prod

# 4. 等待部署完成
# Vercel 会显示部署 URL
```

**优点**：
- ✅ 快速，适合紧急修复
- ✅ 不需要 git commit

**缺点**：
- ⚠️ 没有版本记录
- ⚠️ 可能与 git 不同步

---

#### 方法 3: Vercel Dashboard 手动触发

```bash
# 1. 提交代码到 git
git add .
git commit -m "ui: update styles"
git push origin staging

# 2. 访问 Vercel Dashboard
# https://vercel.com/your-team/your-project

# 3. 点击 "Deployments" 标签

# 4. 点击最新的 commit 旁边的 "Redeploy"

# 5. 等待部署完成
```

---

### 典型 UI 更新场景

#### 场景 A: 修改样式

```bash
# 1. 修改样式文件
# frontend/src/pages/Profile.tsx 中的 styles 对象

# 2. 本地测试
npm run dev

# 3. 提交并推送
git add frontend/src/pages/Profile.tsx
git commit -m "style: improve profile card spacing"
git push origin staging

# 4. 等待 Vercel 自动部署
```

#### 场景 B: 添加新组件

```bash
# 1. 创建新组件
# frontend/src/components/NewFeature.tsx

# 2. 在页面中使用
# frontend/src/pages/SomePage.tsx

# 3. 本地测试
npm run dev

# 4. 提交所有相关文件
git add frontend/src/components/NewFeature.tsx
git add frontend/src/pages/SomePage.tsx
git commit -m "feat: add new feature component"
git push origin staging
```

#### 场景 C: 修改文案

```bash
# 1. 修改文案
# 例如：将 "Tasks I Created" 改为 "我创建的任务"

# 2. 本地测试
npm run dev

# 3. 提交
git add frontend/src/pages/Profile.tsx
git commit -m "i18n: update profile page text to Chinese"
git push origin staging
```

---

## ⚙️ 环境配置

### Vercel 环境变量管理

#### 查看环境变量

1. 访问 Vercel Dashboard
2. 选择项目
3. 点击 "Settings" → "Environment Variables"

#### 添加/修改环境变量

1. 点击 "Add New"
2. 输入 Key 和 Value
3. 选择环境：Production / Preview / Development
4. 点击 "Save"
5. **重要**：修改后需要重新部署

#### 通过 CLI 管理

```bash
# 查看环境变量
vercel env ls

# 添加环境变量
vercel env add VITE_NEW_FEATURE production

# 删除环境变量
vercel env rm VITE_OLD_FEATURE production
```

---

### 多环境配置

#### 开发环境（Development）

```env
# frontend/.env.development
VITE_BACKEND_BASE_URL=http://localhost:3001
VITE_CHAIN_ID=11155111
```

#### 预览环境（Preview/Staging）

```env
# Vercel Preview 环境变量
VITE_BACKEND_BASE_URL=https://staging-backend.railway.app
VITE_CHAIN_ID=11155111
```

#### 生产环境（Production）

```env
# Vercel Production 环境变量
VITE_BACKEND_BASE_URL=https://api.everecho.io
VITE_CHAIN_ID=1  # 主网
```

---

## 🐛 常见问题

### Q1: 推送代码后 Vercel 没有自动部署

**原因**：
- Git 集成未启用
- 推送到了错误的分支

**解决**：
1. 检查 Vercel 项目设置 → "Git"
2. 确认 "Production Branch" 设置正确
3. 手动触发部署：Dashboard → "Deployments" → "Redeploy"

---

### Q2: 部署后环境变量不生效

**原因**：
- 环境变量修改后未重新部署
- 变量名拼写错误

**解决**：
1. 确认变量名以 `VITE_` 开头（Vite 要求）
2. 修改环境变量后，点击 "Redeploy"
3. 检查构建日志确认变量已加载

---

### Q3: 本地正常，部署后报错

**原因**：
- 环境变量缺失
- 依赖版本不一致
- 构建配置错误

**解决**：
1. 检查 Vercel 构建日志
2. 确认所有环境变量已配置
3. 检查 `package.json` 中的依赖版本
4. 本地运行 `npm run build` 测试构建

---

### Q4: CORS 错误

**原因**：
- 后端 CORS 配置未包含前端域名

**解决**：
1. 更新后端 `.env`：
   ```env
   CORS_ORIGIN=https://your-app.vercel.app
   ```
2. 或者在后端代码中添加：
   ```typescript
   app.use(cors({
     origin: ['https://your-app.vercel.app', 'http://localhost:5173']
   }));
   ```

---

### Q5: 部署后页面空白

**原因**：
- 路由配置错误
- 构建输出路径错误

**解决**：
1. 检查 Vercel 配置：
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite"
   }
   ```
2. 添加 `vercel.json`：
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 📋 部署检查清单

### 首次部署
- [ ] 代码已推送到 GitHub
- [ ] Vercel 项目已创建
- [ ] 所有环境变量已配置
- [ ] 后端服务已部署
- [ ] 数据库已初始化
- [ ] 健康检查通过
- [ ] 前端功能测试通过

### 日常更新
- [ ] 本地测试通过
- [ ] 代码已提交到 git
- [ ] 推送到正确的分支
- [ ] Vercel 自动部署成功
- [ ] 访问 staging URL 验证更新
- [ ] 无控制台错误

---

## 🚀 快速命令参考

```bash
# 本地开发
npm run dev

# 本地构建测试
npm run build
npm run preview

# 提交并推送
git add .
git commit -m "your message"
git push origin staging

# Vercel CLI 部署
vercel --prod

# 查看部署日志
vercel logs

# 查看环境变量
vercel env ls
```

---

## 📞 支持

如果遇到问题：
1. 查看 Vercel 构建日志
2. 查看浏览器控制台错误
3. 查看后端日志
4. 参考本文档的常见问题部分

---

**祝部署顺利！** 🎉
