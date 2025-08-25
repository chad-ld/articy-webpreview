/**
 * Console Logger Utility
 * Captures console output and saves to downloadable files
 */

class ConsoleLogger {
  private isEnabled = false;
  private logs: string[] = [];
  private originalConsole: any = {};
  private sessionId: string;
  private isSessionInitialized = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private useRealTimeLogging = true; // New flag to control logging mode

  constructor() {
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.setupConsoleInterception();
    this.setupBeforeUnloadHandler();
  }

  /**
   * Enable console logging to file
   */
  async enable(): Promise<void> {
    this.isEnabled = true;
    this.logs = [];

    if (this.useRealTimeLogging) {
      await this.initializeSession();
      this.startHeartbeat();
      console.log('📝 Real-time console logging enabled - logs will be streamed to server');
    } else {
      console.log('📝 Console logging enabled - logs will be saved to server logs folder');
    }

    localStorage.setItem('console-logging-enabled', 'true');
  }

  /**
   * Disable console logging
   */
  async disable(): Promise<void> {
    this.isEnabled = false;

    if (this.useRealTimeLogging && this.isSessionInitialized) {
      await this.closeSession();
      this.stopHeartbeat();
    }

    console.log('📝 Console logging disabled');
    localStorage.setItem('console-logging-enabled', 'false');
  }

  /**
   * Check if logging is enabled
   */
  isLoggingEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Load saved state from localStorage
   */
  async loadState(): Promise<void> {
    const saved = localStorage.getItem('console-logging-enabled');
    if (saved === 'true') {
      await this.enable();
    }
  }

  /**
   * Setup console interception
   */
  private setupConsoleInterception(): void {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // Intercept console methods
    const interceptMethod = (method: string, originalFn: Function) => {
      (console as any)[method] = (...args: any[]) => {
        // Call original console method
        originalFn.apply(console, args);
        
        // Log to file if enabled
        if (this.isEnabled) {
          const timestamp = new Date().toISOString();
          const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');

          const logEntry = `[${method.toUpperCase()}] ${message}`;
          this.logs.push(`[${timestamp}] ${logEntry}`);

          if (this.useRealTimeLogging && this.isSessionInitialized) {
            // Send log entry to server immediately
            setTimeout(() => {
              this.appendLogToServer(logEntry).catch(error => {
                console.error('❌ Real-time log append failed:', error);
              });
            }, 0);
          } else {
            // Check if auto-save is needed after adding the log entry (legacy mode)
            setTimeout(() => {
              this.autoDownloadIfNeeded().catch(error => {
                console.error('❌ Auto-save check failed:', error);
              });
            }, 0);
          }
        }
      };
    };

    interceptMethod('log', this.originalConsole.log);
    interceptMethod('error', this.originalConsole.error);
    interceptMethod('warn', this.originalConsole.warn);
    interceptMethod('info', this.originalConsole.info);
    interceptMethod('debug', this.originalConsole.debug);
  }

  /**
   * Save current logs to server logs folder
   */
  async downloadLogs(): Promise<void> {
    if (this.logs.length === 0) {
      console.warn('📝 No logs to save');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `console-export-${timestamp}.log`;

    const content = [
      `# Console Log Export`,
      `# Session: ${this.sessionId}`,
      `# Generated: ${new Date().toISOString()}`,
      `# Total entries: ${this.logs.length}`,
      ``,
      ...this.logs
    ].join('\n');

    try {
      // Save to server logs folder
      const response = await fetch('./save-log.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: filename,
          content: content
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📝 Saved ${this.logs.length} log entries to logs/${filename}`);
        console.log(`✅ Server response: ${result.message}`);
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to save logs to server:', error);
      // Fallback to download if server save fails
      this.fallbackDownload(content, filename);
    }
  }

  /**
   * Fallback download method if server save fails
   */
  private fallbackDownload(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    console.log(`📝 Fallback: Downloaded ${filename} to Downloads folder`);
  }

  /**
   * Clear current logs
   */
  clearLogs(): void {
    this.logs = [];
    console.log('📝 Console logs cleared');
  }

  /**
   * Get current log count
   */
  getLogCount(): number {
    return this.logs.length;
  }

  /**
   * Auto-save logs when they reach a certain size (legacy mode)
   */
  async autoDownloadIfNeeded(): Promise<void> {
    if (this.logs.length >= 1000) {
      console.log('📝 Auto-save triggered: 1000 log entries reached');
      try {
        await this.downloadLogs();
        this.clearLogs();
        console.log('📝 Auto-save completed successfully');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
        // Don't clear logs if save failed, so user can manually save them
      }
    }
  }

  /**
   * Initialize session-based logging
   */
  private async initializeSession(): Promise<void> {
    try {
      const response = await fetch('./append-log.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          action: 'init',
          logEntry: ''
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.isSessionInitialized = true;
        console.log(`📝 Session logging initialized: ${result.logFile}`);
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize session logging:', error);
      // Fall back to legacy mode
      this.useRealTimeLogging = false;
    }
  }

  /**
   * Append individual log entry to server
   */
  private async appendLogToServer(logEntry: string): Promise<void> {
    try {
      const response = await fetch('./append-log.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          action: 'append',
          logEntry: logEntry
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      // Silently fail for individual log entries to avoid spam
      // The heartbeat will detect if the session is still alive
    }
  }

  /**
   * Close session logging
   */
  private async closeSession(): Promise<void> {
    try {
      const response = await fetch('./append-log.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          action: 'close',
          logEntry: ''
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📝 Session logging closed: ${result.logFile}`);
      }
    } catch (error) {
      console.error('❌ Failed to close session logging:', error);
    } finally {
      this.isSessionInitialized = false;
    }
  }

  /**
   * Start heartbeat to keep session alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await fetch('./append-log.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            action: 'heartbeat',
            logEntry: ''
          })
        });
      } catch (error) {
        // Heartbeat failures are expected if server is down
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Setup handler for page unload to close session
   */
  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      if (this.isSessionInitialized) {
        // Use sendBeacon for reliable delivery during page unload
        navigator.sendBeacon('./append-log.php', JSON.stringify({
          sessionId: this.sessionId,
          action: 'close',
          logEntry: ''
        }));
      }
    });
  }
}

// Global console logger instance
export const consoleLogger = new ConsoleLogger();

export default ConsoleLogger;
