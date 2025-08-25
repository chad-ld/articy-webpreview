/**
 * Console Logger Utility
 * Captures console output and saves to downloadable files
 */

class ConsoleLogger {
  private isEnabled = false;
  private logs: string[] = [];
  private originalConsole: any = {};
  private sessionId: string;

  constructor() {
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.setupConsoleInterception();
  }

  /**
   * Enable console logging to file
   */
  enable(): void {
    this.isEnabled = true;
    this.logs = [];
    console.log('📝 Console logging enabled - logs will be saved to server logs folder');
    localStorage.setItem('console-logging-enabled', 'true');
  }

  /**
   * Disable console logging
   */
  disable(): void {
    this.isEnabled = false;
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
  loadState(): void {
    const saved = localStorage.getItem('console-logging-enabled');
    if (saved === 'true') {
      this.enable();
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
          
          this.logs.push(`[${timestamp}] [${method.toUpperCase()}] ${message}`);
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
   * Auto-save logs when they reach a certain size
   */
  autoDownloadIfNeeded(): void {
    if (this.logs.length >= 1000) {
      this.downloadLogs();
      this.clearLogs();
    }
  }
}

// Global console logger instance
export const consoleLogger = new ConsoleLogger();

export default ConsoleLogger;
