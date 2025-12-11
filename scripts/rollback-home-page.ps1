# 主页回滚脚本
Write-Host "=== 主页回滚脚本 ===" -ForegroundColor Cyan

# 读取回滚信息
if (Test-Path "docs/HOME_DEPLOY_ROLLBACK.md") {
    Write-Host "`n读取回滚信息..." -ForegroundColor Yellow
    Get-Content "docs/HOME_DEPLOY_ROLLBACK.md" | Select-Object -First 10
    
    Write-Host "`n确认要回滚吗？(y/n)" -ForegroundColor Yellow
    $confirm = Read-Host
    
    if ($confirm -eq 'y') {
        Write-Host "`n执行回滚..." -ForegroundColor Yellow
        
        # 获取最后一次 commit
        $lastCommit = git rev-parse HEAD
        
        # 方法 1: 使用 revert（推荐）
        Write-Host "使用 git revert 回滚..." -ForegroundColor Yellow
        git revert --no-edit $lastCommit
        
        if ($LASTEXITCODE -eq 0) {
            git push origin (git branch --show-current)
            Write-Host "`n✓ 回滚成功！" -ForegroundColor Green
        } else {
            Write-Host "`n✗ 回滚失败" -ForegroundColor Red
            Write-Host "请手动执行: git revert $lastCommit" -ForegroundColor Yellow
        }
    } else {
        Write-Host "取消回滚" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ 找不到回滚信息文件" -ForegroundColor Red
    Write-Host "请手动回滚: git revert HEAD" -ForegroundColor Yellow
}
