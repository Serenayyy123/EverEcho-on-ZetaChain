# TaskEscrow双重扣费修复后的系统启动脚本
# 使用新的TaskEscrow地址进行真人测试

Write-Host "🚀 启动TaskEscrow修复后的系统..." -ForegroundColor Green
Write-Host ""

# 1. 启动本地区块链网络
Write-Host "📦 1. 启动本地Hardhat网络..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx hardhat node" -WindowStyle Normal
Write-Host "等待网络启动..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# 2. 部署合约 (如果需要)
Write-Host "📦 2. 检查合约部署状态..." -ForegroundColor Yellow
$deployChoice = Read-Host "是否需要重新部署合约? (y/N)"
if ($deployChoice -eq "y" -or $deployChoice -eq "Y") {
    Write-Host "部署修复后的TaskEscrow合约..." -ForegroundColor Gray
    npx hardhat run scripts/deployFixedTaskEscrow.ts --network localhost
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 合约部署失败!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ 合约部署成功!" -ForegroundColor Green
} else {
    Write-Host "跳过合约部署，使用现有合约" -ForegroundColor Gray
}

Write-Host ""

# 3. 启动后端服务
Write-Host "🔧 3. 启动后端服务..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Set-Location ..
Write-Host "等待后端服务启动..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# 4. 启动前端应用
Write-Host "🎨 4. 启动前端应用..." -ForegroundColor Yellow
Set-Location frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Set-Location ..
Write-Host "等待前端应用启动..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🎉 系统启动完成!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 服务信息:" -ForegroundColor Cyan
Write-Host "  - 本地网络: http://localhost:8545" -ForegroundColor White
Write-Host "  - 后端API: http://localhost:3001" -ForegroundColor White  
Write-Host "  - 前端应用: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔍 合约地址 (本地网络):" -ForegroundColor Cyan
Write-Host "  - TaskEscrow: 0x5FbDB2315678afecb367f032d93F642f64180aa3 (修复后)" -ForegroundColor White
Write-Host "  - UniversalReward: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 (前端实际使用)" -ForegroundColor White
Write-Host "  - EOCHOToken: 0x5FbDB2315678afecb367f032d93F642f64180aa3" -ForegroundColor White
Write-Host "  - Register: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" -ForegroundColor White
Write-Host ""
Write-Host "✅ 双重扣费问题已修复，可以开始真人测试!" -ForegroundColor Green
Write-Host "🧪 测试验证: npx hardhat run scripts/testDoubleChargingFix.ts --network localhost" -ForegroundColor Yellow
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")