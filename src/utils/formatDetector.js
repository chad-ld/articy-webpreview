/**
 * Articy Format Detector
 * Detects whether uploaded data is 3.x or 4.x format
 */

class FormatDetector {
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
   * Detect the format of uploaded Articy data
   * @param {*} input - Input data (File, FileList, Object, etc.)
   * @returns {Promise<Object>} - Detection result
   */
  async detectFormat(input) {
    if (this.debugMode) {
      console.log('🔍 Starting format detection...');
    }

    try {
      const detection = {
        format: null,
        version: null,
        confidence: 0,
        inputType: null,
        files: null,
        data: null,
        errors: []
      };

      // Determine input type
      detection.inputType = this.getInputType(input);
      
      if (this.debugMode) {
        console.log('📋 Input type detected:', detection.inputType);
      }

      // Process based on input type
      switch (detection.inputType) {
        case 'single-file':
          await this.detectSingleFileFormat(input, detection);
          break;
        case 'file-list':
          await this.detectFileListFormat(input, detection);
          break;
        case 'object':
          await this.detectObjectFormat(input, detection);
          break;
        case 'json-string':
          await this.detectJsonStringFormat(input, detection);
          break;
        default:
          detection.errors.push(`Unsupported input type: ${detection.inputType}`);
      }

      if (this.debugMode) {
        console.log('🎯 Detection result:', {
          format: detection.format,
          version: detection.version,
          confidence: detection.confidence,
          inputType: detection.inputType
        });
      }

      return detection;

    } catch (error) {
      if (this.debugMode) {
        console.error('❌ Format detection failed:', error);
      }
      
      return {
        format: null,
        version: null,
        confidence: 0,
        inputType: null,
        files: null,
        data: null,
        errors: [`Format detection failed: ${error.message}`]
      };
    }
  }

  /**
   * Determine the type of input
   * @param {*} input - Input data
   * @returns {string} - Input type
   */
  getInputType(input) {
    if (input instanceof File) {
      return 'single-file';
    }
    
    if (input instanceof FileList || Array.isArray(input)) {
      return 'file-list';
    }
    
    if (typeof input === 'string') {
      try {
        JSON.parse(input);
        return 'json-string';
      } catch {
        return 'unknown-string';
      }
    }
    
    if (typeof input === 'object' && input !== null) {
      return 'object';
    }
    
    return 'unknown';
  }

