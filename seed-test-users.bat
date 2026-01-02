@echo off
REM Seed test users for testing centralized login system
REM Windows batch script

echo.
echo ====================================
echo Seeding Test Users
echo ====================================
echo.

REM Check if node is installed
where node >nul 2>nul
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    exit /b 1
)

REM Check if seed script exists
if not exist "seed-test-users.js" (
    echo Error: seed-test-users.js not found
    exit /b 1
)

REM Run the seed script
echo Starting seed process...
echo.

node seed-test-users.js

if errorlevel 1 (
    echo.
    echo Error: Seeding failed
    exit /b 1
)

echo.
echo ✅ Seeding completed successfully!
echo.
pause
