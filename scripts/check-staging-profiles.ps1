# Check all profiles on staging backend

$backendUrl = "https://everecho-staging-backend.onrender.com"

Write-Host "=== Checking Staging Profiles EncryptionPubKey Status ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: $backendUrl" -ForegroundColor Gray
Write-Host ""

# Test addresses from previous checks
$testAddresses = @(
    "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
    "0x18D5eeDd85Caf7E96eEcB5c0a50514f810f98541",
    "0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db",
    "0xD68a76259d4100A2622D643d5e62F5F92C28C4fe",
    "0x2bF490F5a7Be8e8AC83020d77d240c4E39165C30"
)

$hasKeyCount = 0
$missingKeyCount = 0
$errorCount = 0

Write-Host "Checking profiles..." -ForegroundColor Yellow
Write-Host ""

foreach ($address in $testAddresses) {
    try {
        $response = Invoke-RestMethod -Uri "$backendUrl/api/profile/$address" -Method GET -ErrorAction Stop
        
        $hasKey = $response.encryptionPubKey -and $response.encryptionPubKey.Length -gt 0
        $status = if ($hasKey) { "[OK]" } else { "[MISSING]" }
        
        if ($hasKey) {
            $hasKeyCount++
        } else {
            $missingKeyCount++
        }
        
        if ($hasKey) {
            Write-Host "[OK] $address" -ForegroundColor Green
        } else {
            Write-Host "[MISSING] $address" -ForegroundColor Red
        }
        Write-Host "   Nickname: $($response.nickname)" -ForegroundColor Gray
        if ($hasKey) {
            $keyPreview = $response.encryptionPubKey.Substring(0, [Math]::Min(20, $response.encryptionPubKey.Length))
            Write-Host "   EncryptionPubKey: $keyPreview..." -ForegroundColor Gray
        } else {
            Write-Host "   EncryptionPubKey: MISSING" -ForegroundColor Red
        }
        Write-Host ""
        
    } catch {
        $errorCount++
        Write-Host "[ERROR] $address" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Total checked: $($testAddresses.Count)" -ForegroundColor White
Write-Host "   [OK] Has encryptionPubKey: $hasKeyCount" -ForegroundColor Green
Write-Host "   [MISSING] Missing encryptionPubKey: $missingKeyCount" -ForegroundColor Red
Write-Host "   [ERROR] Errors: $errorCount" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

if ($missingKeyCount -gt 0) {
    Write-Host "[!] Action Required:" -ForegroundColor Yellow
    Write-Host "   Users missing encryptionPubKey need to:" -ForegroundColor White
    Write-Host "   1. Visit their Profile page" -ForegroundColor White
    Write-Host "   2. Click 'Restore profile (off-chain)' button" -ForegroundColor White
    Write-Host "   3. Confirm the restoration" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[SUCCESS] All checked users have encryptionPubKey!" -ForegroundColor Green
    Write-Host ""
}
