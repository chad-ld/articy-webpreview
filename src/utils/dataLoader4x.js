/**
 * Articy Draft X (4.x) Data Loader
 * Handles loading and parsing multiple JSON files from 4.x format
 */

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

  /**
   * Load all 4.x data from a collection of files
   * @param {Object} files - Object with filename as key and file content as value
   * @returns {Promise<Object>} - Unified data structure compatible with 3.x format
   */
  async loadAll(files) {
    try {
      console.log('Loading 4.x format data...');
      console.log('Available files:', Object.keys(files));
      console.log('File sizes:', Object.keys(files).map(name => `${name}: ${files[name]?.length || 0} chars`));

      // Step 1: Load manifest first to understand file structure
      await this.loadManifest(files);

      // Step 2: Load all referenced files
      await this.loadGlobalVariables(files);
      await this.loadHierarchy(files);
      await this.loadObjectDefinitions(files);
      await this.loadPackageData(files);
      await this.loadScriptMethods(files);

      // Step 3: Combine all data into unified structure
      const unifiedData = this.combineData();

      console.log('4.x data loading complete');
      return unifiedData;
    } catch (error) {
      console.error('Error loading 4.x data:', error);
      throw new Error(`Failed to load 4.x data: ${error.message}`);
    }
  }

  /**
   * Load all 4.x data from a collection of files (raw data for DataMerger4x)
   * @param {Object} files - Object with filename as key and file content as value
   * @returns {Promise<Object>} - Raw loaded data structure for DataMerger4x
   */
  async loadAllRaw(files) {
    try {
      console.log('Loading 4.x format data (raw)...');
      console.log('Available files:', Object.keys(files));
      console.log('File sizes:', Object.keys(files).map(name => `${name}: ${files[name]?.length || 0} chars`));

      // Step 1: Load manifest first to understand file structure
      await this.loadManifest(files);

      // Step 2: Load all referenced files
      await this.loadGlobalVariables(files);
      await this.loadHierarchy(files);
      await this.loadObjectDefinitions(files);
      await this.loadPackageData(files);
      await this.loadScriptMethods(files);

      // Step 3: Return raw loaded data structure for DataMerger4x
      const rawData = {
        manifest: this.manifest,
        globalVariables: this.globalVariables,
        hierarchy: this.hierarchy,
        objectDefinitions: this.objectDefinitions,
        objectDefinitionsLocalization: this.objectDefinitionsLocalization,
        packages: this.packageObjects,
        localizations: this.packageLocalizations,
        scriptMethods: this.scriptMethods
      };

      console.log('4.x raw data loading complete:', {
        hasManifest: !!rawData.manifest,
        packageCount: Object.keys(rawData.packages).length,
        totalObjects: Object.values(rawData.packages).reduce((sum, pkg) => sum + (pkg.Objects?.length || 0), 0)
      });

      return rawData;
    } catch (error) {
      console.error('Error loading 4.x raw data:', error);
      throw new Error(`Failed to load 4.x raw data: ${error.message}`);
    }
  }

  /**
   * Load and parse manifest.json
   * @param {Object} files - Collection of files
   */
  async loadManifest(files) {
    const manifestContent = files['manifest.json'];
    if (!manifestContent) {
      throw new Error('manifest.json not found - required for 4.x format');
    }

    try {
      this.manifest = JSON.parse(manifestContent);
      console.log('Manifest loaded:', {
        exportVersion: this.manifest.Settings?.ExportVersion,
        packagesCount: this.manifest.Packages?.length || 0
      });
    } catch (error) {
      throw new Error(`Failed to parse manifest.json: ${error.message}`);
    }
  }

  /**
   * Load global variables data
   * @param {Object} files - Collection of files
   */
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
      console.log('Global variables loaded:', this.globalVariables.GlobalVariables?.length || 0, 'namespaces');
    } catch (error) {
      throw new Error(`Failed to parse ${fileName}: ${error.message}`);
    }
  }

  /**
   * Load hierarchy data
   * @param {Object} files - Collection of files
   */
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
      console.log('Hierarchy loaded');
    } catch (error) {
      throw new Error(`Failed to parse ${fileName}: ${error.message}`);
    }
  }

  /**
   * Load object definitions
   * @param {Object} files - Collection of files
   */
  async loadObjectDefinitions(files) {
    // Load type definitions
    const typesFileName = this.manifest.ObjectDefinitions?.Types?.FileName;
    if (typesFileName && files[typesFileName]) {
      try {
        this.objectDefinitions = JSON.parse(files[typesFileName]);
        console.log('Object definitions loaded');
      } catch (error) {
        throw new Error(`Failed to parse ${typesFileName}: ${error.message}`);
      }
    }

    // Load type localization
    const textsFileName = this.manifest.ObjectDefinitions?.Texts?.FileName;
    if (textsFileName && files[textsFileName]) {
      try {
        this.objectDefinitionsLocalization = JSON.parse(files[textsFileName]);
        console.log('Object definitions localization loaded');
      } catch (error) {
        throw new Error(`Failed to parse ${textsFileName}: ${error.message}`);
      }
    }
  }

  /**
   * Load package data (objects and localizations)
   * @param {Object} files - Collection of files
   */
  async loadPackageData(files) {
    if (!this.manifest.Packages) {
      console.warn('No packages found in manifest');
      return;
    }

    for (const packageInfo of this.manifest.Packages) {
      const packageId = packageInfo.Id;

      console.log(`🔍 Processing package:`, {
        id: packageId,
        name: packageInfo.Name,
        objectsFile: packageInfo.Files?.Objects?.FileName
      });

      // Load package objects
      const objectsFileName = packageInfo.Files?.Objects?.FileName;
      if (objectsFileName && files[objectsFileName]) {
        try {
          const rawData = JSON.parse(files[objectsFileName]);
          this.packageObjects[packageId] = rawData;

          console.log(`📦 Package objects loaded for ${packageId}:`, {
            objectsCount: rawData.Objects?.length || 0,
            hasObjects: !!rawData.Objects,
            topLevelKeys: Object.keys(rawData),
            firstObjectType: rawData.Objects?.[0]?.Type || 'none',
            rawDataType: typeof rawData,
            isArray: Array.isArray(rawData)
          });

          // Debug: Log structure if no objects found
          if (!rawData.Objects || rawData.Objects.length === 0) {
            console.log(`🔍 Package ${packageId} full structure:`, rawData);
          } else {
            console.log(`✅ Package ${packageId} has ${rawData.Objects.length} objects`);
          }
        } catch (error) {
          console.error(`❌ Failed to parse ${objectsFileName}:`, error);
          throw new Error(`Failed to parse ${objectsFileName}: ${error.message}`);
        }
      } else {
        console.warn(`⚠️ Objects file not found: ${objectsFileName}`);
      }

      // Load package localization
      const textsFileName = packageInfo.Files?.Texts?.FileName;
      if (textsFileName && files[textsFileName]) {
        try {
          this.packageLocalizations[packageId] = JSON.parse(files[textsFileName]);
          const textCount = Object.keys(this.packageLocalizations[packageId]).length;
          console.log(`Package localization loaded for ${packageId}:`, textCount, 'text entries');
        } catch (error) {
          throw new Error(`Failed to parse ${textsFileName}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Load script methods
   * @param {Object} files - Collection of files
   */
  async loadScriptMethods(files) {
    const fileName = this.manifest.ScriptMethods?.FileName;
    if (!fileName) {
      console.log('No script methods file specified in manifest');
      return;
    }

    const content = files[fileName];
    if (!content) {
      console.warn(`Script methods file not found: ${fileName}`);
      return;
    }

    try {
      this.scriptMethods = JSON.parse(content);
      console.log('Script methods loaded');
    } catch (error) {
      throw new Error(`Failed to parse ${fileName}: ${error.message}`);
    }
  }

  /**
   * Combine all loaded data into a unified structure compatible with 3.x format
   * @returns {Object} - Unified data structure
   */
  combineData() {
    console.log('Combining 4.x data into unified structure...');

    // Start with manifest data as base
    const unifiedData = {
      Settings: this.manifest.Settings || {},
      Project: this.manifest.Project || {},
      GlobalVariables: this.globalVariables?.GlobalVariables || [],
      ObjectDefinitions: this.objectDefinitions?.ObjectDefinitions || [],
      Packages: [],
      Hierarchy: this.hierarchy || {},
      ScriptMethods: this.scriptMethods?.ScriptMethods || []
    };

    // Process packages
    if (this.manifest.Packages) {
      for (const packageInfo of this.manifest.Packages) {
        const packageId = packageInfo.Id;
        const packageObjects = this.packageObjects[packageId];
        const packageLocalization = this.packageLocalizations[packageId];

        if (packageObjects) {
          // Create package structure similar to 3.x
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

    console.log('Data combination complete:', {
      globalVariables: unifiedData.GlobalVariables.length,
      objectDefinitions: unifiedData.ObjectDefinitions.length,
      packages: unifiedData.Packages.length,
      totalModels: unifiedData.Packages.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0)
    });

    return unifiedData;
  }

  /**
   * Resolve text references in objects using localization data
   * @param {Array} objects - Array of objects with text references
   * @param {Object} localization - Localization data
   * @returns {Array} - Objects with resolved text
   */
  resolveTextReferences(objects, localization) {
    return objects.map(obj => {
      const resolvedObj = { ...obj };
      
      // Recursively resolve text references in properties
      this.resolveObjectProperties(resolvedObj.Properties, localization);
      
      return resolvedObj;
    });
  }

  /**
   * Recursively resolve text references in object properties
   * @param {Object} properties - Object properties
   * @param {Object} localization - Localization data
   */
  resolveObjectProperties(properties, localization) {
    if (!properties || typeof properties !== 'object') return;

    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'string' && localization[value]) {
        // This is a text reference, resolve it
        properties[key] = localization[value]['']?.Text || value;
      } else if (Array.isArray(value)) {
        // Handle arrays (like InputPins, OutputPins)
        value.forEach(item => {
          if (typeof item === 'object') {
            this.resolveObjectProperties(item, localization);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        // Recursively handle nested objects
        this.resolveObjectProperties(value, localization);
      }
    }
  }
}

export default DataLoader4x;
