/**
 * Environment Detection Utilities
 * Detects deployment environment and chooses appropriate dataset detection strategy
 * TEST: Cache disabled - testing different file at 2025-06-24 05:12:00
 */

class EnvironmentDetector {
  constructor() {
    this.debugMode = false;
  }

  /**
   * Enable debug logging
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Detect the current deployment environment
   * @returns {Object} Environment information
   */
  detectEnvironment() {
    const env = {
      type: 'unknown',
      isWeb: false,
      isElectron: false,
      isDesktop: false,
      isDevelopment: false,
      isProduction: false,
      hasFileSystemAccess: false,
      hasPHPSupport: false,
      capabilities: []
    };

    // Check if running in Electron
    if (typeof window !== 'undefined' && window.process && window.process.type) {
      env.type = 'electron';
      env.isElectron = true;
      env.isDesktop = true;
      env.hasFileSystemAccess = true;
      env.capabilities.push('file-system', 'native-directory-scan');

      if (this.debugMode) {
        console.log('🖥️ Environment: Electron/Desktop application');
      }
    }
    // Check if running in a web browser
    else if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      env.type = 'web';
      env.isWeb = true;

      // Check if we're in development mode
      if (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.port === '5173' || // Vite dev server
          window.location.port === '3000' ||  // Common dev ports
          window.location.port === '3001') {  // Alternative dev port
        env.isDevelopment = true;
        env.capabilities.push('development', 'hot-reload');
      } else {
        env.isProduction = true;
        env.capabilities.push('production');
      }

      // Check for portable desktop environment (PHP server on localhost)
      if (this.isPortableDesktop()) {
        env.type = 'portable-desktop';
        env.isDesktop = true;
        // Override development detection for portable desktop
        env.isDevelopment = false;
        env.isProduction = true; // Treat as production for dataset detection
        env.capabilities = env.capabilities.filter(cap => cap !== 'development' && cap !== 'hot-reload');
        env.capabilities.push('portable-desktop', 'local-php-server');

        if (this.debugMode) {
          console.log('🖥️ Environment: Portable Desktop (PHP server)');
        }
      }

      // Check if PHP support is likely available
      if (env.isProduction || this.canTestPHPSupport() || env.isDevelopment) {
        env.hasPHPSupport = true;
        env.capabilities.push('php-api', 'server-side-scanning');
      }

      env.capabilities.push('fetch-api', 'cors');

      if (this.debugMode && env.type === 'web') {
        console.log(`🌐 Environment: Web browser (${env.isDevelopment ? 'development' : 'production'})`);
      }
    }
    // Node.js environment
    else if (typeof global !== 'undefined' && typeof require !== 'undefined') {
      env.type = 'node';
      env.hasFileSystemAccess = true;
      env.capabilities.push('file-system', 'node-modules');
      
      if (this.debugMode) {
        console.log('🟢 Environment: Node.js');
      }
    }

    if (this.debugMode) {
      console.log('🔍 Environment detection result:', env);
    }

