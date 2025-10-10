# Variable System Documentation

## 🎯 **Overview**

The Articy Web Viewer includes a sophisticated variable management system (`src/utils/ArticyProject.ts`) that handles global variables, variable operations, and complex condition evaluation. The system supports namespaced variables, increment/decrement operations, and boolean expressions with parentheses and operator precedence.

## 🏗️ **Architecture**

### **Core Components**

1. **Variable Storage** - Hierarchical namespace-based storage
2. **Variable Operations** - Assignment, increment, decrement
3. **Condition Evaluation** - Complex boolean expressions with parentheses
4. **Line-by-Line Processing** - Ensures correct execution order
5. **Variable Reset** - Ability to restore initial state

### **Variable Structure**

```typescript
// Global variables organized by namespace
{
  "TestFlowVariables": {
    "Quest001_waypoint01_completed": false,
    "Quest001_progress": 0,
    "player_health": 100
  },
  "GameState": {
    "current_chapter": 1,
    "difficulty": "normal"
  }
}
```

## 📦 **Variable Namespaces**

Variables are organized into namespaces for better organization and to avoid naming conflicts:

```javascript
// Accessing variables
this.variables["TestFlowVariables"]["Quest001_progress"]
this.variables["GameState"]["current_chapter"]
```

**Benefits**:
- Logical grouping of related variables
- Prevents naming conflicts between different systems
- Matches Articy Draft's variable organization
- Easier to manage large variable sets

## 🔧 **Variable Operations**

### **1. Assignment**

Simple value assignment using `=` operator:

```javascript
// In Articy Instruction node Expression field:
TestFlowVariables.Quest001_progress = 1
TestFlowVariables.player_name = "Hero"
GameState.difficulty = "hard"
```

**Supported Types**:
- **Boolean**: `true` / `false`
- **Number**: `42` / `3.14` / `-10`
- **String**: `"text value"`

### **2. Increment (`++`)**

Increases numeric variable by 1:

```javascript
// In Articy Instruction node:
TestFlowVariables.Quest001_progress++

// Equivalent to:
TestFlowVariables.Quest001_progress = TestFlowVariables.Quest001_progress + 1
```

**How it works**:
1. Gets current value of variable
2. Converts to number (0 if undefined)
3. Adds 1
4. Stores new value immediately

### **3. Decrement (`--`)**

Decreases numeric variable by 1:

```javascript
// In Articy Instruction node:
TestFlowVariables.player_health--

// Equivalent to:
TestFlowVariables.player_health = TestFlowVariables.player_health - 1
```

## 📝 **Line-by-Line Processing**

**Critical Feature**: Variables are processed line-by-line to ensure increment/decrement operations work correctly.

### **Why Line-by-Line?**

Consider this example:

```javascript
// Instruction node with multiple operations
TestFlowVariables.counter++
TestFlowVariables.counter++
TestFlowVariables.total = TestFlowVariables.counter
```

**With line-by-line processing**:
1. Line 1: `counter` goes from 0 → 1 (updated immediately)
2. Line 2: `counter` goes from 1 → 2 (uses updated value)
3. Line 3: `total` = 2 (correct!)

**Without line-by-line processing** (old approach):
1. All lines parsed first
2. `counter++` would read old value (0) both times
3. Result: `counter` = 1, `total` = 1 (incorrect!)

### **Implementation**

```typescript
ProcessVariablesLineByLine(node: any): void {
  // Skip Condition nodes - they contain evaluation expressions, not assignments
  if (node.Type === "Condition") {
    return;
  }

  const textChunks = node.Properties.Expression.split("\n");

  // Process each line immediately
  for (let i = 0; i < textChunks.length; i++) {
    const line = textChunks[i].trim();

    // Skip empty lines and comments
    if (line.length === 0 || line.startsWith("//")) {
      continue;
    }

    // Parse and execute this single line
    const value = this.SplitValueFromText(line);
    const pathChunks = this.SplitIndexersFromText(line);

    if (pathChunks.length > 0 && value !== undefined) {
      this.UpdateVariableDirectly(pathChunks, value);
    }
  }
}
```

## 🔍 **Condition Evaluation**

The system supports complex boolean expressions with proper operator precedence and parentheses.

