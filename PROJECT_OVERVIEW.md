# Articy Web Viewer - Project Overview

## Project Description
This is a web viewer for JSON output from Articy Draft, a narrative writing branching tool used for creating game narratives. The project allows users to preview Articy flows in a web browser without requiring Articy Draft installation, making it easier to share and demo interactive narratives.

## Technology Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design (antd)
- **Utilities**: Lodash for object manipulation
- **Styling**: CSS with custom classes for Articy-specific elements

## Project Structure

### Source Code (dev branch)
```
src/
├── App.tsx                     # Main app component
├── main.tsx                    # React entry point
├── InteractiveArticyViewer.tsx # Core viewer component
├── ArticyProject.tsx           # Articy JSON parser and logic
├── components/
│   └── TextBlock.tsx          # Text rendering component
├── panels/
│   ├── InstructionPanel.tsx   # Simple text + button panel
│   └── QuestionPanel.tsx      # Choice/branching panel
└── assets/                    # Static assets
```

### Build Output (main branch)
```
builds/html_viewer_template_v1/
├── index.html                 # Entry HTML file
├── assets/                    # Compiled JS/CSS
└── demo.json                  # Sample Articy export
```

## Core Components

### InteractiveArticyViewer.tsx
- Main component managing flow state and navigation
- Handles node type switching and rendering
- Manages node history/stack
- Processes automatic transitions (Jump, FlowFragment, Condition nodes)

### ArticyProject.tsx
Core class for Articy JSON processing:
- **Variable Management**: Tracks global variables and their states
- **Node Navigation**: Finds nodes by ID, handles parent-child relationships
- **Start Node Detection**: Locates nodes containing `//HTMLPREVIEW`
- **Condition Evaluation**: Processes variable conditions for branching logic
- **Text Parsing**: Extracts variables and values from node expressions

## Supported Node Types

| Node Type | Description | Behavior |
|-----------|-------------|----------|
| **Instruction** | Simple text display | Shows text + "Next" button. Multi-path support: shows choices when multiple connections |
| **Hub** | Choice/branching point | Shows question + multiple choice buttons |
| **Jump** | Navigation redirect | Automatically jumps to target node |
| **FlowFragment** | Container node | Automatically enters first child node |
| **Condition** | Conditional logic | Evaluates condition, branches accordingly |
| **DialogueInteractiveFragmentTemplate** | Dialogue text | Shows text + optional "Next" button |
| **LocationTemplate** | Location/scene nodes | Shows location info + "Next" button. Multi-path support: shows choices when multiple connections |
| **Template Nodes** | Various template types | Supports: EnemyGenericTemplate, innervoice_template, NPCTemplate, PCTemplate, WeaponTemplate, DialogueExplorationActionTemplate |
| **Flow Templates** | Flow container nodes | Auto-navigation: CombatFlowTemplate, CraftingFlowTemplate, TravelFlowTemplate, PlayerActionFlowTemplate, etc. |

## Current Articy JSON Format (Draft 3.x)

### Key Structure Elements:
- **GlobalVariables**: Array of namespaced variables with types and values
- **Packages[0].Models**: Array containing all flow nodes
- **Hierarchy**: Tree structure showing parent-child relationships
- **ObjectDefinitions**: Type definitions for various Articy objects

### Node Properties:
- **Id**: Unique identifier
- **Type**: Node type (Instruction, Hub, Jump, etc.)
- **Properties.Expression**: Text content and variable assignments
- **Properties.OutputPins**: Outgoing connections
- **Properties.InputPins**: Incoming connections with conditions
- **Properties.Parent**: Parent node reference

## Variable System

### Variable Storage:
Variables are organized by namespace:
```javascript
{
  "TestFlowVariables": {
    "Quest001_waypoint01_completed": "false",
    "HasSword": "false",
    "TestPlayerHitPoints": "10"
  }
}
```

### Variable Assignment:
Variables are set through Instruction node expressions:
```
TestFlowVariables.HasSword = true;
TestFlowVariables.TestPlayerHitPoints = 15;
```

### Condition Evaluation:
Conditions are checked in Hub nodes and Condition nodes:
```
TestFlowVariables.HasSword = true
```

## Build Process

### Development:
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Deployment:
1. Run `npm run build`
2. Copy contents of `dist/` to `builds/html_viewer_template_v1/`
3. Update `index.html` to point to correct JSON file
4. Deploy to web server using automated scripts:
   - **SFTP**: `deploy-to-sftp-winscp.bat` (requires WinSCP)
   - **FTP**: `deploy-to-ftp.bat` or `deploy-to-ftp-advanced.bat`
   - **Manual**: Use FileZilla, web control panel, or other FTP clients

