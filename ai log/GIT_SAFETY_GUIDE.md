# 🔒 Git 安全指南 - 防止敏感信息泄露

**确保敏感信息不会被上传到 GitHub**

---

## ✅ 当前安全状态

### 已配置的保护

1. **根目录 .gitignore** ✅
   - 位置: `.gitignore`
   - 忽略所有 `.env` 文件
   - 忽略数据库文件 (`.db`)
   - 忽略私钥文件 (`.key`, `.pem`)

2. **Backend .gitignore** ✅
   - 位置: `backend/.gitignore`
   - 忽略 `backend/.env`
   - 忽略 `backend/prisma/dev.db`

3. **Frontend .gitignore** ✅
   - 位置: `frontend/.gitignore`
   - 忽略 `frontend/.env`

---

## 🚨 敏感文件清单

### 绝对不能上传的文件

```
❌ backend/.env              # 包含数据库连接、RPC URL
❌ frontend/.env             # 包含后端 URL、合约地址
❌ .env                      # 任何根目录的环境变量
❌ backend/prisma/dev.db     # 本地数据库
❌ *.key, *.pem              # 私钥文件
❌ private-keys/             # 私钥目录
```

### 可以上传的文件

```
✅ backend/.env.example      # 环境变量模板（不含真实值）
✅ frontend/.env.example     # 环境变量模板（不含真实值）
✅ .gitignore                # Git 忽略规则
✅ 所有源代码文件            # .ts, .tsx, .js 等
✅ 配置文件                  # package.json, tsconfig.json
✅ Prisma schema             # backend/prisma/schema.prisma
```

---

## 🔍 部署前安全检查

### 方法 1: 使用安全检查脚本（推荐）

```bash
# 运行安全检查
.\scripts\check-git-safety.ps1

# 如果通过，会显示:
# ✅ 安全检查通过！可以安全地推送到 GitHub。
```

### 方法 2: 手动检查

```bash
# 1. 检查 .gitignore 是否存在
ls .gitignore

# 2. 查看将要提交的文件
git status

# 3. 确认没有 .env 文件
git status | Select-String ".env"
# 应该没有输出

# 4. 确认没有 .db 文件
git status | Select-String ".db"
# 应该没有输出
```

---

## 📋 首次推送到 GitHub 的步骤

### 步骤 1: 初始化 Git 仓库（如果还没有）

```bash
# 初始化 Git
git init

# 添加远程仓库（替换为你的仓库 URL）
git remote add origin https://github.com/your-username/everecho.git
```

### 步骤 2: 运行安全检查

```bash
# 运行安全检查脚本
.\scripts\check-git-safety.ps1

# 必须通过才能继续！
```

### 步骤 3: 添加文件

```bash
# 添加所有文件（.gitignore 会自动排除敏感文件）
git add .

# 查看将要提交的文件
git status

# ⚠️ 仔细检查列表中是否有 .env 或 .db 文件
# 如果有，立即停止！
```

### 步骤 4: 提交

```bash
# 提交
git commit -m "feat: initial commit for staging deployment"
```

### 步骤 5: 推送

```bash
# 推送到 GitHub
git push -u origin main

# 或者如果是其他分支
git push -u origin master
```

---

## 🆘 如果不小心提交了敏感文件

### 情况 1: 还没有推送到 GitHub

```bash
# 从暂存区移除文件
git reset HEAD backend/.env

# 或者撤销最后一次提交
git reset --soft HEAD~1

# 确保文件在 .gitignore 中
# 然后重新提交
```

### 情况 2: 已经推送到 GitHub

```bash
# ⚠️ 这会改写历史，谨慎使用！

# 1. 从 Git 历史中完全删除文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. 强制推送
git push origin --force --all

# 3. 立即更改所有泄露的密钥/密码！
```

**⚠️ 重要**: 如果敏感信息已经推送到 GitHub，即使删除了文件，信息可能已经被泄露。你必须：
1. 立即更改所有密码和密钥
2. 撤销所有 API 密钥
3. 更换数据库密码

---

## 🔐 最佳实践

### 1. 使用环境变量模板

创建 `.env.example` 文件（可以提交）：

```bash
# backend/.env.example
DATABASE_URL="file:./dev.db"
PORT=3001
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0xYourContractAddress
CHAIN_ID=84532
```

### 2. 在 README 中说明

```markdown
## 环境配置

1. 复制环境变量模板:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. 编辑 .env 文件，填入真实值
```

### 3. 定期检查

```bash
# 每次推送前运行
.\scripts\check-git-safety.ps1

# 或者设置 Git hook（自动检查）
```

### 4. 使用 .gitignore 全局配置

```bash
# 创建全局 .gitignore
git config --global core.excludesfile ~/.gitignore_global

# 添加常见的敏感文件模式
echo ".env" >> ~/.gitignore_global
echo "*.key" >> ~/.gitignore_global
echo "*.pem" >> ~/.gitignore_global
```

---

## 📊 安全检查清单

在推送到 GitHub 之前，确认：

- [ ] `.gitignore` 文件存在于根目录
- [ ] 运行了 `.\scripts\check-git-safety.ps1` 并通过
- [ ] `git status` 中没有 `.env` 文件
- [ ] `git status` 中没有 `.db` 文件
- [ ] `git status` 中没有 `.key` 或 `.pem` 文件
- [ ] 已创建 `.env.example` 模板文件
- [ ] README 中说明了如何配置环境变量

---

## 🎯 快速命令参考

```bash
# 检查安全性
.\scripts\check-git-safety.ps1

# 查看将要提交的文件
git status

# 查看 .gitignore 是否生效
git check-ignore -v backend/.env
# 应该输出: .gitignore:X:.env    backend/.env

# 从 Git 中移除已追踪的敏感文件
git rm --cached backend/.env
git commit -m "chore: remove sensitive file"

# 查看 Git 历史中的文件
git log --all --full-history -- backend/.env
```

---

## ✅ 总结

### 你的项目已经安全配置

1. ✅ 根目录有 `.gitignore`
2. ✅ Backend 有 `.gitignore`
3. ✅ Frontend 有 `.gitignore`
4. ✅ 所有 `.env` 文件都被忽略
5. ✅ 数据库文件都被忽略
6. ✅ 有安全检查脚本

### 推送前最后确认

```bash
# 1. 运行安全检查
.\scripts\check-git-safety.ps1

# 2. 如果通过，安全推送
git add .
git commit -m "feat: ready for staging deployment"
git push origin main
```

**你的敏感信息是安全的！** 🔒

---

**记住**: 
- 永远不要提交 `.env` 文件
- 推送前总是运行安全检查
- 如果不确定，先检查 `git status`

