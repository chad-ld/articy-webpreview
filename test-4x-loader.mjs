/**
 * Node.js test runner for 4.x data loader
 * Run with: node test-4x-loader.mjs
 */

import fs from 'fs';
import path from 'path';

/**
 * Simple 4.x data loader for testing (Node.js compatible version)
 */
class DataLoader4x {
  constructor() {
    this.manifest = null;
    this.globalVariables = null;
    this.hierarchy = null;
    this.objectDefinitions = null;
    this.packageObjects = {};
    this.packageLocalizations = {};
  }

  async loadAll(files) {
    try {
      console.log('Loading 4.x format data...');
      console.log('Available files:', Object.keys(files));

      await this.loadManifest(files);
      await this.loadGlobalVariables(files);
      await this.loadHierarchy(files);
      await this.loadObjectDefinitions(files);
      await this.loadPackageData(files);

      const unifiedData = this.combineData();
      console.log('4.x data loading complete');
      return unifiedData;
    } catch (error) {
      console.error('Error loading 4.x data:', error);
      throw new Error(`Failed to load 4.x data: ${error.message}`);
    }
  }

  async loadManifest(files) {
    const manifestContent = files['manifest.json'];
    if (!manifestContent) {
      throw new Error('manifest.json not found - required for 4.x format');
    }

    try {
      this.manifest = JSON.parse(manifestContent);
      console.log('✅ Manifest loaded:', {
        exportVersion: this.manifest.Settings?.ExportVersion,
        packagesCount: this.manifest.Packages?.length || 0
      });
    } catch (error) {
      throw new Error(`Failed to parse manifest.json: ${error.message}`);
    }
  }

  async loadGlobalVariables(files) {
    const fileName = this.manifest.GlobalVariables?.FileName;
    if (!fileName) {
      console.warn('No global variables file specified in manifest');
      return;
    }

    const content = files[fileName];
    if (!content) {
      console.warn(`Global variables file not found: ${fileName}`);
      return;
    }

    try {
      this.globalVariables = JSON.parse(content);
      console.log('✅ Global variables loaded:', this.globalVariables.GlobalVariables?.length || 0, 'namespaces');
    } catch (error) {
      throw new Error(`Failed to parse ${fileName}: ${error.message}`);
    }
  }

  async loadHierarchy(files) {
    const fileName = this.manifest.Hierarchy?.FileName;
    if (!fileName) {
      console.warn('No hierarchy file specified in manifest');
      return;
    }

    const content = files[fileName];
    if (!content) {
      console.warn(`Hierarchy file not found: ${fileName}`);
      return;
    }

    try {
      this.hierarchy = JSON.parse(content);
      console.log('✅ Hierarchy loaded');
    } catch (error) {
      throw new Error(`Failed to parse ${fileName}: ${error.message}`);
    }
  }

  async loadObjectDefinitions(files) {
    const typesFileName = this.manifest.ObjectDefinitions?.Types?.FileName;
    if (typesFileName && files[typesFileName]) {
      try {
        this.objectDefinitions = JSON.parse(files[typesFileName]);
        console.log('✅ Object definitions loaded');
      } catch (error) {
        throw new Error(`Failed to parse ${typesFileName}: ${error.message}`);
      }
    }
  }

  async loadPackageData(files) {
    if (!this.manifest.Packages) {
      console.warn('No packages found in manifest');
      return;
    }

    for (const packageInfo of this.manifest.Packages) {
      const packageId = packageInfo.Id;
      
      // Load package objects
      const objectsFileName = packageInfo.Files?.Objects?.FileName;
      if (objectsFileName && files[objectsFileName]) {
        try {
          this.packageObjects[packageId] = JSON.parse(files[objectsFileName]);
          console.log(`✅ Package objects loaded for ${packageId}:`, this.packageObjects[packageId].Objects?.length || 0, 'objects');
        } catch (error) {
          throw new Error(`Failed to parse ${objectsFileName}: ${error.message}`);
        }
      }

      // Load package localization
      const textsFileName = packageInfo.Files?.Texts?.FileName;
      if (textsFileName && files[textsFileName]) {
        try {
          this.packageLocalizations[packageId] = JSON.parse(files[textsFileName]);
          const textCount = Object.keys(this.packageLocalizations[packageId]).length;
          console.log(`✅ Package localization loaded for ${packageId}:`, textCount, 'text entries');
        } catch (error) {
          throw new Error(`Failed to parse ${textsFileName}: ${error.message}`);
        }
      }
    }
  }

  combineData() {
    console.log('🔄 Combining 4.x data into unified structure...');

    const unifiedData = {
      Settings: this.manifest.Settings || {},
      Project: this.manifest.Project || {},
      GlobalVariables: this.globalVariables?.GlobalVariables || [],
      ObjectDefinitions: this.objectDefinitions?.ObjectDefinitions || [],
      Packages: [],
      Hierarchy: this.hierarchy || {}
    };

    // Process packages
    if (this.manifest.Packages) {
      for (const packageInfo of this.manifest.Packages) {
        const packageId = packageInfo.Id;
        const packageObjects = this.packageObjects[packageId];
        const packageLocalization = this.packageLocalizations[packageId];

        if (packageObjects) {
          const unifiedPackage = {
            Name: packageInfo.Name,
            Description: packageInfo.Description,
            IsDefaultPackage: packageInfo.IsDefaultPackage,
            Models: this.resolveTextReferences(packageObjects.Objects || [], packageLocalization || {})
          };

          unifiedData.Packages.push(unifiedPackage);
        }
      }
    }

    console.log('✅ Data combination complete:', {
      globalVariables: unifiedData.GlobalVariables.length,
      objectDefinitions: unifiedData.ObjectDefinitions.length,
      packages: unifiedData.Packages.length,
      totalModels: unifiedData.Packages.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0)
    });

