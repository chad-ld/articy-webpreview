/**
 * Test format detection and data routing
 */

import fs from 'fs';
import path from 'path';

// Simple implementations for testing
class FormatDetector {
  async detectFormat(input) {
    const detection = {
      format: null,
      version: null,
      confidence: 0,
      inputType: null,
      files: null,
      data: null,
      errors: []
    };

    if (typeof input === 'object' && input !== null) {
      // Check if it's a file collection (4.x)
      if (input['manifest.json']) {
        try {
          const manifest = JSON.parse(input['manifest.json']);
          detection.format = '4.x';
          detection.version = manifest.Settings?.ExportVersion || '2.1';
          detection.confidence = 0.95;
          detection.inputType = 'file-collection';
          detection.files = input;
        } catch (error) {
          detection.errors.push('Failed to parse manifest.json');
        }
      } 
      // Check if it's 3.x format
      else if (input.Settings && input.Project && input.Packages) {
        detection.format = '3.x';
        detection.version = input.Settings?.ExportVersion || '1.0';
        detection.confidence = 0.95;
        detection.inputType = 'object';
        detection.data = input;
      }
      else {
        detection.errors.push('Unknown object format');
      }
    } else {
      detection.errors.push('Unsupported input type');
    }

    return detection;
  }
}

class DataLoader4x {
  async loadAll(files) {
    const manifest = JSON.parse(files['manifest.json']);
    const globalVariables = files['global_variables.json'] ? JSON.parse(files['global_variables.json']) : null;
    const hierarchy = files['hierarchy.json'] ? JSON.parse(files['hierarchy.json']) : null;
    const objectDefinitions = files['object_definitions.json'] ? JSON.parse(files['object_definitions.json']) : null;

    const packages = {};
    const localizations = {};

    if (manifest.Packages) {
      for (const packageInfo of manifest.Packages) {
        const packageId = packageInfo.Id;
        
        const objectsFileName = packageInfo.Files?.Objects?.FileName;
        if (objectsFileName && files[objectsFileName]) {
          packages[packageId] = {
            ...packageInfo,
            Objects: JSON.parse(files[objectsFileName]).Objects
          };
        }

        const textsFileName = packageInfo.Files?.Texts?.FileName;
        if (textsFileName && files[textsFileName]) {
          localizations[packageId] = JSON.parse(files[textsFileName]);
        }
      }
    }

    return {
      manifest,
      globalVariables,
      hierarchy,
      objectDefinitions,
      packages,
      localizations
    };
  }
}

class DataMerger4x {
  merge(loadedData) {
    const mergedData = {
      Settings: loadedData.manifest?.Settings || {},
      Project: loadedData.manifest?.Project || {},
      GlobalVariables: loadedData.globalVariables?.GlobalVariables || [],
      ObjectDefinitions: loadedData.objectDefinitions?.ObjectDefinitions || [],
      Packages: this.mergePackages(loadedData.packages, loadedData.localizations),
      Hierarchy: loadedData.hierarchy || {}
    };

    return mergedData;
  }

  mergePackages(packages, localizations) {
    if (!packages) return [];

    const mergedPackages = [];

    for (const [packageId, packageData] of Object.entries(packages)) {
      const localization = localizations?.[packageId] || {};
      
      const mergedPackage = {
        Name: packageData.Name || 'Unnamed Package',
        Description: packageData.Description || '',
        IsDefaultPackage: packageData.IsDefaultPackage || false,
        Models: this.mergeModels(packageData.Objects || [], localization)
      };

      mergedPackages.push(mergedPackage);
    }

    return mergedPackages;
  }

  mergeModels(objects, localization) {
    return objects.map(obj => {
      const mergedModel = {
        Type: obj.Type,
        Properties: { ...obj.Properties }
      };

      this.resolveTextReferences(mergedModel.Properties, localization);
      return mergedModel;
    });
  }

  resolveTextReferences(obj, localization) {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && localization[value]) {
        const resolvedText = localization[value]['']?.Text;
        if (resolvedText !== undefined) {
          obj[key] = resolvedText;
        }
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'object') {
            this.resolveTextReferences(item, localization);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        this.resolveTextReferences(value, localization);
      }
    }
  }

  validateMergedData(mergedData) {
    return {
      isValid: true,
      errors: [],
      stats: {
        totalModels: mergedData.Packages?.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0) || 0
      }
    };
  }
}

class DataRouter {
  constructor() {
    this.formatDetector = new FormatDetector();
    this.dataLoader4x = new DataLoader4x();
    this.dataMerger4x = new DataMerger4x();
  }

  async processData(input) {
    // Step 1: Detect format
    const detection = await this.formatDetector.detectFormat(input);
    
    if (detection.errors.length > 0) {
      throw new Error(`Format detection failed: ${detection.errors.join(', ')}`);
    }

    if (detection.confidence < 0.5) {
      throw new Error(`Low confidence in format detection (${detection.confidence})`);
    }

    // Step 2: Route to appropriate processor
    let processedData;
    
    if (detection.format === '3.x') {
      processedData = detection.data;
    } else if (detection.format === '4.x') {
      const loadedData = await this.dataLoader4x.loadAll(detection.files);
      processedData = this.dataMerger4x.merge(loadedData);
    } else {
      throw new Error(`Unsupported format: ${detection.format}`);
    }

    // Step 3: Add metadata
    processedData._metadata = {
      sourceFormat: detection.format,
      sourceVersion: detection.version,
      confidence: detection.confidence,
      inputType: detection.inputType
    };

    return processedData;
  }

