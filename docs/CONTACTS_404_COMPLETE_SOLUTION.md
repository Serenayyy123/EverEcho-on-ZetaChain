# 🎯 Contacts 404 问题 - 完整解决方案

## 问题总结

### 症状
```
POST https://everecho-staging-backend.onrender.com/api/contacts/decrypt 404 (Not Found)
[ContactsDisplay] Parsed contacts: null
```

### 根本原因 ✅ 已确认

经过诊断，我们确认：

1. ✅ **后端 API 正常** - `/api/contacts/decrypt` 端点存在且工作正常
2. ❌ **前端配置错误** - Vercel 环境变量 `VITE_BACKEND_BASE_URL` 未正确设置
3. ❌ **构建时使用了默认值** - 前端代码中硬编码了 `http://localhost:3001`

### 诊断证据

```powershell
# 后端测试结果
✅ Root endpoint OK
✅ Correctly returned 400 for missing params
✅ Correctly returned 401 for invalid signature

# 前端构建检查结果
❌ Found localhost:3001 in built files!
⚠️  Staging backend URL not found
```

## 完整解决方案

### 步骤 1: 找到你的 Vercel 部署 URL

**问题**: `https://everecho-staging.vercel.app` 不存在

**解决**:
1. 登录 Vercel Dashboard: https://vercel.com/dashboard
2. 找到你的 EverEcho 项目
3. 复制实际的部署 URL（例如 `https://everecho-frontend-xxx.vercel.app`）

📖 详细步骤: [FIND_VERCEL_URL.md](./FIND_VERCEL_URL.md)

### 步骤 2: 设置 Vercel 环境变量

1. **进入项目设置**
   - Vercel Dashboard → 你的项目 → **Settings** → **Environment Variables**

2. **添加以下变量**（如果不存在）:

   | 变量名 | 值 | 环境 |
   |--------|-----|------|
   | `VITE_BACKEND_BASE_URL` | `https://everecho-staging-backend.onrender.com` | All |
   | `VITE_CHAIN_ID` | `84532` | All |
   | `VITE_EOCHO_TOKEN_ADDRESS` | `0xe7940e81dDf4d6415f2947829938f9A24B0ad35d` | All |
   | `VITE_REGISTER_ADDRESS` | `0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151` | All |
   | `VITE_TASK_ESCROW_ADDRESS` | `0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28` | All |

3. **重要**: 为所有环境勾选（Production, Preview, Development）

### 步骤 3: 重新部署

**为什么需要重新部署？**
- Vite 的环境变量在**构建时**注入，不是运行时
- 必须重新构建才能使新的环境变量生效

**如何重新部署：**

#### 方法 A: 在 Vercel Dashboard 中
1. **Deployments** 标签
2. 找到最新部署
3. 点击 **...** → **Redeploy**
4. **取消勾选** "Use existing Build Cache" ⚠️ 重要！
5. 点击 **Redeploy**
6. 等待 2-3 分钟

#### 方法 B: 推送新 commit
```bash
git commit --allow-empty -m "fix: trigger redeploy with correct env vars"
git push origin main
```

### 步骤 4: 验证修复

#### 4.1 等待部署完成
- 在 Vercel Dashboard 中查看部署状态
- 等待状态变为 "Ready" ✅

#### 4.2 在浏览器中验证
1. 打开你的 Vercel URL
2. 按 **F12** 打开开发者工具
3. 切换到 **Console** 标签
4. 运行以下命令：
   ```javascript
   console.log(import.meta.env.VITE_BACKEND_BASE_URL)
   ```
5. 检查输出：
   - ✅ 正确: `https://everecho-staging-backend.onrender.com`
   - ❌ 错误: `http://localhost:3001` → 重新检查环境变量

#### 4.3 测试 Contacts 功能
1. 登录应用
2. 进入一个任务详情页（状态为 InProgress/Submitted/Completed）
3. 点击 "View Contacts" 按钮
4. 检查 Network 标签：
   - ✅ 请求 URL: `https://everecho-staging-backend.onrender.com/api/contacts/decrypt`
   - ✅ 状态码: 200 或 401/403（取决于权限）
   - ❌ 状态码: 404 → 环境变量仍未生效