    return env;
  }

  /**
   * Check if running in portable desktop environment
   * @returns {boolean} Whether this is a portable desktop deployment
   */
  isPortableDesktop() {
    if (typeof window === 'undefined') return false;

    const hostname = window.location.hostname;
    const port = window.location.port;

    // Portable desktop runs on localhost with specific ports (8080, 8081)
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isDesktopPort = port === '8080' || port === '8081';

    // Additional check: look for desktop-specific indicators in the URL or page
    const hasDesktopIndicators = this.hasDesktopIndicators();

    return isLocalhost && isDesktopPort && hasDesktopIndicators;
  }

  /**
   * Check for desktop-specific indicators
   * @returns {boolean} Whether desktop indicators are present
   */
  hasDesktopIndicators() {
    if (typeof window === 'undefined') return false;

    // Check if datasets folder structure suggests desktop deployment
    // This is a heuristic - desktop version will have datasets in a specific folder structure
    const pathname = window.location.pathname;

    // Desktop version serves from root, web version often has subdirectories
    const isRootServed = pathname === '/' || pathname === '/index.html';

    // Check for desktop-specific files that wouldn't be on web server
    // We can't directly check file system, but we can make educated guesses
    return isRootServed;
  }

  /**
   * Test if PHP support is available by checking for common indicators
   * @returns {boolean} Whether PHP support is likely available
   */
  canTestPHPSupport() {
    // Check if we're on a domain that suggests web hosting
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;

      // Common hosting patterns
      const hostingPatterns = [
        /\.com$/,
        /\.net$/,
        /\.org$/,
        /\.dev$/,
        /dreamhost/i,
        /hostgator/i,
        /bluehost/i,
        /godaddy/i
      ];

      return hostingPatterns.some(pattern => pattern.test(hostname));
    }

    return false;
  }

  /**
   * Get the recommended dataset detection strategy for the current environment
   * @returns {string} Recommended strategy
   */
  getRecommendedStrategy() {
    const env = this.detectEnvironment();

    if (env.isElectron) {
      return 'file-system';
    } else if (env.type === 'portable-desktop') {
      return 'php-api'; // Portable desktop uses PHP server for dataset detection
    } else if (env.isWeb && env.hasPHPSupport) {
      return 'php-api';
    } else if (env.isWeb && env.isDevelopment) {
      return 'fallback-with-dev-support';
    } else {
      return 'fallback';
    }
  }

  /**
   * Get available detection methods for the current environment
   * @returns {Array<string>} Available detection methods in priority order
   */
  getAvailableDetectionMethods() {
    const env = this.detectEnvironment();
    const methods = [];

    if (env.isElectron) {
      methods.push('file-system', 'fallback');
    } else if (env.type === 'portable-desktop') {
      // Portable desktop uses PHP API to scan local datasets folder
      methods.push('php-api', 'fallback');
    } else if (env.isWeb) {
      if (env.hasPHPSupport) {
        methods.push('php-api');
      }
      methods.push('fallback');

      if (env.isDevelopment) {
        methods.push('dev-server-scan');
      }
    }

    return methods;
  }

  /**
   * Check if a specific detection method is supported
   * @param {string} method - Detection method to check
   * @returns {boolean} Whether the method is supported
   */
  supportsDetectionMethod(method) {
    const availableMethods = this.getAvailableDetectionMethods();
    return availableMethods.includes(method);
  }

  /**
   * Get environment-specific configuration
   * @returns {Object} Configuration object
   */
  getEnvironmentConfig() {
    const env = this.detectEnvironment();
    const config = {
      apiEndpoint: './datasets.php',
      fallbackDatasets: [
        'mpos', 'mpos_nw', 'demo', 'demo4', 'demo3old', 'adventure', 'mystory', 'test', 'latest', 'current', 'main'
      ],
      timeout: 5000,
      retryAttempts: 2
    };

    if (env.isDevelopment) {
      config.timeout = 10000; // Longer timeout for dev
      config.fallbackDatasets.push('dev', 'development', 'local');
    }

    if (env.isElectron) {
      config.apiEndpoint = null; // No PHP API in Electron
      config.useFileSystem = true;
    }

    if (env.type === 'portable-desktop') {
      // Portable desktop uses PHP API but with local dataset scanning
      config.apiEndpoint = './datasets.php';
      config.timeout = 3000; // Faster timeout for local server
      config.retryAttempts = 1; // Fewer retries needed for local server
      config.isPortableDesktop = true;
    }

    return config;
  }

  /**
   * Log environment information for debugging
   */
  logEnvironmentInfo() {
    const env = this.detectEnvironment();
    const strategy = this.getRecommendedStrategy();
    const methods = this.getAvailableDetectionMethods();
    const config = this.getEnvironmentConfig();

    console.group('🔍 Environment Detection Report');
    console.log('Environment Type:', env.type);
    console.log('Capabilities:', env.capabilities);
    console.log('Recommended Strategy:', strategy);
    console.log('Available Methods:', methods);
    console.log('Configuration:', config);
    console.groupEnd();
  }
}

export default EnvironmentDetector;
