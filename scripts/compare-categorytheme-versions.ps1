# categoryTheme.ts 版本对比脚本

Write-Host "`n🎨 categoryTheme.ts 版本对比" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# V1: ui-tasksquare-v2 分支
Write-Host "`n📌 版本 1: 深色宇宙风格 (ui-tasksquare-v2)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$v1Content = git show ui-tasksquare-v2:frontend/src/utils/categoryTheme.ts 2>$null
if ($v1Content) {
    $v1Categories = ($v1Content | Select-String -Pattern "^\s+(\w+):\s*\{" -AllMatches).Matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
    Write-Host "分类数量: $($v1Categories.Count)" -ForegroundColor Cyan
    Write-Host "分类列表: $($v1Categories -join ', ')" -ForegroundColor White
    
    $hasAnimation = $v1Content -match "categoryAnimations"
    Write-Host "动画支持: $(if ($hasAnimation) { '✅ 是' } else { '❌ 否' })" -ForegroundColor $(if ($hasAnimation) { 'Green' } else { 'Red' })
    
    $themeStyle = if ($v1Content -match "radial-gradient") { "深色径向渐变" } else { "线性渐变" }
    Write-Host "主题风格: $themeStyle" -ForegroundColor White
} else {
    Write-Host "❌ 无法读取 ui-tasksquare-v2 分支" -ForegroundColor Red
}

# V2: stash@{0}
Write-Host "`n📌 版本 2: 浅色莫兰迪 + 动画 (stash@{0})" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$v2Content = git show "stash@{0}:frontend/src/utils/categoryTheme.ts" 2>$null
if ($v2Content) {
    $v2Categories = ($v2Content | Select-String -Pattern "^\s+(\w+):\s*\{" -AllMatches).Matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
    Write-Host "分类数量: $($v2Categories.Count)" -ForegroundColor Cyan
    Write-Host "分类列表: $($v2Categories -join ', ')" -ForegroundColor White
    
    $hasAnimation = $v2Content -match "categoryAnimations"
    Write-Host "动画支持: $(if ($hasAnimation) { '✅ 是' } else { '❌ 否' })" -ForegroundColor $(if ($hasAnimation) { 'Green' } else { 'Red' })
    
    if ($hasAnimation) {
        $animCount = ($v2Content | Select-String -Pattern "'/animations/.*\.json'" -AllMatches).Matches.Count
        Write-Host "动画文件: $animCount 个" -ForegroundColor Cyan
    }
    
    $themeStyle = if ($v2Content -match "莫兰迪") { "浅色莫兰迪" } elseif ($v2Content -match "linear-gradient.*#e8b4b8") { "浅色线性渐变" } else { "其他" }
    Write-Host "主题风格: $themeStyle" -ForegroundColor White
} else {
    Write-Host "❌ 无法读取 stash@{0}" -ForegroundColor Red
}

# V3: 当前工作目录
Write-Host "`n📌 版本 3: 当前工作目录" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

if (Test-Path "frontend/src/utils/categoryTheme.ts") {
    $v3Content = Get-Content "frontend/src/utils/categoryTheme.ts" -Raw
    $v3Categories = ($v3Content | Select-String -Pattern "^\s+(\w+):\s*\{" -AllMatches).Matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
    Write-Host "分类数量: $($v3Categories.Count)" -ForegroundColor Cyan
    Write-Host "分类列表: $($v3Categories -join ', ')" -ForegroundColor White
    
    $hasAnimation = $v3Content -match "categoryAnimations"
    Write-Host "动画支持: $(if ($hasAnimation) { '✅ 是' } else { '❌ 否' })" -ForegroundColor $(if ($hasAnimation) { 'Green' } else { 'Red' })
    
    if ($hasAnimation) {
        $animCount = ($v3Content | Select-String -Pattern "'/animations/.*\.json'" -AllMatches).Matches.Count
        Write-Host "动画文件: $animCount 个" -ForegroundColor Cyan
        
        # 检查动画文件是否存在
        if (Test-Path "frontend/public/animations") {
            $actualAnimFiles = (Get-ChildItem "frontend/public/animations/*.json").Count
            Write-Host "实际文件: $actualAnimFiles 个 $(if ($actualAnimFiles -eq $animCount) { '✅' } else { '⚠️' })" -ForegroundColor $(if ($actualAnimFiles -eq $animCount) { 'Green' } else { 'Yellow' })
        }
    }
    
    $themeStyle = if ($v3Content -match "莫兰迪") { "浅色莫兰迪" } elseif ($v3Content -match "linear-gradient.*#e8b4b8") { "浅色线性渐变" } else { "其他" }
    Write-Host "主题风格: $themeStyle" -ForegroundColor White
    
    # 检查与 V2 的差异
    if ($v2Content) {
        $diff = Compare-Object ($v2Content -split "`n") ($v3Content -split "`n")
        if ($diff) {
            Write-Host "与 V2 差异: ⚠️ 有差异 ($($diff.Count) 行)" -ForegroundColor Yellow
        } else {
            Write-Host "与 V2 差异: ✅ 完全相同" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ 文件不存在" -ForegroundColor Red
}

# 对比总结
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 版本对比总结" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n特性对比:" -ForegroundColor Yellow
Write-Host "┌─────────────────┬──────────┬──────────┬──────────┐" -ForegroundColor Gray
Write-Host "│ 特性            │ V1       │ V2       │ V3       │" -ForegroundColor Gray
Write-Host "├─────────────────┼──────────┼──────────┼──────────┤" -ForegroundColor Gray
Write-Host "│ 分类数量        │ 3        │ 7        │ 7        │" -ForegroundColor White
Write-Host "│ 动画支持        │ ❌       │ ✅       │ ✅       │" -ForegroundColor White
Write-Host "│ 主题风格        │ 深色     │ 浅色     │ 浅色     │" -ForegroundColor White
Write-Host "│ 分类类型        │ 技术类   │ 生活类   │ 生活类   │" -ForegroundColor White
Write-Host "└─────────────────┴──────────┴──────────┴──────────┘" -ForegroundColor Gray

Write-Host "`n💡 推荐:" -ForegroundColor Yellow
Write-Host "  • 生活互助平台 → V2/V3 (浅色莫兰迪 + 动画)" -ForegroundColor Cyan
Write-Host "  • 技术外包平台 → V1 (深色宇宙)" -ForegroundColor Cyan

Write-Host "`n📚 详细文档: docs/CATEGORYTHEME_VERSIONS.md" -ForegroundColor Gray
Write-Host ""
