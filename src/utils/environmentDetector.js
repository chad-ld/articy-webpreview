/**
 * Environment Detection Utilities
 * Detects deployment environment and chooses appropriate dataset detection strategy
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

      // Check if PHP support is likely available
      if (env.isProduction || this.canTestPHPSupport() || env.isDevelopment) {
        env.hasPHPSupport = true;
        env.capabilities.push('php-api', 'server-side-scanning');
      }

      env.capabilities.push('fetch-api', 'cors');
      
      if (this.debugMode) {
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
        'mpos', 'demo', 'demo4', 'test', 'latest', 'current', 'main'
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
