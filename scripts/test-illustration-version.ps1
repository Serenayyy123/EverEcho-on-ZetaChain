# TaskSquare 插画版本快速测试脚本

Write-Host "🎨 TaskSquare 插画版本测试" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查文件是否存在
Write-Host "📂 检查文件..." -ForegroundColor Yellow

$files = @(
    "frontend/src/components/tasksquare/TaskCard3D.tsx",
    "frontend/src/utils/categoryTheme.ts",
    "frontend/public/animations/Pet.json",
    "frontend/public/animations/Exchange.json",
    "frontend/public/animations/Hosting.json",
    "frontend/public/animations/Coffee Chat.json",
    "frontend/public/animations/Career.json",
    "frontend/public/animations/Outreach Help.json",
    "frontend/public/animations/Others.json"
)

$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (缺失)" -ForegroundColor Red
        $allExist = $false
    }
}

Write-Host ""

# 2. 检查 Lottie 导入
Write-Host "🔍 检查 Lottie 集成..." -ForegroundColor Yellow

$cardContent = Get-Content "frontend/src/components/tasksquare/TaskCard3D.tsx" -Raw
if ($cardContent -match "import Lottie from 'lottie-react'") {
    Write-Host "  ✅ Lottie 已导入" -ForegroundColor Green
} else {
    Write-Host "  ❌ Lottie 未导入" -ForegroundColor Red
    $allExist = $false
}

if ($cardContent -match "animationData") {
    Write-Host "  ✅ 动画数据状态已定义" -ForegroundColor Green
} else {
    Write-Host "  ❌ 动画数据状态未定义" -ForegroundColor Red
    $allExist = $false
}

if ($cardContent -match "<Lottie") {
    Write-Host "  ✅ Lottie 组件已使用" -ForegroundColor Green
} else {
    Write-Host "  ❌ Lottie 组件未使用" -ForegroundColor Red
    $allExist = $false
}

Write-Host ""

# 3. 检查动画映射
Write-Host "🎭 检查动画映射..." -ForegroundColor Yellow

$themeContent = Get-Content "frontend/src/utils/categoryTheme.ts" -Raw
if ($themeContent -match "categoryAnimations") {
    Write-Host "  ✅ categoryAnimations 已定义" -ForegroundColor Green
} else {
    Write-Host "  ❌ categoryAnimations 未定义" -ForegroundColor Red
    $allExist = $false
}

if ($themeContent -match "getCategoryAnimation") {
    Write-Host "  ✅ getCategoryAnimation 函数已定义" -ForegroundColor Green
} else {
    Write-Host "  ❌ getCategoryAnimation 函数未定义" -ForegroundColor Red
    $allExist = $false
}

Write-Host ""

# 4. 统计动画文件大小
Write-Host "📊 动画文件统计..." -ForegroundColor Yellow

$totalSize = 0
Get-ChildItem "frontend/public/animations/*.json" | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 1)
    $totalSize += $_.Length
    Write-Host "  📄 $($_.Name): $sizeKB KB" -ForegroundColor Cyan
}

$totalSizeKB = [math]::Round($totalSize / 1KB, 1)
Write-Host "  📦 总大小: $totalSizeKB KB" -ForegroundColor Cyan

Write-Host ""

# 5. 检查依赖
Write-Host "📦 检查依赖..." -ForegroundColor Yellow

$packageJson = Get-Content "frontend/package.json" -Raw | ConvertFrom-Json
if ($packageJson.dependencies.'lottie-react') {
    Write-Host "  ✅ lottie-react: $($packageJson.dependencies.'lottie-react')" -ForegroundColor Green
} else {
    Write-Host "  ❌ lottie-react 未安装" -ForegroundColor Red
    $allExist = $false
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan

if ($allExist) {
    Write-Host "✅ 所有检查通过！插画版本已就绪" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 启动测试:" -ForegroundColor Yellow
    Write-Host "   cd frontend" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 访问:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3000/tasksquare-v2" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "👀 验证清单:" -ForegroundColor Yellow
    Write-Host "   □ 卡片顶部显示动画" -ForegroundColor White
    Write-Host "   □ 激活卡片动画播放" -ForegroundColor White
    Write-Host "   □ 非激活卡片静止" -ForegroundColor White
    Write-Host "   □ 动画与分类匹配" -ForegroundColor White
    Write-Host "   □ 浅色莫兰迪配色" -ForegroundColor White
} else {
    Write-Host "❌ 检查失败，请查看上述错误" -ForegroundColor Red
    exit 1
}
