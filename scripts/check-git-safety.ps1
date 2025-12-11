# Git 安全检查脚本
# 检查是否有敏感信息会被提交到 Git

Write-Host "🔍 检查 Git 安全性..." -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# 1. 检查 .gitignore 是否存在
Write-Host "1️⃣ 检查 .gitignore 文件..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    Write-Host "   ✅ 根目录 .gitignore 存在" -ForegroundColor Green
} else {
    Write-Host "   ❌ 根目录 .gitignore 不存在" -ForegroundColor Red
    $errors++
}

if (Test-Path "backend\.gitignore") {
    Write-Host "   ✅ backend/.gitignore 存在" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  backend/.gitignore 不存在" -ForegroundColor Yellow
    $warnings++
}

if (Test-Path "frontend\.gitignore") {
    Write-Host "   ✅ frontend/.gitignore 存在" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  frontend/.gitignore 不存在" -ForegroundColor Yellow
    $warnings++
}
Write-Host ""

# 2. 检查敏感文件是否存在
Write-Host "2️⃣ 检查敏感文件..." -ForegroundColor Yellow
$sensitiveFiles = @(
    "backend\.env",
    "frontend\.env",
    ".env",
    "backend\prisma\dev.db"
)

foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        Write-Host "   ⚠️  发现敏感文件: $file" -ForegroundColor Yellow
        
        # 检查是否在 .gitignore 中
        $gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue
        $fileName = Split-Path $file -Leaf
        
        if ($gitignoreContent -match $fileName) {
            Write-Host "      ✅ 已在 .gitignore 中忽略" -ForegroundColor Green
        } else {
            Write-Host "      ❌ 未在 .gitignore 中忽略！" -ForegroundColor Red
            $errors++
        }
    }
}
Write-Host ""

# 3. 检查 Git 仓库状态
Write-Host "3️⃣ 检查 Git 仓库..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "   ✅ Git 仓库已初始化" -ForegroundColor Green
    
    # 检查是否有敏感文件被追踪
    Write-Host "   检查已追踪的文件..." -ForegroundColor Cyan
    
    try {
        $trackedFiles = git ls-files
        $dangerousPatterns = @("\.env$", "\.db$", "\.key$", "\.pem$")
        
        $foundDangerous = $false
        foreach ($pattern in $dangerousPatterns) {
            $matches = $trackedFiles | Select-String -Pattern $pattern
            if ($matches) {
                Write-Host "   ❌ 发现已追踪的敏感文件:" -ForegroundColor Red
                $matches | ForEach-Object { Write-Host "      - $_" -ForegroundColor Red }
                $errors++
                $foundDangerous = $true
            }
        }
        
        if (-not $foundDangerous) {
            Write-Host "   ✅ 没有发现已追踪的敏感文件" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  无法检查 Git 追踪文件" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Git 仓库未初始化" -ForegroundColor Yellow
    Write-Host "   运行: git init" -ForegroundColor Cyan
    $warnings++
}
Write-Host ""

# 4. 检查 .env 文件内容
Write-Host "4️⃣ 检查 .env 文件内容..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env"
    
    # 检查是否包含真实的敏感信息
    $sensitivePatterns = @{
        "DATABASE_URL" = "postgresql://"
        "PRIVATE_KEY" = "0x"
        "API_KEY" = "[a-zA-Z0-9]{20,}"
    }
    
    foreach ($key in $sensitivePatterns.Keys) {
        $pattern = $sensitivePatterns[$key]
        $matches = $envContent | Select-String -Pattern "$key.*$pattern"
        if ($matches) {
            Write-Host "   ⚠️  backend/.env 包含 $key" -ForegroundColor Yellow
        }
    }
    
    Write-Host "   ℹ️  确保 backend/.env 在 .gitignore 中" -ForegroundColor Cyan
}
Write-Host ""

# 5. 模拟 git add 检查
Write-Host "5️⃣ 模拟 git add 检查..." -ForegroundColor Yellow
if (Test-Path ".git") {
    try {
        # 检查哪些文件会被添加
        $status = git status --short
        
        if ($status) {
            Write-Host "   将要添加的文件:" -ForegroundColor Cyan
            $status | ForEach-Object {
                $file = $_ -replace '^\s*\?\?\s*', ''
                
                # 检查是否是敏感文件
                if ($file -match "\.env$|\.db$|\.key$|\.pem$") {
                    Write-Host "   ❌ 敏感文件: $file" -ForegroundColor Red
                    $errors++
                } else {
                    Write-Host "   ✅ $file" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "   ✅ 没有待提交的文件" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  无法检查 Git 状态" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⏭️  跳过（Git 未初始化）" -ForegroundColor Gray
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
    Write-Host "✅ 安全检查通过！可以安全地推送到 GitHub。" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 下一步:" -ForegroundColor Cyan
    Write-Host "   1. git add ." -ForegroundColor White
    Write-Host "   2. git commit -m 'feat: ready for staging deployment'" -ForegroundColor White
    Write-Host "   3. git push origin main" -ForegroundColor White
} else {
    Write-Host "❌ 发现 $errors 个安全问题，请修复后再推送。" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 修复建议:" -ForegroundColor Cyan
    Write-Host "   1. 确保所有 .env 文件在 .gitignore 中" -ForegroundColor White
    Write-Host "   2. 运行: git rm --cached <敏感文件>" -ForegroundColor White
    Write-Host "   3. 重新检查: .\scripts\check-git-safety.ps1" -ForegroundColor White
    exit 1
}
