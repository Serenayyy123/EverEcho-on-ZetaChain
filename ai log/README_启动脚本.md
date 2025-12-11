# EverEcho 启动脚本使用指南

## 快速开始

### Windows 用户

#### 启动开发环境

在项目根目录，右键点击 PowerShell 运行：

```powershell
.\start-dev.ps1
```

或者在 PowerShell 中：

```powershell
cd "D:\Program Files\EOCHO"
.\start-dev.ps1
```

#### 停止开发环境

```powershell
.\stop-dev.ps1
```

### Linux/Mac 用户

#### 首次使用（添加执行权限）

```bash
chmod +x start-dev.sh stop-dev.sh
```

#### 启动开发环境

```bash
./start-dev.sh
```

#### 停止开发环境

```bash
./stop-dev.sh
```

---

## 脚本功能

### start-dev 脚本会自动：

1. ✅ 检查 Node.js 是否安装
2. ✅ 释放被占用的端口（3000 和 5173）
3. ✅ 检查并安装 Backend 依赖
4. ✅ 检查并安装 Frontend 依赖
5. ✅ 启动 Backend 服务（新窗口）
6. ✅ 启动 Frontend 服务（新窗口）

### stop-dev 脚本会自动：

1. ✅ 停止 Backend 服务（端口 3000）
2. ✅ 停止 Frontend 服务（端口 5173）

---

## 启动后访问

等待几秒钟让服务完全启动，然后访问：

```
http://localhost:5173
```

---

## 如果脚本无法运行

### Windows PowerShell 执行策略问题

如果遇到 "无法加载文件，因为在此系统上禁止运行脚本" 错误：

```powershell
# 临时允许运行脚本（仅当前会话）
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 然后运行脚本
.\start-dev.ps1
```

或者：

```powershell
# 直接运行（绕过执行策略）
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

### Linux/Mac 权限问题

```bash
# 添加执行权限
chmod +x start-dev.sh stop-dev.sh

# 运行
./start-dev.sh
```

---

## 手动启动（如果脚本不工作）

### 终端 1 - Backend

```bash
cd backend
npm install
npm run dev
```

### 终端 2 - Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 端口占用问题

### Windows - 查找并停止占用端口的进程

```powershell
# 查找占用 3000 端口的进程
netstat -ano | findstr :3000

# 停止进程（替换 PID 为实际值）
taskkill /PID <PID> /F

# 或者停止所有 Node.js 进程
taskkill /F /IM node.exe
```

### Linux/Mac - 查找并停止占用端口的进程

```bash
# 查找占用 3000 端口的进程
lsof -i :3000

# 停止进程
kill -9 $(lsof -t -i:3000)

# 或者停止所有 Node.js 进程
pkill -9 node
```

---

## 日志文件

### Windows

日志显示在各自的 PowerShell 窗口中

### Linux/Mac

日志保存在：
- `backend.log` - Backend 日志
- `frontend.log` - Frontend 日志

查看日志：
```bash
# 实时查看 Backend 日志
tail -f backend.log

# 实时查看 Frontend 日志
tail -f frontend.log
```

---

## 验证服务状态

### 检查 Backend

```bash
curl http://localhost:3000/health
```

应该返回：
```json
{"status":"ok"}
```

### 检查 Frontend

访问浏览器：`http://localhost:5173`

---

## 常见问题

### Q1: 脚本运行后没有反应

**解决**：
1. 检查是否有错误提示
2. 手动运行命令查看详细错误
3. 查看日志文件

### Q2: 端口仍然被占用

**解决**：
1. 运行 `stop-dev` 脚本
2. 手动停止进程（见上方命令）
3. 重启电脑（最后手段）

### Q3: 依赖安装失败

**解决**：
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules
rm -rf backend/node_modules frontend/node_modules

# 重新安装
cd backend && npm install
cd ../frontend && npm install
```

### Q4: 服务启动但无法访问

**解决**：
1. 检查防火墙设置
2. 确认端口未被其他程序占用
3. 检查 `.env` 配置文件

---

## 开发工作流

### 日常开发

```bash
# 1. 启动服务
.\start-dev.ps1  # Windows
./start-dev.sh   # Linux/Mac

# 2. 开发...

# 3. 停止服务
.\stop-dev.ps1   # Windows
./stop-dev.sh    # Linux/Mac
```

### 重启服务

```bash
# Windows
.\stop-dev.ps1
.\start-dev.ps1

# Linux/Mac
./stop-dev.sh
./start-dev.sh
```

---

## 相关文档

- `frontend/README.md` - Frontend 使用文档
- `backend/README.md` - Backend 使用文档
- `故障排查指南.md` - 详细故障排查
- `P0-F1_快速开始.md` - 快速开始指南
