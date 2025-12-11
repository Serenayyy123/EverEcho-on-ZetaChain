# Test the actual contacts decrypt request from browser

$backendUrl = "https://everecho-staging-backend.onrender.com"

Write-Host "=== Testing Actual Contacts Decrypt Request ===" -ForegroundColor Cyan
Write-Host ""

# Simulate the actual request from browser
Write-Host "Testing POST /api/contacts/decrypt..." -ForegroundColor Yellow

$body = @{
    taskId = "2"
    address = "0x099Fb550F7Dc5842621344c5a1678F943eEF3488"
    signature = "0x094852d10b61b9d83c"
    message = "Request contacts for task 2"
} | ConvertTo-Json

Write-Host "Request body:" -ForegroundColor Gray
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/contacts/decrypt" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
    Write-Host "✅ Success! Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
    
    if ($statusCode -eq 404) {
        Write-Host "❌ 404 Not Found - Endpoint does not exist!" -ForegroundColor Red
        Write-Host ""
        Write-Host "This is strange because:" -ForegroundColor Yellow
        Write-Host "  - The root endpoint shows /api/contacts exists" -ForegroundColor White
        Write-Host "  - The code has the route registered" -ForegroundColor White
        Write-Host ""
        Write-Host "Possible causes:" -ForegroundColor Yellow
        Write-Host "  1. Staging backend is running old code" -ForegroundColor White
        Write-Host "  2. Route file not deployed" -ForegroundColor White
        Write-Host "  3. Build/deployment issue" -ForegroundColor White
    } elseif ($statusCode -eq 401) {
        Write-Host "✅ Endpoint exists! (401 = Invalid signature)" -ForegroundColor Green
    } elseif ($statusCode -eq 400) {
        Write-Host "✅ Endpoint exists! (400 = Missing params)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected status code: $statusCode" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Gray
    Write-Host $_.Exception.Message -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Checking if route file exists in deployment ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "The contacts route should be at:" -ForegroundColor White
Write-Host "  backend/src/routes/contacts.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "If you have access to Render dashboard:" -ForegroundColor Yellow
Write-Host "  1. Go to your backend service" -ForegroundColor White
Write-Host "  2. Check 'Logs' tab" -ForegroundColor White
Write-Host "  3. Look for startup messages" -ForegroundColor White
Write-Host "  4. Verify routes are registered" -ForegroundColor White
Write-Host ""
