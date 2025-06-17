import _ from "lodash";

class ArticyProject {
  data: any;
  variables: any;
  initialVariables: any; // Store initial state for reset functionality

  constructor(data: Object) {
    this.data = data;
    this.variables = {};

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
    let value = this.SplitValueFromText(condition);
    let newData: { [k: string]: any } = {};
    let dataChunks = this.SplitIndexersFromText(condition);
    newData[dataChunks[dataChunks.length - 1].trim()] = value;
    for (let j = dataChunks.length - 2; j >= 0; j--) {
      newData = { [dataChunks[j]]: newData } as { [k: string]: any };
    }
    return this.ObjectCompare(this.variables, newData);
  }

  CheckCondition(condition: {}): boolean {
    return this.ObjectCompare(this.variables, condition);
  }

  ObjectCompare(objx: any, objy: any): boolean {
    // Checks if obj2 key is in obj1
    // Returns value comparison
    function GetValue(obj1: any, obj2: any): any {
      const obj1Keys = Object.keys(obj1).sort();
      const obj2Keys = Object.keys(obj2).sort();
      if (typeof obj1 === 'string') {
        // We have our value
        return obj1;
      }
      for (let i = 0; i < obj1Keys.length; i++) {
        for (let j = 0; j < obj2Keys.length; j++) {
          if (obj1Keys[i] == obj2Keys[j]) {
            return GetValue(obj1[obj1Keys[i]], obj2[obj2Keys[j]]);
          }
        }
      }
      return undefined;
    }

    const value1 = GetValue(objx, objy);
    const value2 = GetValue(objy, objy);

    // Handle string-to-boolean conversion for proper comparison
    const normalizeValue = (val: any): any => {
      if (typeof val === 'string') {
        if (val.toLowerCase() === 'true') return true;
        if (val.toLowerCase() === 'false') return false;
      }
      return val;
    };

    const normalizedValue1 = normalizeValue(value1);
    const normalizedValue2 = normalizeValue(value2);

    return normalizedValue1 === normalizedValue2;
  }

  SplitValueFromText(text: string): any {
    const equalIndex = text.indexOf("=");
    if (equalIndex === -1) return undefined;
    
    let value = text.substring(equalIndex + 1).trim();
    
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
    const equalIndex = text.indexOf("=");
    if (equalIndex === -1) return [];
    
    const leftSide = text.substring(0, equalIndex).trim();
    return leftSide.split(".");
  }
}

export default ArticyProject;
