# ⚡ Contacts 404 快速修复

## 🎯 问题
```
POST /api/contacts/decrypt 404 (Not Found)
```

## ✅ 根本原因
Vercel 环境变量 `VITE_BACKEND_BASE_URL` 未设置

## 🔧 5 分钟修复

### 1️⃣ 登录 Vercel
https://vercel.com/dashboard

### 2️⃣ 找到你的项目
选择 EverEcho 相关项目

### 3️⃣ 设置环境变量
**Settings** → **Environment Variables** → 添加：

```
VITE_BACKEND_BASE_URL = https://everecho-staging-backend.onrender.com
VITE_CHAIN_ID = 84532
VITE_EOCHO_TOKEN_ADDRESS = 0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
VITE_REGISTER_ADDRESS = 0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
VITE_TASK_ESCROW_ADDRESS = 0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

⚠️ **重要**: 为所有环境勾选（Production, Preview, Development）

### 4️⃣ 重新部署
**Deployments** → **...** → **Redeploy**
- ⚠️ **取消勾选** "Use existing Build Cache"
- 等待 2-3 分钟

### 5️⃣ 验证
打开浏览器控制台（F12）运行：
```javascript
console.log(import.meta.env.VITE_BACKEND_BASE_URL)
```

✅ 应该显示: `https://everecho-staging-backend.onrender.com`
❌ 如果显示: `http://localhost:3001` → 重新检查步骤 3-4

## 📖 详细文档
- [完整解决方案](docs/CONTACTS_404_COMPLETE_SOLUTION.md)
- [找到 Vercel URL](docs/FIND_VERCEL_URL.md)
- [构建警告说明](docs/VERCEL_BUILD_WARNINGS.md)

## 🔍 验证脚本
```powershell
# 检查后端
.\scripts\test-staging-contacts.ps1

# 检查前端配置
.\scripts\check-staging-frontend-config.ps1
```

---

**问题？** 查看 [完整解决方案](docs/CONTACTS_404_COMPLETE_SOLUTION.md)
