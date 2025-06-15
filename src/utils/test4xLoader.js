/**
 * Test script for 4.x data loader
 * This will test loading the demo4.json data
 */

import DataLoader4x from './dataLoader4x.js';
import fs from 'fs';
import path from 'path';

/**
 * Load all files from the demo4.json directory
 * @param {string} dirPath - Path to demo4.json directory
 * @returns {Object} - Object with filename as key and content as value
 */
function loadDemo4Files(dirPath) {
  const files = {};
  
  try {
    const fileList = fs.readdirSync(dirPath);
    console.log('Found files in demo4.json directory:', fileList);
    
    for (const fileName of fileList) {
      const filePath = path.join(dirPath, fileName);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && fileName.endsWith('.json')) {
        const content = fs.readFileSync(filePath, 'utf8');
        files[fileName] = content;
        console.log(`Loaded ${fileName}: ${content.length} characters`);
      }
    }
    
    return files;
  } catch (error) {
    console.error('Error loading demo4 files:', error);
    throw error;
  }
}

/**
 * Test the 4.x data loader
 */
async function test4xLoader() {
  console.log('=== Testing 4.x Data Loader ===\n');
  
  try {
    // Load demo4.json files
    const demo4Path = path.resolve('./demo4.json');
    console.log('Loading files from:', demo4Path);
    const files = loadDemo4Files(demo4Path);
    
    console.log('\nFiles loaded:', Object.keys(files));
    
    // Create loader and load data
    const loader = new DataLoader4x();
    const unifiedData = await loader.loadAll(files);
    
    // Display results
    console.log('\n=== Loading Results ===');
    console.log('Settings:', {
      exportVersion: unifiedData.Settings?.ExportVersion,
      useScriptSupport: unifiedData.Settings?.set_UseScriptSupport
    });
    
    console.log('Project:', {
      name: unifiedData.Project?.Name,
      guid: unifiedData.Project?.Guid
    });
    
    console.log('Global Variables:', {
      namespaces: unifiedData.GlobalVariables?.length || 0,
      totalVariables: unifiedData.GlobalVariables?.reduce((sum, ns) => sum + (ns.Variables?.length || 0), 0) || 0
    });
    
    console.log('Object Definitions:', unifiedData.ObjectDefinitions?.length || 0);
    
    console.log('Packages:', {
      count: unifiedData.Packages?.length || 0,
      totalModels: unifiedData.Packages?.reduce((sum, pkg) => sum + (pkg.Models?.length || 0), 0) || 0
    });
    
    // Show sample data
    if (unifiedData.Packages && unifiedData.Packages.length > 0) {
      const firstPackage = unifiedData.Packages[0];
      console.log('\nFirst Package Sample:', {
        name: firstPackage.Name,
        modelsCount: firstPackage.Models?.length || 0
      });
      
      if (firstPackage.Models && firstPackage.Models.length > 0) {
        const firstModel = firstPackage.Models[0];
        console.log('First Model Sample:', {
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
      console.log('\nFirst Variable Namespace:', {
        namespace: firstNamespace.Namespace,
        variableCount: firstNamespace.Variables?.length || 0
      });
      
      if (firstNamespace.Variables && firstNamespace.Variables.length > 0) {
        const firstVar = firstNamespace.Variables[0];
        console.log('First Variable:', {
          name: firstVar.Variable,
          type: firstVar.Type,
          value: firstVar.Value,
          description: firstVar.Description
        });
      }
    }
    
    console.log('\n=== Test Completed Successfully ===');
    return unifiedData;
    
  } catch (error) {
    console.error('\n=== Test Failed ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

/**
 * Compare with 3.x format structure
 */
async function compareWith3x() {
  console.log('\n=== Comparing with 3.x Format ===');
  
  try {
    // Load 3.x demo.json for comparison
    const demo3Path = path.resolve('./demo.json');
    const demo3Content = fs.readFileSync(demo3Path, 'utf8');
    const demo3Data = JSON.parse(demo3Content);
    
    console.log('3.x Format Structure:');
    console.log('- Settings:', !!demo3Data.Settings);
    console.log('- Project:', !!demo3Data.Project);
    console.log('- GlobalVariables:', demo3Data.GlobalVariables?.length || 0);
    console.log('- ObjectDefinitions:', demo3Data.ObjectDefinitions?.length || 0);
    console.log('- Packages:', demo3Data.Packages?.length || 0);
    console.log('- Hierarchy:', !!demo3Data.Hierarchy);
    
    if (demo3Data.Packages && demo3Data.Packages.length > 0) {
      const firstPackage = demo3Data.Packages[0];
      console.log('- First Package Models:', firstPackage.Models?.length || 0);
    }
    
    // Now test 4.x
    const demo4Data = await test4xLoader();
    
    console.log('\n4.x Format (Converted) Structure:');
    console.log('- Settings:', !!demo4Data.Settings);
    console.log('- Project:', !!demo4Data.Project);
    console.log('- GlobalVariables:', demo4Data.GlobalVariables?.length || 0);
    console.log('- ObjectDefinitions:', demo4Data.ObjectDefinitions?.length || 0);
    console.log('- Packages:', demo4Data.Packages?.length || 0);
    console.log('- Hierarchy:', !!demo4Data.Hierarchy);
    
    if (demo4Data.Packages && demo4Data.Packages.length > 0) {
      const firstPackage = demo4Data.Packages[0];
      console.log('- First Package Models:', firstPackage.Models?.length || 0);
    }
    
    console.log('\n=== Structure Comparison Complete ===');
    
  } catch (error) {
    console.error('Comparison failed:', error.message);
  }
}

// Export functions for use in other modules
export { test4xLoader, compareWith3x, loadDemo4Files };

// If running directly (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  compareWith3x().catch(console.error);
}
