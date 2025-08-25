# Articy Web Viewer v4.x

A modern React-based web viewer for Articy Draft projects that allows anyone with a web browser to preview and interact with your narrative flows without needing Articy installed.

🌐 **Live Demo**: https://dev.chadbriggs.com/articy/v4/

> **🚀 For Developers**: Always run the safe script DIRECTLY: `powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1`. This provides comprehensive cache protection, file integrity checking, and prevents file reversion issues. If the direct command doesn't work, use `npm run dev:safe` as fallback.

## ✨ **Key Features**

### **Dual Format Support**
- **Articy Draft 3.x** - Single JSON file format
- **Articy Draft X (4.x)** - Multi-file JSON format with manifest
- **Automatic Detection** - Seamlessly handles both formats

### **Smart Dataset Loading**
- **Dynamic Detection** - Automatically finds datasets on server
- **Drag & Drop** - Load files directly into the browser
- **Version Tags** - Visual indicators for 3.x vs 4.x formats
- **Metadata Display** - Shows project names, timestamps, and descriptions

### **Interactive Navigation**
- **All Node Types** - Instructions, dialogues, choices, conditions, hubs
- **Custom Templates** - Supports user-defined node templates
- **Variable Processing** - Real-time variable tracking and updates
- **Condition Evaluation** - Dynamic choice enabling/disabling
- **Flow Fragments** - Proper sub-flow handling

### **Modern UI**
- **React + TypeScript** - Modern, maintainable codebase
- **Ant Design** - Professional UI components
- **Responsive Design** - Works on desktop and mobile
- **Variables Panel** - Collapsible sidebar with search and editing
- **Search Panel** - Find nodes by content across the entire project

### **Plugin System**
- **Auto-Discovery** - Plugins automatically detected from `src/plugins/` folder
- **User Selection** - Enable/disable plugins on loading screen
- **Dynamic Loading** - Plugins only load when selected by user
- **Toggle Interface** - Click plugin buttons to open/close modal windows
- **State Persistence** - Plugin preferences saved between sessions
- **Drop-in Development** - Add new plugins without code changes

## 🆕 **Latest Updates (August 2025)**

### **🔧 Enhanced Plugin System**
- **Case-Insensitive Variable Matching**: Plugins now support mixed-case variable names
- **Fixed Evidence Content Refresh**: Murderboard plugin now properly updates evidence content when variables change
- **Complete Update Notification System**: Evidence shows visual indicators when content changes between sessions
- **Improved Murderboard Plugin**: Better variable detection and debugging capabilities
- **Robust Error Handling**: Plugins gracefully handle missing assets and variables

### **🛡️ Development Improvements**
- **Integrated Safe Script**: PHP server logic moved directly into safe development script
- **Automatic Server Cleanup**: Development scripts now kill existing processes before starting
- **Enhanced File Integrity**: Better protection against file corruption during development
- **Streamlined Workflow**: Removed git status checks for faster startup

### **🔍 Better Debugging**
- **Comprehensive Logging**: Enhanced console output for plugin and variable debugging
- **Asset Loading Feedback**: Clear error messages for missing plugin assets
- **Variable Detection Logs**: Detailed logging for troubleshooting variable visibility issues

## 🚀 **Quick Start**

### **For End Users**
1. Visit https://dev.chadbriggs.com/articy/v4/
2. Either:
   - **Select from dropdown** - Choose from auto-detected datasets
   - **Drag & drop** - Drop your JSON files directly onto the page
3. Navigate through your story using the interactive interface

### **For Developers**
```bash
# Clone the repository
git clone https://github.com/chad-ld/articy-webpreview.git
cd articy-webpreview

# Install dependencies
npm install

# Start development server (RECOMMENDED - includes cache protection)
# IMPORTANT: Run the PowerShell script DIRECTLY, not through npm
powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1

# Alternative: Use npm command (may have issues on some systems)
npm run dev:safe

# Alternative: Start with PHP support only (if you don't need full protection)
npm run dev:php
```

## 📋 **Requirements**

### **For Articy Projects**
- **Articy Draft 3.x** OR **Articy Draft X (4.x)**
- JSON export from your Articy project
- **Start Node**: Create an instruction node with `//HTMLPREVIEW` comment

### **For Development**
- **Node.js** 16+ and npm
- **PHP** (optional, for server-side dataset detection)
- **Modern browser** with ES6+ support

## 🔧 **Development Scripts**

