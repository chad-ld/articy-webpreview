@echo off
echo ========================================
echo Deploying Articy Web Viewer v4.x to SFTP
echo ========================================

REM Build the project first
echo Building project...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo Build failed! Deployment aborted.
    pause
    exit /b 1
)

echo Build completed successfully.

REM WinSCP deployment script for v4.x
echo Deploying to server...

REM Create WinSCP script file
echo open sftp://your-username@your-server.com > winscp_script_v4.txt
echo cd /home/chabri23_dev/dev.chadbriggs.com/articy/v4/ >> winscp_script_v4.txt
echo put -delete dist\* >> winscp_script_v4.txt
echo exit >> winscp_script_v4.txt

REM Execute WinSCP with the script
"C:\Program Files (x86)\WinSCP\WinSCP.com" /script=winscp_script_v4.txt

REM Clean up script file
del winscp_script_v4.txt

echo ========================================
echo Deployment completed!
echo Web URL: https://dev.chadbriggs.com/articy/v4/
echo ========================================
pause
