# Multiple-Choice Sorting Documentation

## Overview

The Articy Web Viewer uses **Y position (vertical position)** as the primary sorting method for multiple-choice options when presenting them to users. This ensures that choices appear in the same visual order as they are arranged in the Articy:draft editor.

## How Choice Sorting Works

### Primary Sort: Y Position
When a node has multiple output connections (choices), the application sorts these choices based on their Y coordinate position from the Articy:draft project:

- **Smaller Y values** (higher on screen in Articy) appear **first** in the choice list
- **Larger Y values** (lower on screen in Articy) appear **last** in the choice list
- This creates a top-to-bottom ordering that matches the visual layout in Articy:draft

### Secondary Sort: X Position
If two or more choices have the same Y position, the application uses X position as a tiebreaker:

- **Smaller X values** (left side) appear before **larger X values** (right side)
- This ensures consistent ordering even when nodes are aligned horizontally

### Default Position Handling
If a node lacks position data (rare but possible):
- Nodes without position data are assigned a default Y value of `999999`
- This places them at the bottom of the choice list

## Implementation Details

### Code Location
The sorting logic is implemented in `src/components/InteractiveArticyViewer.tsx`:

```typescript
// Sort choices by Y position (top to bottom)
const sortedOutputs = [...outputs].sort((a, b) => {
  const yPosA = project.getNodeYPosition(a.targetNode);
  const yPosB = project.getNodeYPosition(b.targetNode);
  
  // Sort by Y position (smaller Y values = higher on screen = come first)
  if (yPosA !== yPosB) {
    return yPosA - yPosB;
  }
  
  // If Y positions are the same, sort by X position as secondary sort
  const xPosA = a.targetNode?.Properties?.Position?.x || 0;
  const xPosB = b.targetNode?.Properties?.Position?.x || 0;
  return xPosA - xPosB;
});
```

### Position Extraction
The Y position is extracted from the node data structure in `src/utils/ArticyProject.ts`:

```typescript
getNodeYPosition(node: any): number {
  // Check if the node has a Position property with y coordinate
  if (node && node.Properties && node.Properties.Position && 
      typeof node.Properties.Position.y === 'number') {
    return node.Properties.Position.y;
  }
  // Return a default value if position is not available (place at bottom)
  return 999999;
}
```

## When Sorting Applies

Choice sorting is applied in the following scenarios:

1. **Hub Nodes**: When displaying choices from hub-type nodes
2. **Dialogue Fragments**: After showing dialogue content, when presenting response options
3. **Condition Nodes**: When showing conditional branches after displaying the condition
4. **Multi-Output Nodes**: Any node with multiple output connections

## Design Rationale

### Why Y Position?
Using Y position for sorting provides several benefits:

1. **Visual Consistency**: Choices appear in the same order as they're arranged in Articy:draft
2. **Author Control**: Content creators can control choice order by positioning nodes vertically
3. **Intuitive Ordering**: Top-to-bottom arrangement is natural for reading order
4. **No Manual Configuration**: Works automatically without requiring additional metadata

### Alternative Approaches Not Used
The application specifically does **NOT** use:
- Alphabetical sorting (would ignore author's intended order)
- Technical name suffixes (like `_01`, `_99` - these are for template organization, not runtime sorting)
- Creation order or ID-based sorting (not meaningful to content flow)
- Random ordering (would break narrative consistency)

## Best Practices for Content Authors

To ensure choices appear in the desired order:

1. **Arrange nodes vertically** in Articy:draft with the first choice at the top
2. **Use consistent spacing** between choice nodes for clarity
3. **Align nodes horizontally** only when order doesn't matter between them
4. **Test your content** in the preview to verify choice ordering

## Technical Notes

- Position data is stored as floating-point numbers in the Articy export
- The sorting is stable (maintains relative order for equal positions)
- Sorting happens at runtime when choices are displayed, not during data loading
- The same sorting logic applies to all node types with multiple outputs
