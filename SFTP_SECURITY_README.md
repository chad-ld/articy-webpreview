# SFTP Security Setup

## Password Protection Methods

### ✅ Current Protection:
- `.vscode/sftp.json` is in `.gitignore` - won't be committed to Git
- Template files provided without real passwords

### 🔐 Setup Options:

#### Option 1: External Password File (Recommended)
1. Edit password file: `E:\docs\text documents\batch\dh\dreamhost-password.txt`
2. Add your actual DreamHost password
3. Run `setup-sftp-external.bat`
4. Password is stored completely outside Git repository

#### Option 2: Manual Setup
1. Copy `.vscode/sftp.json.template` to `.vscode/sftp.json`
2. Replace `YOUR_PASSWORD_HERE` with your actual password
3. File is protected by `.gitignore`

#### Option 3: Automated Setup (Secure)
1. Run `setup-sftp.bat`
2. Enter password when prompted
3. Script creates config file without storing password

#### Option 3: SSH Key (Most Secure)
1. Set up SSH keys on DreamHost (if supported)
2. Use `.vscode/sftp-with-key.json.template`
3. No password needed in config file

### 🚨 Security Checklist:
- [ ] `.vscode/sftp.json` is in `.gitignore`
- [ ] Never commit actual passwords to Git
- [ ] Use SSH keys when possible
- [ ] Regularly rotate passwords
- [ ] Don't share config files with passwords

### 📁 File Structure:
```
.vscode/
├── sftp.json              # Your actual config (gitignored)
├── sftp.json.template     # Template for others (safe to commit)
└── sftp-with-key.json.template  # SSH key template (safe to commit)
```

### 🔄 For Team Members:
1. Copy template file: `cp .vscode/sftp.json.template .vscode/sftp.json`
2. Add your own password
3. Never commit the actual `sftp.json` file
