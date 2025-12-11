# Pre-deployment Check Script
# 部署前检查脚本

Write-Host "🔍 EverEcho 部署前检查..." -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# 1. 检查 Git 状态
Write-Host "1️⃣ 检查 Git 状态..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   ⚠️  有未提交的改动:" -ForegroundColor Yellow
    git status --short
    $warnings++
} else {
    Write-Host "   ✅ Git 工作区干净" -ForegroundColor Green
}
Write-Host ""

# 2. 检查前端环境变量
Write-Host "2️⃣ 检查前端环境变量..." -ForegroundColor Yellow
$frontendEnv = "frontend\.env"
if (Test-Path $frontendEnv) {
    Write-Host "   ✅ frontend/.env 存在" -ForegroundColor Green
    
    # 检查必需的环境变量
    $envContent = Get-Content $frontendEnv
    $requiredVars = @(
        "VITE_BACKEND_BASE_URL",
        "VITE_EOCHO_TOKEN_ADDRESS",
        "VITE_REGISTER_ADDRESS",
        "VITE_TASK_ESCROW_ADDRESS",
        "VITE_CHAIN_ID"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "   ✅ $var 已配置" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var 缺失" -ForegroundColor Red
            $errors++
        }
    }
} else {
    Write-Host "   ❌ frontend/.env 不存在" -ForegroundColor Red
    $errors++
}
Write-Host ""

# 3. 检查后端环境变量
Write-Host "3️⃣ 检查后端环境变量..." -ForegroundColor Yellow
$backendEnv = "backend\.env"
if (Test-Path $backendEnv) {
    Write-Host "   ✅ backend/.env 存在" -ForegroundColor Green
    
    $envContent = Get-Content $backendEnv
    $requiredVars = @(
        "DATABASE_URL",
        "RPC_URL",
        "TASK_ESCROW_ADDRESS",
        "CHAIN_ID"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "   ✅ $var 已配置" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var 缺失" -ForegroundColor Red
            $errors++
        }
    }
} else {
    Write-Host "   ❌ backend/.env 不存在" -ForegroundColor Red
    $errors++
}
Write-Host ""

# 4. 检查依赖安装
Write-Host "4️⃣ 检查依赖安装..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "   ✅ 前端依赖已安装" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  前端依赖未安装，运行: cd frontend && npm install" -ForegroundColor Yellow
    $warnings++
}

if (Test-Path "backend\node_modules") {
    Write-Host "   ✅ 后端依赖已安装" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  后端依赖未安装，运行: cd backend && npm install" -ForegroundColor Yellow
    $warnings++
}
Write-Host ""

# 5. 检查构建配置
Write-Host "5️⃣ 检查构建配置..." -ForegroundColor Yellow
if (Test-Path "frontend\vercel.json") {
    Write-Host "   ✅ Vercel 配置文件存在" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Vercel 配置文件不存在" -ForegroundColor Yellow
    $warnings++
}

if (Test-Path "frontend\vite.config.ts") {
    Write-Host "   ✅ Vite 配置文件存在" -ForegroundColor Green
} else {
    Write-Host "   ❌ Vite 配置文件不存在" -ForegroundColor Red
    $errors++
}
Write-Host ""

# 6. 测试本地构建
Write-Host "6️⃣ 测试前端构建..." -ForegroundColor Yellow
Push-Location frontend
try {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ 前端构建成功" -ForegroundColor Green
    } else {
        Write-Host "   ❌ 前端构建失败" -ForegroundColor Red
        Write-Host $buildOutput
        $errors++
    }
} catch {
    Write-Host "   ❌ 构建过程出错: $_" -ForegroundColor Red
    $errors++
} finally {
    Pop-Location
}
Write-Host ""

# 7. 检查合约地址格式
Write-Host "7️⃣ 检查合约地址格式..." -ForegroundColor Yellow
$envContent = Get-Content "frontend\.env"
$addresses = $envContent | Select-String -Pattern "VITE_.*_ADDRESS=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }

foreach ($addr in $addresses) {
    if ($addr -match "^0x[a-fA-F0-9]{40}$") {
        Write-Host "   ✅ 地址格式正确: $addr" -ForegroundColor Green
    } elseif ($addr -match "^0x0+$") {
        Write-Host "   ⚠️  地址为零地址: $addr" -ForegroundColor Yellow
        $warnings++
    } else {
        Write-Host "   ❌ 地址格式错误: $addr" -ForegroundColor Red
        $errors++
    }
}
Write-Host ""

# 总结
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 检查结果:" -ForegroundColor Cyan
Write-Host "   错误: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host "   警告: $warnings" -ForegroundColor $(if ($warnings -eq 0) { "Green" } else { "Yellow" })
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($errors -eq 0) {
    Write-Host "✅ 检查通过！可以开始部署。" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 下一步:" -ForegroundColor Cyan
    Write-Host "   1. git add ." -ForegroundColor White
    Write-Host "   2. git commit -m 'your message'" -ForegroundColor White
    Write-Host "   3. git push origin staging" -ForegroundColor White
    Write-Host ""
    Write-Host "或使用 Vercel CLI 快速部署:" -ForegroundColor Cyan
    Write-Host "   cd frontend && vercel --prod" -ForegroundColor White
} else {
    Write-Host "❌ 发现 $errors 个错误，请修复后再部署。" -ForegroundColor Red
    exit 1
}
