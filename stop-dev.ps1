# EverEcho 停止开发环境脚本 (Windows PowerShell)
# 使用方法：在项目根目录运行 .\stop-dev.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  EverEcho 停止开发环境" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 停止 3000 端口
Write-Host "[1/2] 停止 Backend (端口 3000)..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Backend 已停止" -ForegroundColor Green
} else {
    Write-Host "✓ Backend 未运行" -ForegroundColor Gray
}

# 停止 5173 端口
Write-Host ""
Write-Host "[2/2] 停止 Frontend (端口 5173)..." -ForegroundColor Yellow
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port5173) {
    Stop-Process -Id $port5173.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Frontend 已停止" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend 未运行" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  所有服务已停止" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
