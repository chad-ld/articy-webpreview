/**
 * Hybrid Dataset Detection Service
 * Automatically detects datasets using the best available method for the current environment
 */

import EnvironmentDetector from './environmentDetector.js';

class HybridDatasetDetector {
  constructor() {
    this.environmentDetector = new EnvironmentDetector();
    this.debugMode = false;
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Enable debug logging
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.environmentDetector.setDebugMode(enabled);
  }

  /**
   * Detect available datasets using the best method for the current environment
   * @returns {Promise<Array>} Array of dataset objects
   */
  async detectDatasets() {
    if (this.debugMode) {
      console.log('🔍 Starting hybrid dataset detection...');
      this.environmentDetector.logEnvironmentInfo();
    }

    // Check cache first
    const cacheKey = 'datasets';
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      if (this.debugMode) {
        console.log('📋 Using cached dataset results');
      }
      return cached;
    }

    const methods = this.environmentDetector.getAvailableDetectionMethods();
    let datasets = [];
    let lastError = null;

    // Try each detection method in priority order
    for (const method of methods) {
      try {
        if (this.debugMode) {
          console.log(`🔄 Trying detection method: ${method}`);
        }

        datasets = await this.detectUsingMethod(method);
        
        if (datasets && datasets.length > 0) {
          if (this.debugMode) {
            console.log(`✅ Successfully detected ${datasets.length} datasets using ${method}`);
          }
          
          // Cache successful result
          this.setCachedResult(cacheKey, datasets);
          return datasets;
        }
      } catch (error) {
        lastError = error;
        if (this.debugMode) {
          console.warn(`⚠️ Detection method ${method} failed:`, error.message);
        }
      }
    }

    // If all methods failed, return empty array
    if (this.debugMode) {
      console.warn('❌ All detection methods failed. Last error:', lastError?.message);
    }

