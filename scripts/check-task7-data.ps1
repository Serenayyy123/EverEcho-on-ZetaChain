# Check Task 7 data from staging backend

$backendUrl = "https://everecho-staging-backend.onrender.com"

Write-Host "=== Checking Task 7 Data ===" -ForegroundColor Cyan
Write-Host ""

try {
    $task = Invoke-RestMethod -Uri "$backendUrl/api/task/7" -Method GET
    
    Write-Host "Task 7 Metadata:" -ForegroundColor Yellow
    Write-Host "  Title: $($task.title)" -ForegroundColor White
    Write-Host "  Description: $($task.description)" -ForegroundColor White
    Write-Host "  Creator: $($task.creator)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Contacts Data:" -ForegroundColor Yellow
    Write-Host "  contactsEncryptedPayload: $($task.contactsEncryptedPayload)" -ForegroundColor White
    Write-Host ""
    
    # Check if it's encrypted
    $isHex = $task.contactsEncryptedPayload -match '^[0-9a-f]{64,}$'
    
    if ($isHex) {
        Write-Host "[INFO] contactsEncryptedPayload is encrypted (expected)" -ForegroundColor Green
        Write-Host "  Length: $($task.contactsEncryptedPayload.Length)" -ForegroundColor Gray
    } else {
        Write-Host "[UNEXPECTED] contactsEncryptedPayload is plaintext" -ForegroundColor Yellow
        Write-Host "  Value: $($task.contactsEncryptedPayload)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "=== Analysis ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The backend is returning contactsEncryptedPayload (encrypted data)" -ForegroundColor White
    Write-Host "But the /api/contacts/decrypt endpoint should return PLAINTEXT" -ForegroundColor White
    Write-Host ""
    Write-Host "Problem:" -ForegroundColor Red
    Write-Host "  - /api/contacts/decrypt is returning encrypted data" -ForegroundColor White
    Write-Host "  - It should decrypt and return plaintext" -ForegroundColor White
    Write-Host ""
    Write-Host "Solution:" -ForegroundColor Yellow
    Write-Host "  - Fix /api/contacts/decrypt to return task.contactsPlaintext" -ForegroundColor White
    Write-Host "  - NOT task.contactsEncryptedPayload" -ForegroundColor White
    
} catch {
    Write-Host "[ERROR] Failed to fetch task: $_" -ForegroundColor Red
}

Write-Host ""
