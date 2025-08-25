# Real-Time Session-Based Console Logging System

## 🎯 **Overview**

The Articy Web Viewer includes an advanced real-time console logging system that maintains persistent log files per browser session, similar to server-side logging. This system replaces traditional download-based logging with continuous streaming to persistent session files.

## 🏗️ **Architecture**

### **Core Components**
- **Console Logger** (`src/utils/consoleLogger.ts`) - Frontend logging orchestration
- **Real-Time Endpoint** (`public/append-log.php`) - Server-side log streaming
- **Session Management** (`public/cleanup-sessions.php`) - Lifecycle and cleanup
- **Administrative Interface** (`public/session-manager.html`) - Monitoring and control

### **Session Lifecycle**
1. **Initialization**: Unique session ID created, persistent log file established
2. **Real-Time Streaming**: Individual console entries immediately appended to session file
3. **Heartbeat Monitoring**: Regular activity tracking (every 30 seconds)
4. **Graceful Closure**: Session properly terminated when browser tab closes
5. **Automatic Cleanup**: Inactive sessions and old files automatically removed

## 🔧 **Implementation Details**

### **Console Logger Class**
```typescript
class ConsoleLogger {
  private sessionId: string;           // Unique session identifier
  private isSessionInitialized: boolean; // Session state tracking
  private heartbeatInterval: NodeJS.Timeout; // Activity monitoring
  private useRealTimeLogging: boolean; // Mode selection flag
}
```

### **Key Methods**
- **`enable()`**: Initialize session and start real-time logging
- **`disable()`**: Close session and stop logging
- **`appendLogToServer()`**: Stream individual log entries
- **`initializeSession()`**: Create persistent session file
- **`startHeartbeat()`**: Begin activity monitoring
- **`closeSession()`**: Gracefully terminate session

### **Session File Format**
```
# Console Log Session
# Session ID: 2025-08-25T15-58-23
# Started: 2025-08-25 15:58:23 UTC
# Real-time logging enabled

[2025-08-25 15:58:23.000 UTC] [LOG] Application started
[2025-08-25 15:58:24.000 UTC] [INFO] Dataset loaded successfully
[2025-08-25 15:58:25.000 UTC] [WARN] Plugin asset missing
...

# Session closed: 2025-08-25 16:30:15 UTC
# End of session log
```

## 📡 **Server Endpoints**

### **append-log.php**
**Purpose**: Handle real-time log streaming and session management

**Actions Supported**:
- **`init`**: Create new session log file with header
- **`append`**: Add individual log entry to session file
- **`heartbeat`**: Update session activity timestamp
- **`close`**: Finalize session with footer and cleanup

**Request Format**:
```json
{
  "sessionId": "2025-08-25T15-58-23",
  "action": "append",
  "logEntry": "[LOG] User clicked navigation button"
}
```

### **cleanup-sessions.php**
**Purpose**: Manage session lifecycle and file cleanup

**Cleanup Operations**:
- Remove log files older than 24 hours
- Close sessions inactive for 1+ hours
- Delete orphaned heartbeat files
- Provide active session statistics

## 🎛️ **Configuration**

### **Vite Proxy Setup**
```typescript
// vite.config.ts
proxy: {
  '/append-log.php': {
    target: 'http://localhost:8080',
    changeOrigin: true
  },
  '/cleanup-sessions.php': {
    target: 'http://localhost:8080',
    changeOrigin: true
  }
}
```

### **Console Interception**
```typescript
// Intercept all console methods
['log', 'error', 'warn', 'info', 'debug'].forEach(method => {
  console[method] = (...args) => {
    originalConsole[method].apply(console, args);
    
    if (this.isEnabled) {
      const logEntry = `[${method.toUpperCase()}] ${message}`;
      this.appendLogToServer(logEntry);
    }
  };
});
```

## 🔄 **Session Management**

### **Session ID Generation**
- **Format**: `YYYY-MM-DDTHH-MM-SS` (ISO timestamp without special characters)
- **Uniqueness**: Timestamp-based ensures no collisions
- **Validation**: Server validates format with regex: `/^[a-zA-Z0-9_-]+$/`

### **Heartbeat System**
- **Frequency**: Every 30 seconds
- **Purpose**: Track session activity and detect browser closure
- **File Format**: `logs/session-{sessionId}.heartbeat`
- **Content**: JSON with session metadata and timestamp

### **Automatic Cleanup**
- **Inactive Sessions**: Closed after 1 hour of inactivity
- **Old Log Files**: Removed after 24 hours
- **Orphaned Files**: Heartbeats without corresponding logs deleted
- **Trigger**: Manual via session manager or automated via cron

## 🖥️ **Administrative Interface**

### **Session Manager** (`session-manager.html`)
**Features**:
- View all active sessions with activity timestamps
- Run manual cleanup operations
- Monitor cleanup statistics
- Test session logging functionality

**Access**: `http://localhost:3000/session-manager.html`

### **Monitoring Capabilities**
- **Active Session Count**: Real-time session tracking
- **Last Activity**: Time since last heartbeat
- **User Agent**: Browser identification
- **Cleanup Statistics**: Files processed and errors

## 🧪 **Testing & Verification**

### **Test Scripts**
- **`test-auto-save-console.js`**: Browser console testing functions
- **`test-auto-save-simple.html`**: Simple interface for log generation

### **Verification Steps**
1. Enable console logging from loading screen
2. Check `logs/` directory for session files
3. Monitor real-time file growth during application use
4. Verify heartbeat files are created and updated
5. Test session closure on browser tab close

### **Expected Behavior**
- **Immediate Logging**: Console entries appear in file within milliseconds
- **Session Persistence**: Single file grows throughout browser session
- **Automatic Management**: No manual intervention required
- **Graceful Degradation**: Falls back to legacy mode if server unavailable

## ⚠️ **Troubleshooting**

### **Common Issues**
- **Proxy Not Working**: Check PHP server is running on port 8080
- **Session Not Initializing**: Verify append-log.php endpoint accessibility
- **Files Not Created**: Check logs directory permissions
- **Heartbeat Failures**: Normal if server temporarily unavailable

### **Debug Information**
- **Console Messages**: Real-time logging status updates
- **Network Tab**: Monitor append-log.php requests
- **Session Manager**: Administrative oversight and statistics
- **Log Files**: Direct file system verification

### **Legacy Fallback**
If real-time logging fails, system automatically falls back to:
- **Batch Logging**: Traditional download-based approach
- **Manual Save**: User-triggered log export
- **Local Storage**: Browser-based log retention

---

> **💡 Note**: This system provides server-like logging persistence without requiring complex infrastructure, making it ideal for both development and production environments.
