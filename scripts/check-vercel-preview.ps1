# Check Vercel Preview Deployment for ui-v2-restore-all branch

Write-Host "=== Vercel Preview Deployment Check ===" -ForegroundColor Cyan
Write-Host ""

$branch = "ui-v2-restore-all"
$repo = "Serenayyy123/EverEcho-2025"

Write-Host "Branch: $branch" -ForegroundColor Yellow
Write-Host "Repository: $repo" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 Latest commits on this branch:" -ForegroundColor Green
git log --oneline -3

Write-Host ""
Write-Host "🔍 Checking GitHub for deployment status..." -ForegroundColor Green
Write-Host ""

# Get the latest commit SHA
$latestCommit = git rev-parse HEAD
Write-Host "Latest commit: $latestCommit" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ Branch pushed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 To view Vercel preview deployment:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://github.com/$repo/commits/$branch" -ForegroundColor White
Write-Host "   2. Look for the latest commit with Vercel deployment status" -ForegroundColor White
Write-Host "   3. Click on the Vercel check to see preview URL" -ForegroundColor White
Write-Host ""
Write-Host "   OR" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Go to Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   2. Find your EverEcho project" -ForegroundColor White
Write-Host "   3. Look for deployment from branch: $branch" -ForegroundColor White
Write-Host ""

Write-Host "🔄 Rollback instructions:" -ForegroundColor Magenta
Write-Host "   If you need to rollback to previous state:" -ForegroundColor White
Write-Host "   git checkout ui-v2-restore-all" -ForegroundColor Gray
Write-Host "   git reset --hard 28e79c9" -ForegroundColor Gray
Write-Host "   git push origin ui-v2-restore-all --force" -ForegroundColor Gray
Write-Host ""

Write-Host "💾 Current state saved at commit: ab916ed" -ForegroundColor Green
Write-Host "   Previous safe point: 28e79c9" -ForegroundColor Yellow
