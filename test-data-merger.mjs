/**
 * Test the complete 4.x data loading and merging pipeline
 */

import fs from 'fs';
import path from 'path';

// Simple DataLoader4x for testing
class DataLoader4x {
  constructor() {
    this.manifest = null;
    this.globalVariables = null;
    this.hierarchy = null;
    this.objectDefinitions = null;
    this.objectDefinitionsLocalization = null;
    this.packageObjects = {};
    this.packageLocalizations = {};
    this.scriptMethods = null;
  }

  async loadAll(files) {
    await this.loadManifest(files);
    await this.loadGlobalVariables(files);
    await this.loadHierarchy(files);
    await this.loadObjectDefinitions(files);
    await this.loadPackageData(files);
    await this.loadScriptMethods(files);

    return {
      manifest: this.manifest,
      globalVariables: this.globalVariables,
      hierarchy: this.hierarchy,
      objectDefinitions: this.objectDefinitions,
      objectDefinitionsLocalization: this.objectDefinitionsLocalization,
      packages: this.packageObjects,
      localizations: this.packageLocalizations,
      scriptMethods: this.scriptMethods
    };
  }

  async loadManifest(files) {
    this.manifest = JSON.parse(files['manifest.json']);
  }

  async loadGlobalVariables(files) {
    const fileName = this.manifest.GlobalVariables?.FileName;
    if (fileName && files[fileName]) {
      this.globalVariables = JSON.parse(files[fileName]);
    }
  }

  async loadHierarchy(files) {
    const fileName = this.manifest.Hierarchy?.FileName;
    if (fileName && files[fileName]) {
      this.hierarchy = JSON.parse(files[fileName]);
    }
  }

  async loadObjectDefinitions(files) {
    const typesFileName = this.manifest.ObjectDefinitions?.Types?.FileName;
    if (typesFileName && files[typesFileName]) {
      this.objectDefinitions = JSON.parse(files[typesFileName]);
    }

    const textsFileName = this.manifest.ObjectDefinitions?.Texts?.FileName;
    if (textsFileName && files[textsFileName]) {
      this.objectDefinitionsLocalization = JSON.parse(files[textsFileName]);
    }
  }

  async loadPackageData(files) {
    if (!this.manifest.Packages) return;

    for (const packageInfo of this.manifest.Packages) {
      const packageId = packageInfo.Id;
      
      const objectsFileName = packageInfo.Files?.Objects?.FileName;
      if (objectsFileName && files[objectsFileName]) {
        this.packageObjects[packageId] = {
          ...packageInfo,
          Objects: JSON.parse(files[objectsFileName]).Objects
        };
      }

      const textsFileName = packageInfo.Files?.Texts?.FileName;
      if (textsFileName && files[textsFileName]) {
        this.packageLocalizations[packageId] = JSON.parse(files[textsFileName]);
      }
    }
  }

  async loadScriptMethods(files) {
    const fileName = this.manifest.ScriptMethods?.FileName;
    if (fileName && files[fileName]) {
      this.scriptMethods = JSON.parse(files[fileName]);
    }
  }
}

// Simple DataMerger4x for testing
class DataMerger4x {
  merge(loadedData) {
    const mergedData = {
      Settings: loadedData.manifest?.Settings || {},
      Project: loadedData.manifest?.Project || {},
      GlobalVariables: loadedData.globalVariables?.GlobalVariables || [],
      ObjectDefinitions: loadedData.objectDefinitions?.ObjectDefinitions || [],
      Packages: this.mergePackages(loadedData.packages, loadedData.localizations),
      Hierarchy: loadedData.hierarchy || {},
      ScriptMethods: loadedData.scriptMethods?.ScriptMethods || []
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
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {}
    };

    const requiredProps = ['Settings', 'Project', 'GlobalVariables', 'ObjectDefinitions', 'Packages'];
    for (const prop of requiredProps) {
      if (!mergedData[prop]) {
        validation.errors.push(`Missing required property: ${prop}`);
        validation.isValid = false;
      }
    }

    if (Array.isArray(mergedData.Packages)) {
      validation.stats.packageCount = mergedData.Packages.length;
      validation.stats.totalModels = mergedData.Packages.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0);
    }

    if (Array.isArray(mergedData.GlobalVariables)) {
      validation.stats.globalVariableNamespaces = mergedData.GlobalVariables.length;
      validation.stats.totalGlobalVariables = mergedData.GlobalVariables.reduce((sum, ns) => sum + (ns.Variables?.length || 0), 0);
    }

