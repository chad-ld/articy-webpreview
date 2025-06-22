import _ from "lodash";

class ArticyProject {
  data: any;
  variables: any;
  initialVariables: any; // Store initial state for reset functionality
  objectDefinitions: any; // Store object definitions for class inheritance checking

  constructor(data: Object) {
    this.data = data;
    this.variables = {};
    this.objectDefinitions = (data as any).ObjectDefinitions || [];

    // Debug: Log data structure
    console.log('🔧 ArticyProject initialized with data:', {
      hasPackages: !!(data as any).Packages,
      packageCount: (data as any).Packages?.length || 0,
      hasGlobalVariables: !!(data as any).GlobalVariables,
      hasObjectDefinitions: !!(data as any).ObjectDefinitions,
      sourceFormat: (data as any)._metadata?.sourceFormat,
      totalModels: (data as any).Packages?.reduce((sum: number, pkg: any) => sum + (pkg.Models?.length || 0), 0) || 0
    });

    // Debug: Log first few packages and models
    if ((data as any).Packages && (data as any).Packages.length > 0) {
      console.log('📦 First package:', {
        name: (data as any).Packages[0].Name,
        modelCount: (data as any).Packages[0].Models?.length || 0,
        firstModel: (data as any).Packages[0].Models?.[0]?.Type || 'none'
      });
    }

    // Initialize variables from GlobalVariables
    for (let i = 0; i < this.data.GlobalVariables.length; i++) {
      const namespace = this.data.GlobalVariables[i];
      this.variables[namespace.Namespace] = {};

      for (let j = 0; j < namespace.Variables.length; j++) {
        const variable = namespace.Variables[j];
        this.variables[namespace.Namespace][variable.Variable] = variable.Value;
      }
    }

    // Store initial state for reset functionality
    this.initialVariables = JSON.parse(JSON.stringify(this.variables));
  }

  GetNodeByID(id: string): any {
    for (let i = 0; i < this.data.Packages.length; i++) {
      const package_ = this.data.Packages[i];
      for (let j = 0; j < package_.Models.length; j++) {
        const model = package_.Models[j];
        if (model.Properties.Id == id) {
          return model;
        }
      }
    }
    return undefined;
  }

  GetStartNode(): any {
    console.log('🔍 Searching for start node in', this.data.Packages?.length || 0, 'packages');

    for (let i = 0; i < this.data.Packages.length; i++) {
      const package_ = this.data.Packages[i];
      console.log(`📦 Package ${i}: ${package_.Name}, ${package_.Models?.length || 0} models`);

      for (let j = 0; j < package_.Models.length; j++) {
        const model = package_.Models[j];

        // Check both Text and Expression properties for HTMLPREVIEW marker
        const hasTextPreview = model.Properties.Text && model.Properties.Text.includes("HTMLPREVIEW");
        const hasExpressionPreview = model.Properties.Expression && model.Properties.Expression.includes("HTMLPREVIEW");

        if (hasTextPreview || hasExpressionPreview) {
          console.log('🎯 Found start node:', {
            id: model.Properties.Id,
            type: model.Type,
            hasText: !!model.Properties.Text,
            hasExpression: !!model.Properties.Expression,
            foundIn: hasTextPreview ? 'Text' : 'Expression'
          });
          return model;
        }
      }
    }

    console.log('❌ No start node found with HTMLPREVIEW marker');
    return undefined;
  }

  GetFirstChildOfNode(parent: any): any {
    // For Flow Fragments, we need to find the start node, not just any child
    if (this.isFlowFragment(parent)) {
      return this.GetStartNodeInFlowFragment(parent);
    }

    // For non-Flow Fragments, return the first child as before
    for (let i = 0; i < this.data.Packages.length; i++) {
      const package_ = this.data.Packages[i];
      for (let j = 0; j < package_.Models.length; j++) {
        const model = package_.Models[j];
        if (model.Properties.Parent == parent.Properties.Id) {
          return model;
        }
      }
    }
    return undefined;
  }

