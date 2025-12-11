# 检查 Task8 数据
Write-Host "=== Checking Task8 Data ===" -ForegroundColor Cyan

# 1. 检查后端健康状态
Write-Host "`n1. Backend Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/healthz" -Method Get -ErrorAction Stop
    Write-Host "✓ Backend is running" -ForegroundColor Green
    Write-Host ($health | ConvertTo-Json)
} catch {
    Write-Host "✗ Backend is not responding" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# 2. 获取 Task8 数据
Write-Host "`n2. Fetching Task8..." -ForegroundColor Yellow
try {
    $task8 = Invoke-RestMethod -Uri "http://localhost:3001/api/task/8" -Method Get -ErrorAction Stop
    Write-Host "✓ Task8 found" -ForegroundColor Green
    Write-Host ($task8 | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "✗ Failed to fetch Task8" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# 3. 获取所有任务（检查 Task8 是否在列表中）
Write-Host "`n3. Checking all tasks..." -ForegroundColor Yellow
try {
    # 尝试获取 Task1-10
    for ($i = 1; $i -le 10; $i++) {
        try {
            $task = Invoke-RestMethod -Uri "http://localhost:3001/api/task/$i" -Method Get -ErrorAction Stop
            Write-Host "✓ Task$i exists: $($task.title)" -ForegroundColor Green
        } catch {
            Write-Host "  Task$i not found" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "✗ Error checking tasks" -ForegroundColor Red
}

Write-Host "`n=== Check Complete ===" -ForegroundColor Cyan