  getProcessingStats(data) {
    return {
      format: data._metadata?.sourceFormat || 'unknown',
      version: data._metadata?.sourceVersion || 'unknown',
      confidence: data._metadata?.confidence || 0,
      packageCount: data.Packages?.length || 0,
      totalModels: data.Packages?.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0) || 0,
      globalVariableNamespaces: data.GlobalVariables?.length || 0,
      totalGlobalVariables: data.GlobalVariables?.reduce((sum, ns) => sum + (ns.Variables?.length || 0), 0) || 0
    };
  }
}

// Load demo files
function loadDemo4Files(dirPath) {
  const files = {};
  
  try {
    const fileList = fs.readdirSync(dirPath);
    
    for (const fileName of fileList) {
      const filePath = path.join(dirPath, fileName);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && fileName.endsWith('.json')) {
        const content = fs.readFileSync(filePath, 'utf8');
        files[fileName] = content;
      }
    }
    
    return files;
  } catch (error) {
    console.error('Error loading demo4 files:', error);
    throw error;
  }
}

function loadDemo3File(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading demo3 file:', error);
    throw error;
  }
}

// Main test function
async function testFormatDetection() {
  console.log('🧪 === Testing Format Detection and Routing ===\n');

  const router = new DataRouter();

  try {
    // Test 1: 4.x format detection and processing
    console.log('🔍 Test 1: 4.x Format Detection and Processing');
    const demo4Path = path.resolve('./demo4.json');
    const demo4Files = loadDemo4Files(demo4Path);
    
    console.log('📂 Loaded 4.x files:', Object.keys(demo4Files).length);
    
    const result4x = await router.processData(demo4Files);
    const stats4x = router.getProcessingStats(result4x);
    
    console.log('✅ 4.x Processing Results:');
    console.log('- Format:', stats4x.format);
    console.log('- Version:', stats4x.version);
    console.log('- Confidence:', stats4x.confidence);
    console.log('- Packages:', stats4x.packageCount);
    console.log('- Total Models:', stats4x.totalModels);
    console.log('- Global Variables:', stats4x.totalGlobalVariables);

    // Test 2: 3.x format detection and processing
    console.log('\n🔍 Test 2: 3.x Format Detection and Processing');
    const demo3Path = path.resolve('./demo.json');
    const demo3Data = loadDemo3File(demo3Path);
    
    console.log('📄 Loaded 3.x file');
    
    const result3x = await router.processData(demo3Data);
    const stats3x = router.getProcessingStats(result3x);
    
    console.log('✅ 3.x Processing Results:');
    console.log('- Format:', stats3x.format);
    console.log('- Version:', stats3x.version);
    console.log('- Confidence:', stats3x.confidence);
    console.log('- Packages:', stats3x.packageCount);
    console.log('- Total Models:', stats3x.totalModels);
    console.log('- Global Variables:', stats3x.totalGlobalVariables);

    // Test 3: Compare results
    console.log('\n📊 Comparison Results:');
    console.log('Format Detection:');
    console.log('- 3.x detected correctly:', stats3x.format === '3.x' ? '✅' : '❌');
    console.log('- 4.x detected correctly:', stats4x.format === '4.x' ? '✅' : '❌');
    
    console.log('\nData Structure Consistency:');
    console.log('- Both have Packages:', (stats3x.packageCount > 0 && stats4x.packageCount > 0) ? '✅' : '❌');
    console.log('- Both have Models:', (stats3x.totalModels > 0 && stats4x.totalModels > 0) ? '✅' : '❌');
    console.log('- Both have Global Variables:', (stats3x.totalGlobalVariables > 0 && stats4x.totalGlobalVariables > 0) ? '✅' : '❌');

    console.log('\nData Integrity:');
    console.log('- 3.x Models Count:', stats3x.totalModels);
    console.log('- 4.x Models Count:', stats4x.totalModels);
    console.log('- Model count similar:', Math.abs(stats3x.totalModels - stats4x.totalModels) < 50 ? '✅' : '❌');

    // Test 4: Sample data verification
    console.log('\n🎯 Sample Data Verification:');
    
    const firstPackage3x = result3x.Packages?.[0];
    const firstPackage4x = result4x.Packages?.[0];
    
    if (firstPackage3x && firstPackage4x) {
      const firstModel3x = firstPackage3x.Models?.[0];
      const firstModel4x = firstPackage4x.Models?.[0];
      
      console.log('3.x First Model:');
      console.log('- Type:', firstModel3x?.Type);
      console.log('- DisplayName:', firstModel3x?.Properties?.DisplayName);
      
      console.log('4.x First Model:');
      console.log('- Type:', firstModel4x?.Type);
      console.log('- DisplayName:', firstModel4x?.Properties?.DisplayName);
      
      console.log('Text Resolution Working:', 
        firstModel4x?.Properties?.DisplayName && 
        !firstModel4x.Properties.DisplayName.includes('.') ? '✅' : '❌');
    }

    console.log('\n✅ === Format Detection and Routing Test Complete ===');
    
    return {
      success: true,
      results: {
        '3x': { result: result3x, stats: stats3x },
        '4x': { result: result4x, stats: stats4x }
      }
    };

  } catch (error) {
    console.error('\n❌ === Format Detection Test Failed ===');
    console.error('Error:', error.message);
    throw error;
  }
}

// Run the test
testFormatDetection().catch(console.error);
