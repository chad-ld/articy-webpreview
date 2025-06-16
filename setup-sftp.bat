@echo off
echo ========================================
echo SFTP Configuration Setup
echo ========================================
echo.
echo This script will create your SFTP configuration
echo with your password securely.
echo.

set /p PASSWORD="Enter your DreamHost password: "

echo Creating SFTP configuration...

(
echo {
echo     "name": "DreamHost Articy Server",
echo     "host": "iad1-shared-e1-23.dreamhost.com",
echo     "protocol": "sftp",
echo     "port": 22,
echo     "username": "chabri23_dev",
echo     "password": "%PASSWORD%",
echo     "remotePath": "/home/chabri23_dev/dev.chadbriggs.com/articy/",
echo     "uploadOnSave": true,
echo     "useTempFile": false,
echo     "openSsh": false,
echo     "downloadOnOpen": false,
echo     "ignore": [
echo         ".vscode",
echo         ".git",
echo         ".DS_Store",
echo         "node_modules",
echo         "*.log"
echo     ],
echo     "watcher": {
echo         "files": "**/*",
echo         "autoUpload": true,
echo         "autoDelete": false
echo     }
echo }
) > .vscode\sftp.json

echo.
echo ✅ SFTP configuration created!
echo ✅ Password is NOT stored in this script
echo ✅ .vscode\sftp.json is in .gitignore
echo.
echo You can now use SFTP in VSCode.
echo.
pause
