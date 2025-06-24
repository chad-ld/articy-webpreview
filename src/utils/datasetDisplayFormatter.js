/**
 * Dataset Display Formatter
 * Centralized service for formatting dataset display names with subtitles
 * Keeps display logic separate from detection logic for easier maintenance
 */

class DatasetDisplayFormatter {
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
   * Format a dataset's display name by adding subtitle from HTMLPREVIEW if available
   * @param {Object} dataset - Dataset object with basic info
   * @returns {Promise<Object>} Dataset object with enhanced displayName
   */
  async formatDatasetDisplayName(dataset) {
    if (!dataset) return dataset;

    // Create a copy to avoid mutating the original
    const formattedDataset = { ...dataset };
    
    try {
      // Extract subtitle based on dataset format
      let subtitle = null;
      
      if (dataset.format === '4.x' && dataset.folder) {
        // 4.x format: extract from objects file
        subtitle = await this.extractSubtitleFrom4x(dataset.name);
      } else if (dataset.format === '3.x' && dataset.file) {
        // 3.x format: extract from main JSON file
        subtitle = await this.extractSubtitleFrom3x(dataset.name);
      }

      // Add subtitle to display name if found
      if (subtitle) {
        formattedDataset.displayName = `${dataset.displayName} - ${subtitle}`;
        
        if (this.debugMode) {
          console.log(`✅ Enhanced display name for ${dataset.name}: "${formattedDataset.displayName}"`);
        }
      } else if (this.debugMode) {
        console.log(`ℹ️ No subtitle found for ${dataset.name}, using original name: "${dataset.displayName}"`);
      }

    } catch (error) {
      if (this.debugMode) {
        console.warn(`⚠️ Error formatting display name for ${dataset.name}:`, error.message);
      }
      // Return original dataset if formatting fails
    }

    return formattedDataset;
  }

  /**
   * Format multiple datasets' display names
   * @param {Array} datasets - Array of dataset objects
   * @returns {Promise<Array>} Array of datasets with enhanced display names
   */
  async formatDatasetDisplayNames(datasets) {
    if (!Array.isArray(datasets)) return datasets;

    if (this.debugMode) {
      console.log(`🎨 Formatting display names for ${datasets.length} datasets`);
    }

    // Process all datasets in parallel for better performance
    const formattedDatasets = await Promise.all(
      datasets.map(dataset => this.formatDatasetDisplayName(dataset))
    );

    if (this.debugMode) {
      console.log('🎨 Formatted dataset names:', formattedDatasets.map(d => `${d.name}: "${d.displayName}"`));
    }

    return formattedDatasets;
  }

  /**
   * Extract subtitle from HTMLPREVIEW node in a 4.x dataset
   * @param {string} datasetName - Name of the dataset
   * @returns {Promise<string|null>} The subtitle text or null if not found
   */
  async extractSubtitleFrom4x(datasetName) {
    try {
      const objectsResponse = await fetch(`./${datasetName}.json/package_010000060000401C_objects.json`);
      if (!objectsResponse.ok) {
        return null;
      }
      
      const objectsData = await objectsResponse.json();
      if (!objectsData || !objectsData.Objects) {
        return null;
      }

      // Search through all objects for HTMLPREVIEW marker
      for (const obj of objectsData.Objects) {
        if (!obj.Properties) continue;
        
        const properties = obj.Properties;
        let textContent = '';
        
        // Check both Text and Expression properties for HTMLPREVIEW marker
        if (properties.Text && properties.Text.includes('HTMLPREVIEW')) {
          textContent = properties.Text;
        } else if (properties.Expression && properties.Expression.includes('HTMLPREVIEW')) {
          textContent = properties.Expression;
        }
        
        if (textContent) {
          const subtitle = this.extractSubtitleFromText(textContent);
          if (subtitle) return subtitle;
        }
      }
      
      return null;
    } catch (error) {
      if (this.debugMode) {
        console.warn(`⚠️ Error extracting 4.x subtitle from ${datasetName}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Extract subtitle from HTMLPREVIEW node in a 3.x dataset
   * @param {string} datasetName - Name of the dataset
   * @returns {Promise<string|null>} The subtitle text or null if not found
   */
  async extractSubtitleFrom3x(datasetName) {
    try {
      const jsonResponse = await fetch(`./${datasetName}.json`);
      if (!jsonResponse.ok) {
        return null;
      }
      
      const jsonData = await jsonResponse.json();
      if (!jsonData.Packages) {
        return null;
      }
      
      // Search through all packages and models for HTMLPREVIEW marker
      for (const packageData of jsonData.Packages) {
        if (!packageData.Models) continue;
        
        for (const model of packageData.Models) {
          if (!model.Properties) continue;
          
          const properties = model.Properties;
          let textContent = '';
          
          // Check both Text and Expression properties for HTMLPREVIEW marker
          if (properties.Text && properties.Text.includes('HTMLPREVIEW')) {
            textContent = properties.Text;
          } else if (properties.Expression && properties.Expression.includes('HTMLPREVIEW')) {
            textContent = properties.Expression;
          }
          
          if (textContent) {
            const subtitle = this.extractSubtitleFromText(textContent);
            if (subtitle) return subtitle;
          }
        }
      }
      
      return null;
    } catch (error) {
      if (this.debugMode) {
        console.warn(`⚠️ Error extracting 3.x subtitle from ${datasetName}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Extract subtitle from HTMLPREVIEW text content
   * @param {string} textContent - The HTMLPREVIEW text content
   * @returns {string|null} The subtitle text or null if not found
   */
  extractSubtitleFromText(textContent) {
    if (!textContent) return null;
    
    const lines = textContent.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('//Project Sub Name:')) {
        const subtitle = trimmedLine.substring('//Project Sub Name:'.length).trim();
        if (subtitle) {
          return subtitle;
        }
      }
    }
    
    return null;
  }

  /**
   * Test the formatter with a specific dataset
   * @param {Object} dataset - Dataset to test
   * @returns {Promise<Object>} Test results
   */
  async testFormatter(dataset) {
    const startTime = Date.now();
    
    try {
      const formatted = await this.formatDatasetDisplayName(dataset);
      const endTime = Date.now();
      
      return {
        success: true,
        original: dataset,
        formatted: formatted,
        processingTime: endTime - startTime,
        subtitleAdded: formatted.displayName !== dataset.displayName
      };
    } catch (error) {
      const endTime = Date.now();
      
      return {
        success: false,
        error: error.message,
        processingTime: endTime - startTime,
        original: dataset
      };
    }
  }
}

export default DatasetDisplayFormatter;