  /**
   * Detect format for single file input
   * @param {File} file - Single file
   * @param {Object} detection - Detection result object
   */
  async detectSingleFileFormat(file, detection) {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.json')) {
      // Read and parse the JSON file
      const content = await this.readFileAsText(file);
      const data = JSON.parse(content);
      
      detection.files = { [file.name]: content };
      detection.data = data;
      
      // Check if it's 3.x format (single JSON with all data)
      if (this.is3xFormat(data)) {
        detection.format = '3.x';
        detection.version = data.Settings?.ExportVersion || '1.0';
        detection.confidence = 0.95;
      } else {
        detection.errors.push('Single JSON file does not match 3.x format structure');
        detection.confidence = 0.1;
      }
    } else {
      detection.errors.push(`Unsupported file type: ${fileName}`);
    }
  }

  /**
   * Detect format for multiple files input
   * @param {FileList|Array} files - Multiple files
   * @param {Object} detection - Detection result object
   */
  async detectFileListFormat(files, detection) {
    const fileArray = Array.from(files);
    const fileContents = {};
    
    // Read all files
    for (const file of fileArray) {
      if (file.name.toLowerCase().endsWith('.json')) {
        const content = await this.readFileAsText(file);
        fileContents[file.name] = content;
      }
    }
    
    detection.files = fileContents;
    
    // Check if it's 4.x format (multiple files with manifest)
    if (this.is4xFormat(fileContents)) {
      const manifest = JSON.parse(fileContents['manifest.json']);
      detection.format = '4.x';
      detection.version = manifest.Settings?.ExportVersion || '2.1';
      detection.confidence = 0.95;
      detection.data = fileContents;
    } else if (fileArray.length === 1 && fileArray[0].name.toLowerCase().endsWith('.json')) {
      // Single JSON file in file list - check if it's 3.x
      const singleFile = fileArray[0];
      await this.detectSingleFileFormat(singleFile, detection);
    } else {
      detection.errors.push('Multiple files do not match 4.x format structure');
      detection.confidence = 0.1;
    }
  }

  /**
   * Detect format for object input
   * @param {Object} obj - Object data
   * @param {Object} detection - Detection result object
   */
  async detectObjectFormat(obj, detection) {
    detection.data = obj;
    
    if (this.is3xFormat(obj)) {
      detection.format = '3.x';
      detection.version = obj.Settings?.ExportVersion || '1.0';
      detection.confidence = 0.9;
    } else if (this.is4xFileCollection(obj)) {
      detection.format = '4.x';
      detection.files = obj;
      
      if (obj['manifest.json']) {
        const manifest = JSON.parse(obj['manifest.json']);
        detection.version = manifest.Settings?.ExportVersion || '2.1';
        detection.confidence = 0.9;
      } else {
        detection.confidence = 0.7;
      }
    } else {
      detection.errors.push('Object does not match known Articy format structure');
      detection.confidence = 0.1;
    }
  }

  /**
   * Detect format for JSON string input
   * @param {string} jsonString - JSON string
   * @param {Object} detection - Detection result object
   */
  async detectJsonStringFormat(jsonString, detection) {
    const data = JSON.parse(jsonString);
    detection.data = data;
    
    if (this.is3xFormat(data)) {
      detection.format = '3.x';
      detection.version = data.Settings?.ExportVersion || '1.0';
      detection.confidence = 0.9;
    } else {
      detection.errors.push('JSON string does not match 3.x format structure');
      detection.confidence = 0.1;
    }
  }

  /**
   * Check if data matches 3.x format structure
   * @param {Object} data - Data to check
   * @returns {boolean} - True if 3.x format
   */
  is3xFormat(data) {
    if (!data || typeof data !== 'object') return false;
    
    // 3.x format has these top-level properties
    const required3xProps = ['Settings', 'Project', 'GlobalVariables', 'ObjectDefinitions', 'Packages'];
    const has3xProps = required3xProps.every(prop => data.hasOwnProperty(prop));
    
    // 3.x format has Packages as array with Models
    const hasPackagesWithModels = Array.isArray(data.Packages) && 
      data.Packages.length > 0 && 
      data.Packages[0].hasOwnProperty('Models');
    
    // 3.x format typically has ExportVersion 1.0 or similar
    const hasOldExportVersion = data.Settings?.ExportVersion === '1.0' || 
      !data.Settings?.ExportVersion;
    
    return has3xProps && hasPackagesWithModels;
  }

  /**
   * Check if file collection matches 4.x format structure
   * @param {Object} files - File collection (filename -> content)
   * @returns {boolean} - True if 4.x format
   */
  is4xFormat(files) {
    if (!files || typeof files !== 'object') return false;
    
    // 4.x format must have manifest.json
    if (!files['manifest.json']) return false;
    
    try {
      const manifest = JSON.parse(files['manifest.json']);
      
      // Check for 4.x manifest structure
      const hasManifestStructure = manifest.Settings && manifest.Project && manifest.Packages;
      
      // Check for new export version
      const hasNewExportVersion = manifest.Settings?.ExportVersion === '2.1' || 
        parseFloat(manifest.Settings?.ExportVersion) >= 2.0;
      
      // Check for file references in manifest
      const hasFileReferences = manifest.Packages && 
        manifest.Packages.length > 0 && 
        manifest.Packages[0].Files;
      
      return hasManifestStructure && hasFileReferences;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if object is a 4.x file collection
   * @param {Object} obj - Object to check
   * @returns {boolean} - True if 4.x file collection
   */
  is4xFileCollection(obj) {
    if (!obj || typeof obj !== 'object') return false;
    
    // Check if it looks like a file collection (filename -> content mapping)
    const keys = Object.keys(obj);
    const hasJsonFiles = keys.some(key => key.endsWith('.json'));
    const hasManifest = keys.includes('manifest.json');
    
    return hasJsonFiles && hasManifest;
  }

  /**
   * Read file as text
   * @param {File} file - File to read
   * @returns {Promise<string>} - File content as text
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Create a detailed format report
   * @param {Object} detection - Detection result
   * @returns {Object} - Detailed report
   */
  createFormatReport(detection) {
    const report = {
      format: detection.format,
      version: detection.version,
      confidence: detection.confidence,
      inputType: detection.inputType,
      isValid: detection.confidence > 0.5 && detection.errors.length === 0,
      errors: detection.errors,
      recommendations: []
    };

    // Add recommendations based on detection results
    if (detection.format === '3.x') {
      report.recommendations.push('Use legacy 3.x data loader');
      report.recommendations.push('Data can be processed directly');
    } else if (detection.format === '4.x') {
      report.recommendations.push('Use new 4.x data loader with text resolution');
      report.recommendations.push('Data requires multi-file processing');
    } else {
      report.recommendations.push('Check file format and structure');
      report.recommendations.push('Ensure files are valid Articy exports');
    }

    // Add file information
    if (detection.files) {
      report.fileInfo = {
        count: Object.keys(detection.files).length,
        files: Object.keys(detection.files),
        totalSize: Object.values(detection.files).reduce((sum, content) => sum + content.length, 0)
      };
    }

    return report;
  }
}

export default FormatDetector;
