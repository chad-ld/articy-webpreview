# Quick PHP Installation for Windows

## Method 1: Portable PHP (5 minutes)

1. **Download PHP:**
   - Go to: https://windows.php.net/download/
   - Download "VS16 x64 Thread Safe" (latest 8.x version)
   - Example: `php-8.3.x-Win32-vs16-x64.zip`

2. **Extract and Setup:**
   ```cmd
   # Create directory
   mkdir C:\php
   
   # Extract downloaded zip to C:\php
   # You should have: C:\php\php.exe
   ```

3. **Add to PATH:**
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Click "Environment Variables"
   - Under "System Variables", find "Path", click "Edit"
   - Click "New", add: `C:\php`
   - Click "OK" on all dialogs

4. **Test Installation:**
   ```cmd
   # Open new Command Prompt
   php --version
   ```

## Method 2: XAMPP (10 minutes, includes GUI)

1. **Download XAMPP:**
   - Go to: https://www.apachefriends.org/
   - Download for Windows

2. **Install:**
   - Run installer
   - Select "Apache" and "PHP" (MySQL optional)
   - Install to default location

3. **Add PHP to PATH:**
   - Add `C:\xampp\php` to your PATH (same steps as above)

4. **Test:**
   ```cmd
   php --version
   ```

## After PHP Installation

Run the development server with PHP support:

```cmd
# PowerShell (recommended)
.\start-dev-with-php.ps1

# Or Command Prompt
.\start-dev-with-php.bat
```

This will:
- Start PHP server on localhost:8080
- Start Vite dev server on localhost:3000
- Proxy PHP requests from Vite to PHP server
- Allow testing of the full hybrid detection system

## Testing the PHP API

Once PHP is installed, you can test:

1. **Direct PHP API:** http://localhost:8080/datasets.php
2. **Proxied through Vite:** http://localhost:3000/datasets.php
3. **Full App with PHP:** http://localhost:3000/
4. **Test Page:** http://localhost:3000/test-hybrid-detection.html
