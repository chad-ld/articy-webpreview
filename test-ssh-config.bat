@echo off
echo ========================================
echo SSH Connection Test using SSH Config
echo ========================================
echo.
echo Using SSH config alias: articy-server
echo This connects to: iad1-shared-e1-23.dreamhost.com
echo Username: chabri23_dev
echo.
echo INSTRUCTIONS:
echo 1. When prompted for password, paste your DreamHost password
echo 2. You won't see the password characters (this is normal)
echo 3. Press Enter after pasting
echo 4. If successful, you'll see a shell prompt
echo 5. Type 'exit' to disconnect
echo.
echo Starting SSH connection...
echo.

ssh articy-server

echo.
echo ========================================
echo SSH connection ended
echo Press any key to close...
pause > nul