| Command | Description |
|---------|-------------|
| `powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1` | **🚀 RECOMMENDED**: Run PowerShell script DIRECTLY for best results |
| `npm run dev:safe` | **🚀 ALTERNATIVE**: Development with automatic cleanup, cache protection and file integrity |
| `npm run dev:php` | Development with automatic cleanup and PHP server for dataset detection |
| `npm run dev` | ⚠️ Basic Vite server (use only for debugging cache system) |
| `npm run build` | Build for production deployment |
| `npm run cleanup:servers` | **🧹 NEW**: Stop all running PHP and Node.js development servers |
| `npm run check:integrity` | Verify critical files haven't been corrupted |
| `npm run test:cache` | **🧪 Testing**: Run 12 cache busting configuration tests |
| `npm run test:runtime` | **🧪 Testing**: Test live cache behavior while server is running |

## 📁 **Project Structure**

```
articy-webpreview/
├── src/
│   ├── components/          # React components
│   │   ├── InteractiveArticyViewer.tsx
│   │   ├── VariablesPanel.tsx
│   │   ├── SearchNodesPanel.tsx
│   │   └── PluginSelector.tsx
│   ├── panels/              # Node type panels
│   │   ├── InstructionPanel.tsx
│   │   ├── QuestionPanel.tsx
│   │   └── EndOfFlowPanel.tsx
│   ├── plugins/             # Plugin system
│   │   ├── types.ts         # Plugin interfaces
│   │   ├── registry.ts      # Plugin registry
│   │   ├── manager.ts       # Plugin lifecycle
│   │   ├── discovery.ts     # Auto-discovery service
│   │   ├── hello-world/     # Example plugin
│   │   └── test-plugin/     # Demo plugin
│   ├── hooks/               # React hooks
│   │   └── usePlugins.ts    # Plugin state management
│   └── utils/               # Core utilities
│       ├── hybridDatasetDetector.js
│       ├── dataRouter.js
│       └── formatDetector.js
├── public/                  # Static assets and demo datasets
├── php-api/                 # Server-side dataset detection
├── builds/                  # Production builds
└── docs/                    # Documentation
```

## 🎮 **Usage Guide**

### **Exporting from Articy**

1. **Create Start Node**: Add an instruction node with `//HTMLPREVIEW` in the text
2. **Export Project**: File → Export → JSON format
3. **Upload Files**: 
   - **3.x**: Upload the single `.json` file
   - **4.x**: Upload the entire folder (contains `manifest.json`)

### **Navigation Controls**

- **Mouse/Touch**: Click choices and buttons
- **Keyboard**: Arrow keys + Enter for navigation
- **Shortcuts**:
  - `Ctrl+R` - Restart story
  - `Ctrl+L` - Return to file loading screen

### **Variables Panel**

- **Toggle**: Click the variables button to show/hide
- **Search**: Filter variables by name or value
- **Edit**: Right-click (desktop) or long-press (mobile) to edit values
- **Import**: Drag TXT or CSV files to bulk update variables

## � **Plugin System**

The Articy Web Viewer includes a powerful plugin system that allows you to extend functionality with custom features. Plugins are automatically discovered and can be enabled/disabled by users.

### **Using Plugins**

1. **Loading Screen**: When you start the app, expand the "Configure Plugins" section
2. **Select Plugins**: Check the plugins you want to enable for this session
3. **Load Dataset**: Proceed to load your Articy project
4. **Access Plugins**: Enabled plugins appear as buttons in the left sidebar
5. **Toggle Windows**: Click plugin buttons to open/close their modal windows

### **Available Plugins**

- **Hello World Plugin** - Demonstrates basic plugin functionality with project info display
- **Test Plugin** - Shows auto-discovery features and plugin development capabilities
- **Mysteryworks Murderboard Plugin** - Interactive murder mystery investigation board with evidence and suspect management
  - **Features**: Visual evidence board, suspect profiles, document viewing, interactive layout
  - **Variable-Based Visibility**: Graphics show/hide based on Articy variables (e.g., `alex_found = true` shows Alex)
  - **Interactive Evidence Popups**: Click evidence images to view detailed information with dynamic content states
  - **Case-Insensitive Matching**: Supports mixed-case variable names (`Alex_Found`, `alex_found`, `ALEX_FOUND`)
  - **Multi-Namespace Support**: Works with variables in any namespace (`SuspectVariables`, `EvidenceVariables`, etc.)
  - **Update Notifications**: Visual indicators when evidence has new information to discover
  - **Scaling**: Automatically scales PSD layout to 30% for optimal modal display (1152px content → 345.6px display)
  - **Modal**: Fixed-size modal (393.6px wide) with 24px padding margins and z-index 9999 for proper layering
  - **Assets**: Includes character portraits, evidence documents, and background imagery
  - **Debug Logging**: Comprehensive console logging for troubleshooting variable detection

