@echo off
title Stopping Articy Web Viewer
echo Stopping Articy Web Viewer...
echo.

REM Kill PHP processes
echo Stopping PHP servers...
taskkill /F /IM php.exe 2>nul
if %errorlevel%==0 (
    echo   ✓ PHP processes stopped
) else (
    echo   ℹ No PHP processes found
)

REM Kill Node.js processes (in case any are running)
echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo   ✓ Node.js processes stopped
) else (
    echo   ℹ No Node.js processes found
)

REM Kill processes using ports 8080-8085
echo Stopping processes on ports 8080-8085...
set KILLED_PROCESSES=0
for /L %%i in (8080,1,8085) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":%%i" ^| find "LISTENING"') do (
        taskkill /F /PID %%a 2>nul
        if !errorlevel!==0 set /A KILLED_PROCESSES+=1
    )
)
if %KILLED_PROCESSES% GTR 0 (
    echo   ✓ Stopped %KILLED_PROCESSES% port processes
) else (
    echo   ℹ No processes found on target ports
)

echo.
echo ✅ SUCCESS: All Articy Web Viewer processes stopped
echo ℹ  Startup windows will close automatically when servers stop
echo 📁 NOTE: Your datasets and logs are preserved in their folders
echo.
echo This window will close in 3 seconds...
timeout /t 3 /nobreak >nul
exit