# Interactive Navigation Implementation Plan

## Overview
This document outlines the steps to add the full interactive GUI and navigation functionality from the 3.x version to our new 4.x application. The goal is to restore the story/dialogue navigation, choice handling, variables panel, and all interactive features while maintaining support for both 3.x and 4.x formats.

## Current Status
✅ **Data Infrastructure Complete**: 4.x multi-file loading, format detection, text resolution
✅ **File Input Complete**: Enhanced drag & drop with progress indicators
✅ **Data Visualization Complete**: Statistics, tables, raw data viewing
✅ **Interactive Navigation Complete**: Full implementation with responsive UI

## Phase 5: Interactive Navigation Implementation

### 5.1 Core Navigation Classes

#### Step 1: Create ArticyProject Class
**File:** `src/utils/ArticyProject.ts`
**Purpose:** Core navigation logic and data management
**Key Methods:**
- `GetNodeByID(id)` - Find nodes by ID
- `GetStartNode()` - Find the starting node (marked with HTMLPREVIEW)
- `GetFirstChildOfNode(parent)` - Navigate to child nodes
- `StoreVariablesFromNode(node)` - Update variables from node expressions
- `CheckConditionString(condition)` - Evaluate conditional expressions
- `SearchNodes(term)` - Search functionality
- `ResetVariablesToInitialState()` - Reset variables for restart

#### Step 2: Create Navigation Panels
**Files to Create:**
- `src/components/panels/InstructionPanel.tsx` - Main content display panel
- `src/components/panels/EndOfFlowPanel.tsx` - End of story panel
- `src/components/panels/QuestionPanel.tsx` - Choice selection panel

**Key Features:**
- Node content display with proper styling
- Next/choice buttons
- Speaker name display with icons
- Color-coded backgrounds based on node properties
- Keyboard navigation support

### 5.2 Interactive Components

#### Step 3: Variables Panel
**File:** `src/components/VariablesPanel.tsx`
**Features:**
- Collapsible left sidebar
- Real-time variable display
- Color-coded values (green/red for booleans, blue for numbers)
- Search/filter functionality
- Font size controls
- Namespace organization

#### Step 4: Search Nodes Panel
**File:** `src/components/SearchNodesPanel.tsx`
**Features:**
- Search through all node content
- Results with preview text
- Click to navigate to specific nodes
- Mutual exclusivity with variables panel

#### Step 5: Condition Bubbles
**File:** `src/components/ConditionBubble.tsx`
**Features:**
- Floating condition displays
- Color-coded true/false values
- Positioned relative to choice nodes
- Syntax highlighting for variables

### 5.3 Navigation Logic

#### Step 6: Interactive Viewer Component
**File:** `src/components/InteractiveArticyViewer.tsx`
**Core Features:**
- Node traversal logic
- Choice handling and history
- Previous choice display with back functionality
- Keyboard navigation (arrow keys, enter, ctrl+r)
- Variable state management
- Flow restart functionality

**Key State Management:**
```typescript
const [currentNode, setCurrentNode] = useState<any>(null);
const [nodeHistory, setNodeHistory] = useState<any[]>([]);
const [previousChoiceHistory, setPreviousChoiceHistory] = useState<PreviousChoice[]>([]);
const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);
const [showPrevious, setShowPrevious] = useState(true);
```

#### Step 7: Navigation Functions
**Key Functions to Implement:**
- `setCurrentNode(node, choiceInfo)` - Navigate to new node
- `handleNextButton()` - Process single choices
- `createChoiceOptions(outputs)` - Generate choice lists
- `renderHubChoices(options)` - Display multiple choices
- `getCurrentNodeOutputs()` - Get available navigation options
- `handleKeyboardNavigation()` - Arrow keys and enter
- `restartFlow()` - Reset to beginning

### 5.4 Integration Steps

#### Step 8: Modify Main App Component
**File:** `src/App.tsx`
**Changes:**
- Replace `ArticyViewer` with `InteractiveArticyViewer` when data is loaded
- Pass processed data to interactive viewer
- Maintain file upload interface when no data loaded

#### Step 9: Create Data Adapter
**File:** `src/utils/DataAdapter.ts`
**Purpose:** Convert our unified data format to ArticyProject-compatible format
**Key Functions:**
- `convertToArticyProject(unifiedData)` - Convert processed data
- `ensureCompatibility()` - Handle 3.x vs 4.x differences
- `validateDataStructure()` - Ensure all required fields present

#### Step 10: Update Styling
**File:** `src/styles/interactive.css`
**Features:**
- Node styling with dynamic colors
- Panel animations and transitions
- Responsive design for mobile
- Keyboard navigation indicators
- Choice selection highlighting

## Implementation Order

