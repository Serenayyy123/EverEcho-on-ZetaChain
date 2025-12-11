# 服务状态检查

## 当前错误：Cannot GET /

这个错误通常意味着你访问了错误的地址。

---

## 正确的访问方式

### Frontend（用户界面）
```
http://localhost:5173
```
这是你应该访问的地址！

### Backend（API 服务）
```
http://localhost:3000
```
这是 API 服务，不提供用户界面

---

## 启动步骤

### 步骤 1：启动 Backend

打开终端 1：
```bash
cd backend
npm install
npm run dev
```

等待看到：
```
Server running on http://localhost:3000
```

### 步骤 2：启动 Frontend

打开终端 2：
```bash
cd frontend
npm install
npm run dev
```

等待看到：
```
➜  Local:   http://localhost:5173/
```

### 步骤 3：访问应用

在浏览器中打开：
```
http://localhost:5173
```

**不要访问** `http://localhost:3000`（这是 Backend API）

---

## 如果仍有问题

### 检查 1：Backend 是否运行？

在浏览器访问：
```
http://localhost:3000/health
```

应该看到：
```json
{"status":"ok"}
```

### 检查 2：Frontend 是否运行？

在终端 2 中应该看到：
```
VITE v5.0.8  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 检查 3：端口是否被占用？

Windows:
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

Linux/Mac:
```bash
lsof -i :3000
lsof -i :5173
```

---

## 总结

✅ **正确**：访问 `http://localhost:5173`（Frontend）
❌ **错误**：访问 `http://localhost:3000`（Backend API）

Frontend 提供用户界面，Backend 提供 API 服务。