### **Comparison Operators**

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equal to | `Quest001_progress == 5` |
| `!=` | Not equal to | `player_name != "Enemy"` |
| `>` | Greater than | `player_health > 50` |
| `<` | Less than | `current_chapter < 10` |
| `>=` | Greater than or equal | `level >= 5` |
| `<=` | Less than or equal | `progress <= 100` |

### **Boolean Operators**

| Operator | Precedence | Description |
|----------|------------|-------------|
| `&&` | Higher | Logical AND (both must be true) |
| `\|\|` | Lower | Logical OR (at least one must be true) |

### **Parentheses**

Parentheses control evaluation order and can be nested:

```javascript
// Complex condition example
(Quest001_progress >= 5 && player_health > 0) || GameState.godmode == true
```

**Evaluation order**:
1. Innermost parentheses first
2. `&&` has higher precedence than `||`
3. Left to right within same precedence level

### **Boolean Expression Parser**

The parser handles nested expressions correctly:

```typescript
ParseBooleanExpression(expression: string): boolean {
  // 1. Find and evaluate innermost parentheses
  while (expression.includes('(')) {
    expression = this.EvaluateInnermostParentheses(expression);
  }

  // 2. Evaluate simple expression without parentheses
  return this.EvaluateSimpleExpression(expression);
}

EvaluateSimpleExpression(expression: string): boolean {
  // Handle || operator (lowest precedence)
  if (expression.includes('||')) {
    const parts = this.SplitByOperator(expression, '||');
    return parts.some(part => this.EvaluateSimpleExpression(part.trim()));
  }

  // Handle && operator (higher precedence)
  if (expression.includes('&&')) {
    const parts = this.SplitByOperator(expression, '&&');
    return parts.every(part => this.EvaluateSimpleExpression(part.trim()));
  }

  // Handle single condition
  return this.CheckSingleCondition(expression);
}
```

### **Condition Examples**

#### Simple Conditions

```javascript
// In Articy Condition nodes:

// Number comparison
TestFlowVariables.Quest001_progress >= 5

// Boolean check
TestFlowVariables.Quest001_completed == true

// String comparison
TestFlowVariables.player_name == "Hero"
```

#### AND Conditions

```javascript
// Both must be true
TestFlowVariables.Quest001_progress >= 5 && TestFlowVariables.player_health > 0
```

#### OR Conditions

```javascript
// At least one must be true
GameState.difficulty == "easy" || GameState.godmode == true
```

#### Complex Nested Conditions

```javascript
// Parentheses control evaluation order
((Quest001_progress >= 5 && player_health > 50) || godmode == true) && chapter >= 3

// Evaluation steps:
// 1. (Quest001_progress >= 5 && player_health > 50) → innermost parentheses
// 2. (result_from_step_1 || godmode == true) → middle parentheses
// 3. result_from_step_2 && chapter >= 3 → final result
```

## 🔄 **Variable Lifecycle**

### **Initialization**

Variables are loaded from `GlobalVariables` section of Articy data:

```typescript
constructor(data: Object) {
  this.variables = {};

  // Load global variables from Articy data
  for (const namespace of data.GlobalVariables) {
    this.variables[namespace.Namespace] = {};

    for (const variable of namespace.Variables) {
      this.variables[namespace.Namespace][variable.Variable] = variable.Value;
    }
  }

  // Store initial state for reset functionality
  this.initialVariables = JSON.parse(JSON.stringify(this.variables));
}
```

### **Runtime Updates**

Variables are updated as the user navigates through nodes:

