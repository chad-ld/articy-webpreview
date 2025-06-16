# SFTP Setup Guide for VSCode (Alternative to Remote-SSH)

## Why SFTP Instead of Remote-SSH?
Your DreamHost shared hosting server doesn't meet the prerequisites for VSCode Server:
- Missing required libraries (libstdc++.so)
- Resource limitations on shared hosting
- Fork/thread restrictions

## Solution: Use SFTP Extension

### Step 1: Install SFTP Extension
1. Open VSCode
2. Press `Ctrl+Shift+X` (Extensions)
3. Search for "SFTP" by Natizyskunk
4. Install the extension

### Step 2: Configure SFTP
1. Open your local project folder in VSCode
2. Press `Ctrl+Shift+P`
3. Type "SFTP: Config" and select it
4. This creates a `.vscode/sftp.json` file

### Step 3: SFTP Configuration
Use this configuration in `.vscode/sftp.json`:

```json
{
    "name": "DreamHost Articy Server",
    "host": "iad1-shared-e1-23.dreamhost.com",
    "protocol": "sftp",
    "port": 22,
    "username": "chabri23_dev",
    "password": "your-password-here",
    "remotePath": "/home/chabri23_dev/dev.chadbriggs.com/articy/",
    "uploadOnSave": true,
    "useTempFile": false,
    "openSsh": false
}
```

### Step 4: Usage
- **Upload files**: Right-click file/folder → "Upload"
- **Download files**: Right-click → "Download"
- **Sync folder**: Right-click → "Sync Local → Remote"
- **Auto-upload**: Files upload automatically when you save (if uploadOnSave: true)

### Step 5: Security Note
- Don't commit the sftp.json file with your password
- Add `.vscode/sftp.json` to your .gitignore file

## Alternative: Use WinSCP + VSCode
Keep using your existing WinSCP batch file workflow:
1. Edit files locally in VSCode
2. Use your WinSCP batch file to sync to server
3. This gives you the best of both worlds

## Benefits of SFTP Approach:
- ✅ Works with shared hosting limitations
- ✅ No server prerequisites needed
- ✅ Automatic file synchronization
- ✅ Keep working locally with full VSCode features
- ✅ Simple setup and reliable operation
