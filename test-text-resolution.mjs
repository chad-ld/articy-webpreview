/**
 * Test text resolution functionality
 * This will verify that text references are properly resolved
 */

import fs from 'fs';
import path from 'path';

// Import our loader
import('./test-4x-loader.mjs').then(async () => {
  
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

  console.log('🔍 === Testing Text Resolution ===\n');

  try {
    // Load the raw files to examine text references
    const demo4Path = path.resolve('./demo4.json');
    const files = loadDemo4Files(demo4Path);
    
    // Parse the objects and localization files
    const objectsData = JSON.parse(files['package_010000060000401C_objects.json']);
    const localizationData = JSON.parse(files['package_010000060000401C_localization.json']);
    
    console.log('📋 Raw Data Analysis:');
    console.log('- Objects count:', objectsData.Objects?.length || 0);
    console.log('- Localization entries:', Object.keys(localizationData).length);
    
    // Find some examples of text references
    const sampleObjects = objectsData.Objects.slice(0, 5);
    
    console.log('\n🔍 Text Reference Examples (Before Resolution):');
    sampleObjects.forEach((obj, index) => {
      console.log(`\nObject ${index + 1} (${obj.Type}):`);
      console.log('- ID:', obj.Properties?.Id);
      console.log('- DisplayName (reference):', obj.Properties?.DisplayName);
      console.log('- TechnicalName:', obj.Properties?.TechnicalName);
      
      // Show what the reference resolves to
      const displayNameRef = obj.Properties?.DisplayName;
      if (displayNameRef && localizationData[displayNameRef]) {
        console.log('- DisplayName (resolved):', localizationData[displayNameRef]['']?.Text);
      }
      
      // Check for other text properties
      if (obj.Properties?.Text) {
        console.log('- Text (reference):', obj.Properties.Text);
        if (localizationData[obj.Properties.Text]) {
          console.log('- Text (resolved):', localizationData[obj.Properties.Text]['']?.Text?.substring(0, 100) + '...');
        }
      }
    });
    
    // Now test our loader's text resolution
    console.log('\n🔄 Testing Automatic Text Resolution...');
    
    // Simple text resolver for testing
    function resolveTextReferences(objects, localization) {
      return objects.map(obj => {
        const resolvedObj = { ...obj };
        resolveObjectProperties(resolvedObj.Properties, localization);
        return resolvedObj;
      });
    }

    function resolveObjectProperties(properties, localization) {
      if (!properties || typeof properties !== 'object') return;

      for (const [key, value] of Object.entries(properties)) {
        if (typeof value === 'string' && localization[value]) {
          properties[key] = localization[value]['']?.Text || value;
        } else if (Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'object') {
              resolveObjectProperties(item, localization);
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          resolveObjectProperties(value, localization);
        }
      }
    }
    
    const resolvedObjects = resolveTextReferences(sampleObjects, localizationData);
    
    console.log('\n✅ Text Resolution Results (After Resolution):');
    resolvedObjects.forEach((obj, index) => {
      console.log(`\nObject ${index + 1} (${obj.Type}):`);
      console.log('- ID:', obj.Properties?.Id);
      console.log('- DisplayName (resolved):', obj.Properties?.DisplayName);
      console.log('- TechnicalName:', obj.Properties?.TechnicalName);
      
      if (obj.Properties?.Text) {
        const text = obj.Properties.Text;
        console.log('- Text (resolved):', text.length > 100 ? text.substring(0, 100) + '...' : text);
      }
    });
    
    // Test specific node types that are important for the web viewer
    console.log('\n🎯 Testing Important Node Types:');
    
    const nodeTypes = ['FlowFragment', 'Dialogue', 'Instruction', 'Hub', 'Jump', 'Condition'];
    
    nodeTypes.forEach(nodeType => {
      const nodesOfType = objectsData.Objects.filter(obj => obj.Type === nodeType);
      if (nodesOfType.length > 0) {
        console.log(`\n${nodeType} nodes: ${nodesOfType.length} found`);
        
        const firstNode = nodesOfType[0];
        const resolvedNode = resolveTextReferences([firstNode], localizationData)[0];
        
        console.log('- Sample ID:', resolvedNode.Properties?.Id);
        console.log('- Sample DisplayName:', resolvedNode.Properties?.DisplayName);
        
        if (resolvedNode.Properties?.Text) {
          const text = resolvedNode.Properties.Text;
          console.log('- Sample Text:', text.length > 50 ? text.substring(0, 50) + '...' : text);
        }
        
        // Check for input/output pins
        if (resolvedNode.Properties?.InputPins) {
          console.log('- Input Pins:', resolvedNode.Properties.InputPins.length);
        }
        if (resolvedNode.Properties?.OutputPins) {
          console.log('- Output Pins:', resolvedNode.Properties.OutputPins.length);
        }
      }
    });
    
    console.log('\n✅ === Text Resolution Test Complete ===');
    
  } catch (error) {
    console.error('\n❌ Text Resolution Test Failed:', error.message);
    throw error;
  }
});