    return [];
  }

  /**
   * Detect datasets using a specific method
   * @param {string} method - Detection method to use
   * @returns {Promise<Array>} Array of dataset objects
   */
  async detectUsingMethod(method) {
    switch (method) {
      case 'php-api':
        return await this.detectViaPHPAPI();
      case 'file-system':
        return await this.detectViaFileSystem();
      case 'dev-server-scan':
        return await this.detectViaDevServerScan();
      case 'fallback':
        return await this.detectViaFallback();
      default:
        throw new Error(`Unknown detection method: ${method}`);
    }
  }

  /**
   * Detect datasets via PHP API (for web deployments)
   * @returns {Promise<Array>} Array of dataset objects
   */
  async detectViaPHPAPI() {
    const config = this.environmentDetector.getEnvironmentConfig();

    if (!config.apiEndpoint) {
      throw new Error('PHP API endpoint not available');
    }

    if (this.debugMode) {
      console.log(`📡 Attempting PHP API request to: ${config.apiEndpoint}`);
    }

    const response = await fetch(config.apiEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`PHP API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`PHP API error: ${data.error || 'Unknown error'}`);
    }

    // Filter to only valid datasets and transform to expected format
    const validDatasets = data.datasets
      .filter(dataset => dataset.valid)
      .map(dataset => ({
        name: dataset.name,
        folder: dataset.folder,
        displayName: dataset.displayName,
        description: dataset.description || `${dataset.name} dataset`
      }));

    if (this.debugMode) {
      console.log('📡 PHP API response:', {
        total: data.datasets.length,
        valid: validDatasets.length,
        debug: data.debug
      });
    }

    return validDatasets;
  }

  /**
   * Detect datasets via file system (for Electron apps)
   * @returns {Promise<Array>} Array of dataset objects
   */
  async detectViaFileSystem() {
    if (typeof window === 'undefined' || !window.require) {
      throw new Error('File system access not available');
    }

    try {
      const { ipcRenderer } = window.require('electron');
      const path = window.require('path');
      const fs = window.require('fs').promises;

      // Get app directory
      const appPath = process.cwd();
      const items = await fs.readdir(appPath);
      const datasets = [];

      for (const item of items) {
        if (item.endsWith('.json')) {
          const itemPath = path.join(appPath, item);
          const stats = await fs.stat(itemPath);
          
          if (stats.isDirectory()) {
            const manifestPath = path.join(itemPath, 'manifest.json');
            
            try {
              const manifestContent = await fs.readFile(manifestPath, 'utf8');
              const manifest = JSON.parse(manifestContent);
              
              const datasetName = item.slice(0, -5); // Remove .json extension
              const displayName = manifest.Project?.Name || 
                                manifest.Project?.DisplayName || 
                                datasetName.charAt(0).toUpperCase() + datasetName.slice(1);
              const description = manifest.Project?.DetailName || 
                                manifest.Project?.Description || 
                                `${datasetName} dataset`;

              datasets.push({
                name: datasetName,
                folder: item,
                displayName,
                description
              });
            } catch (error) {
              if (this.debugMode) {
                console.warn(`⚠️ Could not read manifest for ${item}:`, error.message);
              }
            }
          }
        }
      }

      return datasets;
    } catch (error) {
      throw new Error(`File system detection failed: ${error.message}`);
    }
  }

  /**
   * Detect datasets via development server scanning
   * @returns {Promise<Array>} Array of dataset objects
   */
  async detectViaDevServerScan() {
    // For development, we can try to access the public folder structure
    // This is a fallback that tries to mimic the PHP API behavior
    const commonDatasets = ['demo4', 'mpos', 'demo', 'test'];
    const datasets = [];

    for (const name of commonDatasets) {
      try {
        const manifestResponse = await fetch(`./${name}.json/manifest.json`);
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          
          const displayName = manifest.Project?.Name || 
                            manifest.Project?.DisplayName || 
                            name.charAt(0).toUpperCase() + name.slice(1);
          const description = manifest.Project?.DetailName || 
                            manifest.Project?.Description || 
                            `${name} dataset`;

          datasets.push({
            name,
            folder: `${name}.json`,
            displayName,
            description
          });
        }
      } catch (error) {
        // Dataset doesn't exist, continue
      }
    }

    return datasets;
  }

  /**
   * Fallback detection method (tries common dataset names)
   * @returns {Promise<Array>} Array of dataset objects
   */
  async detectViaFallback() {
    const config = this.environmentDetector.getEnvironmentConfig();
    const datasets = [];

    if (this.debugMode) {
      console.log('🔄 Using fallback detection with predefined dataset names');
      console.log('🔍 Fallback dataset list:', config.fallbackDatasets);
    }

    for (const name of config.fallbackDatasets) {
      if (this.debugMode) {
        console.log(`🔍 Testing dataset: ${name}`);
      }

      try {
        // Test 4.x format first (folder with manifest.json)
        const response = await fetch(`./${name}.json/manifest.json`);
        if (response.ok) {
          const manifest = await response.json();

          // Try to get Last-Modified header for timestamp
          const lastModified = await this.getFileTimestamp(`./${name}.json/manifest.json`);

          // Get Articy version from manifest
          const articyVersion = manifest.Settings?.ExportVersion ?
                               `4.x v${manifest.Settings.ExportVersion}` : '4.x';

          datasets.push({
            name,
            folder: `${name}.json`,
            displayName: manifest.Project?.Name || name.charAt(0).toUpperCase() + name.slice(1),
            description: manifest.Project?.DetailName || `${name} dataset`,
            articyVersion,
            format: '4.x',
            lastModified,
            lastModifiedFormatted: new Date(lastModified).toLocaleString()
          });

          if (this.debugMode) {
            console.log(`✅ Found 4.x dataset: ${name}`);
          }
        } else {
          // Test 3.x format (single JSON file)
          const fileResponse = await fetch(`./${name}.json`);
          if (fileResponse.ok) {
            const jsonData = await fileResponse.json();

            // Check if it looks like 3.x format
            const is3xFormat = jsonData.Packages && jsonData.Project && jsonData.GlobalVariables;

            if (is3xFormat) {
              // Try to get Last-Modified header for timestamp
              const lastModified = await this.getFileTimestamp(`./${name}.json`);

              const articyVersion = jsonData.Settings?.ExportVersion ?
                                   `3.x v${jsonData.Settings.ExportVersion}` : '3.x';

              datasets.push({
                name,
                file: `${name}.json`,
                displayName: jsonData.Project?.Name || name.charAt(0).toUpperCase() + name.slice(1),
                description: jsonData.Project?.DetailName || `${name} dataset (3.x format)`,
                articyVersion,
                format: '3.x',
                lastModified,
                lastModifiedFormatted: new Date(lastModified).toLocaleString()
              });

              if (this.debugMode) {
                console.log(`✅ Found 3.x dataset: ${name}`);
              }
            }
          }
        }
      } catch (error) {
        // Dataset doesn't exist or manifest is invalid, skip silently
        if (this.debugMode) {
          console.log(`❌ ${name} not found or invalid`);
        }
      }
    }

    return datasets;
  }

  /**
   * Try to get file timestamp from HTTP Last-Modified header
   * @param {string} url - File URL to check
   * @returns {Promise<number>} Unix timestamp or current time as fallback
   */
  async getFileTimestamp(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        const lastModified = response.headers.get('Last-Modified');
        if (lastModified) {
          const timestamp = new Date(lastModified).getTime();
          if (!isNaN(timestamp)) {
            return timestamp;
          }
        }
      }
    } catch (error) {
      // HEAD request failed, fall back to current time
    }

    // Fallback to current time if we can't get real timestamp
    return Date.now();
  }

  /**
   * Get cached result if still valid
   * @param {string} key - Cache key
   * @returns {*} Cached result or null
   */
  getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached result
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  setCachedResult(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Test the hybrid detection system
   * @returns {Promise<Object>} Test results
   */
  async testDetection() {
    const startTime = Date.now();
    
    try {
      const datasets = await this.detectDatasets();
      const endTime = Date.now();
      
      return {
        success: true,
        datasets,
        detectionTime: endTime - startTime,
        environment: this.environmentDetector.detectEnvironment(),
        methods: this.environmentDetector.getAvailableDetectionMethods()
      };
    } catch (error) {
      const endTime = Date.now();
      
      return {
        success: false,
        error: error.message,
        detectionTime: endTime - startTime,
        environment: this.environmentDetector.detectEnvironment(),
        methods: this.environmentDetector.getAvailableDetectionMethods()
      };
    }
  }
}

export default HybridDatasetDetector;