### **Plugin Features**

- **🔍 Auto-Discovery**: Plugins are automatically detected from the `src/plugins/` folder
- **👤 User Control**: Users choose which plugins to enable on the loading screen
- **💾 State Persistence**: Plugin preferences are saved between browser sessions
- **🎛️ Toggle Interface**: Plugin buttons in sidebar toggle modal windows open/closed
- **🎨 Visual Feedback**: Active plugin buttons show blue background when modal is open
- **📱 Responsive Design**: Plugin modals work on both desktop and mobile devices

### **For Plugin Developers**

#### **Creating a New Plugin**

1. **Create Plugin Folder**: `src/plugins/my-plugin/`
2. **Implement Plugin Class**:
   ```typescript
   // src/plugins/my-plugin/MyPlugin.tsx
   import { IPlugin, PluginMetadata, PluginButtonConfig, PluginModalProps, PluginContext } from '../types';

   export class MyPlugin implements IPlugin {
     metadata: PluginMetadata = {
       id: 'my-plugin',
       name: 'My Plugin',
       description: 'Description of what my plugin does',
       version: '1.0.0',
       author: 'Your Name',
       enabled: false
     };

     async initialize(context: PluginContext): Promise<void> {
       // Plugin initialization code
     }

     async destroy(): Promise<void> {
       // Cleanup code
     }

     getButtonConfig(): PluginButtonConfig {
       return {
         text: 'My Plugin',
         icon: <YourIcon />,
         position: 1
       };
     }

     renderModal(props: PluginModalProps): React.ReactNode {
       return (
         <Modal title="My Plugin" open={props.isVisible} onCancel={props.onClose}>
           {/* Your plugin UI here */}
         </Modal>
       );
     }
   }

   export const myPlugin = new MyPlugin();
   ```

3. **Create Entry Point**:
   ```typescript
   // src/plugins/my-plugin/index.ts
   export { myPlugin as default } from './MyPlugin';
   ```

4. **Refresh Browser**: Your plugin will be automatically discovered and available for selection!

#### **Plugin Interface (IPlugin)**

All plugins must implement the `IPlugin` interface:

- **`metadata`**: Plugin information (id, name, description, version, author)
- **`initialize(context)`**: Called when plugin is enabled
- **`destroy()`**: Called when plugin is disabled
- **`getButtonConfig()`**: Returns button configuration for sidebar
- **`renderModal(props)`**: Returns React component for plugin modal
- **`onDatasetLoad(data)`** *(optional)*: Called when dataset loads
- **`onNodeChange(node)`** *(optional)*: Called when current node changes
- **`onVariableChange(variables)`** *(optional)*: Called when variables update

#### **Variable Handling Best Practices**

When working with Articy variables in plugins:

```typescript
// ✅ GOOD: Case-insensitive variable checking
const isElementVisible = (elementName: string): boolean => {
  const foundVariableName = `${elementName}_found`;

  // Check all namespaces and variable names case-insensitively
  for (const namespace in variables) {
    const namespaceVars = variables[namespace];
    if (namespaceVars) {
      for (const varName in namespaceVars) {
        if (varName.toLowerCase() === foundVariableName.toLowerCase() &&
            namespaceVars[varName] === true) {
          return true;
        }
      }
    }
  }
  return false;
};

// ❌ AVOID: Case-sensitive exact matching only
const badCheck = variables.SomeNamespace?.exact_variable_name === true;
```

**Variable Naming Conventions Supported:**
- `alex_found` (lowercase with underscore)
- `Alex_Found` (PascalCase with underscore)
- `ALEX_FOUND` (uppercase with underscore)
- `alexFound` (camelCase)
- `AlexFound` (PascalCase)

#### **Plugin Context API**

Plugins receive a context object with access to:

- **`project`**: Current Articy project data
- **`currentNode`**: Currently active node
- **`variables`**: Project variables
- **`showMessage(content, type)`**: Display notifications to user
- **`navigateToNode(nodeId)`**: Navigate to specific node
- **`emitEvent(name, data)`**: Send events to other plugins
- **`onEvent(name, handler)`**: Listen for events from other plugins

#### **Development Workflow**

1. **No Registration Required**: Plugins are automatically discovered
2. **Hot Reloading**: Changes to plugin code update immediately during development
3. **Error Handling**: Invalid plugins are gracefully handled with console warnings
4. **TypeScript Support**: Full type checking and IntelliSense support

## 🔍 **Murderboard Evidence Popup System**

The Mysteryworks Murderboard Plugin includes an advanced evidence interaction system that allows users to click on evidence images to view detailed information with dynamic content states based on Articy variables.

