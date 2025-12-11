# Check staging frontend configuration

$stagingFrontendUrl = "https://everecho-staging.vercel.app"
$expectedBackendUrl = "https://everecho-staging-backend.onrender.com"

Write-Host "=== Checking Staging Frontend Configuration ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Expected Configuration:" -ForegroundColor Yellow
Write-Host "   Frontend: $stagingFrontendUrl" -ForegroundColor Gray
Write-Host "   Backend:  $expectedBackendUrl" -ForegroundColor Gray
Write-Host ""

Write-Host "🔍 Checking frontend build..." -ForegroundColor Yellow
Write-Host ""

# Check if frontend dist exists
if (Test-Path "frontend/dist") {
    Write-Host "✅ Frontend dist folder exists" -ForegroundColor Green
    
    # Check index.html for environment variables
    $indexPath = "frontend/dist/index.html"
    if (Test-Path $indexPath) {
        Write-Host "✅ index.html found" -ForegroundColor Green
        
        # Look for any hardcoded URLs in the built files
        $jsFiles = Get-ChildItem "frontend/dist/assets/*.js" -ErrorAction SilentlyContinue
        if ($jsFiles) {
            Write-Host ""
            Write-Host "🔍 Checking for API URLs in built files..." -ForegroundColor Yellow
            
            $foundLocalhost = $false
            $foundStaging = $false
            
            foreach ($file in $jsFiles) {
                $content = Get-Content $file.FullName -Raw
                
                if ($content -match "localhost:3001") {
                    $foundLocalhost = $true
                }
                
                if ($content -match "everecho-staging-backend") {
                    $foundStaging = $true
                }
            }
            
            if ($foundLocalhost) {
                Write-Host "❌ Found localhost:3001 in built files!" -ForegroundColor Red
                Write-Host "   This means VITE_BACKEND_BASE_URL was not set during build" -ForegroundColor Red
            } else {
                Write-Host "✅ No localhost URLs found" -ForegroundColor Green
            }
            
            if ($foundStaging) {
                Write-Host "✅ Found staging backend URL" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Staging backend URL not found" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "⚠️  Frontend not built yet (no dist folder)" -ForegroundColor Yellow
    Write-Host "   Run: cd frontend && npm run build" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Vercel Environment Variables Check ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please verify these variables are set in Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "   https://vercel.com/dashboard → Your Project → Settings → Environment Variables" -ForegroundColor Gray
Write-Host ""
Write-Host "Required variables:" -ForegroundColor White
Write-Host "   VITE_BACKEND_BASE_URL = $expectedBackendUrl" -ForegroundColor Cyan
Write-Host "   VITE_CHAIN_ID = 84532" -ForegroundColor Cyan
Write-Host "   VITE_EOCHO_TOKEN_ADDRESS = 0xe7940e81dDf4d6415f2947829938f9A24B0ad35d" -ForegroundColor Cyan
Write-Host "   VITE_REGISTER_ADDRESS = 0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151" -ForegroundColor Cyan
Write-Host "   VITE_TASK_ESCROW_ADDRESS = 0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to Vercel Dashboard and check environment variables" -ForegroundColor White
Write-Host "2. If missing or incorrect, add/update them" -ForegroundColor White
Write-Host "3. Redeploy the frontend (Deployments → ... → Redeploy)" -ForegroundColor White
Write-Host "4. Wait 2-3 minutes for deployment to complete" -ForegroundColor White
Write-Host "5. Test again in browser" -ForegroundColor White
Write-Host ""

Write-Host "📖 Detailed guide: docs/STAGING_CONTACTS_404_FIX.md" -ForegroundColor Yellow
Write-Host ""
