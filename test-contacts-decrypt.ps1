# Test contacts decrypt endpoint

Write-Host "Testing /api/contacts/decrypt endpoint..." -ForegroundColor Cyan

$body = @{
    taskId = "1"
    address = "0x1234567890123456789012345678901234567890"
    signature = "0xtest"
    message = "test"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3001/api/contacts/decrypt" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✓ Endpoint is accessible" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $content = $_.ErrorDetails.Message
    
    if ($statusCode -eq 404) {
        Write-Host "✗ 404 Not Found - Endpoint does not exist" -ForegroundColor Red
    } elseif ($statusCode -eq 400 -or $statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "✓ Endpoint exists (got $statusCode)" -ForegroundColor Green
        Write-Host "Response: $content" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Unexpected error: $statusCode" -ForegroundColor Red
        Write-Host "Response: $content" -ForegroundColor Yellow
    }
}

Write-Host "`nChecking backend routes..." -ForegroundColor Cyan
Write-Host "Expected route: POST /api/contacts/decrypt" -ForegroundColor Yellow