## Usage Workflow

### For Content Creators:
1. Create Articy project with flows
2. Add Instruction node containing `//HTMLPREVIEW` at desired start point
3. Export project as JSON
4. Place JSON file in same directory as `index.html`
5. Update `index.html` to reference correct JSON filename
6. Upload to web server

### For Viewers:
1. Navigate to hosted URL
2. Click through narrative using "Next" buttons and choice options
3. Disabled (red) options indicate unmet conditions

## Key Features

### Current Capabilities:
- ✅ Supports all major Articy node types
- ✅ Variable tracking and condition evaluation
- ✅ Custom node colors and templates
- ✅ Syntax highlighting for code elements
- ✅ Input/output pin condition display
- ✅ Visual feedback for unavailable choices

### Roadmap Features:
- 🔄 Support for new Articy Draft X JSON format
- 📱 Mobile device optimization
- 🔗 External hyperlink support
- 🎯 Jump to "bark" nodes
- 📊 Variable state sidebar/viewer
- 🖼️ Character/item image support
- 💻 Local file execution (no web server required)

## Recent Improvements (Latest Update)

### Multi-Path Navigation System:
- **Smart choice detection**: Nodes with multiple output connections automatically display as choice panels
- **Virtual choice nodes**: System creates temporary choice nodes to display multiple path options
- **Proper node formatting**: Choice options display as full InstructionPanels with correct colors and styling
- **Individual navigation**: Each choice option has its own "Next" button for path selection
- **Supported node types**: Works with Instruction, LocationTemplate, and other template nodes

### Enhanced Node Type Support:
- **Comprehensive template coverage**: Added support for all major Articy template types
- **Location nodes**: Proper handling of LocationTemplate nodes with multi-path navigation
- **Template standardization**: Consistent behavior across EnemyGenericTemplate, NPCTemplate, PCTemplate, WeaponTemplate, etc.
- **Flow template auto-navigation**: Automatic progression through flow container nodes

### Enhanced Syntax Highlighting:
- **Consistent comment highlighting**: All comments (`//`) now display in green (#88d889) across all nodes
- **Advanced expression parsing**: Complex expressions like `TestFlowVariables.TestPlayerHitPoints+1` are properly tokenized
- **Improved color scheme**:
  - Variable names: Teal (#6e9a9a)
  - Numbers: Gray (#a3a4a4)
  - Booleans/Keywords: Orange (#f6a206)
  - String values: White (default)
  - Comments: Green (#88d889)

### Deployment Automation:
- **SFTP deployment script**: `deploy-to-sftp-winscp.bat` for WinSCP users
- **FTP deployment scripts**: `deploy-to-ftp.bat` and `deploy-to-ftp-advanced.bat`
- **Configuration management**: Uses `sftp-config.txt` for secure credential storage
- **Automated building**: Scripts can build project before deployment
- **Error handling**: Comprehensive validation and error reporting

### File Loading Improvements:
- **Drag & drop support**: Users can drag JSON files directly into the browser
- **Client-side processing**: No server upload required, files processed in browser memory
- **Privacy focused**: JSON files never leave the user's device
- **Web server compatible**: Drag & drop works on both local and hosted versions

## Technical Notes

### Start Node Detection:
The system finds the starting point by searching for nodes with `//HTMLPREVIEW` in their Expression property.

### Automatic Navigation:
Some node types (Jump, FlowFragment, Condition) automatically navigate without user interaction, using setTimeout to prevent stack overflow.

### Condition Parsing:
The system parses dot-notation variable references and evaluates them against the current variable state using lodash merge operations.

### Multi-Path Navigation Logic:
When a node has multiple output connections, the system:
1. **Detection**: Checks `OutputPins[0].Connections.length > 1`
2. **Virtual Node Creation**: Creates a temporary "VirtualChoice" node containing target node data
3. **Choice Rendering**: Displays each target node as a full InstructionPanel with proper formatting
4. **Individual Navigation**: Each choice has its own "Next" button that navigates to that specific path

### Error Handling:
Unimplemented node types display an error message indicating the missing functionality.

## Future Considerations

### New Articy Format Support:
The project is designed to eventually support the updated JSON format from Articy Draft X. This will likely require:
- Updates to the JSON parsing logic in `ArticyProject.tsx`
- Potential new node type handlers
- Modified variable system handling
- Updated condition evaluation logic

### Architecture Benefits:
The modular design with separate panel components and centralized logic in `ArticyProject.tsx` makes it relatively straightforward to extend support for new formats and node types.
