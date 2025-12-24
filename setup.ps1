# Unicorn PC Builder - Setup Script
# Run this script to set up and start the application

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🦄 Unicorn PC Builder - Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
$targetDir = "c:\Users\Isuru Chathuranga\Desktop\Project\Unicorn PC Builder"
if ((Get-Location).Path -ne $targetDir) {
    Write-Host "Changing to project directory..." -ForegroundColor Yellow
    Set-Location $targetDir
}

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ $pythonVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host ""
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"
Write-Host "✅ Virtual environment activated" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Check required data files
Write-Host ""
Write-Host "Checking data files..." -ForegroundColor Yellow

$requiredFiles = @(
    "data\final_ruleset_data.csv",
    "data\hardware_lookup.csv",
    "models\fps_model.pkl",
    "models\gaming_model.pkl",
    "models\render_model.pkl"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "⚠️ Some data files are missing. Please copy them from the original folders." -ForegroundColor Yellow
    Write-Host "See README.md for instructions." -ForegroundColor Yellow
    Write-Host ""
}

# Check Firebase key
if (Test-Path "serviceAccountKey.json") {
    Write-Host "  ✅ Firebase key found (Manual Build will use real data)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Firebase key not found (Manual Build will use mock data)" -ForegroundColor Yellow
}

# Start the application
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Unicorn PC Builder" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Homepage:              http://127.0.0.1:5000" -ForegroundColor Cyan
Write-Host "Intelligent Build:     http://127.0.0.1:5000/intelligent-build" -ForegroundColor Cyan
Write-Host "Manual Build:          http://127.0.0.1:5000/manual-build" -ForegroundColor Cyan
Write-Host "Performance Predict:   http://127.0.0.1:5000/performance-predict" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python app.py