1. User clicks choice or "Next" button
2. System navigates to target node
3. If node is Instruction type, processes variables line-by-line
4. If node is Condition type, evaluates condition (doesn't modify variables)
5. Updated variables affect future condition evaluations

### **Reset Functionality**

Variables can be reset to their initial state:

```typescript
ResetVariablesToInitialState(): void {
  this.variables = JSON.parse(JSON.stringify(this.initialVariables));
}
```

**Use cases**:
- User wants to restart the experience
- Testing different story paths
- Resetting after reaching an end node

## 🎮 **Usage in Articy Draft**

### **Instruction Nodes**

Use Instruction nodes to modify variables:

```javascript
// In Instruction node's Expression field:

// Set quest progress
TestFlowVariables.Quest001_progress = 1

// Mark quest complete
TestFlowVariables.Quest001_completed = true

// Increment counter
TestFlowVariables.attempts++

// Multiple operations (processed line-by-line)
TestFlowVariables.Quest001_started = true
TestFlowVariables.Quest001_progress = 0
TestFlowVariables.attempts++
```

**Important**: Instruction nodes should ONLY contain variable assignments, not condition checks.

### **Condition Nodes**

Use Condition nodes to evaluate conditions:

```javascript
// In Condition node's Expression field:

// Simple condition
TestFlowVariables.Quest001_completed == true

// Complex condition
TestFlowVariables.Quest001_progress >= 5 && TestFlowVariables.player_health > 0

// Very complex condition
((Quest001_completed == true && Quest002_completed == true) || godmode == true) && chapter >= 2
```

**Important**: Condition nodes should ONLY contain condition expressions, not variable assignments. The system specifically skips variable processing for Condition nodes to prevent confusion.

### **Node Type Distinction**

| Node Type | Expression Purpose | Variable Processing | Example |
|-----------|-------------------|---------------------|---------|
| **Instruction** | Modify variables | ✅ Yes | `counter++` |
| **Condition** | Evaluate conditions | ❌ No | `counter >= 5` |

## 🧪 **Testing & Debugging**

### **Variable Inspector**

The application includes a Variables Panel that shows current variable values:

- View all namespaces and variables
- See current values in real-time
- Edit variables during testing
- Reset variables to initial state

### **Console Logging**

The system logs detailed information about variable operations:

```javascript
console.log(`🔧 DIRECT VARIABLE UPDATE: TestFlowVariables.counter = 5`);
console.log(`🔢 INCREMENT: TestFlowVariables.progress from 0 to 1`);
console.log(`🔍 CONDITION RESULT: true`);
```

Enable debug output to troubleshoot variable issues.

### **Common Issues**

#### Variables Not Updating

**Problem**: Variable changes don't seem to take effect

**Solutions**:
1. Check node type - Condition nodes don't process variables
2. Verify variable path matches namespace structure
3. Check for typos in variable names
4. Review console logs for processing errors

#### Increment Not Working

**Problem**: `counter++` doesn't increment correctly

**Solutions**:
1. Ensure using Instruction node, not Condition node
2. Check if variable exists in GlobalVariables
3. Verify variable is numeric type
4. Review line-by-line processing logs

#### Condition Always False

**Problem**: Condition never evaluates to true

**Solutions**:
1. Check variable path is correct
2. Verify expected value matches actual value
3. Check for type mismatches (string "true" vs boolean true)
4. Enable debug logging to see actual vs. expected values

## 📚 **Best Practices**

### **For Content Creators**

1. **Use meaningful names** - `Quest001_progress` not `q1p`
2. **Organize by namespace** - Group related variables together
3. **Initialize in GlobalVariables** - Set default values in Articy Draft
4. **Test conditions thoroughly** - Verify logic with different variable states
5. **Document complex expressions** - Add comments explaining logic

### **For Developers**

1. **Preserve line-by-line processing** - Critical for correct operation order
2. **Don't modify Condition nodes for variables** - They're for evaluation only
3. **Handle type conversions** - String "true" vs boolean true
4. **Log variable changes** - Help debug issues
5. **Validate variable paths** - Check namespace.variableName format

### **Variable Naming Conventions**

```javascript
// Good - Clear, descriptive names
TestFlowVariables.Quest001_WaypointAlpha_discovered = true
GameState.current_chapter_number = 3
PlayerStats.health_current = 75

// Avoid - Ambiguous or too short
TestFlowVariables.q1wa = true
GameState.ccn = 3
PlayerStats.hc = 75
```

## 🔒 **Type Handling**

### **Automatic Type Conversion**

The system handles type conversions automatically:

```typescript
// String to boolean
if (value.toLowerCase() === 'true') return true;
if (value.toLowerCase() === 'false') return false;

// String to number
if (!isNaN(Number(value))) return Number(value);
```

### **Type Preservation**

Original types are preserved when possible:
- Boolean values stay boolean
- Numeric values stay numeric
- String values stay string

This prevents unexpected type coercion issues.

---

> **📝 Note**: The variable system is designed to match Articy Draft's behavior while providing robust error handling and debugging capabilities. Understanding line-by-line processing and the distinction between Instruction and Condition nodes is critical for correct usage.
