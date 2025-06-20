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
    const isFlowFragment = (
      parent.Type === "FlowFragment" ||
      parent.Type === "DialogueIntActionTemplate" ||
      parent.Type === "CombatFlowTemplate" ||
      parent.Type === "CraftingFlowTemplate" ||
      parent.Type === "TravelFlowTemplate" ||
      parent.Type === "PlayerActionFlowTemplate" ||
      parent.Type === "LocationFlowTemplate" ||
      parent.Type === "EnemyGenericFlowTemplate" ||
      parent.Type === "NPCFlowTemplate" ||
      parent.Type === "PCFlowTemplate" ||
      parent.Type === "WeaponFlowTemplate"
    );

    if (isFlowFragment) {
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

  // Find the parent Flow Fragment container for a given node
  GetParentFlowFragment(node: any): any {
    if (!node || !node.Properties.Parent) {
      return undefined;
    }

    const parent = this.GetNodeByID(node.Properties.Parent);
    if (!parent) {
      return undefined;
    }

    // Check if the parent is a Flow Fragment
    const isFlowFragment = (
      parent.Type === "FlowFragment" ||
      parent.Type === "DialogueIntActionTemplate" ||
      parent.Type === "CombatFlowTemplate" ||
      parent.Type === "CraftingFlowTemplate" ||
      parent.Type === "TravelFlowTemplate" ||
      parent.Type === "PlayerActionFlowTemplate" ||
      parent.Type === "LocationFlowTemplate" ||
      parent.Type === "EnemyGenericFlowFragment" ||
      parent.Type === "NPCFlowTemplate" ||
      parent.Type === "PCFlowTemplate" ||
      parent.Type === "WeaponFlowTemplate"
    );

    if (isFlowFragment) {
      return parent;
    }

    // Recursively check parent's parent
    return this.GetParentFlowFragment(parent);
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

  StoreVariablesFromNode(node: any): void {
    const newVars = this.GetVariablesFromNode(node);
    if (newVars) {
      this.variables = _.merge(this.variables, newVars);
    }
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
    if (node.Properties == undefined) return;
    if (node.Properties.Expression == undefined) return;

    var textChunks: string[] = (node.Properties.Expression as string).split("\n");
    var newVars: { [k: string]: any } = {};

    // Remove all commented and empty lines
    for (let i = textChunks.length - 1; i >= 0; i--) {
      if (textChunks[i].trim().slice(0, 2) == "//") {
        textChunks.splice(i, 1);
        continue;
      }
      if (textChunks[i].trim().length > 0) {
        console.log("processing...", textChunks[i]);
        let value = this.SplitValueFromText(textChunks[i]);
        let newData: { [k: string]: any } = {};
        let dataChunks = this.SplitIndexersFromText(textChunks[i]);
        newData[dataChunks[dataChunks.length - 1].trim()] = value;
        for (let j = dataChunks.length - 2; j >= 0; j--) {
          newData = { [dataChunks[j]]: newData } as { [k: string]: any };
        }
        newVars = _.merge(newData, newVars);
      }
    }
    return newVars;
  }

  CheckConditionString(condition: string): boolean {
    // Handle compound conditions with && and || operators
    if (condition.includes('&&')) {
      const parts = condition.split('&&');
      return parts.every(part => this.CheckSingleCondition(part.trim()));
    } else if (condition.includes('||')) {
      const parts = condition.split('||');
      return parts.some(part => this.CheckSingleCondition(part.trim()));
    } else {
      return this.CheckSingleCondition(condition);
    }
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
