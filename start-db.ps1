# Script to start local MySQL Server on port 3307
Write-Host "Starting MySQL Community Server on port 3307..." -ForegroundColor Cyan

$dataDir = "$PSScriptRoot\database\mysql-data"
$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"

if (-not (Test-Path $mysqlExe)) {
    Write-Host "Error: mysqld.exe not found at $mysqlExe" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $dataDir)) {
    Write-Host "Initializing MySQL datadir at $dataDir..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    & $mysqlExe --initialize-insecure --datadir="$dataDir" --console
}

Write-Host "Running MySQL Server..." -ForegroundColor Green
& $mysqlExe --datadir="$dataDir" --port=3307 --bind-address=127.0.0.1 --console
