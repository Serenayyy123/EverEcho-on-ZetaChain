# 测试 /api/contacts/decrypt 修复
# 验证是否能正确返回明文联系方式

$taskId = "7"
$address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"  # 替换为实际的 creator 地址
$message = "Decrypt contacts for task $taskId"

Write-Host "=== Testing /api/contacts/decrypt Fix ===" -ForegroundColor Cyan
Write-Host ""

# 1. 先获取任务信息
Write-Host "1. Getting task info..." -ForegroundColor Yellow
$taskResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/task/$taskId" -Method Get
Write-Host "Task contactsEncryptedPayload:" $taskResponse.contactsEncryptedPayload.Substring(0, 50) "..."
Write-Host "Length:" $taskResponse.contactsEncryptedPayload.Length
Write-Host ""

# 2. 生成签名（这里简化，实际需要用钱包签名）
Write-Host "2. Calling /api/contacts/decrypt..." -ForegroundColor Yellow
$body = @{
    taskId = $taskId
    address = $address
    signature = "0x" + ("0" * 130)  # 假签名，实际需要真实签名
    message = $message
} | ConvertTo-Json

try {
    $decryptResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/contacts/decrypt" -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ Decrypt successful!" -ForegroundColor Green
    Write-Host "Contacts:" $decryptResponse.contacts
    Write-Host "Length:" $decryptResponse.contacts.Length
    Write-Host ""
    
    # 检查是否是明文
    if ($decryptResponse.contacts -match "^[0-9a-f]{64,}$") {
        Write-Host "❌ FAIL: Contacts still looks like encrypted data (hex)" -ForegroundColor Red
    } else {
        Write-Host "✅ PASS: Contacts looks like plaintext" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error:" $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details:" $_.ErrorDetails.Message -ForegroundColor Red
    }
}
