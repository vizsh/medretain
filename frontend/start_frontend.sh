#!/bin/bash
# MedRetain CRM Frontend - Quick Start Script for Unix/Linux/Mac

echo "===================================="
echo "MedRetain CRM Frontend - Quick Start"
echo "===================================="
echo

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "ERROR: Please run this script from the frontend directory"
    exit 1
fi

echo "Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo
echo "Step 2: Starting development server..."
echo
echo "Frontend will be available at: http://localhost:3000"
echo "Make sure the backend is running at: http://localhost:8000"
echo

npm run dev
