# 主页推送脚本 - 带回滚保护
Write-Host "=== 主页推送脚本 ===" -ForegroundColor Cyan

# 1. 检查当前状态
Write-Host "`n[1/6] 检查 Git 状态..." -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "当前分支: $branch" -ForegroundColor Green

# 2. 保存当前 commit（用于回滚）
$currentCommit = git rev-parse HEAD
Write-Host "当前 Commit: $currentCommit" -ForegroundColor Green
Write-Host "✓ 已记录回滚点" -ForegroundColor Green

# 3. 暂存主页文件
Write-Host "`n[2/6] 暂存主页文件..." -ForegroundColor Yellow
git add frontend/src/pages/Home.tsx
git add frontend/src/components/home/HowItWorks.tsx
git add frontend/src/components/layout/PageLayout.tsx

# 4. 检查暂存的文件
Write-Host "`n[3/6] 检查暂存的文件..." -ForegroundColor Yellow
git status --short | Where-Object { $_ -match "^[AM]" }

# 5. 提交
Write-Host "`n[4/6] 提交改动..." -ForegroundColor Yellow
git commit -m "feat: restore hand-drawn illustrations on home page"

if ($LASTEXITCODE -eq 0) {
    $newCommit = git rev-parse HEAD
    Write-Host "✓ 提交成功: $newCommit" -ForegroundColor Green
    
    # 6. 推送
    Write-Host "`n[5/6] 推送到远程..." -ForegroundColor Yellow
    git push origin $branch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ 推送成功！" -ForegroundColor Green
        
        # 保存回滚信息
        Write-Host "`n[6/6] 保存回滚信息..." -ForegroundColor Yellow
        $rollbackInfo = @"
# 主页推送记录

推送时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
分支: $branch
推送前 Commit: $currentCommit
推送后 Commit: $newCommit

## 如果需要回滚，执行：
``````powershell
git revert $newCommit
git push origin $branch
``````

或者硬回滚（慎用）：
``````powershell
git reset --hard $currentCommit
git push origin $branch --force
``````
"@
        
        $rollbackInfo | Out-File -FilePath "docs/HOME_DEPLOY_ROLLBACK.md" -Encoding UTF8
        Write-Host "✓ 回滚信息已保存到: docs/HOME_DEPLOY_ROLLBACK.md" -ForegroundColor Green
        
        Write-Host "`n=== 推送完成 ===" -ForegroundColor Cyan
        Write-Host "请访问 Vercel Dashboard 查看构建状态" -ForegroundColor Yellow
        Write-Host "Staging URL: https://everecho-staging.vercel.app/" -ForegroundColor Yellow
        
    } else {
        Write-Host "`n✗ 推送失败" -ForegroundColor Red
        Write-Host "可能需要先 pull: git pull origin $branch" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n✗ 提交失败" -ForegroundColor Red
    Write-Host "可能没有改动或有冲突" -ForegroundColor Yellow
}