### **Core Features**

- **🖱️ Interactive Evidence**: Click any visible evidence image to open detailed information popup
- **📋 Dynamic Content**: Popup content changes based on current variable states in the story
- **🔔 Update Notifications**: Visual indicators show when evidence has new content to discover
- **🔔 Update Notifications**: Visual indicators when evidence has new information to discover
- **🎨 Themed Design**: Popup matches the overall app design aesthetic
- **📱 Responsive**: Works on both desktop and mobile devices
- **⌨️ Accessible**: Close via clicking outside popup or X button

### **How It Works**

#### **1. Character Name Resolution**
When a user clicks an evidence image (e.g., `va_paternity_test.png`):
- Plugin looks for variable `{imageName}_charname` (e.g., `va_paternity_test_charname`)
- Retrieves the plain English evidence name (e.g., "Paternity Test")
- Uses this name as the popup header and for dialogue fragment matching

#### **2. Dialogue Fragment Discovery**
- Searches all dialogue fragments in the Articy project data
- Finds fragments where the speaker name matches the evidence character name
- These fragments contain the various information states for that evidence

#### **3. Condition Evaluation & Content Selection**
- Examines input pin conditions on each dialogue fragment
- Evaluates conditions against current variable states
- Displays content from the fragment whose conditions are met
- Example condition: `EvidenceVariables.va_paternity_test_found==true&&EvidenceVariables.va_paternity_test_analyzed==false`
- If no conditions exist on a fragment, it serves as the default/fallback content

#### **4. Update Notification System**
- Stores the unique ID of the currently displayed dialogue fragment
- When murderboard reopens, compares current fragment ID vs. previously stored ID
- If different (content has changed), shows `{imageName}_updated.png` indicator
- Hides update indicator once user clicks to view the evidence
- Update tracking persists until new Articy data is loaded

### **Implementation Plan**

#### **Phase 1: Visual Popup Component** ✅ *Ready to Implement*
```typescript
// Create reusable popup component with:
- Modal overlay with high z-index (above murderboard)
- Header with evidence name
- Content area for dialogue text
- Close button (X) and click-outside-to-close
- Responsive design matching app theme
- Test with static content:
  "Gives injected heroin as cause of death. Daria used 'Find my phone'
   after Victor was missing for Days, and body was found.
   Revised autopsy report indicates the heavy presence of the drug
   Etomidate, known on the street as Space Oil, in the victims body.
   The drug acts as a powerful sedative.
   This evidence cannot be processed further."
```

#### **Phase 2: Click Handler Integration**
```typescript
// Add click handlers to evidence images:
- Detect clicks on visible evidence images
- Extract evidence name from image filename
- Trigger popup with evidence-specific data
- Handle mobile touch events appropriately
```

#### **Phase 3: Character Name Resolution**
```typescript
// Implement name lookup system:
- Parse image filename to get base evidence name
- Look up {evidenceName}_charname variable
- Handle case-insensitive variable matching
- Support multi-namespace variable searching
- Fallback to filename if charname variable not found
```

#### **Phase 4: Dialogue Fragment Matching**
```typescript
// Search and filter dialogue fragments:
- Iterate through all project dialogue nodes
- Filter by speaker name matching evidence character name
- Handle case-insensitive speaker name matching
- Build array of potential content fragments
```

#### **Phase 5: Condition Evaluation Engine**
```typescript
// Implement condition parsing and evaluation:
- Parse input pin condition strings
- Evaluate boolean expressions against current variables
- Handle complex conditions with && and || operators
- Support namespace-qualified variable references
- Select fragment with matching conditions or fallback to default
```

#### **Phase 6: Update Tracking System**
```typescript
// Implement change detection:
- Store fragment IDs in component state/localStorage
- Compare current vs. previous fragment ID on murderboard open
- Show/hide update indicator images based on changes
- Clear update indicators when evidence is viewed
- Reset tracking when new dataset is loaded
```

#### **Phase 7: Integration & Polish**
```typescript
// Final integration and user experience:
- Integrate all systems into murderboard plugin
- Add comprehensive error handling
- Implement debug logging for troubleshooting
- Add loading states and smooth animations
- Test with various evidence configurations
- Optimize performance for large datasets
```

### **Technical Specifications**

#### **Variable Naming Conventions**
- **Character Name**: `{evidenceName}_charname` → Plain English evidence name
- **Update Indicator**: `{evidenceName}_updated` → Boolean for showing update notification
- **Evidence Visibility**: `{evidenceName}_found` → Boolean for showing evidence image

