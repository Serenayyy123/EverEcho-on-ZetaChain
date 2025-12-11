# EverEcho 开发环境启动脚本 (Windows PowerShell)
# 使用方法：在项目根目录运行 .\start-dev.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  EverEcho 开发环境启动脚本" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "[1/6] 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 停止占用端口的进程
Write-Host ""
Write-Host "[2/6] 检查并释放端口..." -ForegroundColor Yellow

# 停止 3000 端口
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "  停止占用 3000 端口的进程..." -ForegroundColor Yellow
    Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "✓ 端口 3000 已释放" -ForegroundColor Green
} else {
    Write-Host "✓ 端口 3000 可用" -ForegroundColor Green
}

# 停止 5173 端口
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port5173) {
    Write-Host "  停止占用 5173 端口的进程..." -ForegroundColor Yellow
    Stop-Process -Id $port5173.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "✓ 端口 5173 已释放" -ForegroundColor Green
} else {
    Write-Host "✓ 端口 5173 可用" -ForegroundColor Green
}

# 安装 Backend 依赖
Write-Host ""
Write-Host "[3/6] 检查 Backend 依赖..." -ForegroundColor Yellow
if (Test-Path "backend/node_modules") {
    Write-Host "✓ Backend 依赖已安装" -ForegroundColor Green
} else {
    Write-Host "  安装 Backend 依赖..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    Write-Host "✓ Backend 依赖安装完成" -ForegroundColor Green
}

# 安装 Frontend 依赖
Write-Host ""
Write-Host "[4/6] 检查 Frontend 依赖..." -ForegroundColor Yellow
if (Test-Path "frontend/node_modules") {
    Write-Host "✓ Frontend 依赖已安装" -ForegroundColor Green
} else {
    Write-Host "  安装 Frontend 依赖..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Host "✓ Frontend 依赖安装完成" -ForegroundColor Green
}

# 启动 Backend
Write-Host ""
Write-Host "[5/6] 启动 Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Backend 启动中...' -ForegroundColor Cyan; npm run dev"
Write-Host "✓ Backend 正在启动（新窗口）" -ForegroundColor Green
Start-Sleep -Seconds 3

# 启动 Frontend
Write-Host ""
Write-Host "[6/6] 启动 Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Frontend 启动中...' -ForegroundColor Cyan; npm run dev"
Write-Host "✓ Frontend 正在启动（新窗口）" -ForegroundColor Green

# 完成
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  启动完成！" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "请等待几秒钟让服务完全启动..." -ForegroundColor Cyan
Write-Host "然后在浏览器中访问: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "按任意键退出此窗口（服务将继续运行）..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
