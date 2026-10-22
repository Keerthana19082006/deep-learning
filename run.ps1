# EarthGuardian AI Unified Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      EarthGuardian AI - Multi-Hazard Risk System      " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptDir) {
    $ScriptDir = Get-Location
}
Set-Location $ScriptDir

$PythonPath = if (Test-Path "$ScriptDir\.venv\Scripts\python.exe") {
    "$ScriptDir\.venv\Scripts\python.exe"
} elseif (Test-Path "$ScriptDir\backend\venv\Scripts\python.exe") {
    "$ScriptDir\backend\venv\Scripts\python.exe"
} else {
    "python"
}

# Verify Python
try {
    $pyVer = & $PythonPath --version 2>&1
    Write-Host "`n[1/3] Verified Python: $PythonPath ($pyVer)" -ForegroundColor Yellow
} catch {
    Write-Host "`n[ERROR] Unable to run Python with: $PythonPath" -ForegroundColor Red
    pause
    exit 1
}

# Verify npm
$npmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Host "[ERROR] npm is not found in PATH. Please install Node.js (v18+) to run EarthGuardian Frontend." -ForegroundColor Red
    pause
    exit 1
}

# Start Backend
Write-Host "[2/3] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$ScriptDir`" && `"$PythonPath`" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $ScriptDir

# Wait for backend health
Write-Host "Verifying backend health..." -ForegroundColor Gray
$backendReady = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -TimeoutSec 1 -ErrorAction Stop
        if ($res.status -eq "healthy") {
            $backendReady = $true
            break
        }
    } catch {
        # Waiting for backend to bind port
    }
}

if ($backendReady) {
    Write-Host "Backend is online and healthy!" -ForegroundColor Green
} else {
    Write-Host "Backend is still initializing. Continuing launch..." -ForegroundColor DarkYellow
}

# Start Frontend
Write-Host "[3/3] Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$ScriptDir\frontend`" && npm run dev" -WorkingDirectory "$ScriptDir\frontend"

Start-Sleep -Seconds 2
Write-Host "`nLaunching browser at http://localhost:5173..." -ForegroundColor Green
Start-Process "http://localhost:5173"