#### **Dialogue Fragment Requirements**
- **Speaker Field**: Must match the character name from `_charname` variable
- **Input Pin Conditions**: Optional boolean expressions for content state logic
- **Content Field**: The main text content to display in popup

#### **Popup Component Specifications**
- **Z-Index**: 10000+ (above murderboard modal at 9999)
- **Width**: Responsive, max 500px on desktop
- **Position**: Centered on screen
- **Background**: Semi-transparent overlay
- **Animation**: Smooth fade in/out transitions
- **Accessibility**: Keyboard navigation support (ESC to close)

### **🔔 Update Notification System**

The murderboard includes an intelligent update notification system that alerts users when evidence content has changed between sessions:

#### **How It Works**
1. **Fragment ID Tracking**: When evidence is first viewed, the system stores the unique ID of the dialogue fragment being displayed
2. **Content Change Detection**: Each time the murderboard opens, it compares current dialogue fragment IDs with stored ones
3. **Visual Indicators**: If content has changed, an update indicator image becomes visible (e.g., `va_paternity_test_update.png`)
4. **Notification Clearing**: When the user clicks the evidence to view the new content, the update indicator disappears

#### **Technical Implementation**
- **Naming Convention**: Update indicators use the same name as evidence with `_update` suffix
- **Variable Independence**: Update indicators are controlled by the plugin, not by Articy variables
- **Session Persistence**: Fragment IDs are stored in component state and persist until new dataset loads
- **Fresh Evaluation**: System re-evaluates all evidence content every time murderboard opens

#### **Example Workflow**
1. **Initial Discovery**: User finds paternity test → Fragment ID `0x123ABC` stored for unanalyzed content
2. **Story Progress**: User analyzes paternity test → `va_paternity_test_analyzed = true`
3. **Content Changes**: Evidence now shows different dialogue fragment → Fragment ID `0x456DEF`
4. **Update Notification**: Next time murderboard opens → `va_paternity_test_update.png` becomes visible
5. **User Interaction**: User clicks evidence → Views new analyzed content → Update indicator disappears

### **Example Usage Scenario**

1. **User opens murderboard** → Plugin evaluates all evidence visibility
2. **Evidence becomes visible** → `va_paternity_test_found = true` shows paternity test image
3. **User clicks evidence** → Plugin looks up `va_paternity_test_charname = "Paternity Test"`
4. **System finds dialogue fragments** → Searches for speaker "Paternity Test"
5. **Condition evaluation** → Checks `EvidenceVariables.va_paternity_test_analyzed == false`
6. **Content display** → Shows unanalyzed evidence description
7. **Fragment ID stored** → System remembers this content for future comparison
8. **Story progresses** → User analyzes evidence, `va_paternity_test_analyzed = true`
9. **Murderboard reopens** → System detects content change, shows `va_paternity_test_update.png`
10. **User clicks evidence** → Views new analyzed content, update indicator disappears
7. **Later in story** → `va_paternity_test_analyzed = true` changes available content
8. **Update notification** → `va_paternity_test_updated.png` becomes visible
9. **User clicks again** → Sees new analyzed evidence content, update indicator disappears

This system provides a rich, dynamic evidence investigation experience that adapts to the player's progress through the narrative.

## � **Current Bug Investigation: Evidence Content Not Updating (August 25, 2025)**

### **Issue Summary**
The Mysteryworks Murderboard Plugin evidence popup system is not displaying updated content when variables change during gameplay. Users see stale evidence content instead of the current state-appropriate content.

### **Problem Description**
- **Expected Behavior**: When evidence is processed (e.g., paternity test analyzed), clicking the evidence should show the analyzed content
- **Actual Behavior**: Evidence popups continue showing the original unprocessed content even after variables change
- **Specific Case**: Paternity test shows unanalyzed content ("This evidence can be summarized with document analytics") instead of analyzed content ("The test results are negative, proving that Victor is not the father")

### **Root Cause Analysis**
The issue stems from a **stale cache problem** in the evidence content pre-evaluation system:

1. **Cache Population**: When murderboard opens, all evidence content is pre-evaluated and cached for performance
2. **Variable Changes**: When user processes evidence, variables change (e.g., `va_paternity_test_analyzed = true`)
3. **Stale Cache**: The cached content is not invalidated/refreshed when variables change
4. **Wrong Content**: Evidence clicks use stale cached content instead of re-evaluating with current variables

### **Technical Investigation Progress**

#### **Phase 1: Condition Parsing Bug (FIXED)**
- **Issue**: Trailing semicolons in Articy conditions caused parsing failures
- **Example**: `"EvidenceVariables.va_paternity_test_analyzed==true;"` was comparing `true == "true;"` (failed)
- **Fix**: Updated `parseValue()` function to strip trailing semicolons before boolean parsing
- **Status**: ✅ **RESOLVED** - Condition evaluation now works correctly

