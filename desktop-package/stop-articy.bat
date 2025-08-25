@echo off
echo Stopping Articy Web Viewer...

REM Kill PHP processes
taskkill /F /IM php.exe 2>nul

REM Kill processes using ports 8080-8085
for /L %%i in (8080,1,8085) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":%%i" ^| find "LISTENING"') do (
        taskkill /F /PID %%a 2>nul
    )
)

echo SUCCESS: Servers stopped successfully.
echo NOTE: Your datasets and logs are preserved in their folders.
pause