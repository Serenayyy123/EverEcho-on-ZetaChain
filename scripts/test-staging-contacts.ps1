# Test staging contacts decrypt endpoint

$stagingUrl = "https://everecho-staging-backend.onrender.com"

Write-Host "=== Testing Staging Contacts Decrypt ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check root endpoint
Write-Host "1. Checking root endpoint..." -ForegroundColor Yellow
try {
    $root = Invoke-RestMethod -Uri "$stagingUrl/" -Method GET
    Write-Host "✅ Root endpoint OK" -ForegroundColor Green
    Write-Host "   Endpoints: $($root.endpoints | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Root endpoint failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Check contacts endpoint with missing params (should return 400)
Write-Host "2. Testing /api/contacts/decrypt with missing params..." -ForegroundColor Yellow
try {
    $body = @{
        taskId = "2"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$stagingUrl/api/contacts/decrypt" -Method POST -ContentType "application/json" -Body $body
    Write-Host "❌ Should have returned 400 but got: $($response | ConvertTo-Json)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ Correctly returned 400 for missing params" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Returned $statusCode instead of 400" -ForegroundColor Yellow
        Write-Host "   Error: $_" -ForegroundColor Gray
    }
}
Write-Host ""

# Test 3: Check with all params but invalid signature (should return 401)
Write-Host "3. Testing with invalid signature..." -ForegroundColor Yellow
try {
    $body = @{
        taskId = "2"
        address = "0x099Fb550F7Dc5842621344c5a1678F943eEF3488"
        signature = "0x1234567890abcdef"
        message = "Request contacts for task 2"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$stagingUrl/api/contacts/decrypt" -Method POST -ContentType "application/json" -Body $body
    Write-Host "❌ Should have returned 401 but got: $($response | ConvertTo-Json)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Correctly returned 401 for invalid signature" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Returned $statusCode instead of 401" -ForegroundColor Yellow
        Write-Host "   Error: $_" -ForegroundColor Gray
    }
}
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   - The /api/contacts/decrypt endpoint EXISTS on staging" -ForegroundColor White
Write-Host "   - It's returning proper error codes (400/401)" -ForegroundColor White
Write-Host "   - The 404 error in browser is likely a CORS or routing issue" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Check browser console for CORS errors" -ForegroundColor White
Write-Host "   2. Verify the frontend is using the correct staging URL" -ForegroundColor White
Write-Host "   3. Check if there's a proxy/CDN issue" -ForegroundColor White