    return validation;
  }

  createSummary(mergedData) {
    const summary = {
      format: '4.x (converted to 3.x-compatible)',
      exportVersion: mergedData.Settings?.ExportVersion,
      projectName: mergedData.Project?.Name,
      packageCount: mergedData.Packages?.length || 0,
      totalModels: mergedData.Packages?.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0) || 0,
      globalVariableNamespaces: mergedData.GlobalVariables?.length || 0,
      totalGlobalVariables: mergedData.GlobalVariables?.reduce((sum, ns) => sum + (ns.Variables?.length || 0), 0) || 0,
      objectDefinitions: mergedData.ObjectDefinitions?.length || 0,
      hasHierarchy: !!mergedData.Hierarchy,
      hasScriptMethods: !!(mergedData.ScriptMethods?.length)
    };

    summary.nodeTypes = {};
    if (mergedData.Packages) {
      mergedData.Packages.forEach(pkg => {
        if (pkg.Models) {
          pkg.Models.forEach(model => {
            const type = model.Type;
            summary.nodeTypes[type] = (summary.nodeTypes[type] || 0) + 1;
          });
        }
      });
    }

    return summary;
  }
}

// Load demo4.json files
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

// Main test function
async function testDataMerger() {
  console.log('🧪 === Testing Complete 4.x Data Pipeline ===\n');

  try {
    // Load demo4.json files
    const demo4Path = path.resolve('./demo4.json');
    console.log('📂 Loading files from:', demo4Path);
    const files = loadDemo4Files(demo4Path);
    
    console.log('📋 Files loaded:', Object.keys(files).length);

    // Step 1: Load raw data
    console.log('\n🔄 Step 1: Loading raw 4.x data...');
    const loader = new DataLoader4x();
    const loadedData = await loader.loadAll(files);
    
    console.log('✅ Raw data loaded:', {
      hasManifest: !!loadedData.manifest,
      hasGlobalVariables: !!loadedData.globalVariables,
      hasHierarchy: !!loadedData.hierarchy,
      packageCount: Object.keys(loadedData.packages).length,
      localizationCount: Object.keys(loadedData.localizations).length
    });

    // Step 2: Merge data
    console.log('\n🔄 Step 2: Merging data into 3.x-compatible structure...');
    const merger = new DataMerger4x();
    const mergedData = merger.merge(loadedData);
    
    console.log('✅ Data merged successfully');

    // Step 3: Validate merged data
    console.log('\n🔄 Step 3: Validating merged data...');
    const validation = merger.validateMergedData(mergedData);
    
    if (validation.isValid) {
      console.log('✅ Validation passed');
    } else {
      console.log('❌ Validation failed:', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:', validation.warnings);
    }

    console.log('📊 Validation stats:', validation.stats);

    // Step 4: Create summary
    console.log('\n🔄 Step 4: Creating data summary...');
    const summary = merger.createSummary(mergedData);
    
    console.log('📋 === Data Summary ===');
    console.log('Format:', summary.format);
    console.log('Export Version:', summary.exportVersion);
    console.log('Project Name:', summary.projectName);
    console.log('Packages:', summary.packageCount);
    console.log('Total Models:', summary.totalModels);
    console.log('Global Variable Namespaces:', summary.globalVariableNamespaces);
    console.log('Total Global Variables:', summary.totalGlobalVariables);
    console.log('Object Definitions:', summary.objectDefinitions);
    console.log('Has Hierarchy:', summary.hasHierarchy);
    console.log('Has Script Methods:', summary.hasScriptMethods);

    console.log('\n🎯 Node Types:');
    Object.entries(summary.nodeTypes).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });

    // Step 5: Test specific functionality
    console.log('\n🔄 Step 5: Testing specific functionality...');
    
    // Test text resolution
    const firstPackage = mergedData.Packages[0];
    const firstModel = firstPackage?.Models?.[0];
    
    if (firstModel) {
      console.log('🎯 First Model Test:');
      console.log('- Type:', firstModel.Type);
      console.log('- ID:', firstModel.Properties?.Id);
      console.log('- DisplayName (resolved):', firstModel.Properties?.DisplayName);
      console.log('- TechnicalName:', firstModel.Properties?.TechnicalName);
      
      if (firstModel.Properties?.Text) {
        const text = firstModel.Properties.Text;
        console.log('- Text (resolved):', text.length > 50 ? text.substring(0, 50) + '...' : text);
      }
    }

    // Test global variables
    const firstNamespace = mergedData.GlobalVariables[0];
    if (firstNamespace) {
      console.log('\n🔧 First Variable Namespace Test:');
      console.log('- Namespace:', firstNamespace.Namespace);
      console.log('- Variable Count:', firstNamespace.Variables?.length || 0);
      
      const firstVar = firstNamespace.Variables?.[0];
      if (firstVar) {
        console.log('- First Variable:', {
          name: firstVar.Variable,
          type: firstVar.Type,
          value: firstVar.Value
        });
      }
    }

    console.log('\n✅ === Complete Pipeline Test Successful ===');
    
    return {
      loadedData,
      mergedData,
      validation,
      summary
    };

  } catch (error) {
    console.error('\n❌ === Pipeline Test Failed ===');
    console.error('Error:', error.message);
    throw error;
  }
}

// Run the test
testDataMerger().catch(console.error);
