# Stage 4.9 Universal App - 停止所有服务

Write-Host "🛑 Stopping Stage 4.9 Universal App Services" -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Red

# 停止 Node.js 进程
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force

# 停止 Hardhat 节点
Write-Host "Stopping Hardhat node..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*hardhat*"} | Stop-Process -Force

# 清理端口
Write-Host "Cleaning up ports..." -ForegroundColor Yellow
$ports = @(3000, 3001, 8545)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Freed port $port" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ All Stage 4.9 services stopped" -ForegroundColor Green