# 🔧 Staging Contacts 404 错误修复

## 问题诊断

### 症状
```
POST https://everecho-staging-backend.onrender.com/api/contacts/decrypt 404 (Not Found)
```

### 根本原因
✅ **后端路由正常** - `/api/contacts/decrypt` 端点存在且工作正常
❌ **前端配置错误** - Vercel 环境变量未正确设置

## 验证结果

### 后端测试 ✅
```powershell
# 测试结果：所有端点正常
✅ Root endpoint OK
✅ Correctly returned 400 for missing params
✅ Correctly returned 401 for invalid signature
```

### 问题定位
前端在 Vercel 上部署时，`VITE_BACKEND_BASE_URL` 环境变量可能：
1. 未设置（使用默认值 `http://localhost:3001`）
2. 设置错误
3. 构建时未正确注入

## 修复步骤

### 1. 检查 Vercel 环境变量

1. 访问 Vercel Dashboard: https://vercel.com/dashboard
2. 选择你的项目（everecho-frontend）
3. 进入 **Settings** → **Environment Variables**
4. 检查是否存在以下变量：

```bash
VITE_BACKEND_BASE_URL=https://everecho-staging-backend.onrender.com
VITE_CHAIN_ID=84532
VITE_EOCHO_TOKEN_ADDRESS=0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
VITE_REGISTER_ADDRESS=0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
VITE_TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

### 2. 添加/更新环境变量

如果变量不存在或错误：

1. 点击 **Add New**
2. 输入变量名和值
3. 选择环境：**Production**, **Preview**, **Development** (全选)
4. 点击 **Save**

### 3. 重新部署

环境变量更新后，需要重新部署：

#### 方法 1: 在 Vercel Dashboard 重新部署
1. 进入 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **...** → **Redeploy**
4. 选择 **Use existing Build Cache** (取消勾选)
5. 点击 **Redeploy**

#### 方法 2: 推送新的 commit
```bash
git commit --allow-empty -m "fix: trigger redeploy with correct env vars"
git push origin main
```

### 4. 验证修复

部署完成后（约 2-3 分钟）：

1. 访问 staging 前端
2. 打开浏览器开发者工具 → Network 标签
3. 尝试查看 contacts
4. 检查请求 URL 是否正确：
   ```
   ✅ https://everecho-staging-backend.onrender.com/api/contacts/decrypt
   ❌ http://localhost:3001/api/contacts/decrypt
   ```

## 快速验证脚本

```powershell
# 运行此脚本验证后端正常
.\scripts\test-staging-contacts.ps1
```

## 常见问题

### Q: 为什么本地开发正常，staging 不行？
A: 本地使用 `frontend/.env` 文件，staging 使用 Vercel 环境变量。两者是独立的配置。

### Q: 我已经设置了环境变量，为什么还是 404？
A: Vite 的环境变量在**构建时**注入，不是运行时。必须重新部署才能生效。

### Q: 如何确认环境变量是否生效？
A: 在浏览器控制台运行：
```javascript
console.log(import.meta.env.VITE_BACKEND_BASE_URL)
```

### Q: 可以在代码中硬编码 URL 吗？
A: 不推荐。应该使用环境变量，这样可以轻松切换不同环境。

## 预防措施

### 1. 使用 `.env.example` 作为模板
```bash
# frontend/.env.example
VITE_BACKEND_BASE_URL=https://everecho-staging-backend.onrender.com
VITE_CHAIN_ID=84532
VITE_EOCHO_TOKEN_ADDRESS=0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
VITE_REGISTER_ADDRESS=0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
VITE_TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

### 2. 部署前检查清单
- [ ] Vercel 环境变量已设置
- [ ] 环境变量值正确（URL、地址等）
- [ ] 选择了正确的环境（Production/Preview/Development）
- [ ] 重新部署后验证

### 3. 自动化检查
在 `package.json` 中添加构建前检查：
```json
{
  "scripts": {
    "prebuild": "node scripts/check-env.js"
  }
}
```

## 相关文档

- [STAGING_DEPLOYMENT_GUIDE.md](./STAGING_DEPLOYMENT_GUIDE.md) - 完整部署指南
- [STAGING_QUICK_START.md](../STAGING_QUICK_START.md) - 快速开始
- [QUICK_UPDATE_CHEATSHEET.md](./QUICK_UPDATE_CHEATSHEET.md) - 更新速查表

## 总结

✅ **后端正常** - 所有 API 端点工作正常
❌ **前端配置** - Vercel 环境变量需要更新
🔧 **修复方法** - 更新环境变量 + 重新部署
⏱️ **修复时间** - 约 5 分钟

---

**下一步**: 按照上述步骤更新 Vercel 环境变量并重新部署。
