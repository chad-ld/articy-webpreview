/**
 * Test script for murderboard variable-based visibility system
 * Run this in the browser console to test the evidence visibility functionality
 */

console.log('🧪 Starting Murderboard Variable Visibility Test...');

// Test function to check current evidence visibility
function checkEvidenceVisibility() {
    console.log('\n📋 Checking Current Evidence Visibility...');
    
    // Look for isolated plugin containers
    const containers = document.querySelectorAll('[id^="isolated-plugin-mysteryworks-murderboard"]');
    
    if (containers.length === 0) {
        console.log('⚠️ Murderboard plugin not currently visible. Open the murderboard first.');
        return;
    }
    
    containers.forEach(container => {
        console.log(`\n🔍 Checking container: ${container.id}`);
        
        // Find all images in the murderboard
        const images = container.querySelectorAll('img');
        console.log(`Found ${images.length} images in murderboard`);
        
        images.forEach((img, index) => {
            const isVisible = img.style.display !== 'none';
            const altText = img.alt || 'unknown';
            console.log(`  ${index + 1}. ${altText}: ${isVisible ? '✅ VISIBLE' : '❌ HIDDEN'}`);
        });
    });
}

// Test function to simulate setting evidence variables
function simulateEvidenceFound(evidenceName) {
    console.log(`\n🔬 Simulating evidence found: ${evidenceName}`);
    
    // This would normally be done by the Articy flow, but we can simulate it for testing
    const foundVariableName = `${evidenceName}_found`;
    console.log(`Setting variable: ${foundVariableName} = true`);
    
    // Note: In the actual app, variables are managed by the Articy project
    // This is just for demonstration of what the system looks for
    console.log(`💡 In the actual Articy flow, you would set: ${foundVariableName} = true`);
    console.log(`Then navigate to a new node to trigger variable updates`);
}

// Test function to list all expected evidence items
function listExpectedEvidence() {
    console.log('\n📋 Expected Evidence Items (from PSD structure):');
    
    const expectedEvidence = [
        'va_paternity_test_update',
        'va_new_will_update', 
        'va_photo_affair_update',
        'suspect_liza_update',
        'va_new_will',
        'ap_leoalexpic',
        'va_original_will',
        'va_autopsy_original',
        'va_paternity_test',
        'va_reciept',
        'va_photo_affair'
        // 'bg' is always visible (background)
    ];
    
    console.log('Evidence items that should be controlled by variables:');
    expectedEvidence.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item} (controlled by: ${item}_found)`);
    });
    
    console.log('\n💡 Background (bg) is always visible');
}

// Test function to check current Articy variables
function checkArticyVariables() {
    console.log('\n📋 Checking Current Articy Variables...');
    
    // Try to access the React app's state (this is a bit hacky but useful for testing)
    try {
        // Look for React fiber nodes that might contain the project data
        const reactRoot = document.querySelector('#root');
        if (reactRoot && reactRoot._reactInternalFiber) {
            console.log('Found React fiber, but variable access requires more complex inspection');
        }
        
        console.log('💡 To see current variables:');
        console.log('  1. Open the Variables panel in the app');
        console.log('  2. Look for variables ending with "_found"');
        console.log('  3. Set them to true to reveal evidence');
        
    } catch (error) {
        console.log('⚠️ Cannot directly access Articy variables from console');
        console.log('💡 Use the Variables panel in the app to view/edit variables');
    }
}

// Main test function
function runMurderboardVariableTests() {
    console.log('🚀 Running Murderboard Variable Visibility Tests...');
    
    listExpectedEvidence();
    checkArticyVariables();
    checkEvidenceVisibility();
    
    console.log('\n📋 Test Instructions:');
    console.log('1. Load a dataset (demo4.json recommended)');
    console.log('2. Open the Variables panel');
    console.log('3. Look for or create variables like "va_photo_affair_found"');
    console.log('4. Set them to true');
    console.log('5. Open the murderboard to see evidence appear');
    console.log('6. Run checkEvidenceVisibility() to verify');
    
    console.log('\n💡 Available test functions:');
    console.log('  - checkEvidenceVisibility() - Check what evidence is currently visible');
    console.log('  - listExpectedEvidence() - List all evidence items');
    console.log('  - simulateEvidenceFound("evidence_name") - Show how to set variables');
    console.log('  - checkArticyVariables() - Check current variable state');
}

// Export functions for manual testing
window.murderboardVariableTests = {
    runMurderboardVariableTests,
    checkEvidenceVisibility,
    listExpectedEvidence,
    simulateEvidenceFound,
    checkArticyVariables
};

// Auto-run tests
runMurderboardVariableTests();

console.log('\n💡 Tests complete! You can re-run individual tests using:');
console.log('   window.murderboardVariableTests.checkEvidenceVisibility()');
console.log('   window.murderboardVariableTests.simulateEvidenceFound("va_photo_affair")');
console.log('   etc.');