### Priority 1: Core Navigation (Essential)
1. ✅ ArticyProject class
2. ✅ InstructionPanel component
3. ✅ Basic node navigation
4. ✅ Choice handling
5. ✅ Variables management

### Priority 2: Enhanced Features (Important)
6. ✅ Previous choice display and back functionality
7. ✅ Keyboard navigation
8. ✅ Variables panel
9. ✅ End of flow handling
10. ✅ Flow restart functionality

### Priority 3: Advanced Features (Nice to Have)
11. ✅ Search nodes panel
12. ✅ Condition bubbles
13. ✅ Speaker name display
14. ✅ Advanced keyboard shortcuts
15. ✅ Mobile responsiveness

## Technical Considerations

### Data Compatibility
- **3.x Format**: Direct compatibility with existing ArticyProject class
- **4.x Format**: Requires data adapter to convert unified format
- **Text Resolution**: Already handled in our data processing pipeline
- **Variable Structure**: Ensure consistent format across both versions

### State Management
- Use React hooks for component state
- Maintain navigation history for back functionality
- Preserve variable state across navigation
- Handle component unmounting gracefully

### Performance
- Lazy load large node trees
- Optimize re-renders with React.memo
- Cache frequently accessed nodes
- Efficient search indexing

### Error Handling
- Graceful handling of missing nodes
- Fallback for broken connections
- User-friendly error messages
- Recovery mechanisms for corrupted state

## Testing Strategy

### Unit Tests
- ArticyProject navigation methods
- Condition evaluation logic
- Variable management
- Search functionality

### Integration Tests
- Complete navigation flows
- Choice selection and history
- Variables panel updates
- Keyboard navigation

### User Acceptance Tests
- Story navigation with both formats
- All interactive features working
- Mobile device compatibility
- Performance with large datasets

## Success Criteria

### Functional Requirements
✅ **Navigation**: Click through story nodes with Next buttons  
✅ **Choices**: Select from multiple options when available  
✅ **Variables**: View and track variable changes  
✅ **History**: Go back to previous choices  
✅ **Search**: Find and navigate to specific nodes  
✅ **Keyboard**: Full keyboard navigation support  

### Technical Requirements
✅ **Compatibility**: Works with both 3.x and 4.x formats  
✅ **Performance**: Smooth navigation with large datasets  
✅ **Responsive**: Works on desktop and mobile  
✅ **Accessibility**: Keyboard navigation and screen reader support  

### User Experience
✅ **Intuitive**: Easy to understand and use  
✅ **Consistent**: Matches 3.x version functionality  
✅ **Reliable**: Handles edge cases gracefully  
✅ **Fast**: Quick response to user interactions  

## File Structure After Implementation

```
src/
├── components/
│   ├── panels/
│   │   ├── InstructionPanel.tsx
│   │   ├── EndOfFlowPanel.tsx
│   │   └── QuestionPanel.tsx
│   ├── VariablesPanel.tsx
│   ├── SearchNodesPanel.tsx
│   ├── ConditionBubble.tsx
│   ├── InteractiveArticyViewer.tsx
│   └── EnhancedFileInput.tsx
├── utils/
│   ├── ArticyProject.ts
│   ├── DataAdapter.ts
│   ├── dataLoader4x.js
│   ├── dataMerger4x.js
│   ├── formatDetector.js
│   └── dataRouter.js
├── styles/
│   └── interactive.css
└── App.tsx
```

## Next Steps

1. **Start with ArticyProject class** - Core navigation logic
2. **Create basic InstructionPanel** - Display nodes with Next buttons
3. **Add choice handling** - Multiple option selection
4. **Implement variables panel** - Real-time variable tracking
5. **Add keyboard navigation** - Arrow keys and enter
6. **Test with both formats** - Ensure compatibility
7. **Polish and optimize** - Performance and UX improvements

This implementation will restore the full interactive functionality while maintaining all the benefits of our new 4.x infrastructure!

## Recent Updates (June 2025)

### Responsive UI Implementation ✅
**Date**: June 16, 2025
**Features Completed**:
- **Gradual Panel Responsiveness**: Content shifts smoothly when panels get wide (320px+ threshold)
- **Unified Interface**: Removed view mode buttons, always shows interactive mode
- **Enhanced Footer**: Data view information moved to responsive footer with detailed stats
- **Header/Content/Footer Sync**: All page sections respond together to panel width changes
- **Buffer Zone Optimization**: Panels can overlay content until they interfere with readability

**Technical Details**:
- Buffer threshold: 320px (panels narrower than this overlay content)
- Gradual shifting formula: `(panelWidth - 320) * 0.8 + 40px` margin
- CSS transitions for smooth animations
- React hooks compliance for proper state management

**User Experience**:
- Variables panel (300px) overlays content without shifting
- Search panel (400px) triggers responsive behavior immediately
- Wider panels cause proportional content shifting
- All sections move together for consistent layout
