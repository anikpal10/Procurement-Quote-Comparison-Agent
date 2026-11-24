Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   PROCURAI - DIAGNOSTIC & SERVER LAUNCHER" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
Set-Location $root

# Check port 8001
$p8001 = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue
if ($p8001) {
    Write-Host "[✓] Port 8001 is already active (PID $($p8001.OwningProcess))" -ForegroundColor Green
} else {
    Write-Host "[+] Starting FastAPI Backend on Port 8001..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; `$env:PYTHONPATH='services/api'; python -m uvicorn app.main:app --app-dir services/api --host 0.0.0.0 --port 8001"
}

# Check port 3000
$p3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($p3000) {
    Write-Host "[✓] Port 3000 is already active (PID $($p3000.OwningProcess))" -ForegroundColor Green
} else {
    Write-Host "[+] Starting Next.js Frontend on Port 3000..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root/apps/web'; npm run dev"
}

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Verifying endpoints:" -ForegroundColor Cyan
try {
    $res8001 = Invoke-RestMethod -Uri "http://localhost:8001/v1/health" -TimeoutSec 3
    Write-Host " - Backend (8001):   ONLINE (Status: $($res8001.status))" -ForegroundColor Green
} catch {
    Write-Host " - Backend (8001):   STARTING UP..." -ForegroundColor Yellow
}

try {
    $res3000 = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
    Write-Host " - Frontend (3000):  ONLINE (HTTP $($res3000.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " - Frontend (3000):  STARTING UP..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Web Application: http://localhost:3000" -ForegroundColor White
Write-Host "API Swagger:     http://localhost:8001/docs" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
