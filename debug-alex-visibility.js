/**
 * Debug script for Alex visibility issue
 * Run this in the browser console to debug why alex.png isn't showing
 */

console.log('🔍 Debugging Alex Visibility Issue...');

// Test function to check Alex specifically
function debugAlexVisibility() {
    console.log('\n📋 Alex Visibility Debug Report:');
    
    // 1. Check if murderboard is open
    const containers = document.querySelectorAll('[id^="isolated-plugin-mysteryworks-murderboard"]');
    
    if (containers.length === 0) {
        console.log('❌ Murderboard plugin not currently visible. Open the murderboard first.');
        return;
    }
    
    console.log(`✅ Found ${containers.length} murderboard container(s)`);
    
    containers.forEach((container, containerIndex) => {
        console.log(`\n🔍 Container ${containerIndex + 1}: ${container.id}`);
        
        // Find all images in the murderboard
        const images = container.querySelectorAll('img');
        console.log(`Found ${images.length} images in murderboard`);
        
        // Look specifically for Alex
        let alexFound = false;
        images.forEach((img, index) => {
            const altText = img.alt || 'unknown';
            const isVisible = img.style.display !== 'none';
            const src = img.src;
            
            if (altText.toLowerCase().includes('alex') || src.toLowerCase().includes('alex')) {
                alexFound = true;
                console.log(`🎯 ALEX FOUND - Image ${index + 1}:`);
                console.log(`  - Alt text: ${altText}`);
                console.log(`  - Source: ${src}`);
                console.log(`  - Visible: ${isVisible ? '✅ YES' : '❌ NO'}`);
                console.log(`  - Display style: ${img.style.display || 'default'}`);
                console.log(`  - Z-index: ${img.style.zIndex || 'default'}`);
                console.log(`  - Position: left=${img.style.left}, top=${img.style.top}`);
                console.log(`  - Size: width=${img.style.width}, height=${img.style.height}`);
            } else {
                console.log(`  ${index + 1}. ${altText}: ${isVisible ? '✅ VISIBLE' : '❌ HIDDEN'}`);
            }
        });
        
        if (!alexFound) {
            console.log('❌ No Alex image found in the murderboard');
        }
    });
}

// Test function to check variables
function debugAlexVariables() {
    console.log('\n📋 Alex Variables Debug:');
    
    // Try to access React component state (this is tricky but possible)
    try {
        // Look for React fiber nodes
        const reactRoot = document.querySelector('#root');
        if (reactRoot && reactRoot._reactInternalFiber) {
            console.log('Found React fiber, but direct variable access is complex');
        }
        
        console.log('💡 To check variables manually:');
        console.log('1. Open the Variables panel in the app');
        console.log('2. Look for these variable names:');
        console.log('   - alex_found (lowercase)');
        console.log('   - Alex_found (capitalized)');
        console.log('   - ALEX_found (uppercase)');
        console.log('3. Make sure the value is exactly: true (boolean, not string)');
        
    } catch (error) {
        console.log('⚠️ Cannot directly access variables from console');
    }
}

// Test function to check PSD structure
function debugPSDStructure() {
    console.log('\n📋 PSD Structure Debug:');
    
    console.log('Expected elements from PSD structure:');
    const expectedElements = [
        'alex',           // ← This is what we're looking for
        'daria', 
        'leo', 
        'liza',
        'bg',
        'va_photo_affair',
        'va_paternity_test',
        'va_new_will',
        // ... and others
    ];
    
    expectedElements.forEach(element => {
        const expectedVariable = `${element}_found`;
        console.log(`  - Element: "${element}" → Variable: "${expectedVariable}"`);
    });
    
    console.log('\n🎯 For Alex specifically:');
    console.log('  - PSD element name: "alex" (lowercase)');
    console.log('  - Expected variable: "alex_found" (lowercase)');
    console.log('  - Variable value must be: true (boolean)');
}

// Test function to simulate setting the variable
function simulateAlexFound() {
    console.log('\n🧪 Simulating Alex Found:');
    console.log('In the Variables panel, you should set:');
    console.log('  Variable name: alex_found');
    console.log('  Variable value: true');
    console.log('  Variable type: boolean (not string "true")');
    console.log('');
    console.log('After setting the variable:');
    console.log('1. Navigate to a new node to trigger variable updates');
    console.log('2. Open the murderboard');
    console.log('3. Alex should now be visible');
}

// Main debug function
function runAlexDebug() {
    console.log('🚀 Running Alex Visibility Debug...');
    
    debugPSDStructure();
    debugAlexVariables();
    debugAlexVisibility();
    simulateAlexFound();
    
    console.log('\n📊 Debug Summary:');
    console.log('Most likely causes:');
    console.log('1. ❓ Variable name case mismatch (alex_found vs Alex_found)');
    console.log('2. ❓ Variable value is string "true" instead of boolean true');
    console.log('3. ❓ Variable is in wrong namespace');
    console.log('4. ❓ Variable change not triggering plugin refresh');
    console.log('5. ❓ Asset file alex.png missing from assets folder');
    
    console.log('\n💡 Next steps:');
    console.log('1. Check Variables panel for exact variable name and value');
    console.log('2. Run debugAlexVisibility() after opening murderboard');
    console.log('3. Check browser console for any asset loading errors');
}

// Export functions for manual testing
window.alexDebug = {
    runAlexDebug,
    debugAlexVisibility,
    debugAlexVariables,
    debugPSDStructure,
    simulateAlexFound
};

// Auto-run debug
runAlexDebug();

console.log('\n💡 Available debug functions:');
console.log('  - window.alexDebug.debugAlexVisibility() - Check if Alex image is in DOM');
console.log('  - window.alexDebug.debugAlexVariables() - Check variable setup');
console.log('  - window.alexDebug.simulateAlexFound() - Show how to set variable');
