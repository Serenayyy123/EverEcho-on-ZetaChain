# Staging API 验证脚本
# 用途：验证 staging 环境的 Task 和 Profile API 是否正常返回 fallback 数据

$STAGING_BACKEND_URL = "https://everecho-staging-backend.onrender.com"

Write-Host "🔍 Verifying Staging API..." -ForegroundColor Cyan
Write-Host "Backend URL: $STAGING_BACKEND_URL`n" -ForegroundColor Gray

# 验证 Task API
Write-Host "📋 Testing Task API..." -ForegroundColor Yellow
Write-Host "=" * 60

for ($i = 1; $i -le 5; $i++) {
    Write-Host "`n[Task $i]" -ForegroundColor Cyan
    $url = "$STAGING_BACKEND_URL/api/task/84532/$i"
    Write-Host "URL: $url" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
        
        Write-Host "✅ Status: 200 OK" -ForegroundColor Green
        Write-Host "Title: $($response.title)" -ForegroundColor White
        Write-Host "Description: $($response.description.Substring(0, [Math]::Min(50, $response.description.Length)))..." -ForegroundColor White
        
        # 检查是否是 fallback
        if ($response.title -like "*synced from chain*") {
            Write-Host "🔄 Is Fallback: YES" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Is Real Metadata: YES" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        }
    }
}

# 验证 Profile API
Write-Host "`n`n📋 Testing Profile API..." -ForegroundColor Yellow
Write-Host "=" * 60

$profiles = @(
    "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
    "0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db",
    "0xD68a76259d4100A2622D643d5e62F5F92C28C4fe",
    "0x2bF490F5a7Be8e8AC83020d77d240c4E39165C30",
    "0x18D5eeDd85Caf7E96eEcB5c0a50514f810f98541"
)

$index = 1
foreach ($address in $profiles) {
    Write-Host "`n[Profile $index]" -ForegroundColor Cyan
    $url = "$STAGING_BACKEND_URL/api/profile/$address"
    Write-Host "URL: $url" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
        
        Write-Host "✅ Status: 200 OK" -ForegroundColor Green
        Write-Host "Nickname: $($response.nickname)" -ForegroundColor White
        Write-Host "City: $($response.city)" -ForegroundColor White
        Write-Host "Skills: $($response.skills -join ', ')" -ForegroundColor White
        
        # 检查是否是 fallback
        if ($response.nickname -like "*synced from chain*") {
            Write-Host "🔄 Is Fallback: YES" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Is Real Data: YES" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        }
    }
    
    $index++
}

# 验证所有任务列表
Write-Host "`n`n📋 Testing Task List API..." -ForegroundColor Yellow
Write-Host "=" * 60

$url = "$STAGING_BACKEND_URL/api/task/84532"
Write-Host "`nURL: $url" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
    
    Write-Host "✅ Status: 200 OK" -ForegroundColor Green
    Write-Host "Total Tasks: $($response.Count)" -ForegroundColor White
    
    if ($response.Count -gt 0) {
        Write-Host "`nFirst 3 tasks:" -ForegroundColor Gray
        $response | Select-Object -First 3 | ForEach-Object {
            Write-Host "  - Task $($_.taskId): $($_.title)" -ForegroundColor White
        }
    }
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`n`n" + ("=" * 60)
Write-Host "✅ Verification Complete!" -ForegroundColor Green
Write-Host "=" * 60
