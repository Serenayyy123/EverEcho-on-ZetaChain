# ZetaChain测试网启动脚本

Write-Host "🚀 启动EverEcho ZetaChain测试网模式..." -ForegroundColor Green
Write-Host ""

# 检查是否存在ZetaChain配置
if (-not (Test-Path ".env.zeta")) {
    Write-Host "❌ 未找到ZetaChain配置文件 .env.zeta" -ForegroundColor Red
    Write-Host "请先运行部署脚本: npm run deploy:zeta" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "backend/.env.zeta")) {
    Write-Host "❌ 未找到后端ZetaChain配置文件 backend/.env.zeta" -ForegroundColor Red
    Write-Host "请先运行部署脚本: npm run deploy:zeta" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 ZetaChain Athens测试网信息:" -ForegroundColor Cyan
Write-Host "   Chain ID: 7001"
Write-Host "   RPC URL: https://zetachain-athens-evm.blockpi.network/v1/rpc/public"
Write-Host "   浏览器: https://athens.explorer.zetachain.com"
Write-Host ""

# 复制ZetaChain配置到主配置文件
Write-Host "🔧 配置ZetaChain环境..." -ForegroundColor Yellow
Copy-Item ".env.zeta" ".env.local" -Force
Copy-Item "backend/.env.zeta" "backend/.env" -Force
Write-Host "✅ 环境配置已切换到ZetaChain测试网"
Write-Host ""

# 启动后端
Write-Host "🔧 启动后端服务..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

# 等待后端启动
Start-Sleep -Seconds 3

# 启动前端
Write-Host "🔧 启动前端服务..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "🎉 EverEcho ZetaChain测试网模式启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 访问地址:" -ForegroundColor Cyan
Write-Host "   前端: http://localhost:5173"
Write-Host "   后端: http://localhost:3001"
Write-Host ""
Write-Host "🔧 MetaMask设置:" -ForegroundColor Cyan
Write-Host "1. 添加ZetaChain Athens测试网:"
Write-Host "   - 网络名称: ZetaChain Athens Testnet"
Write-Host "   - RPC URL: https://zetachain-athens-evm.blockpi.network/v1/rpc/public"
Write-Host "   - Chain ID: 7001"
Write-Host "   - 货币符号: ZETA"
Write-Host ""
Write-Host "2. 获取测试代币: https://labs.zetachain.com/get-zeta"
Write-Host ""
Write-Host "✅ Method 4原子操作已在ZetaChain上启用！" -ForegroundColor Green
Write-Host "✅ 准备进行真实账号测试！" -ForegroundColor Green