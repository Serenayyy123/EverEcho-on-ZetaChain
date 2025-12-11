# Check what's actually stored in Profile.contacts

$backendUrl = "https://everecho-staging-backend.onrender.com"
$address = "0x099Fb550F7Dc5842621344c5a1678F943eEF3488"

Write-Host "=== Checking Profile.contacts ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Address: $address" -ForegroundColor Gray
Write-Host ""

try {
    $profile = Invoke-RestMethod -Uri "$backendUrl/api/profile/$address" -Method GET
    
    Write-Host "Profile Data:" -ForegroundColor Yellow
    Write-Host "  Nickname: $($profile.nickname)" -ForegroundColor White
    Write-Host "  Contacts: $($profile.contacts)" -ForegroundColor White
    Write-Host ""
    
    # Check if contacts looks like encrypted data
    $isHex = $profile.contacts -match '^[0-9a-f]{64,}$'
    
    if ($isHex) {
        Write-Host "[ERROR] Contacts is ENCRYPTED (hex string)" -ForegroundColor Red
        Write-Host "  Length: $($profile.contacts.Length)" -ForegroundColor Gray
        Write-Host "  Preview: $($profile.contacts.Substring(0, [Math]::Min(50, $profile.contacts.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "[OK] Contacts is PLAINTEXT" -ForegroundColor Green
        Write-Host "  Value: $($profile.contacts)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "=== Analysis ===" -ForegroundColor Cyan
    Write-Host ""
    
    if ($isHex) {
        Write-Host "Problem confirmed:" -ForegroundColor Red
        Write-Host "  - Profile.contacts contains encrypted data" -ForegroundColor White
        Write-Host "  - All tasks created from this profile will have encrypted contacts" -ForegroundColor White
        Write-Host ""
        Write-Host "Solution:" -ForegroundColor Yellow
        Write-Host "  1. Update Profile.contacts to plaintext" -ForegroundColor White
        Write-Host "  2. Then create new tasks" -ForegroundColor White
    } else {
        Write-Host "Profile.contacts looks OK" -ForegroundColor Green
        Write-Host "  - Contains plaintext data" -ForegroundColor White
        Write-Host "  - Problem might be elsewhere" -ForegroundColor White
    }
    
} catch {
    Write-Host "[ERROR] Failed to fetch profile: $_" -ForegroundColor Red
}

Write-Host ""