    return unifiedData;
  }

  resolveTextReferences(objects, localization) {
    return objects.map(obj => {
      const resolvedObj = { ...obj };
      this.resolveObjectProperties(resolvedObj.Properties, localization);
      return resolvedObj;
    });
  }

  resolveObjectProperties(properties, localization) {
    if (!properties || typeof properties !== 'object') return;

    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'string' && localization[value]) {
        properties[key] = localization[value]['']?.Text || value;
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'object') {
            this.resolveObjectProperties(item, localization);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        this.resolveObjectProperties(value, localization);
      }
    }
  }
}

/**
 * Load all files from demo4.json directory
 */
function loadDemo4Files(dirPath) {
  const files = {};
  
  try {
    const fileList = fs.readdirSync(dirPath);
    console.log('📁 Found files in demo4.json directory:', fileList);
    
    for (const fileName of fileList) {
      const filePath = path.join(dirPath, fileName);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && fileName.endsWith('.json')) {
        const content = fs.readFileSync(filePath, 'utf8');
        files[fileName] = content;
        console.log(`📄 Loaded ${fileName}: ${(content.length / 1024).toFixed(1)}KB`);
      }
    }
    
    return files;
  } catch (error) {
    console.error('❌ Error loading demo4 files:', error);
    throw error;
  }
}

/**
 * Main test function
 */
async function runTest() {
  console.log('🚀 === Testing 4.x Data Loader ===\n');
  
  try {
    // Load demo4.json files
    const demo4Path = path.resolve('./demo4.json');
    console.log('📂 Loading files from:', demo4Path);
    const files = loadDemo4Files(demo4Path);
    
    console.log('\n📋 Files loaded:', Object.keys(files));
    
    // Create loader and load data
    const loader = new DataLoader4x();
    const unifiedData = await loader.loadAll(files);
    
    // Display results
    console.log('\n📊 === Loading Results ===');
    console.log('⚙️  Settings:', {
      exportVersion: unifiedData.Settings?.ExportVersion,
      useScriptSupport: unifiedData.Settings?.set_UseScriptSupport
    });
    
    console.log('📋 Project:', {
      name: unifiedData.Project?.Name,
      guid: unifiedData.Project?.Guid?.substring(0, 8) + '...'
    });
    
    console.log('🔧 Global Variables:', {
      namespaces: unifiedData.GlobalVariables?.length || 0,
      totalVariables: unifiedData.GlobalVariables?.reduce((sum, ns) => sum + (ns.Variables?.length || 0), 0) || 0
    });
    
    console.log('📚 Object Definitions:', unifiedData.ObjectDefinitions?.length || 0);
    
    console.log('📦 Packages:', {
      count: unifiedData.Packages?.length || 0,
      totalModels: unifiedData.Packages?.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0) || 0
    });
    
    // Show sample data
    if (unifiedData.Packages && unifiedData.Packages.length > 0) {
      const firstPackage = unifiedData.Packages[0];
      console.log('\n📋 First Package Sample:', {
        name: firstPackage.Name,
        modelsCount: firstPackage.Models?.length || 0
      });
      
      if (firstPackage.Models && firstPackage.Models.length > 0) {
        const firstModel = firstPackage.Models[0];
        console.log('🎯 First Model Sample:', {
          type: firstModel.Type,
          id: firstModel.Properties?.Id,
          displayName: firstModel.Properties?.DisplayName,
          technicalName: firstModel.Properties?.TechnicalName
        });
      }
    }
    
    // Show global variables sample
    if (unifiedData.GlobalVariables && unifiedData.GlobalVariables.length > 0) {
      const firstNamespace = unifiedData.GlobalVariables[0];
      console.log('\n🔧 First Variable Namespace:', {
        namespace: firstNamespace.Namespace,
        variableCount: firstNamespace.Variables?.length || 0
      });
      
      if (firstNamespace.Variables && firstNamespace.Variables.length > 0) {
        const firstVar = firstNamespace.Variables[0];
        console.log('📊 First Variable:', {
          name: firstVar.Variable,
          type: firstVar.Type,
          value: firstVar.Value,
          description: firstVar.Description?.substring(0, 50) + (firstVar.Description?.length > 50 ? '...' : '')
        });
      }
    }
    
    console.log('\n✅ === Test Completed Successfully ===');
    return unifiedData;
    
  } catch (error) {
    console.error('\n❌ === Test Failed ===');
    console.error('Error:', error.message);
    throw error;
  }
}

// Run the test
runTest().catch(console.error);
