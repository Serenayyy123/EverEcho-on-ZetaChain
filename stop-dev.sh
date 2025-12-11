#!/bin/bash
# EverEcho 停止开发环境脚本 (Linux/Mac)
# 使用方法：./stop-dev.sh

echo "=================================="
echo "  EverEcho 停止开发环境"
echo "=================================="
echo ""

# 停止 Backend
echo "[1/2] 停止 Backend..."
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null
        echo "✓ Backend 已停止 (PID: $BACKEND_PID)"
    else
        echo "✓ Backend 未运行"
    fi
    rm .backend.pid
else
    # 尝试通过端口停止
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        kill -9 $(lsof -t -i:3000) 2>/dev/null
        echo "✓ Backend 已停止"
    else
        echo "✓ Backend 未运行"
    fi
fi

# 停止 Frontend
echo ""
echo "[2/2] 停止 Frontend..."
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✓ Frontend 已停止 (PID: $FRONTEND_PID)"
    else
        echo "✓ Frontend 未运行"
    fi
    rm .frontend.pid
else
    # 尝试通过端口停止
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        kill -9 $(lsof -t -i:5173) 2>/dev/null
        echo "✓ Frontend 已停止"
    else
        echo "✓ Frontend 未运行"
    fi
fi

echo ""
echo "=================================="
echo "  所有服务已停止"
echo "=================================="
echo ""
