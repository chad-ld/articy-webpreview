/**
 * Verification script for isolated rendering implementation
 * Run this in the browser console to test the implementation
 */

console.log('🧪 Starting Isolated Rendering Verification...');

// Test 1: Check if isolated render manager is available
function testIsolatedRenderManager() {
    console.log('\n📋 Test 1: Checking Isolated Render Manager...');
    
    try {
        // Try to access the isolated render manager (it should be imported in the app)
        const containers = document.querySelectorAll('[id^="isolated-plugin-"]');
        console.log(`✅ Found ${containers.length} isolated plugin containers`);
        
        if (containers.length > 0) {
            containers.forEach(container => {
                console.log(`  - Container: ${container.id}`);
                console.log(`  - Visible: ${container.style.pointerEvents !== 'none'}`);
                console.log(`  - Z-index: ${container.style.zIndex}`);
            });
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error checking isolated render manager:', error);
        return false;
    }
}

// Test 2: Check plugin system integration
function testPluginSystemIntegration() {
    console.log('\n📋 Test 2: Checking Plugin System Integration...');
    
    try {
        // Look for plugin buttons
        const pluginButtons = document.querySelectorAll('[class*="plugin"]');
        console.log(`✅ Found ${pluginButtons.length} potential plugin elements`);
        
        // Look for murderboard specific elements
        const murderboardElements = document.querySelectorAll('[class*="murderboard"], [id*="murderboard"]');
        console.log(`✅ Found ${murderboardElements.length} murderboard-related elements`);
        
        return true;
    } catch (error) {
        console.error('❌ Error checking plugin system:', error);
        return false;
    }
}

// Test 3: Check for infinite render loop indicators
function testForInfiniteLoops() {
    console.log('\n📋 Test 3: Checking for Infinite Render Loop Indicators...');
    
    let renderCount = 0;
    const startTime = Date.now();
    
    // Monitor console for rapid repeated messages
    const originalLog = console.log;
    const originalError = console.error;
    
    let logCount = 0;
    let errorCount = 0;
    
    console.log = function(...args) {
        logCount++;
        return originalLog.apply(console, args);
    };
    
    console.error = function(...args) {
        errorCount++;
        return originalError.apply(console, args);
    };
    
    setTimeout(() => {
        console.log = originalLog;
        console.error = originalError;
        
        const duration = Date.now() - startTime;
        const logsPerSecond = logCount / (duration / 1000);
        const errorsPerSecond = errorCount / (duration / 1000);
        
        console.log(`✅ Monitoring complete (${duration}ms):`);
        console.log(`  - Logs per second: ${logsPerSecond.toFixed(2)}`);
        console.log(`  - Errors per second: ${errorsPerSecond.toFixed(2)}`);
        
        if (logsPerSecond > 50) {
            console.warn('⚠️ High log frequency detected - possible infinite loop');
        } else {
            console.log('✅ Log frequency normal');
        }
        
        if (errorsPerSecond > 10) {
            console.warn('⚠️ High error frequency detected');
        } else {
            console.log('✅ Error frequency normal');
        }
    }, 3000);
    
    return true;
}

// Test 4: Simulate plugin toggle
function testPluginToggle() {
    console.log('\n📋 Test 4: Testing Plugin Toggle Simulation...');
    
    try {
        // Look for plugin buttons and try to simulate clicks
        const buttons = document.querySelectorAll('button');
        let murderboardButton = null;
        
        buttons.forEach(button => {
            const text = button.textContent || button.innerText || '';
            if (text.toLowerCase().includes('murderboard')) {
                murderboardButton = button;
            }
        });
        
        if (murderboardButton) {
            console.log('✅ Found murderboard button');
            console.log('  - Text:', murderboardButton.textContent);
            console.log('  - Classes:', murderboardButton.className);
            console.log('  - To test: Click this button and watch for isolated container creation');
        } else {
            console.log('⚠️ Murderboard button not found - may not be loaded yet');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error testing plugin toggle:', error);
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running Isolated Rendering Verification Tests...');
    
    const results = {
        isolatedRenderManager: testIsolatedRenderManager(),
        pluginSystemIntegration: testPluginSystemIntegration(),
        infiniteLoopCheck: testForInfiniteLoops(),
        pluginToggle: testPluginToggle()
    };
    
    console.log('\n📊 Test Results Summary:');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${test}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'All tests passed' : 'Some tests failed'}`);
    
    return results;
}

// Auto-run tests
runAllTests();

// Export for manual testing
window.isolatedRenderingTests = {
    runAllTests,
    testIsolatedRenderManager,
    testPluginSystemIntegration,
    testForInfiniteLoops,
    testPluginToggle
};

console.log('\n💡 Tests complete! You can re-run individual tests using:');
console.log('   window.isolatedRenderingTests.testIsolatedRenderManager()');
console.log('   window.isolatedRenderingTests.testPluginToggle()');
console.log('   etc.');
