# File Protection System

## 🚨 **Problem Statement**

This project experiences file reversion issues where critical files get reverted to older versions during development, particularly:
- `src/utils/hybridDatasetDetector.js` - Missing `getLastSuccessfulMethod()` method
- `vite.config.ts` - Cache disabling and PHP proxy configuration gets reverted

## 🛡️ **Protection Architecture**

### **Safe Mode System**
The file protection system is built around "safe mode" development that prevents file corruption through:
- **Cache Disabling**: Prevents Vite internal caching that can cause reversions
- **Polling-Based File Watching**: Reliable change detection every 100ms
- **Backup File System**: Automatic restoration from known-good copies
- **Integrity Checking**: Verification of critical file contents

### **Core Components**
- **Safe Development Script**: `start-dev-safe.ps1`
- **Integrity Checker**: `check-file-integrity.ps1`
- **Backup Files**: `.backup` versions of critical files
- **NPM Scripts**: Convenient access to protection features

## 🔧 **Implementation Details**

### **Critical Files Monitored**

#### **hybridDatasetDetector.js Requirements**
```javascript
// Must have these components:
class HybridDatasetDetector {
  constructor() {
    this.lastSuccessfulMethod = null;  // ← CRITICAL
  }
  
  async detectDatasets() {
    // Detection loop must set:
    this.lastSuccessfulMethod = method;  // ← CRITICAL
  }
  
  // Must have this method:
  getLastSuccessfulMethod() {  // ← CRITICAL
    return this.lastSuccessfulMethod;
  }
}
```

#### **vite.config.ts Requirements**
```typescript
// Must have these configurations:
export default defineConfig({
  cacheDir: false,  // ← CRITICAL: Prevents reversions
  server: {
    hmr: { overlay: false },  // ← CRITICAL: Prevents cache UI corruption
    watch: { usePolling: true },  // ← CRITICAL: Reliable change detection
    proxy: {
      '/datasets.php': { /* proxy config */ },  // ← CRITICAL: PHP routing
      '/append-log.php': { /* proxy config */ },
      '/cleanup-sessions.php': { /* proxy config */ }
    }
  }
});
```

### **Backup System**
- **Location**: Same directory as original files
- **Naming**: `{filename}.backup.{extension}`
- **Purpose**: Known-good versions for automatic restoration
- **Maintenance**: Updated when working versions are confirmed

### **Integrity Checking Process**
1. **File Existence**: Verify critical files exist
2. **Content Validation**: Check for required methods/configurations
3. **Backup Verification**: Ensure backup files are available
4. **Automatic Restoration**: Replace corrupted files from backups
5. **Status Reporting**: Clear feedback on file health

## 🚀 **Usage Instructions**

### **Development Startup (REQUIRED)**
```bash
# ALWAYS use safe mode for development
powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1

# Alternative (may have issues on some systems)
npm run dev:safe

# Check integrity before starting work
npm run check:integrity
```

### **File Corruption Recovery**
```bash
# Automatic restoration
npm run check:integrity

# Manual restoration (if needed)
Copy-Item vite.config.backup.ts vite.config.ts -Force
Copy-Item src/utils/hybridDatasetDetector.backup.js src/utils/hybridDatasetDetector.js -Force
```

### **Backup Maintenance**
```bash
# Update backups after confirming changes work
Copy-Item vite.config.ts vite.config.backup.ts -Force
Copy-Item src/utils/hybridDatasetDetector.js src/utils/hybridDatasetDetector.backup.js -Force

# Commit immediately to prevent loss
git add . && git commit -m "Update: working configuration" && git push origin v4.x
```

## 📋 **NPM Scripts**

| Command | Purpose |
|---------|---------|
| `npm run dev:safe` | Start development with full protection |
| `npm run check:integrity` | Verify and restore critical files |
| `npm run dev:php` | Start with PHP support (basic protection) |
| `npm run test:cache` | Verify cache prevention configuration |
| `npm run cleanup:servers` | Stop all development servers |

## ⚠️ **Warning Signs**

### **Application Errors**
- `hybridDetector.getLastSuccessfulMethod is not a function`
- Dataset detection failures
- PHP proxy serving static files instead of executing
- Slow or inconsistent file updates

### **Configuration Issues**
- Development server cache accumulation
- HMR overlay corruption
- File watching failures
- Proxy routing problems

### **File System Issues**
- Missing backup files
- Integrity check failures
- Unexpected file modifications
- Git status showing reverted changes

## 🧪 **Testing & Verification**

### **Cache Prevention Tests**
```bash
# Run comprehensive cache testing
npm run test:cache

# Expected results: 11/12 or 12/12 tests passing
# Tests verify:
# - Vite cache disabled
# - HMR overlay disabled  
# - File watching uses polling
# - Backup files exist
# - Integrity checker works
# - Core methods present
# - Proxy configuration active
```

### **Runtime Verification**
```bash
# Test live behavior while server running
npm run test:runtime

# Verifies:
# - All servers running correctly
# - File change detection working
# - Cache accumulation minimal
# - Proxy routing functional
```

### **Manual Verification**
1. **Check File Contents**: Verify critical methods exist
2. **Test Dataset Detection**: Ensure detection works properly
3. **Monitor Cache Directory**: Should remain minimal
4. **Verify Proxy**: PHP files should execute, not serve as static

## 🔄 **Recommended Workflow**

### **Daily Development**
1. `npm run check:integrity` - Verify file health
2. `powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1` - Start safely
3. Make changes and test
4. `npm run check:integrity` - Verify integrity maintained
5. `git add . && git commit && git push` - Save work immediately

### **After Major Changes**
1. Test functionality thoroughly
2. Update backup files if changes work
3. Run full test suite
4. Commit and push immediately

### **Troubleshooting Issues**
1. Stop development server
2. Run `npm run check:integrity`
3. Check test results with `npm run test:cache`
4. Restart with safe mode
5. If problems persist, restore from git

## 💡 **Best Practices**

### **Prevention**
- **Always use safe mode** - Never use basic `npm run dev`
- **Check integrity regularly** - Before major work sessions
- **Commit frequently** - Prevent work loss
- **Monitor warning signs** - Address issues immediately

### **Recovery**
- **Don't panic** - Backup system provides safety net
- **Use integrity checker** - Automated restoration available
- **Verify after restoration** - Ensure fixes worked
- **Update backups** - Keep known-good versions current

### **Maintenance**
- **Test cache system** - Regular verification prevents issues
- **Update documentation** - Keep procedures current
- **Monitor file changes** - Watch for unexpected modifications
- **Backup working versions** - Maintain safety net

---

> **🔒 Critical**: This protection system is essential for stable development. File reversion issues can cause significant work loss - always use safe mode and check integrity regularly.
