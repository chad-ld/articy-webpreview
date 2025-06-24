# File Protection System for Dual Deployment

## 🚨 **Problem: File Reversion Issue**

This project experiences a file reversion issue where critical files get reverted to older versions during development, particularly:
- `src/utils/hybridDatasetDetector.js` - Missing `getLastSuccessfulMethod()` method
- `vite.config.ts` - Cache disabling and PHP proxy configuration gets reverted

## 🛡️ **Protection System**

### **Backup Files**
- `vite.config.backup.ts` - Working Vite configuration with cache disabled
- `src/utils/hybridDatasetDetector.backup.js` - Working detector with all methods

### **Integrity Checking**
- `check-file-integrity.ps1` - Checks and restores files if reverted
- `start-dev-safe.ps1` - Safe startup with integrity checking

### **NPM Scripts**
```bash
npm run check:integrity  # Check file integrity
npm run dev:safe         # Start with integrity checking
npm run dev:php          # Start with PHP support
```

## 🔧 **Usage Instructions**

### **Before Starting Development**
```bash
# Always check integrity first
npm run check:integrity

# Start development safely
npm run dev:safe
```

### **If Files Get Reverted**
```bash
# Restore from backups
npm run check:integrity

# Or manually restore
Copy-Item vite.config.backup.ts vite.config.ts -Force
Copy-Item src/utils/hybridDatasetDetector.backup.js src/utils/hybridDatasetDetector.js -Force
```

### **After Making Changes**
```bash
# Update backups with working versions
Copy-Item vite.config.ts vite.config.backup.ts -Force
Copy-Item src/utils/hybridDatasetDetector.js src/utils/hybridDatasetDetector.backup.js -Force

# Commit immediately
git add .
git commit -m "Update: [description]"
git push origin v4.x
```

## 🔍 **Critical Files to Monitor**

### **hybridDatasetDetector.js Must Have:**
- `this.lastSuccessfulMethod = null` in constructor
- `this.lastSuccessfulMethod = method` in detection loop
- `getLastSuccessfulMethod()` method

### **vite.config.ts Must Have:**
- `cacheDir: false` to prevent reversions
- `/datasets.php` proxy configuration
- `hmr: { overlay: false }`
- `watch: { usePolling: true }`

## ⚠️ **Warning Signs**
- App shows "hybridDetector.getLastSuccessfulMethod is not a function"
- PHP proxy not working (serving static PHP files)
- Files reverting after git operations
- Development server cache issues

## 🚀 **Recommended Workflow**
1. `npm run check:integrity` - Check files
2. `npm run dev:safe` - Start development
3. Make changes
4. `npm run check:integrity` - Verify integrity
5. `git add . && git commit && git push` - Save immediately
