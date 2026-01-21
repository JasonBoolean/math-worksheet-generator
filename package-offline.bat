@echo off
REM Offline Package Creation Script for Windows
REM Creates a distributable offline package of the Math Worksheet Generator

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Math Worksheet Generator
echo   Offline Package Creator
echo ========================================
echo.

REM Configuration
set PACKAGE_NAME=math-worksheet-generator-offline
set BUILD_DIR=dist
set PACKAGE_DIR=offline-package
set OUTPUT_FILE=%PACKAGE_NAME%.zip

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Step 1: Build the project
echo [1/6] Building project...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [OK] Build completed
echo.

REM Step 2: Create package directory
echo [2/6] Creating package directory...
if exist "%PACKAGE_DIR%" rmdir /s /q "%PACKAGE_DIR%"
mkdir "%PACKAGE_DIR%"
echo [OK] Package directory created
echo.

REM Step 3: Copy build files
echo [3/6] Copying build files...
xcopy /E /I /Q "%BUILD_DIR%\*" "%PACKAGE_DIR%\"
echo [OK] Build files copied
echo.

REM Step 4: Add documentation
echo [4/6] Adding documentation...
copy /Y OFFLINE_PACKAGE_README.md "%PACKAGE_DIR%\README.md" >nul
copy /Y USER_GUIDE.md "%PACKAGE_DIR%\" >nul
if exist LICENSE (
    copy /Y LICENSE "%PACKAGE_DIR%\" >nul
) else (
    echo MIT License > "%PACKAGE_DIR%\LICENSE"
)
echo [OK] Documentation added
echo.

REM Step 5: Create version info
echo [5/6] Creating version info...
(
echo Math Worksheet Generator - Offline Package
echo Version: 1.0.0
echo Build Date: %date% %time%
echo Package Type: Offline Deployment
echo.
echo System Requirements:
echo - Modern web browser ^(Chrome 80+, Firefox 78+, Safari 13+, Edge 80+^)
echo - HTTP server ^(Python, Node.js, PHP, or any web server^)
echo - 100 MB disk space
echo.
echo Quick Start:
echo 1. Extract this package
echo 2. Run: python -m http.server 8080
echo 3. Open: http://localhost:8080
echo.
echo For detailed instructions, see README.md
) > "%PACKAGE_DIR%\VERSION.txt"
echo [OK] Version info created
echo.

REM Step 6: Create ZIP package
echo [6/6] Creating ZIP package...

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    powershell -command "Compress-Archive -Path '%PACKAGE_DIR%\*' -DestinationPath '%OUTPUT_FILE%' -Force"
    if %ERRORLEVEL% EQU 0 (
        echo [OK] ZIP package created
    ) else (
        echo [ERROR] Failed to create ZIP package
        pause
        exit /b 1
    )
) else (
    echo [WARNING] PowerShell not found. Please manually zip the '%PACKAGE_DIR%' folder.
    echo Rename it to '%OUTPUT_FILE%'
)
echo.

REM Summary
echo ========================================
echo   Package Created Successfully!
echo ========================================
echo.
echo Package Information:
echo   Name: %OUTPUT_FILE%
echo   Location: %CD%\%OUTPUT_FILE%
echo.
echo Distribution:
echo   1. Share the ZIP file with users
echo   2. Users extract and run a local server
echo   3. Access via browser at localhost
echo.
echo Documentation:
echo   - README.md: Quick start guide
echo   - USER_GUIDE.md: Complete user manual
echo   - VERSION.txt: Version information
echo.

REM Cleanup option
set /p CLEANUP="Clean up temporary files? [y/N]: "
if /i "%CLEANUP%"=="y" (
    echo Cleaning up...
    rmdir /s /q "%PACKAGE_DIR%"
    echo [OK] Cleanup completed
)

echo.
echo Done!
echo.
pause
