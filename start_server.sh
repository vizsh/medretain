#!/bin/bash
# MedRetain CRM - Quick Start Script for Unix/Linux/Mac

echo "===================================="
echo "MedRetain CRM - Quick Start"
echo "===================================="
echo

# Check if in correct directory
if [ ! -f "backend/main.py" ]; then
    echo "ERROR: Please run this script from the medretain-crm root directory"
    exit 1
fi

echo "Step 1: Installing dependencies..."
cd backend
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo
echo "Step 2: Checking environment configuration..."
cd ..
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found."
    echo "ERROR: Please configure your Twilio credentials in .env file"
    exit 1
fi

echo
echo "Step 3: Starting the server..."
echo
echo "The server will:"
echo "  - Initialize the database"
echo "  - Load patient data from CSV"
echo "  - Train the ML model"
echo "  - Start the API server"
echo
echo "API will be available at: http://localhost:8000"
echo "Documentation: http://localhost:8000/docs"
echo

cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