  GetStartNodeInFlowFragment(flowFragment: any): any {
    // Get all children of the Flow Fragment
    const children: any[] = [];
    for (let i = 0; i < this.data.Packages.length; i++) {
      const package_ = this.data.Packages[i];
      for (let j = 0; j < package_.Models.length; j++) {
        const model = package_.Models[j];
        if (model.Properties.Parent == flowFragment.Properties.Id) {
          children.push(model);
        }
      }
    }

    if (children.length === 0) {
      return undefined;
    }

    // Find nodes that have no input connections from other nodes within the same Flow Fragment
    const candidateStartNodes: any[] = [];
    for (const child of children) {
      const hasInternalInputs = this.hasInputConnectionsFromSiblings(child, children);
      if (!hasInternalInputs) {
        candidateStartNodes.push(child);
      }
    }

    if (candidateStartNodes.length === 0) {
      console.log("⚠️ No nodes without internal inputs found, returning first child");
      return children[0];
    }

    if (candidateStartNodes.length === 1) {
      console.log("🎯 Found start node in Flow Fragment:", candidateStartNodes[0].Properties.Id, candidateStartNodes[0].Type, candidateStartNodes[0].Properties.DisplayName);
      return candidateStartNodes[0];
    }

    // Multiple candidates - use position and type to determine the best start node
    // Prefer Instruction nodes with "HUB" in the name, then use leftmost position
    let bestCandidate = candidateStartNodes[0];

    for (const candidate of candidateStartNodes) {
      const isHubInstruction = candidate.Type === "Instruction" &&
                              candidate.Properties.DisplayName &&
                              candidate.Properties.DisplayName.includes("HUB");
      const currentIsHubInstruction = bestCandidate.Type === "Instruction" &&
                                     bestCandidate.Properties.DisplayName &&
                                     bestCandidate.Properties.DisplayName.includes("HUB");

      // Prefer hub instructions over other nodes
      if (isHubInstruction && !currentIsHubInstruction) {
        bestCandidate = candidate;
      } else if (isHubInstruction === currentIsHubInstruction) {
        // If both are hub instructions or both are not, prefer leftmost position
        const candidateX = candidate.Properties.Position?.x || 0;
        const bestX = bestCandidate.Properties.Position?.x || 0;
        if (candidateX < bestX) {
          bestCandidate = candidate;
        }
      }
    }

    console.log("🎯 Found start node in Flow Fragment (from", candidateStartNodes.length, "candidates):", bestCandidate.Properties.Id, bestCandidate.Type, bestCandidate.Properties.DisplayName);
    return bestCandidate;
  }

  // Get all nodes connected to the input pin of a Flow Fragment
  // This handles cases where multiple nodes are connected to the input pin and should be presented as choices
  GetNodesConnectedToFlowFragmentInput(flowFragment: any): any[] {
    console.log("🔍 GetNodesConnectedToFlowFragmentInput called for:", {
      id: flowFragment.Properties.Id,
      type: flowFragment.Type,
      displayName: flowFragment.Properties.DisplayName
    });

    // Get all children of the Flow Fragment
    const children: any[] = [];
    for (let i = 0; i < this.data.Packages.length; i++) {
      const package_ = this.data.Packages[i];
      for (let j = 0; j < package_.Models.length; j++) {
        const model = package_.Models[j];
        if (model.Properties.Parent == flowFragment.Properties.Id) {
          children.push(model);
        }
      }
    }

    console.log("🔍 Flow Fragment children found:", {
      flowFragmentId: flowFragment.Properties.Id,
      childrenCount: children.length,
      children: children.map(child => ({
        id: child.Properties.Id,
        type: child.Type,
        displayName: child.Properties.DisplayName
      }))
    });

    if (children.length === 0) {
      console.log("⚠️ No children found in Flow Fragment");
      return [];
    }

    // Find nodes that have no input connections from other nodes within the same Flow Fragment
    // These are the nodes connected directly to the Flow Fragment's input pin
    const inputConnectedNodes: any[] = [];
    for (const child of children) {
      const hasInternalInputs = this.hasInputConnectionsFromSiblings(child, children);
      console.log("🔍 Checking child for internal inputs:", {
        childId: child.Properties.Id,
        childType: child.Type,
        childDisplayName: child.Properties.DisplayName,
        hasInternalInputs: hasInternalInputs
      });

      if (!hasInternalInputs) {
        inputConnectedNodes.push(child);
      }
    }

    console.log("🎯 Found nodes connected to Flow Fragment input:", {
      flowFragmentId: flowFragment.Properties.Id,
      flowFragmentType: flowFragment.Type,
      totalChildren: children.length,
      inputConnectedCount: inputConnectedNodes.length,
      inputConnectedNodes: inputConnectedNodes.map(node => ({
        id: node.Properties.Id,
        type: node.Type,
        displayName: node.Properties.DisplayName
      }))
    });

    return inputConnectedNodes;
  }

