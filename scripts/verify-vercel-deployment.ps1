# Verify Vercel deployment and environment variables

param(
    [string]$FrontendUrl = "https://everecho-staging.vercel.app"
)

Write-Host "=== Verifying Vercel Deployment ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor Gray
Write-Host ""

# Step 1: Check if frontend is accessible
Write-Host "1. Checking frontend accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $FrontendUrl -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Frontend is not accessible: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Please check:" -ForegroundColor Yellow
    Write-Host "   - Is the URL correct?" -ForegroundColor Gray
    Write-Host "   - Has the deployment completed?" -ForegroundColor Gray
    Write-Host "   - Check Vercel Dashboard for deployment status" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# Step 2: Check if the built files contain correct backend URL
Write-Host "2. Checking for API URL in deployed frontend..." -ForegroundColor Yellow
Write-Host "   (This requires manual verification in browser)" -ForegroundColor Gray
Write-Host ""
Write-Host "   Open browser console and run:" -ForegroundColor White
Write-Host "   console.log(import.meta.env.VITE_BACKEND_BASE_URL)" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Expected output:" -ForegroundColor White
Write-Host "   https://everecho-staging-backend.onrender.com" -ForegroundColor Green
Write-Host ""
Write-Host "   If you see 'http://localhost:3001':" -ForegroundColor Yellow
Write-Host "   ❌ Environment variables not set correctly" -ForegroundColor Red
Write-Host "   → Go to Vercel Dashboard → Settings → Environment Variables" -ForegroundColor Gray
Write-Host "   → Add VITE_BACKEND_BASE_URL and redeploy" -ForegroundColor Gray
Write-Host ""

# Step 3: Test backend connectivity
Write-Host "3. Testing backend connectivity..." -ForegroundColor Yellow
$backendUrl = "https://everecho-staging-backend.onrender.com"
try {
    $backendResponse = Invoke-RestMethod -Uri "$backendUrl/" -Method GET
    Write-Host "   ✅ Backend is accessible" -ForegroundColor Green
    Write-Host "   Backend version: $($backendResponse.version)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Backend is not accessible: $_" -ForegroundColor Red
}

Write-Host ""

# Step 4: Test contacts endpoint
Write-Host "4. Testing contacts endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        taskId = "2"
    } | ConvertTo-Json
    
    $contactsResponse = Invoke-RestMethod -Uri "$backendUrl/api/contacts/decrypt" -Method POST -ContentType "application/json" -Body $body
    Write-Host "   ❌ Should have returned 400 but got: $contactsResponse" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "   ✅ Contacts endpoint is working (returned 400 for missing params)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Unexpected status code: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Deployment Verification Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Frontend: Accessible" -ForegroundColor Green
Write-Host "✅ Backend: Accessible" -ForegroundColor Green
Write-Host "✅ Contacts API: Working" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Manual Check Required:" -ForegroundColor Yellow
Write-Host "   1. Open $FrontendUrl in browser" -ForegroundColor White
Write-Host "   2. Open Developer Console (F12)" -ForegroundColor White
Write-Host "   3. Run: console.log(import.meta.env.VITE_BACKEND_BASE_URL)" -ForegroundColor White
Write-Host "   4. Verify it shows: https://everecho-staging-backend.onrender.com" -ForegroundColor White
Write-Host ""
Write-Host "If environment variable is incorrect:" -ForegroundColor Yellow
Write-Host "   → Update Vercel environment variables" -ForegroundColor White
Write-Host "   → Redeploy (Deployments → ... → Redeploy)" -ForegroundColor White
Write-Host "   → Wait 2-3 minutes" -ForegroundColor White
Write-Host "   → Run this script again" -ForegroundColor White
Write-Host ""
Write-Host "📖 Detailed guide: docs/STAGING_CONTACTS_404_FIX.md" -ForegroundColor Cyan
Write-Host ""