#### **Phase 2: Cache Invalidation System (RESOLVED)**
- **Issue**: Evidence content cache not refreshing when variables change
- **Problem**: `useEffect` dependency array trying to detect variable changes, but variables object is mutated in place
- **Solution**: Changed approach to refresh cache every time murderboard opens instead of trying to detect variable changes
- **Status**: ✅ **RESOLVED** - Fresh evaluation on every murderboard open ensures current content is always displayed

#### **Phase 3: Update Notification System (RESOLVED)**
- **Issue**: No visual indication when evidence content changes between murderboard sessions
- **Problem**: Component lifecycle events not triggering due to component reuse instead of remounting
- **Solution**: Implemented modal open counter system to trigger evaluation on each murderboard open
- **Status**: ✅ **RESOLVED** - Evidence shows `_update.png` indicators when content changes, cleared when viewed

### **Code Changes Made (Since Last Git Push)**

#### **1. Fixed Condition Parsing (MysteryworksMurderboardPlugin.tsx)**
```typescript
// BEFORE: Semicolons caused parsing failures
const parseValue = (value: string): any => {
  const trimmed = value.trim();
  // Boolean parsing failed with "true;" vs true
}

// AFTER: Strip semicolons before parsing
const parseValue = (value: string): any => {
  let trimmed = value.trim();

  // Remove trailing semicolon if present (Articy conditions end with semicolons)
  if (trimmed.endsWith(';')) {
    trimmed = trimmed.slice(0, -1).trim();
  }

  // Now boolean parsing works correctly
}
```

#### **2. Enhanced Cache Management**
```typescript
// BEFORE: Cache never refreshed when variables changed
useEffect(() => {
  if (variables && project) {
    preEvaluateAllEvidence();
  }
}, [variables, project, evaluationTrigger]);

// AFTER: Explicit cache clearing + debugging
useEffect(() => {
  if (variables && project) {
    console.log(`🔄 Pre-evaluating all evidence (trigger: ${evaluationTrigger})...`);
    console.log(`🗑️ Clearing evidence content cache...`);
    setEvidenceContentCache({}); // Force fresh evaluation
    preEvaluateAllEvidence();
  }
}, [variables, project, evaluationTrigger]);
```

#### **3. Added Comprehensive Debugging**
- Enhanced console logging for cache operations
- Variable state tracking in evidence evaluation
- Condition evaluation step-by-step debugging
- Cache hit/miss logging for troubleshooting

### **Testing Status**

#### **✅ Confirmed Working**
- Condition parsing with semicolons
- Variable detection and evaluation
- Real-time evidence evaluation (when cache is empty)
- Evidence visibility based on `_found` variables
- Cache invalidation when murderboard opens
- Fresh content evaluation after evidence processing
- Proper content selection based on current variable states
- Update notification system with visual indicators
- Fragment ID tracking and comparison
- Modal open counter triggering system

#### **✅ Testing Complete - All Systems Working**
- Evidence content now updates correctly when variables change
- Murderboard performs fresh evaluation every time it opens
- Evidence popups show current state-appropriate content
- Update indicators (`_update.png`) appear when evidence content changes
- Update indicators disappear when evidence is viewed

#### **📋 Test Scenario**
1. Load MPOS dataset
2. Open murderboard (cache populated with unprocessed content)
3. Process paternity test evidence (sets `va_paternity_test_analyzed = true`)
4. Reopen murderboard (should clear cache and re-evaluate)
5. Click paternity test evidence (should show analyzed content)

### **✅ Resolution Confirmed**
The complete evidence system has successfully resolved all issues by:
- Forcing fresh evaluation every time murderboard opens
- Ensuring evidence content reflects current game state
- Providing visual update notifications when content changes
- Maintaining performance benefits while providing accurate content

### **✅ Completed Steps**
1. **✅ Fix Verified**: Evidence content updates correctly after variable changes
2. **✅ Performance Confirmed**: Cache clearing doesn't negatively impact performance
3. **✅ Testing Complete**: Multiple evidence state changes work correctly
4. **✅ Update Notifications Working**: Visual indicators show when evidence has new content
5. **✅ Documentation Updated**: Complete evidence system documented for future developers

### **Files Modified**
- `src/plugins/mysteryworks-murderboard/MysteryworksMurderboardPlugin.tsx` - Cache management and condition parsing fixes
- `logs/console-export-*.log` - Debugging logs for investigation

