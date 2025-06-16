@echo off
echo ========================================
echo Check DreamHost Server Directories
echo ========================================
echo.
echo This will show your server directory structure
echo to help configure the correct SFTP remote path.
echo.
echo Starting SSH connection...
echo.

ssh -t chabri23_dev@iad1-shared-e1-23.dreamhost.com "
echo 'Current directory:'
pwd
echo ''
echo 'Home directory contents:'
ls -la
echo ''
echo 'Looking for web directories:'
ls -la | grep -E '(\.com|www|public|htdocs|web)'
echo ''
echo 'Checking dev.chadbriggs.com directory:'
if [ -d 'dev.chadbriggs.com' ]; then
    echo 'dev.chadbriggs.com exists!'
    cd dev.chadbriggs.com
    echo 'Contents of dev.chadbriggs.com:'
    ls -la
    echo ''
    echo 'Looking for articy directory:'
    if [ -d 'articy' ]; then
        echo 'articy directory exists!'
        cd articy
        echo 'Contents of articy directory:'
        ls -la
    else
        echo 'No articy directory found. Available directories:'
        ls -d */ 2>/dev/null || echo 'No subdirectories found'
    fi
else
    echo 'dev.chadbriggs.com directory not found'
    echo 'Available directories:'
    ls -d */ 2>/dev/null || echo 'No subdirectories found'
fi
echo ''
echo 'Full path check:'
echo 'Current working directory:' \$(pwd)
echo ''
echo 'Press Enter to exit...'
read
"

echo.
echo ========================================
echo Directory check completed
echo Press any key to close...
pause > nul
