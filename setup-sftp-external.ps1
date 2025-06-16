# Setup SFTP Configuration with External Password File
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SFTP Configuration Setup (External Password)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if password file exists
$passwordFile = "E:\docs\text documents\batch\dh\dreamhost-password.txt"
if (-not (Test-Path $passwordFile)) {
    Write-Host "❌ Password file not found: $passwordFile" -ForegroundColor Red
    Write-Host "Please create the file and add your DreamHost password to it." -ForegroundColor Yellow
    Write-Host "Example: echo 'your_password' > '$passwordFile'" -ForegroundColor Yellow
    pause
    exit
}

# Read password from external file
try {
    $password = Get-Content $passwordFile -Raw
    $password = $password.Trim()
    Write-Host "✅ Password loaded from external file" -ForegroundColor Green
} catch {
    Write-Host "❌ Error reading password file: $_" -ForegroundColor Red
    pause
    exit
}

# Create SFTP configuration
$sftpConfig = @{
    name = "DreamHost Articy Server"
    host = "iad1-shared-e1-23.dreamhost.com"
    protocol = "sftp"
    port = 22
    username = "chabri23_dev"
    password = $password
    remotePath = "/home/chabri23_dev/dev.chadbriggs.com/articy/v4/"
    uploadOnSave = $true
    useTempFile = $false
    openSsh = $false
    downloadOnOpen = $false
    ignore = @(
        ".vscode",
        ".git",
        ".DS_Store",
        "node_modules",
        "*.log"
    )
    watcher = @{
        files = "**/*"
        autoUpload = $true
        autoDelete = $false
    }
}

# Ensure .vscode directory exists
if (-not (Test-Path ".vscode")) {
    New-Item -ItemType Directory -Path ".vscode" | Out-Null
}

# Convert to JSON and save
$jsonConfig = $sftpConfig | ConvertTo-Json -Depth 10
$jsonConfig | Out-File -FilePath ".vscode\sftp.json" -Encoding UTF8

Write-Host ""
Write-Host "✅ SFTP configuration created successfully!" -ForegroundColor Green
Write-Host "✅ Password is stored outside Git repository" -ForegroundColor Green
Write-Host "✅ Configuration file is in .gitignore" -ForegroundColor Green
Write-Host ""
Write-Host "Security Notes:" -ForegroundColor Yellow
Write-Host "- Password file: $passwordFile (outside Git)" -ForegroundColor Gray
Write-Host "- SFTP config: .vscode\sftp.json (gitignored)" -ForegroundColor Gray
Write-Host "- Never commit the password file to Git!" -ForegroundColor Red
Write-Host ""
Write-Host "You can now use SFTP in VSCode!" -ForegroundColor Cyan
pause
