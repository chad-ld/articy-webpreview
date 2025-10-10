# Documentation Review & Update Plan

## Executive Summary

After reviewing the source code and comparing it to the existing devdocs, I found that **most documentation is accurate and well-maintained**. However, there are a few areas that need updates and some important systems that lack dedicated documentation.

## What's Already Well-Documented ✅

The following systems have accurate, comprehensive documentation:

1. **Plugin System** (devdoc_plugins.md) - Matches implementation perfectly
2. **Dataset Management** (devdoc_datasets.md) - Accurate and complete
3. **Logging System** (devdoc_logging.md) - Matches the SimpleConsoleLogger implementation
4. **Desktop Version** (devdoc_desktop-version.md) - Comprehensive and accurate
5. **File Protection** (devdoc_fileprotection.md) - Accurate and helpful
6. **Choice Sorting** (devdoc_sorting.md) - Correctly documents Y-position sorting

## Issues Found & Recommended Updates

### 1. Configuration System Documentation (NEEDS UPDATE)

**File**: `devdocs/devdoc_configuration.md`

**Issues**:
- The example JSON structure doesn't match the actual `public/config.json` file
- Missing documentation for `ui` section (storyMode, variablesPanel, searchPanel)
- Missing documentation for `advanced.debugging` section
- Missing documentation for `datasets.allowUserOverride` and `datasets.fallbackBehavior`
- The structure shown doesn't align with the actual configService.ts implementation

**Actual config.json structure**:
```json
{
  "version": "1.0.0",
  "description": "Articy Web Viewer Configuration",
  "plugins": {
    "defaultEnabled": ["mysteryworks-murderboard"]
  },
  "datasets": {
    "autoLoad": "mpos1.5",
    "skipLoadingScreen": false,
    "allowUserOverride": true,
    "fallbackBehavior": "showLoadingScreen"
  },
  "ui": {
    "storyMode": true,
    "variablesPanel": false,
    "searchPanel": false
  },
  "advanced": {
    "debugging": {
      "enableConsoleLogging": false,
      "logLevel": "error"
    }
  }
}
```

**Recommended Actions**:
- Update example JSON to match actual structure
- Add section documenting `ui` configuration options
- Add section documenting `advanced.debugging` options
- Update dataset configuration section with new fields
- Clarify the relationship between config file and actual implementation

---

### 2. Environment Detection System (MISSING DOCUMENTATION)

**File to create**: `devdocs/devdoc_environment.md`

**Why this is important**:
The Environment Detector (`src/utils/environmentDetector.js`) is a sophisticated system that:
- Detects deployment environment (development/production/portable-desktop)
- Determines available detection methods for datasets
- Provides environment-specific configuration
- Critical for hybrid dataset detection to work correctly

**Currently**: Only briefly mentioned in dataset documentation

**Recommended**: Create dedicated documentation covering:
- Environment types (web, electron, portable-desktop, node)
- Environment detection logic
- How it affects dataset detection strategy
- Development vs production distinction
- Portable desktop detection

---

### 3. Variable System (MISSING DOCUMENTATION)

**File to create**: `devdocs/devdoc_variables.md`

**Why this is important**:
The variable system in `src/utils/ArticyProject.ts` has sophisticated features:
- Line-by-line variable processing
- Increment/decrement operators (++/--)
- Complex condition evaluation with parentheses and operator precedence
- Variable path resolution
- Type conversion handling
- Reset functionality

**Currently**: Not documented except briefly in main devdoc

**Recommended**: Create dedicated documentation covering:
- Variable structure and namespaces
- Variable operations (assignment, increment, decrement)
- Condition evaluation system
- Boolean expression parsing with parentheses
- Line-by-line processing approach
- Variable reset functionality
- Usage in nodes and expressions

---

### 4. Story Mode Feature (MISSING DOCUMENTATION)

**Where to add**: Either in `devdoc_configuration.md` or create a UI features document

**Why this is important**:
Story Mode is referenced in:
- Configuration file (`ui.storyMode`)
- Config service implementation
- Main application features list

**Currently**: Mentioned but not explained

**Recommended**: Document what story mode is and what it does (if you can clarify this with the user)

---

### 5. Search Functionality (INCOMPLETE DOCUMENTATION)

**Current status**:
- Mentioned in main devdoc.md as a feature
- `SearchNodes` method exists in ArticyProject.ts
- Config has `searchPanel` option

**Recommended**:
- Either create dedicated documentation
- Or add section to an existing relevant doc
- Document search functionality, how it works, and configuration

---

## Proposed Update Order

1. **Update `devdoc_configuration.md`** (Priority: HIGH)
   - Most straightforward fix
   - Critical for developers configuring the application

2. **Create `devdoc_environment.md`** (Priority: MEDIUM)
   - Important for understanding deployment
   - Referenced by dataset detection system

3. **Create `devdoc_variables.md`** (Priority: MEDIUM)
   - Important for content creators
   - Complex system that needs explanation

4. **Update `devdoc.md`** (Priority: LOW)
   - Add references to new documentation
   - Update feature list if needed

5. **Clarify Story Mode & Search** (Priority: LOW - needs user input)
   - Depends on user clarifying what these features do
   - Can be added to appropriate docs once clarified

---

## Testing Plan

After each documentation update:
1. ✅ Verify the documentation matches the actual source code
2. ✅ Check all code references and file paths are accurate
3. ✅ Ensure examples are up-to-date with current implementation
4. ✅ Update cross-references between devdocs as needed

---

## Questions for User

Before proceeding with updates, please clarify:

1. **Story Mode**: What does story mode do? How does it affect the UI/UX?
2. **Search Feature**: Should search functionality get its own devdoc or be part of another doc?
3. **Priority**: Would you like me to proceed with all updates, or focus on specific ones first?
4. **Breaking Changes**: Are there any planned changes to these systems that should be considered?

---

## Files to Modify

- ✅ **Update**: `devdocs/devdoc_configuration.md`
- ✅ **Create**: `devdocs/devdoc_environment.md`
- ✅ **Create**: `devdocs/devdoc_variables.md`
- ✅ **Update**: `devdocs/devdoc.md` (add references)

## Files That Don't Need Changes

- ✅ `devdocs/devdoc_plugins.md` (accurate)
- ✅ `devdocs/devdoc_datasets.md` (accurate)
- ✅ `devdocs/devdoc_logging.md` (accurate)
- ✅ `devdocs/devdoc_desktop-version.md` (accurate)
- ✅ `devdocs/devdoc_fileprotection.md` (accurate)
- ✅ `devdocs/devdoc_sorting.md` (accurate)