## �🔄 **Dual Deployment Architecture**

This project supports two deployment targets from a single codebase:

### **Web Version** (Current)
- **Server**: DreamHost shared hosting
- **Detection**: PHP script scans for uploaded datasets
- **URL**: https://dev.chadbriggs.com/articy/v4/

### **Desktop EXE Version** (Planned)
- **Platform**: Electron-based desktop application
- **Detection**: Local folder scanning + drag-and-drop
- **Distribution**: Single executable file

## 👨‍💻 **Developer Notes**

### **🚀 Quick Start for Developers**

```bash
# 1. Check system health
npm run check:integrity

# 2. Test cache configuration
npm run test:cache

# 3. Start development (ALWAYS use safe mode - run PowerShell script DIRECTLY)
powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1

# 4. Test runtime behavior (in another terminal)
npm run test:runtime
```

> **💡 Important**: Always run the safe script DIRECTLY: `powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1`. If that doesn't work, use `npm run dev:safe` as fallback. The basic `npm run dev` command should only be used when debugging the cache system itself.

### **⚠️ Important Development Guidelines**

#### **Git & Repository Management**
- **🚨 ALWAYS ASK BEFORE PUSHING**: Never push to local git or remote repository without explicit permission from the project maintainer
- **Branch Safety**: Currently working on `v4.x` branch - ensure you're on the correct branch before making changes
- **Commit Frequently**: Make small, frequent commits during development to prevent work loss

#### **Server Process Management**
- **🔄 Automatic Cleanup**: Development scripts now automatically kill existing PHP and Node.js processes before starting new ones
- **🧹 Manual Cleanup**: Use `npm run cleanup:servers` to manually stop all development servers
- **⚡ Streamlined Startup**: Git status check removed for faster, uninterrupted development workflow
- **🛡️ Error Resilient**: Scripts continue even if cleanup encounters issues

**Available Startup Commands:**
```bash
# RECOMMENDED: Run PowerShell script directly for best results
powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1

# Alternative: Use npm commands (may have issues on some systems)
npm run dev:safe          # Includes automatic cleanup + full protection
npm run dev:php           # Includes automatic cleanup + PHP support

# Manual cleanup
npm run cleanup:servers   # Stop all PHP and Node.js processes
powershell -ExecutionPolicy Bypass -File cleanup-servers.ps1  # Direct execution
```

**Script Modifications (2025-08-23):**
- ✅ **Added automatic server cleanup** to `start-dev-safe.ps1` and `start-dev-with-php.ps1`
- ✅ **Removed git status check** from startup process for uninterrupted workflow
- ✅ **Created standalone cleanup script** (`cleanup-servers.ps1`) for manual use
- ✅ **Added error handling** with try-catch blocks for robust operation
- ✅ **Improved user feedback** showing number of processes stopped

#### **Log Files & Debugging**
- **Log Location**: Development and debugging logs are stored in the `logs/` folder
- **Console Exports**: Browser console exports saved as `logs/console-export-YYYY-MM-DD_HH-MM-SS.txt`
- **Investigation Logs**: Specific debugging logs like `fallback-detection-debug.log`, `work-loss-investigation.log`
- **Log Cleanup**: Excessive logs are automatically cleaned during project maintenance

#### **File Integrity Protection**
- **🚀 Default Mode**: Always use `npm run dev:safe` for all development work
- **⚠️ Basic Mode**: Only use `npm run dev` when debugging the cache system itself
- **Check Integrity**: Run `npm run check:integrity` before starting development sessions
- **Backup System**: Critical files have `.backup` versions that are automatically restored if corruption is detected

#### **Cache Busting Verification**
- **Test Configuration**: Run `npm run test:cache` to verify all cache prevention features
- **Test Runtime**: Run `npm run test:runtime` while server is running to check live behavior
- **Monitor Performance**: Tests verify minimal cache accumulation and fast file detection

## 🧪 **Cache Busting & Testing**

This project includes comprehensive cache prevention and testing systems to ensure reliable development without file reversion issues.

### **🚀 Why Safe Mode is Superior**

Safe mode (`npm run dev:safe`) provides **better development experience** than basic mode with **zero meaningful downsides**:

| Feature | Safe Mode | Basic Mode |
|---------|-----------|------------|
| **File Protection** | ✅ Complete protection from reversions | ❌ Vulnerable to file corruption |
| **Development Speed** | ✅ No interruptions from lost work | ❌ Time lost to file issues |
| **Hot Reload** | ✅ Reliable with polling-based detection | ⚠️ Event-based (less reliable) |
| **PHP Integration** | ✅ Automatic server management | ❌ Manual setup required |
| **Error Handling** | ✅ Better diagnostics and recovery | ❌ Basic error reporting |
| **Performance** | ✅ Negligible impact (sub-2s file detection) | ✅ Slightly faster (not noticeable) |

