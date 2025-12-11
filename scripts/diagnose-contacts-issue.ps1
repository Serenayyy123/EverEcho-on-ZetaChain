# 诊断联系方式乱码问题
# 检查后端返回的数据

$taskId = Read-Host "Enter taskId to test (e.g., 7)"
$address = Read-Host "Enter your wallet address"

Write-Host "`n=== Diagnosing Contacts Issue ===" -ForegroundColor Cyan
Write-Host ""

# 1. 检查本地后端
Write-Host "1. Testing LOCAL backend (localhost:3001)..." -ForegroundColor Yellow
try {
    $localHealth = Invoke-RestMethod -Uri "http://localhost:3001/healthz" -Method Get -ErrorAction Stop
    Write-Host "   Status:" $localHealth.status -ForegroundColor Green
} catch {
    Write-Host "   ❌ Local backend not running" -ForegroundColor Red
}

# 2. 检查 staging 后端
Write-Host "`n2. Testing STAGING backend (Render)..." -ForegroundColor Yellow
try {
    $stagingHealth = Invoke-RestMethod -Uri "https://everecho-backend.onrender.com/healthz" -Method Get -ErrorAction Stop
    Write-Host "   Status:" $stagingHealth.status -ForegroundColor Green
} catch {
    Write-Host "   ❌ Staging backend error:" $_.Exception.Message -ForegroundColor Red
}

# 3. 获取任务数据（本地）
Write-Host "`n3. Getting task data from LOCAL backend..." -ForegroundColor Yellow
try {
    $taskData = Invoke-RestMethod -Uri "http://localhost:3001/api/task/$taskId" -Method Get -ErrorAction Stop
    Write-Host "   Task found!" -ForegroundColor Green
    Write-Host "   Creator:" $taskData.creator
    Write-Host "   contactsEncryptedPayload (first 50 chars):" $taskData.contactsEncryptedPayload.Substring(0, [Math]::Min(50, $taskData.contactsEncryptedPayload.Length))
    
    # 检查是否是 hex
    if ($taskData.contactsEncryptedPayload -match "^[0-9a-f]+$") {
        Write-Host "   ✅ contactsEncryptedPayload is hex (encrypted)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ contactsEncryptedPayload is NOT hex" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed to get task:" $_.Exception.Message -ForegroundColor Red
}

# 4. 测试 decrypt 接口（需要签名，这里只是演示）
Write-Host "`n4. To test /api/contacts/decrypt, you need:" -ForegroundColor Yellow
Write-Host "   - Sign a message with your wallet" -ForegroundColor Gray
Write-Host "   - POST to /api/contacts/decrypt with signature" -ForegroundColor Gray
Write-Host "   - Check the response.contacts field" -ForegroundColor Gray
Write-Host ""
Write-Host "   Expected: response.contacts should be plaintext (e.g., 'Telegram: @user, Email: user@example.com')" -ForegroundColor Gray
Write-Host "   Actual (from your log): hex string starting with 'c197ab6e...'" -ForegroundColor Gray

Write-Host "`n=== Diagnosis Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check if Render has deployed the latest code (commit 896cc09)" -ForegroundColor White
Write-Host "2. Check backend logs for '[/decrypt]' messages" -ForegroundColor White
Write-Host "3. Verify the fallback logic is triggered" -ForegroundColor White
