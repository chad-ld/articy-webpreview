/**
 * File Change Monitor - Detect when hybridDatasetDetector.js gets reverted
 * Run this script to monitor for unexpected file changes
 */

import fs from 'fs';
import path from 'path';

const targetFile = './src/utils/hybridDatasetDetector.js';
const checkInterval = 2000; // Check every 2 seconds

console.log('🔍 Monitoring file changes for work loss investigation...');
console.log(`📁 Watching: ${targetFile}`);
console.log(`⏱️  Check interval: ${checkInterval}ms`);
console.log('');

let lastContent = '';
let lastSize = 0;
let checkCount = 0;

function checkFile() {
  checkCount++;
  
  try {
    const stats = fs.statSync(targetFile);
    const content = fs.readFileSync(targetFile, 'utf8');
    
    // Check for specific markers that should be present
    const hasGetLastSuccessfulMethod = content.includes('getLastSuccessfulMethod()');
    const hasLastSuccessfulProperty = content.includes('this.lastSuccessfulMethod = null');
    const hasEnhancedFallback = content.includes('getFileTimestamp');
    
    const currentSize = stats.size;
    const timestamp = new Date().toLocaleTimeString();
    
    // Log status every 10 checks (20 seconds)
    if (checkCount % 10 === 0) {
      console.log(`[${timestamp}] Check #${checkCount} - Size: ${currentSize} bytes`);
      console.log(`  ✅ getLastSuccessfulMethod: ${hasGetLastSuccessfulMethod}`);
      console.log(`  ✅ lastSuccessfulMethod property: ${hasLastSuccessfulProperty}`);
      console.log(`  ✅ Enhanced fallback: ${hasEnhancedFallback}`);
      console.log('');
    }
    
    // Detect significant changes
    if (lastContent && content !== lastContent) {
      console.log(`🚨 [${timestamp}] FILE CONTENT CHANGED!`);
      console.log(`📏 Size change: ${lastSize} → ${currentSize} bytes`);
      console.log(`🔍 getLastSuccessfulMethod: ${hasGetLastSuccessfulMethod}`);
      console.log(`🔍 lastSuccessfulMethod property: ${hasLastSuccessfulProperty}`);
      console.log(`🔍 Enhanced fallback: ${hasEnhancedFallback}`);
      
      if (!hasGetLastSuccessfulMethod || !hasLastSuccessfulProperty) {
        console.log('❌ WORK LOSS DETECTED! Missing critical methods/properties');
      }
      
      console.log('');
    }
    
    // Detect size changes
    if (lastSize && Math.abs(currentSize - lastSize) > 100) {
      console.log(`📏 [${timestamp}] Significant size change: ${lastSize} → ${currentSize} bytes`);
    }
    
    lastContent = content;
    lastSize = currentSize;
    
  } catch (error) {
    console.error(`❌ [${new Date().toLocaleTimeString()}] Error checking file:`, error.message);
  }
}

// Initial check
console.log('🔍 Initial file state:');
checkFile();
console.log('');

// Start monitoring
const interval = setInterval(checkFile, checkInterval);

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping file monitor...');
  clearInterval(interval);
  console.log(`📊 Total checks performed: ${checkCount}`);
  process.exit(0);
});

console.log('🎯 Monitor started. Press Ctrl+C to stop.');
console.log('💡 Now test switching between web/electron modes to see if file gets reverted.');
console.log('');
