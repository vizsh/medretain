@echo off
REM MedRetain CRM Frontend - Quick Start Script for Windows

echo ====================================
echo MedRetain CRM Frontend - Quick Start
echo ====================================
echo.

REM Check if in correct directory
if not exist "package.json" (
    echo ERROR: Please run this script from the frontend directory
    pause
    exit /b 1
)

echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Starting development server...
echo.
echo Frontend will be available at: http://localhost:3000
echo Make sure the backend is running at: http://localhost:8000
echo.

call npm run dev

pause