## 验证脚本

### 检查后端状态
```powershell
.\scripts\test-staging-contacts.ps1
```

### 检查前端配置
```powershell
.\scripts\check-staging-frontend-config.ps1
```

### 验证部署（需要正确的 URL）
```powershell
.\scripts\verify-vercel-deployment.ps1 -FrontendUrl "https://your-actual-url.vercel.app"
```

## 常见问题

### Q1: 我已经设置了环境变量，为什么还是 404？
**A**: 环境变量在构建时注入，必须重新部署。确保：
- ✅ 重新部署时**取消勾选** "Use existing Build Cache"
- ✅ 等待部署完全完成（2-3 分钟）
- ✅ 刷新浏览器（Ctrl+Shift+R 强制刷新）

### Q2: 如何确认环境变量是否生效？
**A**: 在浏览器控制台运行：
```javascript
console.log(import.meta.env.VITE_BACKEND_BASE_URL)
```
如果显示 `undefined` 或 `localhost:3001`，说明未生效。

### Q3: 本地开发正常，为什么 staging 不行？
**A**: 本地使用 `frontend/.env` 文件，staging 使用 Vercel 环境变量。两者是独立的配置。

### Q4: 可以在代码中硬编码 URL 吗？
**A**: 不推荐。应该使用环境变量，这样可以轻松切换不同环境（dev/staging/production）。

### Q5: Preview 部署和 Production 部署有什么区别？
**A**: 
- **Production**: main 分支的部署，使用 Production 环境变量
- **Preview**: 其他分支的部署，使用 Preview 环境变量
- 建议为所有环境设置相同的变量

## 预防措施

### 1. 部署前检查清单
- [ ] Vercel 环境变量已设置
- [ ] 环境变量值正确（URL、地址等）
- [ ] 选择了正确的环境（Production/Preview/Development）
- [ ] 重新部署时取消了 Build Cache

### 2. 使用 `.env.example` 作为模板
在 `frontend/.env.example` 中记录所有需要的环境变量：
```bash
VITE_BACKEND_BASE_URL=https://everecho-staging-backend.onrender.com
VITE_CHAIN_ID=84532
VITE_EOCHO_TOKEN_ADDRESS=0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
VITE_REGISTER_ADDRESS=0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
VITE_TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

### 3. 自动化检查
在部署前运行：
```powershell
.\scripts\check-staging-frontend-config.ps1
```

## 相关文档

| 文档 | 用途 |
|------|------|
| [FIND_VERCEL_URL.md](./FIND_VERCEL_URL.md) | 找到 Vercel 部署 URL |
| [STAGING_CONTACTS_404_FIX.md](./STAGING_CONTACTS_404_FIX.md) | 详细修复步骤 |
| [VERCEL_BUILD_WARNINGS.md](./VERCEL_BUILD_WARNINGS.md) | 构建警告说明 |
| [STAGING_DEPLOYMENT_GUIDE.md](./STAGING_DEPLOYMENT_GUIDE.md) | 完整部署指南 |
| [STAGING_QUICK_START.md](../STAGING_QUICK_START.md) | 快速开始 |

## 时间线

| 步骤 | 预计时间 |
|------|----------|
| 找到 Vercel URL | 1 分钟 |
| 设置环境变量 | 2 分钟 |
| 重新部署 | 2-3 分钟 |
| 验证修复 | 1 分钟 |
| **总计** | **约 5-7 分钟** |

## 总结

✅ **问题已诊断**: 前端环境变量未设置
✅ **解决方案明确**: 设置 Vercel 环境变量 + 重新部署
✅ **验证方法清晰**: 浏览器控制台检查 + 功能测试
⏱️ **修复时间**: 约 5-7 分钟

---

**下一步**: 
1. 登录 Vercel Dashboard
2. 找到你的项目 URL
3. 设置环境变量
4. 重新部署
5. 验证修复

**需要帮助？** 查看相关文档或检查 Vercel 部署日志。
