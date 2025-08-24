# Murderboard Visibility Toggle - Task Progress Report

## 🎯 **Objective**
Fix the murderboard plugin visibility toggle functionality that works on single nodes but fails on multiple choice nodes, causing infinite re-render loops.

## 🔍 **Problem Analysis**

### **Symptoms**
- ✅ Murderboard works perfectly on single nodes (dialogue, instruction, etc.)
- ❌ Murderboard fails on multiple choice nodes (location selection screens)
- ❌ Button click detected but modal never shows/hides
- ❌ Infinite re-render loops prevent component completion

### **Root Cause Identified**
Multiple choice nodes trigger complex choice rendering logic that causes infinite React re-render loops, preventing the plugin modal system from completing its render cycle.

## 📋 **Steps Taken & Issues Encountered**

### **Phase 1: Initial Investigation**
1. **Added comprehensive debugging logs** to track component render cycle
2. **Identified infinite loop pattern**: Component starts → reaches certain point → restarts before completion
3. **Confirmed button clicks detected** but component never reaches "Component rendering" log
4. **Discovered issue specific to multiple choice nodes** - works fine on single nodes

### **Phase 2: useEffect Debugging**
1. **Disabled hub useEffect** - Controls automatic choice display logic
   - **Issue**: Still had infinite loops
2. **Disabled bubble re-render useEffect** - Controls condition bubble rendering
   - **Issue**: Still had infinite loops
3. **Fixed dependency arrays** - Removed circular dependencies
   - **Issue**: Still had infinite loops

### **Phase 3: Render Logic Investigation**
1. **Disabled getCurrentNodeOutputs() call** in main render logic
   - **Result**: ✅ Infinite loops stopped, murderboard worked!
   - **Issue**: ❌ All choice functionality broken
2. **Re-enabled choice rendering logic**
   - **Result**: ❌ Infinite loops returned immediately

### **Phase 4: useMemo Approach**
1. **Wrapped getCurrentNodeOutputs() in useMemo** to prevent render-time side effects
   - **Issue**: ❌ ReferenceError - useMemo not imported
2. **Added useMemo import** to React imports
   - **Status**: ⏳ Pending test (where we stopped)

## 🔧 **Technical Details**

### **Infinite Loop Pattern**
```
1. Plugin button clicked
2. Modal state change triggers re-render
3. Component starts: FUNCTION START
4. Reaches: getCurrentNodeOutputs called
5. Complex choice logic executes
6. Something triggers another re-render
7. Loop restarts at step 3
8. Never reaches: Component rendering
```

### **Key Functions Involved**
- `getCurrentNodeOutputs()` - Processes choice options and conditions
- `getConditionText()` - Evaluates choice conditions
- Choice rendering logic - Complex mapping and filtering
- Condition bubble rendering - Visual condition indicators

### **Files Modified**
- `src/components/InteractiveArticyViewer.tsx` - Main component with infinite loop issues
- Multiple debug logs added throughout render cycle

## 🎯 **Recommended Solution: Isolated Render Loop**

### **Problem with Current Approach**
The murderboard modal is rendered within the same React component tree that handles choice logic, causing interference between:
- Plugin modal state management
- Choice rendering and condition evaluation
- Complex useEffect dependencies

### **Proposed Solution: Separate React Root**
Create a completely isolated render loop for the murderboard:

```typescript
// 1. Create separate DOM container
const murderboardContainer = document.createElement('div');
murderboardContainer.id = 'murderboard-portal';
document.body.appendChild(murderboardContainer);

// 2. Create separate React root
const murderboardRoot = createRoot(murderboardContainer);

// 3. Render murderboard in isolated tree
murderboardRoot.render(<MurderboardModal />);
```

### **Benefits of Isolated Approach**
- ✅ **Complete isolation** from main app re-renders
- ✅ **No interference** with choice rendering logic
- ✅ **Guaranteed stability** - Cannot be affected by infinite loops
- ✅ **Maintains React benefits** - Still uses React components
- ✅ **Easy communication** - Via events or shared state
- ✅ **Performance improvement** - No unnecessary re-renders

### **Implementation Steps**
1. Create separate React root for murderboard
2. Move murderboard components out of main component tree
3. Set up event-based communication between main app and murderboard
4. Ensure complete render isolation
5. Test on both single and multiple choice nodes

## 📊 **Current Status**
- **Main Issue**: ✅ **RESOLVED** - Infinite re-render loops on multiple choice nodes
- **Solution Implemented**: ✅ Isolated render loop architecture
- **Testing Result**: ✅ **SUCCESS** - Murderboard works on multiple choice nodes!
- **Files Modified**: Isolated render manager, plugin types, usePlugins hook, murderboard plugin

## ✅ **SOLUTION COMPLETE**
**Date**: 2025-08-24
**Result**: **SUCCESS** - Murderboard plugin now works perfectly on both single nodes AND multiple choice nodes!

### **What Was Implemented**
1. ✅ Created `isolatedRenderManager.ts` - Manages separate React roots for problematic plugins
2. ✅ Enhanced plugin interface with `useIsolatedRendering()` method
3. ✅ Updated murderboard plugin to use isolated rendering
4. ✅ Modified `usePlugins` hook to support dual rendering modes
5. ✅ Maintained full backward compatibility with existing plugins

### **Test Results**
- ✅ **Single nodes**: Murderboard works (already working)
- ✅ **Multiple choice nodes**: Murderboard works (NOW FIXED!)
- ✅ **No infinite loops**: Complete isolation prevents interference
- ✅ **Smooth operation**: Open/close works perfectly
- ✅ **Other plugins**: Unaffected by changes
