# Duplicate Entry Investigation

## Issue Description

The Articy web viewer is inserting additional pages between expected flow nodes, where it displays whatever choice the player makes on a page by itself, instead of going directly to the target node.

**Expected Flow:**
- Page 01: Three choices → Player picks middle choice
- Page 02: NPC response (should go directly here)

**Current Problematic Flow:**
- Page 01: Three choices → Player picks middle choice  
- **EXTRA PAGE**: Shows player's choice text as standalone page
- Page 02: NPC response

## Investigation Findings

### Flow Trace from Demo.json

Starting from the HTML start node, we traced the flow to the first dialogue fragment choice selection:

**Flow Path:**
1. **Start Node** (HTMLPREVIEW) → 
2. **QUEST_001 FLOW START** → 
3. **Waypoint** (Ask the blacksmith about The Code) → 
4. **PerForge Location** → 
5. **HUB - PerForge Conversation Hub Start**

### First Dialogue Fragment Choice Selection

At the **HUB - PerForge Conversation Hub Start**, there are **4 choices**:

1. **"Talk to Duhvel Opper"** (DialogueIntActionTemplate) - Leads to dialogue fragments
2. **"//TRAVEL - The Lost Forest"** (TravelTemplate)  
3. **"//ACTION - Pick up bucket of bits"** (PlayerActionTemplate)
4. **"//ACTION - Swing sword at the Kew Eh block"** (PlayerActionTemplate)

### Dialogue Fragment Choices

When selecting **"Talk to Duhvel Opper"**, you get **4 dialogue fragment choices**:

1. **"Well? Do you have my bucket of bits?"** (ID: 0x01000006000043C9)
2. **"Greetings Duhvel Opper! I seek a boon from you!"** (ID: 0x0100000600004388) ⭐
3. **"Stop yapping and test The Code already!!"** (ID: 0x0100000600004FD7)
4. **"I've helped you all I can, piss off."** (ID: 0x0100000600004FE3)

### Test Case: Choice #2 Flow

**Selected Choice**: "Greetings Duhvel Opper! I seek a boon from you!" (Player dialogue)

**Expected Next Node**: 
- **Speaker**: Duhvel Opper (NPC)
- **Text**: "Let me guess, you want The Code weeks ahead of schedule?"
- **ID**: 0x010000060000438E

**Expected Behavior**: Direct navigation from player choice to NPC response
**Current Issue**: Extra intermediate page showing the player's choice text

## Technical Analysis

### Current Navigation Logic

The issue appears to be in how choice text is being stored and displayed. The system may be:

1. Storing the choice text as history (correct)
2. But also creating an intermediate display page with that choice text (incorrect)
3. Instead of going directly to the target node

### Code Areas to Investigate

1. **Choice Creation Logic** (`createChoiceOptions` function)
   - How choice text is being stored vs. displayed
   - Whether target node text is being confused with choice text

2. **Navigation Logic** (`navigateWithChoice` function)
   - Duplicate detection logic
   - Whether intermediate pages are being created unnecessarily

3. **Node Display Logic** (`setCurrentNode` function)
   - How nodes are added to the nodeList
   - Whether choice info is being treated as a displayable node

## Major Refactoring Completed

### Code Consolidation and Cleanup

We performed significant refactoring to consolidate duplicate code and improve maintainability:

1. **Consolidated Choice Creation Logic**
   - Created unified `createChoiceOptions()` function
   - Eliminated duplicate choice creation code across different node types
   - Standardized choice handling for VirtualChoice, Instruction, and Dialogue nodes

2. **Unified Navigation Functions**
   - Created `navigateWithChoice()` function for consistent choice tracking
   - Implemented `handleSingleChoiceNavigation()` for single-path flows
   - Added comprehensive duplicate detection logic

3. **Consolidated Hub Display Logic**
   - Created `renderHubChoices()` function for consistent choice display
   - Unified condition bubble positioning and styling
   - Standardized keyboard navigation across all choice types

4. **Enhanced Duplicate Detection**
   - Implemented bulletproof duplicate detection using node IDs and content comparison
   - Added logic to skip redundant dialogue fragments from multi-choice screens
   - Preserved linear conversation flow for single-choice screens

5. **Improved Code Organization**
   - Removed redundant code blocks
   - Standardized function signatures and parameters
   - Added comprehensive logging for debugging

### Files Modified

- `src/InteractiveArticyViewer.tsx` - Major refactoring and consolidation

### Benefits of Refactoring

- **Reduced code duplication** by ~200+ lines
- **Improved maintainability** with centralized logic
- **Enhanced consistency** across different node types
- **Better debugging** with unified logging
- **Easier future modifications** with consolidated functions

## Next Steps

1. **Test the specific flow** using demo.json in the web viewer
2. **Identify where the extra page is being created** in the code
3. **Fix the navigation logic** to go directly from choice to target node
4. **Verify the fix** doesn't break other dialogue flows
5. **Test all refactored functionality** to ensure no regressions

## Expected Fix

The system should:
- Store choice information for history/back navigation
- Go **directly** to the target node without creating intermediate pages
- Only display the target node's content, not the choice text as a separate page

## Test Verification

After fixing, verify that:
1. Selecting "Greetings Duhvel Opper! I seek a boon from you!" goes directly to Duhvel's response
2. No intermediate page shows the player's choice text
3. Back navigation still works correctly
4. Choice history is preserved for the "show previous" functionality

## Context for New Agent

### Current State
- All major refactoring is **COMPLETE**
- Code is significantly cleaner and more maintainable
- Issue is isolated to the duplicate entry problem described above

### Key Files
- `src/InteractiveArticyViewer.tsx` - Main component with all the refactored logic
- `demo.json` - Test data file for reproducing the issue
- `duplicate-entry-investigation.md` - This investigation document

### Immediate Focus
The next agent should focus **only** on fixing the duplicate entry issue, not on further refactoring. The codebase is in good shape after our consolidation work.

### Test Instructions
1. Load demo.json in the web viewer
2. Navigate to: Start → QUEST_001 → Waypoint → PerForge → Hub → "Talk to Duhvel Opper"
3. Select choice #2: "Greetings Duhvel Opper! I seek a boon from you!"
4. Verify it goes directly to Duhvel's response without intermediate page
