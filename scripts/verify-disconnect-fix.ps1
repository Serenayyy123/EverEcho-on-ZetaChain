# Verify wallet disconnect fix is correctly applied

Write-Host "Verifying wallet disconnect fix..." -ForegroundColor Cyan
Write-Host ""

# Check if all authenticated pages have the disconnect listener
$files = @(
  "frontend/src/pages/Profile.tsx",
  "frontend/src/pages/TaskSquare.tsx",
  "frontend/src/pages/PublishTask.tsx",
  "frontend/src/pages/TaskDetail.tsx",
  "frontend/src/pages/Register.tsx"
)

$missing = 0

foreach ($file in $files) {
  Write-Host "Checking $file..." -ForegroundColor Yellow
  
  $content = Get-Content $file -Raw
  
  # Check if useEffect is imported
  if ($content -notmatch "import.*useEffect") {
    Write-Host "  [X] Missing useEffect import" -ForegroundColor Red
    $missing++
  } else {
    Write-Host "  [OK] useEffect imported" -ForegroundColor Green
  }
  
  # Check if useRef is imported
  if ($content -notmatch "import.*useRef") {
    Write-Host "  [X] Missing useRef import" -ForegroundColor Red
    $missing++
  } else {
    Write-Host "  [OK] useRef imported" -ForegroundColor Green
  }
  
  # Check if prevAddressRef is created
  if ($content -notmatch "prevAddressRef\s*=\s*useRef") {
    Write-Host "  [X] Missing prevAddressRef" -ForegroundColor Red
    $missing++
  } else {
    Write-Host "  [OK] prevAddressRef created" -ForegroundColor Green
  }
  
  # Check if disconnect listener is added (v2 with useRef)
  if ($content -notmatch "prevAddressRef\.current\s*&&\s*!address") {
    Write-Host "  [X] Missing v2 disconnect listener" -ForegroundColor Red
    $missing++
  } else {
    Write-Host "  [OK] v2 disconnect listener added" -ForegroundColor Green
  }
  
  # Check if navigate('/') is called
  if ($content -notmatch "navigate\('/'\)") {
    Write-Host "  [X] Missing navigate('/') call" -ForegroundColor Red
    $missing++
  } else {
    Write-Host "  [OK] navigate('/') call added" -ForegroundColor Green
  }
  
  Write-Host ""
}

if ($missing -eq 0) {
  Write-Host "All checks passed! Wallet disconnect fix v2 is correctly applied." -ForegroundColor Green
  Write-Host ""
  Write-Host "Next steps:" -ForegroundColor Cyan
  Write-Host "1. Start dev server: npm run dev"
  Write-Host "2. Connect MetaMask wallet"
  Write-Host "3. Visit each page and test wallet disconnect"
  Write-Host "4. Verify page redirects to home"
  Write-Host "5. Test infinite loop fix: visit /tasks without wallet"
  exit 0
} else {
  Write-Host "Found $missing issues, please check the errors above." -ForegroundColor Red
  exit 1
}
