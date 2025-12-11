# 测量后端 API 响应时间
Write-Host "=== Measuring Backend API Response Time ===" -ForegroundColor Cyan

# 测试多个端点
$endpoints = @(
    @{ Name = "Health Check"; Url = "http://localhost:3001/healthz" },
    @{ Name = "Task 1"; Url = "http://localhost:3001/api/task/1" },
    @{ Name = "Task 8"; Url = "http://localhost:3001/api/task/8" }
)

foreach ($endpoint in $endpoints) {
    Write-Host "`n--- Testing: $($endpoint.Name) ---" -ForegroundColor Yellow
    
    # 测试 5 次取平均值
    $times = @()
    
    for ($i = 1; $i -le 5; $i++) {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        try {
            $response = Invoke-RestMethod -Uri $endpoint.Url -Method Get -ErrorAction Stop
            $stopwatch.Stop()
            $ms = $stopwatch.ElapsedMilliseconds
            $times += $ms
            Write-Host "  Attempt $i : ${ms}ms" -ForegroundColor Gray
        } catch {
            $stopwatch.Stop()
            Write-Host "  Attempt $i : FAILED" -ForegroundColor Red
        }
    }
    
    if ($times.Count -gt 0) {
        $avg = ($times | Measure-Object -Average).Average
        $min = ($times | Measure-Object -Minimum).Minimum
        $max = ($times | Measure-Object -Maximum).Maximum
        
        Write-Host "`nResults:" -ForegroundColor Green
        Write-Host "  Average: ${avg}ms"
        Write-Host "  Min: ${min}ms"
        Write-Host "  Max: ${max}ms"
        
        # 性能评估
        if ($avg -lt 50) {
            Write-Host "  Performance: Excellent ⚡" -ForegroundColor Green
        } elseif ($avg -lt 200) {
            Write-Host "  Performance: Good ✓" -ForegroundColor Green
        } elseif ($avg -lt 500) {
            Write-Host "  Performance: Acceptable ⚠" -ForegroundColor Yellow
        } else {
            Write-Host "  Performance: Slow ✗" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
