# 本地 PostgreSQL 设置指南

## 当前状态

✅ Prisma schema 已配置为 `postgresql`
✅ Migrations 已重置为 PG 版本
✅ `.env.example` 已更新 PG 示例

## 下一步：安装 Docker 并启动 PG

### 1. 安装 Docker Desktop

下载并安装：https://www.docker.com/products/docker-desktop/

安装后重启电脑，确保 Docker 服务运行。

### 2. 启动 PostgreSQL 容器

```powershell
docker run --name everecho-pg `
  -e POSTGRES_USER=everecho `
  -e POSTGRES_PASSWORD=dev_password_123 `
  -e POSTGRES_DB=everecho_dev `
  -p 5432:5432 `
  -d postgres:15-alpine
```

验证容器运行：
```powershell
docker ps | findstr everecho-pg
```

### 3. 更新 backend/.env

```env
DATABASE_URL="postgresql://everecho:dev_password_123@localhost:5432/everecho_dev"
```

### 4. 应用 Migrations

```powershell
cd backend

# 删除旧 SQLite 文件
Remove-Item -Path "dev.db*" -ErrorAction SilentlyContinue

# 应用 migrations（会创建所有表）
npx prisma migrate deploy

# 重新生成 Prisma Client
npx prisma generate

# 验证状态
npx prisma migrate status
```

预期输出：
```
Database schema is up to date!
```

### 5. 启动后端

```powershell
npm run dev
```

预期日志：
```
✅ Chain ID validated: 84532 (Base Sepolia)
✅ Server running on http://localhost:3001
```

### 6. 验证 API

```powershell
curl http://localhost:3001/healthz
```

预期：`{"status":"ok"}` 或 `{"status":"degraded"}`

---

## 故障排查

### Docker 未启动

```powershell
# 检查 Docker 服务
Get-Service docker

# 启动 Docker Desktop
# 从开始菜单打开 "Docker Desktop"
```

### 端口 5432 被占用

```powershell
# 查看占用端口的进程
netstat -ano | findstr :5432

# 停止旧容器
docker stop everecho-pg
docker rm everecho-pg

# 重新启动
docker run --name everecho-pg ...
```

### Prisma 连接失败

```
Error: P1001: Can't reach database server
```

检查：
1. Docker 容器是否运行：`docker ps`
2. DATABASE_URL 是否正确
3. 防火墙是否阻止 5432 端口

---

## 回滚到 SQLite（如果需要）

```powershell
# 1. 修改 backend/.env
DATABASE_URL="file:./dev.db"

# 2. 重新生成 Prisma Client
cd backend
npx prisma generate

# 3. 重启服务
npm run dev
```

**注意：** 不推荐回滚，因为 staging/production 都使用 PostgreSQL。
