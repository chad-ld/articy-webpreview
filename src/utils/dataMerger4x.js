/**
 * Articy Draft X (4.x) Data Merger
 * Combines separated 4.x data back into 3.x-like structure for compatibility
 */

class DataMerger4x {
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
   * Merge 4.x data into 3.x-compatible structure
   * @param {Object} loadedData - Data loaded by DataLoader4x
   * @returns {Object} - 3.x-compatible unified structure
   */
  merge(loadedData) {
    if (this.debugMode) {
      console.log('🔄 Starting data merge process...');
    }

    const mergedData = {
      Settings: this.mergeSettings(loadedData.manifest?.Settings),
      Project: this.mergeProject(loadedData.manifest?.Project),
      GlobalVariables: this.mergeGlobalVariables(loadedData.globalVariables),
      ObjectDefinitions: this.mergeObjectDefinitions(loadedData.objectDefinitions, loadedData.objectDefinitionsLocalization),
      Packages: this.mergePackages(loadedData.packages, loadedData.localizations),
      Hierarchy: this.mergeHierarchy(loadedData.hierarchy),
      ScriptMethods: this.mergeScriptMethods(loadedData.scriptMethods)
    };

    if (this.debugMode) {
      console.log('✅ Data merge complete:', {
        globalVariables: mergedData.GlobalVariables?.length || 0,
        objectDefinitions: mergedData.ObjectDefinitions?.length || 0,
        packages: mergedData.Packages?.length || 0,
        totalModels: mergedData.Packages?.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0) || 0
      });
    }

    return mergedData;
  }

  /**
   * Merge settings data
   * @param {Object} settings - Settings from manifest
   * @returns {Object} - Merged settings
   */
  mergeSettings(settings) {
    if (!settings) return {};

    return {
      ExportVersion: settings.ExportVersion || '2.1',
      set_UseScriptSupport: settings.set_UseScriptSupport || 'False',
      ...settings
    };
  }

  /**
   * Merge project data
   * @param {Object} project - Project from manifest
   * @returns {Object} - Merged project
   */
  mergeProject(project) {
    if (!project) return {};

    return {
      Name: project.Name || 'Untitled Project',
      Guid: project.Guid,
      TechnicalName: project.TechnicalName,
      ...project
    };
  }

  /**
   * Merge global variables
   * @param {Object} globalVariablesData - Global variables data
   * @returns {Array} - Array of variable namespaces
   */
  mergeGlobalVariables(globalVariablesData) {
    if (!globalVariablesData?.GlobalVariables) return [];

    return globalVariablesData.GlobalVariables.map(namespace => ({
      Namespace: namespace.Namespace,
      Variables: namespace.Variables || []
    }));
  }

  /**
   * Merge object definitions
   * @param {Object} objectDefinitions - Object definitions data
   * @param {Object} localization - Object definitions localization
   * @returns {Array} - Array of object definitions
   */
  mergeObjectDefinitions(objectDefinitions, localization) {
    if (!objectDefinitions?.ObjectDefinitions) return [];

    const definitions = objectDefinitions.ObjectDefinitions;
    
    if (!localization) {
      return definitions;
    }

    // Resolve text references in object definitions
    return definitions.map(definition => {
      const mergedDefinition = { ...definition };
      this.resolveTextReferences(mergedDefinition, localization);
      return mergedDefinition;
    });
  }

  /**
   * Merge packages with their objects and localizations
   * @param {Object} packages - Package data by ID
   * @param {Object} localizations - Localization data by package ID
   * @returns {Array} - Array of merged packages
   */
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

  /**
   * Merge models (objects) with their localization
   * @param {Array} objects - Array of objects
   * @param {Object} localization - Localization data
   * @returns {Array} - Array of merged models
   */
  mergeModels(objects, localization) {
    return objects.map(obj => {
      const mergedModel = {
        Type: obj.Type,
        Properties: { ...obj.Properties }
      };

      // Resolve text references in properties
      this.resolveTextReferences(mergedModel.Properties, localization);

      return mergedModel;
    });
  }

  /**
   * Merge hierarchy data
   * @param {Object} hierarchy - Hierarchy data
   * @returns {Object} - Merged hierarchy
   */
  mergeHierarchy(hierarchy) {
    if (!hierarchy) return {};
    return { ...hierarchy };
  }

  /**
   * Merge script methods
   * @param {Object} scriptMethods - Script methods data
   * @returns {Array} - Array of script methods
   */
  mergeScriptMethods(scriptMethods) {
    if (!scriptMethods?.ScriptMethods) return [];
    return scriptMethods.ScriptMethods;
  }

  /**
   * Recursively resolve text references in an object
   * @param {Object} obj - Object to resolve references in
   * @param {Object} localization - Localization data
   */
  resolveTextReferences(obj, localization) {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && localization[value]) {
        // This is a text reference, resolve it
        const resolvedText = localization[value]['']?.Text;
        if (resolvedText !== undefined) {
          obj[key] = resolvedText;
          
          if (this.debugMode && key === 'DisplayName') {
            console.log(`📝 Resolved ${key}: ${value} → ${resolvedText}`);
          }
        }
      } else if (Array.isArray(value)) {
        // Handle arrays (like InputPins, OutputPins)
        value.forEach(item => {
          if (typeof item === 'object') {
            this.resolveTextReferences(item, localization);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        // Recursively handle nested objects
        this.resolveTextReferences(value, localization);
      }
    }
  }

  /**
   * Validate merged data structure
   * @param {Object} mergedData - Merged data to validate
   * @returns {Object} - Validation result
   */
  validateMergedData(mergedData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {}
    };

    // Check required top-level properties
    const requiredProps = ['Settings', 'Project', 'GlobalVariables', 'ObjectDefinitions', 'Packages'];
    for (const prop of requiredProps) {
      if (!mergedData[prop]) {
        validation.errors.push(`Missing required property: ${prop}`);
        validation.isValid = false;
      }
    }

    // Validate Settings
    if (mergedData.Settings && !mergedData.Settings.ExportVersion) {
      validation.warnings.push('Missing ExportVersion in Settings');
    }

    // Validate Project
    if (mergedData.Project && !mergedData.Project.Name) {
      validation.warnings.push('Missing Project Name');
    }

    // Validate Packages
    if (Array.isArray(mergedData.Packages)) {
      validation.stats.packageCount = mergedData.Packages.length;
      validation.stats.totalModels = mergedData.Packages.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0);
      
      mergedData.Packages.forEach((pkg, index) => {
        if (!pkg.Models || !Array.isArray(pkg.Models)) {
          validation.errors.push(`Package ${index} missing Models array`);
          validation.isValid = false;
        }
      });
    } else {
      validation.errors.push('Packages is not an array');
      validation.isValid = false;
    }

    // Validate GlobalVariables
    if (Array.isArray(mergedData.GlobalVariables)) {
      validation.stats.globalVariableNamespaces = mergedData.GlobalVariables.length;
      validation.stats.totalGlobalVariables = mergedData.GlobalVariables.reduce((sum, ns) => sum + (ns.Variables?.length || 0), 0);
    } else {
      validation.warnings.push('GlobalVariables is not an array');
    }

    return validation;
  }

  /**
   * Create a summary of merged data
   * @param {Object} mergedData - Merged data
   * @returns {Object} - Data summary
   */
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

    // Count node types
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

export default DataMerger4x;
