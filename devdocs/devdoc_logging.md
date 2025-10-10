# Simple Console Logging System

## 🎯 **Overview**

The Articy Web Viewer includes a simple console logging system that captures console output in memory and allows users to save logs on demand via a floating button. This system provides easy debugging without the complexity of real-time streaming or session management.

## 🏗️ **Architecture**

### **Core Components**
- **Simple Console Logger** (`src/utils/consoleLogger.ts`) - Frontend logging capture and batch saving
- **Save Endpoint** (`public/save-log.php`) - Server-side batch log saving
- **Floating Button** (App.tsx) - User interface for saving captured logs

### **Simple Workflow**
1. **Automatic Capture**: Console logs are automatically captured in memory from app startup
2. **User-Triggered Save**: User clicks floating log button to save all captured logs
3. **Batch Upload**: All logs are sent to server in a single request
4. **File Creation**: Server saves logs with timestamp to logs folder
5. **Memory Clear**: Captured logs are cleared after successful save

## 🔧 **Implementation Details**

### **Simple Console Logger Class**
```typescript
class SimpleConsoleLogger {
  private logs: string[] = [];        // In-memory log storage
  private originalConsole: any = {};  // Original console methods
  private sessionId: string;          // Session identifier for file naming

  constructor() {
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.setupConsoleInterception();
    this.startCapturing();
  }
}
```

### **Key Methods**
- **`saveLogs()`**: Save all captured logs to server and clear memory
- **`getLogCount()`**: Get current number of captured logs
- **`clearLogs()`**: Clear captured logs from memory
- **`setupConsoleInterception()`**: Intercept console methods for automatic capture
- **`isCapturing()`**: Always returns true (always capturing in this simple version)
- **`fallbackDownload()`**: Downloads logs if server save fails

### **Log File Format**
```
# Console Log Capture
# Session: 2025-08-26T02-47-08
# Generated: 2025-08-26T02:55:15.123Z
# Total entries: 45

[2025-08-26T02:47:08.000Z] [LOG] Application started
[2025-08-26T02:47:09.000Z] [INFO] Dataset loaded successfully
[2025-08-26T02:47:10.000Z] [WARN] Plugin asset missing
...
```

## 📡 **Server Endpoints**

### **save-log.php**
**Purpose**: Save batch console logs to server logs folder

**Request Format**:
```json
{
  "filename": "console-capture-2025-08-26T02-55-15.log",
  "content": "# Console Log Capture\n# Session: 2025-08-26T02-47-08\n..."
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Log saved successfully to logs/console-capture-2025-08-26T02-55-15.log",
  "filename": "console-capture-2025-08-26T02-55-15.log",
  "size": 1234
}
```

### **Disabled Legacy Endpoints**
The following endpoints are disabled and return 410 errors:
- **`append-log.php`** - Real-time log streaming (legacy)
- **`cleanup-sessions.php`** - Session management (legacy)

These were part of a previous real-time logging implementation that has been replaced by the simpler batch approach.

## 🎛️ **User Interface**

### **Floating Log Button**
- **Position**: Fixed bottom-right corner of screen (z-index: 1000)
- **Visibility**: Always visible on both loading screen and viewer interface
- **Display**: Shows current log count with file icon (e.g., "📝 (23)")
- **Action**: Click to save all captured logs and clear memory
- **Styling**: Blue primary button with rounded corners and shadow
- **Size**: Small button with 12px font size for minimal intrusion

### **Console Interception**
```typescript
// Intercept all console methods automatically
const interceptMethod = (method: string, originalFn: Function) => {
  (console as any)[method] = (...args: any[]) => {
    // Call original console method first
    originalFn.apply(console, args);

    // Always capture logs in memory
    const timestamp = new Date().toISOString();
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    const logEntry = `[${method.toUpperCase()}] ${message}`;
    this.logs.push(`[${timestamp}] ${logEntry}`);
  };
};
```

## 🔄 **File Management**

### **Filename Generation**
- **Format**: `console-capture-YYYY-MM-DDTHH-MM-SS.log`
- **Uniqueness**: Timestamp-based ensures no collisions
- **Validation**: Server validates format with regex: `/^console-(export|capture)-[\w-]+\.log$/`
- **Example**: `console-capture-2025-08-26T02-55-15.log`

### **Storage**
- **Location**: `logs/` directory on server (created automatically if missing)
- **Retention**: Manual cleanup (no automatic deletion)
- **Access**: Files remain until manually removed
- **Backup**: Standard file system backup applies
- **Permissions**: Directory created with 0755 permissions

## 🖥️ **Usage**

### **How to Use**
1. **Automatic Start**: Console logging starts automatically when app loads
2. **Monitor Count**: Watch the floating button show increasing log count
3. **Save Logs**: Click the floating button to save all logs to server
4. **Success Feedback**: App shows success message when logs are saved
5. **Memory Clear**: Logs are automatically cleared after successful save
6. **Fallback Download**: If server save fails, logs download to browser Downloads folder

### **Benefits**
- **Simple**: No configuration or setup required
- **Reliable**: No network dependencies during capture
- **Efficient**: Batch upload reduces server requests
- **User-Controlled**: Save only when needed
- **Fallback Support**: Works even if server is unavailable
- **Always Capturing**: No need to enable/disable logging

## 🧪 **Testing & Verification**

### **Verification Steps**
1. Open application and observe floating log button
2. Perform actions that generate console logs
3. Watch log count increase in button text
4. Click button to save logs
5. Check `logs/` directory for new log file
6. Verify button count resets to 0 after save

### **Expected Behavior**
- **Automatic Capture**: All console output captured from app start
- **Real-Time Count**: Button shows current number of captured logs
- **Successful Save**: Logs saved to server with timestamp filename
- **Memory Clear**: Log count resets after successful save
- **Fallback Download**: Browser download if server save fails

## ⚠️ **Troubleshooting**

### **Common Issues**
- **Button Not Appearing**: Check if floating button CSS is being overridden by other styles
- **Save Fails**: Verify PHP server is running and `save-log.php` is accessible
- **No Logs Captured**: Console interception starts automatically - check browser console for startup message
- **Permission Errors**: Ensure `logs/` directory is writable by web server (auto-created with 0755)
- **Empty Log Count**: Button shows (0) if no logs captured yet

### **Debug Information**
- **Console Messages**: Look for "📝 Console log capture started" message on app load
- **Network Tab**: Monitor `./save-log.php` POST requests in browser dev tools
- **Log Count**: Button shows current captured log count in real-time
- **File System**: Check `logs/` directory for created `.log` files
- **Server Response**: Success/error messages logged to console

### **Fallback Behavior**
If server save fails, system automatically:
- **Downloads File**: Browser downloads log file to Downloads folder
- **Clears Memory**: Logs are still cleared after fallback download
- **Shows Error**: User sees error message but logs are not lost
- **Continues Capturing**: System continues capturing new logs after save/download

---

> **💡 Note**: This simplified system provides reliable logging with minimal complexity, making it ideal for debugging without infrastructure overhead.
