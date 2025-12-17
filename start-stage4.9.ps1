# Stage 4.9 Universal App 跨链奖励系统 - 一键启动脚本

Write-Host "🚀 Starting Stage 4.9 Universal App Cross-Chain Rewards System" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# 检查 Node.js
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# 检查依赖
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# 启动本地区块链 (Hardhat)
Write-Host "⛓️  Starting local blockchain..." -ForegroundColor Yellow
Start-Process -FilePath "npx" -ArgumentList "hardhat", "node" -WindowStyle Minimized
Start-Sleep -Seconds 5

# 部署合约
Write-Host "📝 Deploying Stage 4.9 contracts..." -ForegroundColor Yellow
npx tsx scripts/deployStage4_9Production.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Contract deployment failed" -ForegroundColor Red
    exit 1
}

# 启动后端
Write-Host "🖥️  Starting backend server..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev:backend" -WindowStyle Minimized
Start-Sleep -Seconds 3

# 启动前端
Write-Host "🌐 Starting frontend..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev:frontend" -WindowStyle Minimized
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎉 Stage 4.9 System Started Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access Information:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   Blockchain: http://localhost:8545" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test Account:" -ForegroundColor Cyan
Write-Host "   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" -ForegroundColor White
Write-Host "   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80d" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Testing Steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3000 in browser" -ForegroundColor White
Write-Host "   2. Connect MetaMask to localhost:8545 (Chain ID: 31337)" -ForegroundColor White
Write-Host "   3. Import the test account above" -ForegroundColor White
Write-Host "   4. Create profile and test cross-chain rewards!" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  To stop all services, run: ./stop-stage4.9.ps1" -ForegroundColor Yellow

# 等待用户输入
Write-Host "Press any key to open browser..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 打开浏览器
Start-Process "http://localhost:3000"