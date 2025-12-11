# 🔍 如何找到你的 Vercel 部署 URL

## 问题

你看到的错误 `The deployment could not be found on Vercel` 说明：
- ❌ URL `https://everecho-staging.vercel.app` 不存在
- ✅ 你需要找到实际的 Vercel 部署 URL

## 解决方案

### 方法 1: 从 Vercel Dashboard 查找（推荐）

1. **登录 Vercel**
   - 访问: https://vercel.com/dashboard
   - 使用你的 GitHub 账号登录

2. **找到你的项目**
   - 在 Dashboard 中查看所有项目
   - 找到 EverEcho 相关的项目（可能叫 `everecho-frontend` 或类似名称）

3. **获取 URL**
   - 点击项目进入详情页
   - 在顶部会显示项目的 URL，例如：
     - `https://everecho-frontend.vercel.app`
     - `https://everecho-frontend-xxx.vercel.app`
     - 或者你设置的自定义域名

4. **复制 URL**
   - 点击 URL 旁边的复制按钮
   - 或者直接访问该 URL 验证是否可以打开

### 方法 2: 从 Git 提交记录查找

如果你之前推送过代码到 GitHub：

1. 访问你的 GitHub 仓库
2. 查看最近的 commit
3. 如果 Vercel 已集成，会在 commit 下方显示部署状态
4. 点击 "View deployment" 查看部署 URL

### 方法 3: 从 Vercel CLI 查找

如果你安装了 Vercel CLI：

```bash
# 安装 Vercel CLI（如果还没安装）
npm install -g vercel

# 登录
vercel login

# 在项目目录中运行
cd frontend
vercel ls

# 或者直接部署并获取 URL
vercel --prod
```

## 找到 URL 后的步骤

### 1. 更新验证脚本

```powershell
# 使用你的实际 URL 运行
.\scripts\verify-vercel-deployment.ps1 -FrontendUrl "https://your-actual-url.vercel.app"
```

### 2. 在浏览器中测试

1. 打开你的 Vercel URL
2. 按 F12 打开开发者工具
3. 在 Console 中运行：
   ```javascript
   console.log(import.meta.env.VITE_BACKEND_BASE_URL)
   ```
4. 检查输出：
   - ✅ 应该是: `https://everecho-staging-backend.onrender.com`
   - ❌ 如果是: `http://localhost:3001` → 需要设置环境变量

### 3. 设置环境变量（如果需要）

如果环境变量不正确：

1. 在 Vercel Dashboard 中进入你的项目
2. **Settings** → **Environment Variables**
3. 添加以下变量：

```
VITE_BACKEND_BASE_URL = https://everecho-staging-backend.onrender.com
VITE_CHAIN_ID = 84532
VITE_EOCHO_TOKEN_ADDRESS = 0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
VITE_REGISTER_ADDRESS = 0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
VITE_TASK_ESCROW_ADDRESS = 0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

4. 为所有环境勾选（Production, Preview, Development）
5. 保存后重新部署

### 4. 重新部署

在 Vercel Dashboard 中：
1. **Deployments** 标签
2. 找到最新部署
3. 点击 **...** → **Redeploy**
4. **取消勾选** "Use existing Build Cache"
5. 点击 **Redeploy**
6. 等待 2-3 分钟

## 如果还没有部署到 Vercel

如果你还没有部署前端到 Vercel：

### 快速部署步骤

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "ready for deployment"
   git push origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问: https://vercel.com/new
   - 选择 "Import Git Repository"
   - 选择你的 GitHub 仓库
   - 配置：
     - Framework Preset: **Vite**
     - Root Directory: **frontend**
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **设置环境变量**（在导入时或之后）
   ```
   VITE_BACKEND_BASE_URL = https://everecho-staging-backend.onrender.com
   VITE_CHAIN_ID = 84532
   VITE_EOCHO_TOKEN_ADDRESS = 0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
   VITE_REGISTER_ADDRESS = 0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
   VITE_TASK_ESCROW_ADDRESS = 0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
   ```

4. **点击 Deploy**

5. **等待部署完成**（约 2-3 分钟）

6. **获取 URL** 并测试

## 常见问题

### Q: 我有多个 Vercel 项目，哪个是正确的？
A: 查看项目的 Git 仓库链接，确认是你的 EverEcho 仓库。

### Q: URL 是 `.vercel.app` 还是自定义域名？
A: 默认是 `.vercel.app`，如果你设置了自定义域名，使用自定义域名。

### Q: Preview 部署和 Production 部署有什么区别？
A: 
- **Production**: 主分支（main/master）的部署，使用 Production 环境变量
- **Preview**: 其他分支或 PR 的部署，使用 Preview 环境变量

### Q: 如何确认部署成功？
A: 在 Vercel Dashboard 的 Deployments 标签中，状态显示 "Ready" 且有绿色勾号。

## 下一步

找到正确的 URL 后：

1. ✅ 在浏览器中打开并验证应用可以访问
2. ✅ 检查环境变量是否正确（F12 → Console）
3. ✅ 测试 contacts 功能是否正常
4. ✅ 如果有问题，参考 [STAGING_CONTACTS_404_FIX.md](./STAGING_CONTACTS_404_FIX.md)

## 相关文档

- [STAGING_DEPLOYMENT_GUIDE.md](./STAGING_DEPLOYMENT_GUIDE.md) - 完整部署指南
- [STAGING_QUICK_START.md](../STAGING_QUICK_START.md) - 快速开始
- [STAGING_CONTACTS_404_FIX.md](./STAGING_CONTACTS_404_FIX.md) - Contacts 404 修复

---

**需要帮助？** 在 Vercel Dashboard 中查看部署日志，或者检查 GitHub 集成状态。