  // Find the parent Flow Fragment container for a given node
  GetParentFlowFragment(node: any): any {
    if (!node || !node.Properties.Parent) {
      return undefined;
    }

    const parent = this.GetNodeByID(node.Properties.Parent);
    if (!parent) {
      return undefined;
    }

    // Check if the parent is a Flow Fragment using inheritance
    if (this.isFlowFragment(parent)) {
      return parent;
    }

    // Recursively check parent's parent
    return this.GetParentFlowFragment(parent);
  }

  // Get all sibling nodes within the same flow fragment
  GetSiblingNodesInFlowFragment(node: any): any[] {
    const parentFlowFragment = this.GetParentFlowFragment(node);
    if (!parentFlowFragment) {
      return [];
    }

    // Get all children of the Flow Fragment (siblings of the current node)
    const siblings: any[] = [];
    for (let i = 0; i < this.data.Packages.length; i++) {
      const package_ = this.data.Packages[i];
      for (let j = 0; j < package_.Models.length; j++) {
        const model = package_.Models[j];
        if (model.Properties.Parent === parentFlowFragment.Properties.Id &&
            model.Properties.Id !== node.Properties.Id) {
          siblings.push(model);
        }
      }
    }

    console.log("🔍 GetSiblingNodesInFlowFragment:", {
      currentNodeId: node.Properties.Id,
      currentNodeType: node.Type,
      parentFlowFragmentId: parentFlowFragment.Properties.Id,
      parentFlowFragmentType: parentFlowFragment.Type,
      siblingCount: siblings.length,
      siblings: siblings.map(s => ({
        id: s.Properties.Id,
        type: s.Type,
        displayName: s.Properties.DisplayName
      }))
    });

    return siblings;
  }

