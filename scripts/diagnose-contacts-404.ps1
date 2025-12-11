# Diagnose why contacts endpoint returns 404 in browser but works in scripts

$backendUrl = "https://everecho-staging-backend.onrender.com"

Write-Host "=== Diagnosing Contacts 404 Issue ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check root endpoint
Write-Host "1. Checking root endpoint..." -ForegroundColor Yellow
try {
    $root = Invoke-RestMethod -Uri "$backendUrl/" -Method GET
    Write-Host "   [OK] Root endpoint works" -ForegroundColor Green
    Write-Host "   Endpoints listed: $($root.endpoints | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   [ERROR] Root endpoint failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Check contacts endpoint with OPTIONS (CORS preflight)
Write-Host "2. Testing CORS preflight (OPTIONS)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "https://everecho-staging.vercel.app"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "content-type"
    }
    
    $response = Invoke-WebRequest -Uri "$backendUrl/api/contacts/decrypt" -Method OPTIONS -Headers $headers -UseBasicParsing
    Write-Host "   [OK] OPTIONS request succeeded" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   CORS headers:" -ForegroundColor Gray
    $response.Headers.GetEnumerator() | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
        Write-Host "      $($_.Key): $($_.Value)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [ERROR] OPTIONS request failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Check with different User-Agent (simulate browser)
Write-Host "3. Testing with browser-like User-Agent..." -ForegroundColor Yellow
try {
    $headers = @{
        "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        "Origin" = "https://everecho-staging.vercel.app"
    }
    
    $body = @{
        taskId = "2"
        address = "0x099Fb550F7Dc5842621344c5a1678F943eEF3488"
        signature = "0x1234"
        message = "test"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$backendUrl/api/contacts/decrypt" -Method POST -Headers $headers -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "   [OK] Request succeeded with status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
    if ($statusCode -eq 404) {
        Write-Host "   [ERROR] Still getting 404!" -ForegroundColor Red
    } elseif ($statusCode -eq 401) {
        Write-Host "   [OK] Got 401 (endpoint exists, signature invalid)" -ForegroundColor Green
    } else {
        Write-Host "   [INFO] Got $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 4: Check if there's a CDN/proxy in front
Write-Host "4. Checking for CDN/Proxy..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/contacts/decrypt" -Method POST -UseBasicParsing
    Write-Host "   Response headers:" -ForegroundColor Gray
    $response.Headers.GetEnumerator() | Where-Object { 
        $_.Key -like "*CF-*" -or $_.Key -like "*X-*" -or $_.Key -like "*Server*" 
    } | ForEach-Object {
        Write-Host "      $($_.Key): $($_.Value)" -ForegroundColor Gray
    }
} catch {
    $response = $_.Exception.Response
    if ($response) {
        Write-Host "   Response headers from error:" -ForegroundColor Gray
        $response.Headers.GetEnumerator() | ForEach-Object {
            Write-Host "      $($_.Key): $($_.Value)" -ForegroundColor Gray
        }
    }
}
Write-Host ""

# Test 5: Direct test without any headers
Write-Host "5. Testing with minimal request..." -ForegroundColor Yellow
try {
    $body = '{"taskId":"2"}'
    Invoke-RestMethod -Uri "$backendUrl/api/contacts/decrypt" -Method POST -Body $body -ContentType "application/json"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "   [OK] Got 400 (endpoint exists, missing params)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "   [ERROR] Got 404 (endpoint not found)" -ForegroundColor Red
    } else {
        Write-Host "   [INFO] Got $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "=== Analysis ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Possible causes:" -ForegroundColor Yellow
Write-Host "1. Browser cache - Try hard refresh (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "2. CDN cache (Cloudflare) - May need to purge cache" -ForegroundColor White
Write-Host "3. Different deployment - Browser hitting old deployment" -ForegroundColor White
Write-Host "4. CORS issue - Browser blocking the request" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check browser Network tab for actual request URL" -ForegroundColor White
Write-Host "2. Check if request is being redirected" -ForegroundColor White
Write-Host "3. Try in incognito/private mode" -ForegroundColor White
Write-Host "4. Check Render deployment logs" -ForegroundColor White
Write-Host ""
