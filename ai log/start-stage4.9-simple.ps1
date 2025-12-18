# Stage 4.9 Universal App - 简化一键启动

Write-Host "🚀 Starting Stage 4.9 Universal App (Simplified)" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# 检查并安装依赖
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# 快速部署
Write-Host "⚡ Quick deploying contracts..." -ForegroundColor Yellow
npx tsx scripts/quickDeployStage4_9.ts

# 启动后端 (后台)
Write-Host "🖥️  Starting backend..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev:backend" -WindowStyle Hidden

# 等待后端启动
Start-Sleep -Seconds 3

# 启动前端 (后台)
Write-Host "🌐 Starting frontend..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev:frontend" -WindowStyle Hidden

# 等待前端启动
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎉 Stage 4.9 System Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test Account (Import to MetaMask):" -ForegroundColor Cyan
Write-Host "   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" -ForegroundColor White
Write-Host "   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80d" -ForegroundColor White
Write-Host ""
Write-Host "🔧 MetaMask Setup:" -ForegroundColor Cyan
Write-Host "   Network: Add Custom RPC" -ForegroundColor White
Write-Host "   RPC URL: http://localhost:8545" -ForegroundColor White
Write-Host "   Chain ID: 31337" -ForegroundColor White
Write-Host "   Currency: ETH" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Testing Steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3000" -ForegroundColor White
Write-Host "   2. Connect MetaMask with test account" -ForegroundColor White
Write-Host "   3. Create profile with contact info" -ForegroundColor White
Write-Host "   4. Publish task with cross-chain reward!" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  To stop: ./stop-stage4.9.ps1" -ForegroundColor Yellow

# 自动打开浏览器
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✨ Ready for testing! Browser should open automatically." -ForegroundColor Green