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
  private logs: string[];             // In-memory log storage
  private originalConsole: any;       // Original console methods
  private sessionId: string;          // Session identifier for file naming
}
```

### **Key Methods**
- **`saveLogs()`**: Save all captured logs to server and clear memory
- **`getLogCount()`**: Get current number of captured logs
- **`clearLogs()`**: Clear captured logs from memory
- **`setupConsoleInterception()`**: Intercept console methods for automatic capture

### **Log File Format**
```
# Console Log Capture
# Session: 2025-08-25T15-58-23
# Generated: 2025-08-25T16:30:15.123Z
# Total entries: 45

[2025-08-25T15:58:23.000Z] [LOG] Application started
[2025-08-25T15:58:24.000Z] [INFO] Dataset loaded successfully
[2025-08-25T15:58:25.000Z] [WARN] Plugin asset missing
...
```

## 📡 **Server Endpoints**

### **save-log.php**
**Purpose**: Save batch console logs to server logs folder

**Request Format**:
```json
{
  "filename": "console-capture-2025-08-25T16-30-15.log",
  "content": "# Console Log Capture\n# Session: 2025-08-25T15-58-23\n..."
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Log saved successfully to logs/console-capture-2025-08-25T16-30-15.log",
  "filename": "console-capture-2025-08-25T16-30-15.log",
  "size": 1234
}
```

## 🎛️ **User Interface**

### **Floating Log Button**
- **Position**: Fixed bottom-right corner of screen
- **Visibility**: Always visible on both loading screen and viewer interface
- **Display**: Shows current log count (e.g., "📝 (23)")
- **Action**: Click to save all captured logs and clear memory

### **Console Interception**
```typescript
// Intercept all console methods automatically
['log', 'error', 'warn', 'info', 'debug'].forEach(method => {
  console[method] = (...args) => {
    originalConsole[method].apply(console, args);

    // Always capture logs in memory
    const logEntry = `[${method.toUpperCase()}] ${message}`;
    this.logs.push(`[${timestamp}] ${logEntry}`);
  };
});
```

## 🔄 **File Management**

### **Filename Generation**
- **Format**: `console-capture-YYYY-MM-DDTHH-MM-SS.log`
- **Uniqueness**: Timestamp-based ensures no collisions
- **Validation**: Server validates format with regex: `/^console-(export|capture)-[\d-]+\.log$/`

### **Storage**
- **Location**: `logs/` directory on server
- **Retention**: Manual cleanup (no automatic deletion)
- **Access**: Files remain until manually removed
- **Backup**: Standard file system backup applies

## 🖥️ **Usage**

### **How to Use**
1. **Automatic Start**: Console logging starts automatically when app loads
2. **Monitor Count**: Watch the floating button show increasing log count
3. **Save Logs**: Click the floating button to save all logs to server
4. **Success Feedback**: App shows success message when logs are saved
5. **Memory Clear**: Logs are automatically cleared after successful save

### **Benefits**
- **Simple**: No configuration or setup required
- **Reliable**: No network dependencies during capture
- **Efficient**: Batch upload reduces server requests
- **User-Controlled**: Save only when needed

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
- **Button Not Appearing**: Check if floating button CSS is being overridden
- **Save Fails**: Verify PHP server is running and save-log.php is accessible
- **No Logs Captured**: Check console interception is working properly
- **Permission Errors**: Ensure logs directory is writable by web server

### **Debug Information**
- **Console Messages**: Check for save success/failure messages
- **Network Tab**: Monitor save-log.php requests
- **Log Count**: Button shows current captured log count
- **File System**: Check logs directory for created files

### **Fallback Behavior**
If server save fails, system automatically:
- **Downloads File**: Browser downloads log file to Downloads folder
- **Clears Memory**: Logs are still cleared after fallback download
- **Shows Error**: User sees error message but logs are not lost

---

> **💡 Note**: This simplified system provides reliable logging with minimal complexity, making it ideal for debugging without infrastructure overhead.
