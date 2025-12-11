#!/bin/bash
# EverEcho 开发环境启动脚本 (Linux/Mac)
# 使用方法：chmod +x start-dev.sh && ./start-dev.sh

echo "=================================="
echo "  EverEcho 开发环境启动脚本"
echo "=================================="
echo ""

# 检查 Node.js
echo "[1/6] 检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js 版本: $NODE_VERSION"
else
    echo "✗ 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 停止占用端口的进程
echo ""
echo "[2/6] 检查并释放端口..."

# 停止 3000 端口
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  停止占用 3000 端口的进程..."
    kill -9 $(lsof -t -i:3000) 2>/dev/null
    sleep 1
    echo "✓ 端口 3000 已释放"
else
    echo "✓ 端口 3000 可用"
fi

# 停止 5173 端口
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  停止占用 5173 端口的进程..."
    kill -9 $(lsof -t -i:5173) 2>/dev/null
    sleep 1
    echo "✓ 端口 5173 已释放"
else
    echo "✓ 端口 5173 可用"
fi

# 安装 Backend 依赖
echo ""
echo "[3/6] 检查 Backend 依赖..."
if [ -d "backend/node_modules" ]; then
    echo "✓ Backend 依赖已安装"
else
    echo "  安装 Backend 依赖..."
    cd backend
    npm install
    cd ..
    echo "✓ Backend 依赖安装完成"
fi

# 安装 Frontend 依赖
echo ""
echo "[4/6] 检查 Frontend 依赖..."
if [ -d "frontend/node_modules" ]; then
    echo "✓ Frontend 依赖已安装"
else
    echo "  安装 Frontend 依赖..."
    cd frontend
    npm install
    cd ..
    echo "✓ Frontend 依赖安装完成"
fi

# 启动 Backend
echo ""
echo "[5/6] 启动 Backend..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "✓ Backend 正在启动 (PID: $BACKEND_PID)"
sleep 3

# 启动 Frontend
echo ""
echo "[6/6] 启动 Frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "✓ Frontend 正在启动 (PID: $FRONTEND_PID)"

# 保存 PID
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# 完成
echo ""
echo "=================================="
echo "  启动完成！"
echo "=================================="
echo ""
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo ""
echo "日志文件:"
echo "  Backend:  backend.log"
echo "  Frontend: frontend.log"
echo ""
echo "停止服务: ./stop-dev.sh"
echo ""
echo "请等待几秒钟让服务完全启动..."
echo "然后在浏览器中访问: http://localhost:5173"
echo ""
