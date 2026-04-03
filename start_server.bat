@echo off
REM MedRetain CRM - Quick Start Script for Windows

echo ====================================
echo MedRetain CRM - Quick Start
echo ====================================
echo.

REM Check if in correct directory
if not exist "backend\main.py" (
    echo ERROR: Please run this script from the medretain-crm root directory
    pause
    exit /b 1
)

echo Step 1: Installing dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Checking environment configuration...
cd ..
if not exist ".env" (
    echo WARNING: .env file not found. Creating template...
    echo ERROR: Please configure your Twilio credentials in .env file
    pause
    exit /b 1
)

echo.
echo Step 3: Starting the server...
echo.
echo The server will:
echo   - Initialize the database
echo   - Load patient data from CSV
echo   - Train the ML model
echo   - Start the API server
echo.
echo API will be available at: http://localhost:8000
echo Documentation: http://localhost:8000/docs
echo.

cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
