# Mysteryworks Murderboard Plugin - Development Progress

## Current Status: CORE FUNCTIONALITY WORKING ✅

### Major Breakthrough Achieved (2025-08-24)
The plugin now successfully finds and displays actual dialogue content from the Articy project data!

## Completed Features:

### ✅ **Core Plugin Infrastructure**
- Basic plugin structure and integration with main app
- Plugin registration and loading system
- Modal popup interface (1280x720)

### ✅ **Murderboard Display System**
- Murderboard image loading and display with proper scaling
- Evidence visibility based on Articy variables (e.g., `va_old_autopsy_found`)
- Image click detection and evidence identification
- Variable-based layer visibility system
- Update notification system using `_updated` flags

### ✅ **Evidence Interaction System**
- Evidence popup modal with character name resolution
- Character name lookup from variables (e.g., `va_old_autopsy_charname`)
- Evidence click handling and popup display

### ✅ **MAJOR: Dialogue Content System**
- **Dialogue fragment search working** - finds DialogueInteractiveFragmentTemplate objects
- **Speaker ID resolution fixed** - correctly maps character names to entity IDs
- **Localization system working** - uses pre-resolved display names and text content
- **Evidence clicks show actual dialogue content** instead of fallback messages

## Technical Fixes Implemented:

### 🔧 **Dialogue Fragment Discovery**
- Fixed search to include `DialogueInteractiveFragmentTemplate` (not just `DialogueExplorationFragmentTemplate`)
- Implemented correct workflow: Evidence Name → Character Name → Speaker ID → Dialogue Fragments

### 🔧 **Speaker ID Resolution**
- Fixed `findSpeakerIdByName()` to use already-resolved `DisplayName` properties
- Removed manual localization resolution (data is pre-resolved during loading)
- Now correctly finds speaker IDs like `0x0100000B0000023F` for "Autopsy Report"

### 🔧 **Text Content Resolution**
- Fixed content selection to use pre-resolved `Text` properties
- Removed manual text key resolution (content is already localized)
- Now displays actual dialogue content like: "Gives injected heroin as cause of death..."

## Current Issues & Next Steps:

### ⚠️ **Condition Evaluation System**
- Input pin condition parsing needs refinement
- Complex condition expressions need proper evaluation
- Multiple dialogue states based on game progress need testing

### ⚠️ **Evidence State Management**
- Some evidence may have multiple dialogue fragments with different conditions
- Need to test various evidence types and variable states
- Condition evaluation for fragment selection needs validation

### 🎯 **Immediate Next Steps**
1. Refine condition evaluation system for dialogue fragment selection
2. Test with various evidence types and different variable states  
3. Implement proper condition parsing for complex expressions
4. Add support for different dialogue states based on game progress
5. Polish UI and error handling

## Testing Status:

### ✅ **Working Evidence**
- `va_old_autopsy.png` - Shows correct autopsy dialogue content
- Character name resolution working
- Speaker ID lookup working
- Dialogue content display working

### 🧪 **Needs Testing**
- Other evidence types (wills, photos, etc.)
- Different variable states and conditions
- Multiple dialogue fragments per evidence
- Condition-based content selection

## Code Architecture:

### **Key Functions**
- `handleEvidenceClick()` - Main evidence interaction handler
- `getCharacterNameForEvidence()` - Resolves evidence to character name
- `findSpeakerIdByName()` - Maps character name to entity ID
- `findDialogueFragmentsByCharacter()` - Finds dialogue fragments by speaker
- `selectContentByConditions()` - Evaluates conditions and selects content

### **Data Flow**
1. User clicks evidence image (e.g., `va_old_autopsy.png`)
2. Extract base evidence name (`va_old_autopsy`)
3. Look up character name variable (`va_old_autopsy_charname` → "Autopsy Report")
4. Find speaker entity ID for "Autopsy Report" (`0x0100000B0000023F`)
5. Search for dialogue fragments with that speaker ID
6. Evaluate input pin conditions to select appropriate fragment
7. Display resolved dialogue content in popup

## Files Modified:
- `src/plugins/mysteryworks-murderboard/MysteryworksMurderboardPlugin.tsx` - Main plugin implementation
- Evidence dialogue content now working correctly

---

**Status**: Core functionality achieved! Plugin successfully displays actual Articy dialogue content for evidence interactions.
