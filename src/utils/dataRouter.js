/**
 * Articy Data Router
 * Routes data to appropriate loader based on format detection
 */

import FormatDetector from './formatDetector';
import DataLoader4x from './dataLoader4x';
import DataMerger4x from './dataMerger4x';

class DataRouter {
  constructor() {
    this.formatDetector = new FormatDetector();
    this.dataLoader4x = new DataLoader4x();
    this.dataMerger4x = new DataMerger4x();
    this.debugMode = true; // Enable debug mode for 4.x development
  }

  /**
   * Enable debug logging
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.formatDetector.setDebugMode(enabled);
    this.dataMerger4x.setDebugMode(enabled);
  }

  /**
   * Process input data and route to appropriate loader
   * @param {*} input - Input data (File, FileList, Object, etc.)
   * @returns {Promise<Object>} - Processed data in unified format
   */
  async processData(input) {
    if (this.debugMode) {
      console.log('🚀 Starting data processing pipeline...');
    }

    try {
      // Step 1: Detect format
      const detection = await this.formatDetector.detectFormat(input);
      
      if (this.debugMode) {
        console.log('🔍 Format detection result:', {
          format: detection.format,
          version: detection.version,
          confidence: detection.confidence
        });
      }

      // Step 2: Validate detection
      if (detection.errors.length > 0) {
        throw new Error(`Format detection failed: ${detection.errors.join(', ')}`);
      }

      if (detection.confidence < 0.5) {
        throw new Error(`Low confidence in format detection (${detection.confidence}). Unable to process data.`);
      }

      // Step 3: Route to appropriate processor
      let processedData;
      
      if (detection.format === '3.x') {
        processedData = await this.route3xData(detection);
      } else if (detection.format === '4.x') {
        processedData = await this.route4xData(detection);
      } else {
        throw new Error(`Unsupported format: ${detection.format}`);
      }

      // Step 4: Normalize output
      const normalizedData = this.normalizeOutput(processedData, detection);

      if (this.debugMode) {
        console.log('✅ Data processing complete:', {
          format: detection.format,
          packages: normalizedData.Packages?.length || 0,
          totalModels: normalizedData.Packages?.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0) || 0
        });
      }

      return normalizedData;

    } catch (error) {
      if (this.debugMode) {
        console.error('❌ Data processing failed:', error);
      }
      throw new Error(`Data processing failed: ${error.message}`);
    }
  }

  /**
   * Process 3.x format data
   * @param {Object} detection - Format detection result
   * @returns {Promise<Object>} - Processed 3.x data
   */
  async route3xData(detection) {
    if (this.debugMode) {
      console.log('📋 Processing 3.x format data...');
    }

    // For 3.x format, data is already in the correct structure
    // Just return the parsed data
    let data = detection.data;
    
    // If data is a string, parse it
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    
    // If data is in files object, extract the single JSON
    if (detection.files && Object.keys(detection.files).length === 1) {
      const fileName = Object.keys(detection.files)[0];
      data = JSON.parse(detection.files[fileName]);
    }

    // Validate 3.x structure
    this.validate3xStructure(data);

    if (this.debugMode) {
      console.log('✅ 3.x data processed:', {
        packages: data.Packages?.length || 0,
        globalVariables: data.GlobalVariables?.length || 0,
        objectDefinitions: data.ObjectDefinitions?.length || 0
      });
    }

    return data;
  }

  /**
   * Process 4.x format data
   * @param {Object} detection - Format detection result
   * @returns {Promise<Object>} - Processed 4.x data (converted to 3.x-compatible)
   */
  async route4xData(detection) {
    if (this.debugMode) {
      console.log('📋 Processing 4.x format data...');
    }

    // Use the 4.x loader to load raw data (not combined)
    const loadedData = await this.dataLoader4x.loadAllRaw(detection.files);
    const mergedData = this.dataMerger4x.merge(loadedData);

    // Validate merged data
    const validation = this.dataMerger4x.validateMergedData(mergedData);
    
    if (!validation.isValid) {
      throw new Error(`4.x data validation failed: ${validation.errors.join(', ')}`);
    }

    if (this.debugMode) {
      console.log('✅ 4.x data processed and converted:', {
        packages: mergedData.Packages?.length || 0,
        globalVariables: mergedData.GlobalVariables?.length || 0,
        objectDefinitions: mergedData.ObjectDefinitions?.length || 0,
        totalModels: validation.stats.totalModels
      });
    }

    return mergedData;
  }

  /**
   * Normalize output to ensure consistent structure
   * @param {Object} data - Processed data
   * @param {Object} detection - Format detection result
   * @returns {Object} - Normalized data
   */
  normalizeOutput(data, detection) {
    const normalized = {
      // Core data structure
      Settings: data.Settings || {},
      Project: data.Project || {},
      GlobalVariables: data.GlobalVariables || [],
      ObjectDefinitions: data.ObjectDefinitions || [],
      Packages: data.Packages || [],
      Hierarchy: data.Hierarchy || {},
      ScriptMethods: data.ScriptMethods || [],

      // Metadata about processing
      _metadata: {
        sourceFormat: detection.format,
        sourceVersion: detection.version,
        processingTimestamp: new Date().toISOString(),
        confidence: detection.confidence,
        inputType: detection.inputType
      }
    };

    // Ensure all packages have required structure
    normalized.Packages = normalized.Packages.map(pkg => ({
      Name: pkg.Name || 'Unnamed Package',
      Description: pkg.Description || '',
      IsDefaultPackage: pkg.IsDefaultPackage || false,
      Models: pkg.Models || []
    }));

    return normalized;
  }

  /**
   * Validate 3.x data structure
   * @param {Object} data - 3.x data to validate
   */
  validate3xStructure(data) {
    const requiredProps = ['Settings', 'Project', 'GlobalVariables', 'ObjectDefinitions', 'Packages'];
    
    for (const prop of requiredProps) {
      if (!data.hasOwnProperty(prop)) {
        throw new Error(`Missing required 3.x property: ${prop}`);
      }
    }

    if (!Array.isArray(data.Packages)) {
      throw new Error('3.x Packages must be an array');
    }

    if (data.Packages.length > 0 && !data.Packages[0].hasOwnProperty('Models')) {
      throw new Error('3.x Packages must contain Models');
    }
  }

  /**
   * Get processing statistics
   * @param {Object} data - Processed data
   * @returns {Object} - Processing statistics
   */
  getProcessingStats(data) {
    const stats = {
      format: data._metadata?.sourceFormat || 'unknown',
      version: data._metadata?.sourceVersion || 'unknown',
      confidence: data._metadata?.confidence || 0,
      packageCount: data.Packages?.length || 0,
      totalModels: data.Packages?.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0) || 0,
      globalVariableNamespaces: data.GlobalVariables?.length || 0,
      totalGlobalVariables: data.GlobalVariables?.reduce((sum, ns) => sum + (ns.Variables?.length || 0), 0) || 0,
      objectDefinitions: data.ObjectDefinitions?.length || 0,
      hasHierarchy: !!data.Hierarchy && Object.keys(data.Hierarchy).length > 0,
      hasScriptMethods: !!(data.ScriptMethods?.length),
      processingTimestamp: data._metadata?.processingTimestamp
    };

    // Count node types
    stats.nodeTypes = {};
    if (data.Packages) {
      data.Packages.forEach(pkg => {
        if (pkg.Models) {
          pkg.Models.forEach(model => {
            const type = model.Type;
            stats.nodeTypes[type] = (stats.nodeTypes[type] || 0) + 1;
          });
        }
      });
    }

    return stats;
  }

  /**
   * Create a format report for the processed data
   * @param {Object} data - Processed data
   * @returns {Object} - Format report
   */
  createProcessingReport(data) {
    const stats = this.getProcessingStats(data);
    
    return {
      success: true,
      format: stats.format,
      version: stats.version,
      confidence: stats.confidence,
      summary: {
        packages: stats.packageCount,
        totalModels: stats.totalModels,
        globalVariables: stats.totalGlobalVariables,
        objectDefinitions: stats.objectDefinitions
      },
      nodeTypes: stats.nodeTypes,
      features: {
        hasHierarchy: stats.hasHierarchy,
        hasScriptMethods: stats.hasScriptMethods
      },
      processingInfo: {
        timestamp: stats.processingTimestamp,
        inputType: data._metadata?.inputType
      }
    };
  }

  /**
   * Test the router with sample data
   * @param {*} input - Test input
   * @returns {Promise<Object>} - Test results
   */
  async testRouter(input) {
    try {
      const startTime = Date.now();
      const processedData = await this.processData(input);
      const endTime = Date.now();
      
      const report = this.createProcessingReport(processedData);
      report.performance = {
        processingTimeMs: endTime - startTime,
        dataSize: JSON.stringify(processedData).length
      };
      
      return {
        success: true,
        data: processedData,
        report: report
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        report: null
      };
    }
  }
}

export default DataRouter;