  hasInputConnectionsFromSiblings(node: any, siblings: any[]): boolean {
    if (!node.Properties.InputPins) {
      return false;
    }

    // We need to find connections TO this node's input pins from sibling nodes
    // Since input pins don't store their incoming connections, we need to search
    // through all sibling nodes' output pins to see if any connect to this node
    for (const sibling of siblings) {
      if (sibling.Properties.Id === node.Properties.Id) {
        continue; // Skip self
      }

      if (sibling.Properties.OutputPins) {
        for (const outputPin of sibling.Properties.OutputPins) {
          if (outputPin.Connections) {
            for (const connection of outputPin.Connections) {
              if (connection.Target === node.Properties.Id) {
                console.log("🔗 Found internal connection:", sibling.Properties.Id, "→", node.Properties.Id);
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  // Check if a node type inherits from a specific class
  nodeInheritsFromClass(nodeType: string, className: string): boolean {
    if (!this.objectDefinitions) {
      console.log('🚨 No object definitions found in project');
      return false;
    }

    const definition = this.objectDefinitions.find((def: any) => def.Type === nodeType);
    if (!definition) {
      console.log('🚨 No definition found for node type:', nodeType);
      return false;
    }

    console.log('🔍 Checking inheritance for:', {
      nodeType,
      className,
      definitionClass: definition.Class,
      definitionInheritsFrom: definition.InheritsFrom
    });

    // Check direct class match
    if (definition.Class === className) {
      console.log('✅ Direct class match:', nodeType, 'is', className);
      return true;
    }

    // Check inheritance chain
    if (definition.InheritsFrom === className) {
      console.log('✅ Inheritance match:', nodeType, 'inherits from', className);
      return true;
    }

    console.log('❌ No inheritance match found');
    return false;
  }

  // Check if a node is a flow fragment based on inheritance
  isFlowFragment(node: any): boolean {
    return this.nodeInheritsFromClass(node.Type, "FlowFragment");
  }

  // Get the template technical name for a node type
  getTemplateTechnicalName(nodeType: string): string {
    if (!this.objectDefinitions) {
      console.log('🚨 No object definitions found in project');
      return '';
    }

    const definition = this.objectDefinitions.find((def: any) => def.Type === nodeType);
    if (!definition || !definition.Template) {
      console.log('🚨 No template definition found for node type:', nodeType);
      return '';
    }

    return definition.Template.TechnicalName || '';
  }

  // Extract the numeric suffix from a template technical name (e.g., "_99" from "TravelFlowTemplate_99")
  getTemplateSortOrder(nodeType: string): { hasPostfix: boolean; number: number; originalName: string } {
    const technicalName = this.getTemplateTechnicalName(nodeType);

    // Match pattern like "_01", "_99", etc. at the end of the string
    const match = technicalName.match(/_(\d+)$/);

    if (match) {
      const number = parseInt(match[1], 10);
      console.log('🔢 Template sort order:', {
        nodeType,
        technicalName,
        hasPostfix: true,
        number
      });
      return {
        hasPostfix: true,
        number: number,
        originalName: technicalName
      };
    } else {
      console.log('🔢 Template sort order:', {
        nodeType,
        technicalName,
        hasPostfix: false,
        number: 50 // Default middle value for nodes without postfix
      });
      return {
        hasPostfix: false,
        number: 50, // Default middle value for nodes without postfix
        originalName: technicalName
      };
    }
  }

  StoreVariablesFromNode(node: any): void {
    // 🔧 NEW LINE-BY-LINE APPROACH: Process variables immediately as we encounter each line
    this.ProcessVariablesLineByLine(node);
  }

  /**
   * Process variables line by line, updating this.variables immediately after each line
   * This ensures increment operations work correctly and variables are always up-to-date
   */
  ProcessVariablesLineByLine(node: any): void {
    if (node.Properties == undefined) return;
    if (node.Properties.Expression == undefined) return;

    // Skip processing for Condition nodes - they contain evaluation expressions, not assignments
    if (node.Type === "Condition") {
      console.log(`🔍 SKIPPING VARIABLE PROCESSING for Condition node ${node.Properties.Id}: Contains evaluation expressions, not assignments`);
      return;
    }

    const textChunks: string[] = (node.Properties.Expression as string).split("\n");

    console.log(`🔄 PROCESSING VARIABLES LINE-BY-LINE for node ${node.Properties.Id}:`, {
      nodeType: node.Type,
      totalLines: textChunks.length,
      expression: node.Properties.Expression
    });

    // Process each line immediately
    for (let i = 0; i < textChunks.length; i++) {
      const line = textChunks[i].trim();

      // Skip empty lines and comments
      if (line.length === 0 || line.startsWith("//")) {
        continue;
      }

      console.log(`📝 PROCESSING LINE ${i + 1}: ${line}`);

      // Process this single line and update variables immediately
      const value = this.SplitValueFromText(line);
      const pathChunks = this.SplitIndexersFromText(line);

      if (pathChunks.length > 0 && value !== undefined) {
        this.UpdateVariableDirectly(pathChunks, value);
        console.log(`✅ LINE ${i + 1} COMPLETE: ${pathChunks.join('.')} = ${value}`);
      } else {
        console.log(`⚠️ LINE ${i + 1} SKIPPED: Could not parse variable assignment`);
      }
    }

    console.log(`🎯 FINAL VARIABLES AFTER LINE-BY-LINE PROCESSING:`, this.variables);
  }

  ResetVariablesToInitialState(): void {
    this.variables = JSON.parse(JSON.stringify(this.initialVariables));
  }

  SearchNodes(term: string): any[] {
    const results: any[] = [];
    const searchTerm = term.toLowerCase();

    for (let i = 0; i < this.data.Packages.length; i++) {
      const package_ = this.data.Packages[i];
      for (let j = 0; j < package_.Models.length; j++) {
        const model = package_.Models[j];
        
        // Search in various text fields
        const searchableText = [
          model.Properties.Text || '',
          model.Properties.DisplayName || '',
          model.Properties.TechnicalName || '',
          model.Properties.Expression || ''
        ].join(' ').toLowerCase();

        if (searchableText.includes(searchTerm)) {
          // Create preview text (first 100 chars)
          let preview = model.Properties.Text || model.Properties.Expression || model.Properties.DisplayName || '';
          if (preview.length > 100) {
            preview = preview.substring(0, 97) + '...';
          }
          
          results.push({
            node: model,
            preview: preview
          });
        }
      }
    }
    
    return results;
  }

  GetVariablesFromNode(node: any): any {
    // 🔧 DEPRECATED: This method is now replaced by ProcessVariablesLineByLine
    // Keeping for backward compatibility, but it just returns empty object
    console.log("⚠️ GetVariablesFromNode called - this method is deprecated in favor of line-by-line processing");
    return {};
  }

  /**
   * Update a variable directly in this.variables using the path chunks
   * This ensures immediate updates for increment operations
   */
  UpdateVariableDirectly(pathChunks: string[], value: any): void {
    let current = this.variables;

    // Navigate to the parent object
    for (let i = 0; i < pathChunks.length - 1; i++) {
      const chunk = pathChunks[i];
      if (!current[chunk]) {
        current[chunk] = {};
      }
      current = current[chunk];
    }

    // Set the final value
    const finalKey = pathChunks[pathChunks.length - 1].trim();
    current[finalKey] = value;

    console.log(`🔧 DIRECT VARIABLE UPDATE: ${pathChunks.join('.')} = ${value}`, {
      pathChunks: pathChunks,
      finalKey: finalKey,
      value: value,
      updatedSection: current
    });
  }

  CheckConditionString(condition: string): boolean {
    // Enhanced condition parser that handles parentheses and proper operator precedence
    return this.ParseBooleanExpression(condition.trim());
  }

  /**
   * Parse a boolean expression with support for:
   * - Parentheses grouping: (condition1 && condition2) || condition3
   * - Operator precedence: && has higher precedence than ||
   * - Nested expressions: ((condition1 && condition2) || condition3) && condition4
   */
  ParseBooleanExpression(expression: string): boolean {
    console.log('🔍 PARSING BOOLEAN EXPRESSION:', expression);

    // Remove outer whitespace
    expression = expression.trim();

    // Handle parentheses first - find and evaluate innermost parentheses
    while (expression.includes('(')) {
      const result = this.EvaluateInnermostParentheses(expression);
      if (result === null) {
        console.error('🚨 Failed to parse parentheses in expression:', expression);
        return false;
      }
      expression = result;
    }

    // Now we have an expression without parentheses, evaluate it
    return this.EvaluateSimpleExpression(expression);
  }

  /**
   * Find and evaluate the innermost parentheses in an expression
   * Returns the expression with the parentheses replaced by the result
   */
  EvaluateInnermostParentheses(expression: string): string | null {
    // Find the last opening parenthesis (innermost)
    let lastOpenIndex = -1;
    for (let i = 0; i < expression.length; i++) {
      if (expression[i] === '(') {
        lastOpenIndex = i;
      }
    }

    if (lastOpenIndex === -1) {
      return expression; // No parentheses found
    }

    // Find the corresponding closing parenthesis
    let closeIndex = -1;
    for (let i = lastOpenIndex + 1; i < expression.length; i++) {
      if (expression[i] === ')') {
        closeIndex = i;
        break;
      }
    }

    if (closeIndex === -1) {
      console.error('🚨 Unmatched opening parenthesis in expression:', expression);
      return null;
    }

    // Extract the expression inside the parentheses
    const innerExpression = expression.substring(lastOpenIndex + 1, closeIndex);
    console.log('🔍 EVALUATING INNER EXPRESSION:', innerExpression);

    // Evaluate the inner expression
    const result = this.EvaluateSimpleExpression(innerExpression);
    console.log('🔍 INNER EXPRESSION RESULT:', result);

    // Replace the parentheses and their content with the result
    const before = expression.substring(0, lastOpenIndex);
    const after = expression.substring(closeIndex + 1);
    const newExpression = before + result.toString() + after;

    console.log('🔍 EXPRESSION AFTER PARENTHESES EVALUATION:', newExpression);
    return newExpression;
  }

  /**
   * Evaluate a simple expression without parentheses
   * Handles || and && operators with proper precedence (|| has lower precedence than &&)
   */
  EvaluateSimpleExpression(expression: string): boolean {
    expression = expression.trim();
    console.log('🔍 EVALUATING SIMPLE EXPRESSION:', expression);

    // Handle || operator (lowest precedence)
    if (expression.includes('||')) {
      const parts = this.SplitByOperator(expression, '||');
      console.log('🔍 OR PARTS:', parts);
      return parts.some(part => this.EvaluateSimpleExpression(part.trim()));
    }

    // Handle && operator (higher precedence)
    if (expression.includes('&&')) {
      const parts = this.SplitByOperator(expression, '&&');
      console.log('🔍 AND PARTS:', parts);
      return parts.every(part => this.EvaluateSimpleExpression(part.trim()));
    }

    // Handle boolean literals (from evaluated parentheses)
    if (expression === 'true') return true;
    if (expression === 'false') return false;

    // Handle single condition
    return this.CheckSingleCondition(expression);
  }

  /**
   * Split an expression by an operator, respecting that the operator
   * should not be inside parentheses or quotes
   */
  SplitByOperator(expression: string, operator: string): string[] {
    const parts: string[] = [];
    let currentPart = '';
    let parenthesesDepth = 0;
    let inQuotes = false;
    let i = 0;

    while (i < expression.length) {
      const char = expression[i];

      if (char === '"' && (i === 0 || expression[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
        currentPart += char;
      } else if (!inQuotes) {
        if (char === '(') {
          parenthesesDepth++;
          currentPart += char;
        } else if (char === ')') {
          parenthesesDepth--;
          currentPart += char;
        } else if (parenthesesDepth === 0 && expression.substring(i, i + operator.length) === operator) {
          // Found the operator at the top level
          parts.push(currentPart);
          currentPart = '';
          i += operator.length - 1; // Skip the operator
        } else {
          currentPart += char;
        }
      } else {
        currentPart += char;
      }

      i++;
    }

    // Add the last part
    if (currentPart) {
      parts.push(currentPart);
    }

    return parts;
  }

  CheckSingleCondition(condition: string): boolean {
    // Determine the operator type
    let operator = '=='; // default
    let operatorIndex = -1;

    // Check for operators in order of precedence (longer operators first)
    if (condition.includes('>=')) {
      operator = '>=';
      operatorIndex = condition.indexOf('>=');
    } else if (condition.includes('<=')) {
      operator = '<=';
      operatorIndex = condition.indexOf('<=');
    } else if (condition.includes('!=')) {
      operator = '!=';
      operatorIndex = condition.indexOf('!=');
    } else if (condition.includes('==')) {
      operator = '==';
      operatorIndex = condition.indexOf('==');
    } else if (condition.includes('>')) {
      operator = '>';
      operatorIndex = condition.indexOf('>');
    } else if (condition.includes('<')) {
      operator = '<';
      operatorIndex = condition.indexOf('<');
    } else if (condition.includes('=')) {
      operator = '=';
      operatorIndex = condition.indexOf('=');
    }

    if (operatorIndex === -1) {
      console.log('🔍 NO OPERATOR FOUND in condition:', condition);
      return false;
    }

    // Extract variable path and comparison value
    const variablePath = condition.substring(0, operatorIndex).trim();
    const comparisonValueStr = condition.substring(operatorIndex + operator.length).trim().replace(';', '');

    // Parse the comparison value
    let comparisonValue: any = comparisonValueStr;
    if (comparisonValueStr === "true") comparisonValue = true;
    else if (comparisonValueStr === "false") comparisonValue = false;
    else if (!isNaN(Number(comparisonValueStr))) comparisonValue = Number(comparisonValueStr);
    else if (comparisonValueStr.startsWith('"') && comparisonValueStr.endsWith('"')) {
      comparisonValue = comparisonValueStr.slice(1, -1);
    }

    // Get the actual variable value
    const actualValue = this.GetVariableValue(variablePath);

    // Debug logging
    console.log('🔍 CONDITION EVALUATION DEBUG:', {
      originalCondition: condition,
      operator: operator,
      variablePath: variablePath,
      actualValue: actualValue,
      comparisonValue: comparisonValue,
      currentVariables: this.variables
    });

    // Perform the comparison based on operator
    let result = false;
    switch (operator) {
      case '>':
        result = actualValue > comparisonValue;
        break;
      case '<':
        result = actualValue < comparisonValue;
        break;
      case '>=':
        result = actualValue >= comparisonValue;
        break;
      case '<=':
        result = actualValue <= comparisonValue;
        break;
      case '!=':
        result = actualValue != comparisonValue;
        break;
      case '==':
      case '=':
      default:
        result = actualValue == comparisonValue;
        break;
    }

    console.log('🔍 CONDITION RESULT:', result);
    return result;
  }

  CheckCondition(condition: {}): boolean {
    return this.ObjectCompare(this.variables, condition);
  }

  ObjectCompare(objx: any, objy: any): boolean {
    // objx = current variables (e.g., { TestFlowVariables: { Quest001_waypoint01_completed: "False" } })
    // objy = condition structure (e.g., { TestFlowVariables: { Quest001_waypoint01_completed: false } })

    // Get the actual variable value from objx using the path structure from objy
    function GetValueFromPath(variables: any, pathStructure: any): any {
      if (typeof variables === 'string' || typeof variables === 'boolean' || typeof variables === 'number') {
        // We've reached the leaf value in the variables
        return variables;
      }

      if (typeof pathStructure === 'string' || typeof pathStructure === 'boolean' || typeof pathStructure === 'number') {
        // We've reached the leaf in pathStructure, but variables should be the actual value
        return variables;
      }

      // Navigate through the path
      for (const key in pathStructure) {
        if (variables && variables.hasOwnProperty(key)) {
          return GetValueFromPath(variables[key], pathStructure[key]);
        }
      }
      return undefined;
    }

    // Get the expected value from the condition structure (objy)
    function GetExpectedValue(pathStructure: any): any {
      if (typeof pathStructure === 'string' || typeof pathStructure === 'boolean' || typeof pathStructure === 'number') {
        return pathStructure;
      }

      for (const key in pathStructure) {
        return GetExpectedValue(pathStructure[key]);
      }
      return undefined;
    }

    const actualValue = GetValueFromPath(objx, objy);
    const expectedValue = GetExpectedValue(objy);

    // Handle string-to-boolean conversion for proper comparison
    const normalizeValue = (val: any): any => {
      if (typeof val === 'string') {
        if (val.toLowerCase() === 'true') return true;
        if (val.toLowerCase() === 'false') return false;
      }
      return val;
    };

    const normalizedActualValue = normalizeValue(actualValue);
    const normalizedExpectedValue = normalizeValue(expectedValue);

    // Debug logging for comparison
    console.log('🔍 OBJECT COMPARE DEBUG:', {
      actualValue: actualValue,
      expectedValue: expectedValue,
      actualValueType: typeof actualValue,
      expectedValueType: typeof expectedValue,
      normalizedActualValue: normalizedActualValue,
      normalizedExpectedValue: normalizedExpectedValue,
      normalizedActualValueType: typeof normalizedActualValue,
      normalizedExpectedValueType: typeof normalizedExpectedValue,
      comparisonResult: normalizedActualValue === normalizedExpectedValue
    });

    return normalizedActualValue === normalizedExpectedValue;
  }

  // Helper method to get current variable value by path
  GetVariableValue(variablePath: string): any {
    const pathParts = variablePath.split('.');
    let current = this.variables;

    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined; // Return undefined if variable doesn't exist
      }
    }

    // Handle string-to-boolean conversion for proper comparison
    if (typeof current === 'string') {
      if (current.toLowerCase() === 'true') return true;
      if (current.toLowerCase() === 'false') return false;
      // Try to convert to number if it's a numeric string
      if (!isNaN(Number(current))) return Number(current);
    }

    return current;
  }

  SplitValueFromText(text: string): any {
    // Handle increment/decrement operators first
    if (text.includes('++')) {
      // For increment, we need to get the current value and add 1
      const variablePath = text.replace('++', '').replace(';', '').trim();
      const currentValue = this.GetVariableValue(variablePath);
      const numValue = Number(currentValue) || 0;
      const newValue = numValue + 1;
      console.log(`🔢 INCREMENT: ${variablePath} from ${currentValue} to ${newValue}`);
      return newValue;
    } else if (text.includes('--')) {
      // For decrement, we need to get the current value and subtract 1
      const variablePath = text.replace('--', '').replace(';', '').trim();
      const currentValue = this.GetVariableValue(variablePath);
      const numValue = Number(currentValue) || 0;
      const newValue = numValue - 1;
      console.log(`🔢 DECREMENT: ${variablePath} from ${currentValue} to ${newValue}`);
      return newValue;
    }

    // Handle comparison operators: ==, !=, >=, <=, >, <
    let operatorIndex = -1;
    let operatorLength = 0;

    // Check for double-character operators first
    if (text.includes('==')) {
      operatorIndex = text.indexOf('==');
      operatorLength = 2;
    } else if (text.includes('!=')) {
      operatorIndex = text.indexOf('!=');
      operatorLength = 2;
    } else if (text.includes('>=')) {
      operatorIndex = text.indexOf('>=');
      operatorLength = 2;
    } else if (text.includes('<=')) {
      operatorIndex = text.indexOf('<=');
      operatorLength = 2;
    } else if (text.includes('>')) {
      operatorIndex = text.indexOf('>');
      operatorLength = 1;
    } else if (text.includes('<')) {
      operatorIndex = text.indexOf('<');
      operatorLength = 1;
    } else if (text.includes('=')) {
      // Single = for assignment
      operatorIndex = text.indexOf('=');
      operatorLength = 1;
    }

    if (operatorIndex === -1) return undefined;

    let value = text.substring(operatorIndex + operatorLength).trim();

    // Remove semicolon if present
    if (value.endsWith(";")) {
      value = value.slice(0, -1);
    }

    // Parse different value types
    if (value === "true") return true;
    if (value === "false") return false;
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1); // Remove quotes
    }
    if (!isNaN(Number(value))) {
      return Number(value);
    }

    return value;
  }

  SplitIndexersFromText(text: string): string[] {
    // Handle increment/decrement operators first
    if (text.includes('++')) {
      const variablePath = text.replace('++', '').replace(';', '').trim();
      return variablePath.split(".");
    } else if (text.includes('--')) {
      const variablePath = text.replace('--', '').replace(';', '').trim();
      return variablePath.split(".");
    }

    // Handle comparison operators: ==, !=, >=, <=, >, <, =
    let operatorIndex = -1;

    // Check for double-character operators first
    if (text.includes('==')) {
      operatorIndex = text.indexOf('==');
    } else if (text.includes('!=')) {
      operatorIndex = text.indexOf('!=');
    } else if (text.includes('>=')) {
      operatorIndex = text.indexOf('>=');
    } else if (text.includes('<=')) {
      operatorIndex = text.indexOf('<=');
    } else if (text.includes('>')) {
      operatorIndex = text.indexOf('>');
    } else if (text.includes('<')) {
      operatorIndex = text.indexOf('<');
    } else if (text.includes('=')) {
      // Single = for assignment
      operatorIndex = text.indexOf('=');
    }

    if (operatorIndex === -1) return [];

    const leftSide = text.substring(0, operatorIndex).trim();
    return leftSide.split(".");
  }
}

export default ArticyProject;
