/**
 * Auto-Save Console Logger Test Script
 * 
 * This script can be run in the browser console to test the auto-save functionality.
 * 
 * Usage:
 * 1. Open the Articy Web Viewer in your browser (http://localhost:3000/)
 * 2. Enable console logging from the loading screen
 * 3. Open browser developer tools (F12)
 * 4. Copy and paste this entire script into the console
 * 5. Run: testAutoSave()
 */

function testAutoSave() {
    console.log('🧪 Starting Auto-Save Test...');
    console.log('📝 This test will generate 1000 console logs to trigger auto-save');
    
    // Check if console logging is enabled
    if (!window.consoleLogger || !window.consoleLogger.isLoggingEnabled()) {
        console.error('❌ Console logging is not enabled! Please enable it from the loading screen first.');
        return;
    }
    
    const startCount = window.consoleLogger.getLogCount();
    console.log(`📊 Starting log count: ${startCount}`);
    
    // Generate 1000 logs to trigger auto-save
    console.log('🔄 Generating 1000 logs...');
    
    for (let i = 1; i <= 1000; i++) {
        // Use different log types to test comprehensive capture
        const logTypes = ['log', 'info', 'warn', 'error', 'debug'];
        const logType = logTypes[i % logTypes.length];
        
        console[logType](`Auto-save test entry #${i} - Type: ${logType} - Timestamp: ${new Date().toISOString()}`);
        
        // Log progress every 200 entries
        if (i % 200 === 0) {
            console.log(`📊 Progress: ${i}/1000 logs generated`);
        }
    }
    
    console.log('✅ All 1000 logs generated!');
    console.log('⏳ Waiting for auto-save to trigger...');
    
    // Check the log count after a short delay
    setTimeout(() => {
        const finalCount = window.consoleLogger.getLogCount();
        console.log(`📊 Final log count: ${finalCount}`);
        
        if (finalCount === 0) {
            console.log('🎉 SUCCESS! Auto-save triggered and logs were cleared!');
            console.log('📁 Check the logs/ folder on the server for the saved file.');
        } else if (finalCount < 1000) {
            console.log(`🎉 PARTIAL SUCCESS! Auto-save may have triggered. ${1000 - finalCount} logs were processed.`);
            console.log('📁 Check the logs/ folder on the server for saved files.');
        } else {
            console.log('❌ Auto-save did not trigger. Logs were not cleared automatically.');
            console.log('🔧 You can manually save logs using: window.consoleLogger.downloadLogs()');
        }
    }, 2000);
}

function testManualSave() {
    console.log('🧪 Testing Manual Save...');
    
    if (!window.consoleLogger || !window.consoleLogger.isLoggingEnabled()) {
        console.error('❌ Console logging is not enabled! Please enable it from the loading screen first.');
        return;
    }
    
    // Generate a few test logs
    console.log('📝 Generating test logs for manual save...');
    for (let i = 1; i <= 10; i++) {
        console.log(`Manual save test entry #${i} - ${new Date().toISOString()}`);
    }
    
    console.log('💾 Triggering manual save...');
    window.consoleLogger.downloadLogs();
}

function checkConsoleLoggerStatus() {
    console.log('🔍 Console Logger Status Check:');
    
    if (!window.consoleLogger) {
        console.log('❌ Console logger not found. Make sure you\'re on the Articy Web Viewer page.');
        return;
    }
    
    console.log(`📊 Logging enabled: ${window.consoleLogger.isLoggingEnabled()}`);
    console.log(`📊 Current log count: ${window.consoleLogger.getLogCount()}`);
    console.log(`📊 Console logger methods available:`, Object.getOwnPropertyNames(window.consoleLogger));
}

// Auto-run status check when script loads
console.log('🧪 Auto-Save Test Script Loaded!');
console.log('📋 Available test functions:');
console.log('  - testAutoSave() - Generate 1000 logs to test auto-save');
console.log('  - testManualSave() - Test manual save with 10 logs');
console.log('  - checkConsoleLoggerStatus() - Check current logger status');
console.log('');
console.log('💡 Make sure console logging is enabled before running tests!');

// Run initial status check
checkConsoleLoggerStatus();
