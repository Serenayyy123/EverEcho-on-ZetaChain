# ZetaChain测试网真人测试启动脚本
# TaskEscrow双重扣费修复后的系统测试

Write-Host "🚀 启动ZetaChain测试网真人测试..." -ForegroundColor Green
Write-Host ""

# 显示合约信息
Write-Host "📋 ZetaChain Athens测试网合约地址:" -ForegroundColor Cyan
Write-Host "  - TaskEscrow:     0xE442Eb737983986153E42C9ad28530676d8C1f55 (修复后)" -ForegroundColor White
Write-Host "  - UniversalReward: 0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3 (前端实际使用)" -ForegroundColor White
Write-Host "  - EOCHOToken:     0xE0e8CD2F3a8bd6241B09798DEe98f1c777537b4D" -ForegroundColor White
Write-Host "  - Register:       0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA" -ForegroundColor White
Write-Host ""

# 1. 启动后端服务
Write-Host "🔧 1. 启动后端服务..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Set-Location ..
Write-Host "等待后端服务启动..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# 2. 启动前端应用
Write-Host "🎨 2. 启动前端应用..." -ForegroundColor Yellow
Set-Location frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Set-Location ..
Write-Host "等待前端应用启动..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🎉 ZetaChain测试系统启动完成!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 服务信息:" -ForegroundColor Cyan
Write-Host "  - 网络: ZetaChain Athens Testnet (ChainId: 7001)" -ForegroundColor White
Write-Host "  - RPC: https://zetachain-athens-evm.blockpi.network/v1/rpc/public" -ForegroundColor White
Write-Host "  - 后端API: http://localhost:3001" -ForegroundColor White  
Write-Host "  - 前端应用: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔍 浏览器:" -ForegroundColor Cyan
Write-Host "  - ZetaChain Explorer: https://athens.explorer.zetachain.com" -ForegroundColor White
Write-Host ""
Write-Host "✅ 双重扣费问题已修复特性:" -ForegroundColor Green
Write-Host "  - TaskEscrow只处理ECHO代币 (不再接受msg.value)" -ForegroundColor White
Write-Host "  - UniversalReward独立处理跨链代币" -ForegroundColor White
Write-Host "  - 两条资金流完全分离，无双重收费" -ForegroundColor White
Write-Host "  - Gateway合约已屏蔽，避免混淆" -ForegroundColor White
Write-Host ""
Write-Host "🧪 测试建议:" -ForegroundColor Yellow
Write-Host "  1. 连接MetaMask到ZetaChain Athens测试网" -ForegroundColor White
Write-Host "  2. 确保有测试ZETA代币用于gas费" -ForegroundColor White
Write-Host "  3. 测试创建跨链奖励任务，验证不会双重收费" -ForegroundColor White
Write-Host "  4. 验证ECHO代币和跨链代币分别扣费" -ForegroundColor White
Write-Host ""
Write-Host "🔧 验证命令:" -ForegroundColor Yellow
Write-Host "  npx hardhat run scripts/testDoubleChargingFix.ts --network zetachainAthens" -ForegroundColor Gray
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")