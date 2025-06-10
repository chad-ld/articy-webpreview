@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Articy Web Viewer - SFTP Deploy (WinSCP)
echo ========================================
echo.

REM ===== CONFIGURATION =====
REM Edit these variables with your SFTP server details
set SFTP_HOST=your-sftp-server.com
set SFTP_USER=your-username
set SFTP_PASS=your-password
set SFTP_PORT=22
set SFTP_REMOTE_DIR=/public_html/articy-viewer
set WEB_URL_PATH=/articy-viewer
set LOCAL_DIR=builds\html_viewer_template_v1

REM ===== CHECK FOR CONFIG FILE =====
if exist "sftp-config.txt" (
    echo Loading SFTP configuration from sftp-config.txt...
    for /f "tokens=1,2 delims==" %%a in (sftp-config.txt) do (
        if "%%a"=="SFTP_HOST" set SFTP_HOST=%%b
        if "%%a"=="SFTP_USER" set SFTP_USER=%%b
        if "%%a"=="SFTP_PASS" set SFTP_PASS=%%b
        if "%%a"=="SFTP_PORT" set SFTP_PORT=%%b
        if "%%a"=="SFTP_REMOTE_DIR" set SFTP_REMOTE_DIR=%%b
        if "%%a"=="WEB_URL_PATH" set WEB_URL_PATH=%%b
    )
    echo Configuration loaded.
    echo.
) else (
    echo Creating sample sftp-config.txt file...
    (
        echo SFTP_HOST=your-sftp-server.com
        echo SFTP_USER=your-username
        echo SFTP_PASS=your-password
        echo SFTP_PORT=22
        echo SFTP_REMOTE_DIR=/public_html/articy-viewer
        echo WEB_URL_PATH=/articy-viewer
    ) > sftp-config.txt
    echo.
    echo Please edit sftp-config.txt with your SFTP details and run this script again.
    echo.
    pause
    exit /b 1
)

REM ===== CHECK FOR WINSCP =====
where winscp.com >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: WinSCP command line tool not found!
    echo.
    echo Please install WinSCP and add it to your PATH, or:
    echo 1. Download WinSCP from https://winscp.net/
    echo 2. Install it
    echo 3. Add the installation directory to your PATH environment variable
    echo    ^(usually C:\Program Files ^(x86^)\WinSCP\^)
    echo.
    pause
    exit /b 1
)

REM ===== VALIDATION =====
if not exist "%LOCAL_DIR%" (
    echo ERROR: Local directory "%LOCAL_DIR%" not found!
    echo Please run "npm run build" first to create the build files.
    pause
    exit /b 1
)

if "%SFTP_HOST%"=="your-sftp-server.com" (
    echo ERROR: Please configure your SFTP settings in sftp-config.txt
    pause
    exit /b 1
)

echo Local directory: %LOCAL_DIR%
echo SFTP Server: %SFTP_HOST%:%SFTP_PORT%
echo Remote directory: %SFTP_REMOTE_DIR%
echo.

REM ===== BUILD FIRST =====
set /p BUILD="Build project first? (Y/n): "
if /i not "%BUILD%"=="n" (
    echo Building project...
    call npm run build
    if !ERRORLEVEL! neq 0 (
        echo Build failed! Aborting deployment.
        pause
        exit /b 1
    )
    echo Build completed successfully.
    echo.
)

REM ===== CONFIRMATION =====
set /p CONFIRM="Deploy to SFTP server? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo Starting SFTP deployment...
echo.

REM ===== CREATE WINSCP SCRIPT =====
echo Creating WinSCP script...
(
    echo option batch abort
    echo option confirm off
    echo open sftp://%SFTP_USER%:%SFTP_PASS%@%SFTP_HOST%:%SFTP_PORT%
    echo cd %SFTP_REMOTE_DIR%
    echo lcd %LOCAL_DIR%
    echo put index.html
    echo put demo.json
    echo mkdir assets
    echo put assets\*.* assets/
    echo exit
) > winscp_script.txt

REM ===== EXECUTE WINSCP =====
echo Uploading files via SFTP...
winscp.com /script=winscp_script.txt

REM ===== CLEANUP =====
del winscp_script.txt

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo  DEPLOYMENT SUCCESSFUL!
    echo ========================================
    echo Your Articy Web Viewer is now live at:
    echo https://%SFTP_HOST%%WEB_URL_PATH%/
    echo.
    echo Files deployed:
    echo - index.html
    echo - demo.json  
    echo - assets/ directory with CSS and JS files
    echo.
) else (
    echo.
    echo ========================================
    echo  DEPLOYMENT FAILED!
    echo ========================================
    echo Please check your SFTP credentials and try again.
    echo.
)

pause