**Recommendation**: Use safe mode for **all development work**. Only use basic mode when debugging the cache system itself.

### **Cache Prevention Features**

- **Vite Cache Disabled**: `cacheDir: false` prevents internal caching
- **HMR Overlay Disabled**: Prevents cache-related UI corruption
- **File Watching with Polling**: Reliable change detection every 100ms
- **Cache-Busting Parameters**: Dynamic timestamps in data loading
- **File Integrity Protection**: Automatic backup/restore system

### **Testing Commands**

```bash
# Test all cache busting configuration
npm run test:cache

# Test runtime cache behavior (while server is running)
npm run test:runtime

# Check file integrity and restore if needed
npm run check:integrity
```

### **Cache Test Results**

The `npm run test:cache` command runs 12 comprehensive tests:

- ✅ **Vite Cache Disabled** - Configuration verification
- ✅ **HMR Overlay Disabled** - UI protection active
- ✅ **File Watching Uses Polling** - Reliable change detection
- ✅ **Vite Cache Directory Status** - Minimal cache files present
- ✅ **Backup Files Exist** - Protection system ready
- ✅ **Integrity Checker Works** - Restoration system functional
- ✅ **HybridDatasetDetector Methods** - Core functionality intact
- ✅ **PHP Proxy Configuration** - API routing configured
- ✅ **Cache Busting in App** - Dynamic timestamps implemented
- ✅ **Safe Mode Scripts** - Development tools available
- ✅ **File Modification Detection** - Sub-second change detection
- ✅ **Memory Cache Management** - Proper cache lifecycle

### **Runtime Testing**

The `npm run test:runtime` command verifies live server behavior:

- **Server Status**: Confirms development server is running on port 3000
- **PHP Integration**: Verifies PHP server on port 8080 with proxy
- **Process Health**: Monitors Node.js memory usage and process count
- **Cache Directory**: Ensures minimal cache file accumulation
- **File Detection**: Tests real-time file modification detection

### **Manual Browser Testing**

For complete verification:

1. **Start Server**: `powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1` (run PowerShell script directly)
2. **Open Browser**: http://localhost:3000/
3. **Open Dev Tools**: F12 → Network tab
4. **Edit Source File**: Make changes and save
5. **Verify Hot Reload**: Page updates automatically
6. **Check Network Tab**: Look for cache-busting parameters (`?v=timestamp`)

> **💡 Note**: Safe mode provides superior development experience with zero downsides compared to basic mode.

## ⚠️ **Known Issues & Solutions**

### **File Reversion Problem**
This project previously experienced file reversion issues during development. **The safe mode completely prevents these issues.**

```bash
# ALWAYS use safe mode for development (prevents file reversions)
npm run dev:safe

# Check file integrity if you suspect issues
npm run check:integrity

# Test cache system health
npm run test:cache
```

> **✅ Solution**: Safe mode eliminates file reversion problems entirely. There's no reason to use basic mode unless debugging the cache system.

### **Cache Issues Troubleshooting**

If you experience slow file updates or caching problems:

```bash
# 1. Test cache configuration
npm run test:cache

# 2. Check runtime behavior
npm run test:runtime

# 3. Clear any accumulated cache
npm run clean

# 4. Restart with safe mode
npm run dev:safe
```

**Expected Test Results:**
- Cache tests should show 11/12 or 12/12 passing
- Runtime tests should show all servers running
- File modification detection should be under 2 seconds
- Cache directory should have fewer than 50 files

### **PHP Proxy Issues**
If PHP detection isn't working in development:

1. Ensure PHP is installed and in PATH
2. Use `npm run dev:php` instead of `npm run dev`
3. Check that `vite.config.ts` has proxy configuration

## 📚 **Documentation**

- **[Dual Deployment Plan](dual-deployment-plan.md)** - Technical architecture details
- **[File Protection System](FILE-PROTECTION-README.md)** - Development stability guide
- **[SFTP Setup Guide](SFTP_Setup_Guide.md)** - Deployment configuration

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Run `npm run check:integrity` before starting
4. Make your changes
5. Test with both 3.x and 4.x datasets
6. Submit a pull request

## 📄 **License**

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Articy Software** - For creating the excellent narrative design tool
- **React Community** - For the robust framework and ecosystem
- **Ant Design** - For the beautiful UI components

---

**Need help?** Open an issue on GitHub or visit the live demo to see the viewer in action.
