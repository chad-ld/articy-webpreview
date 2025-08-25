# Plugin Architecture System

## 🎯 **Overview**

The Articy Web Viewer features a flexible plugin architecture that allows developers to extend functionality without modifying core application code. Plugins are automatically discovered, loaded, and integrated into the application interface.

## 🏗️ **Architecture**

### **Plugin Discovery**
- **Location**: All plugins reside in `src/plugins/` directory
- **Auto-Detection**: Plugins are automatically discovered at build time
- **No Registration**: No manual registration or configuration required
- **Hot Reloading**: Development changes update immediately

### **Plugin Structure**
```
src/plugins/
├── pluginName/
│   ├── index.ts          # Main plugin entry point
│   ├── PluginComponent.tsx # React component (if UI plugin)
│   ├── assets/           # Plugin-specific assets
│   └── types.ts          # TypeScript definitions
```

## 🔧 **Plugin Interface**

### **Base Plugin Structure**
```typescript
export interface Plugin {
  id: string;                    // Unique plugin identifier
  name: string;                  // Display name
  version: string;               // Plugin version
  description?: string;          // Optional description
  author?: string;               // Plugin author
  dependencies?: string[];       // Required dependencies
  
  // Lifecycle hooks
  initialize?: (context: PluginContext) => void;
  cleanup?: () => void;
  
  // UI integration
  component?: React.ComponentType<any>;
  menuItems?: MenuItem[];
  
  // Event handlers
  onNodeChange?: (node: any) => void;
  onVariableChange?: (variable: string, value: any) => void;
}
```

### **Plugin Context**
```typescript
interface PluginContext {
  // Application state
  currentNode: any;
  variables: Record<string, any>;
  history: any[];
  
  // Utility functions
  navigateToNode: (nodeId: string) => void;
  updateVariable: (name: string, value: any) => void;
  showNotification: (message: string, type?: string) => void;
  
  // Data access
  getNodeById: (id: string) => any;
  getVariableValue: (name: string) => any;
  getAllVariables: () => Record<string, any>;
}
```

## 📦 **Plugin Types**

### **UI Plugins**
Plugins that provide user interface components:
```typescript
export const MyUIPlugin: Plugin = {
  id: 'my-ui-plugin',
  name: 'My UI Plugin',
  version: '1.0.0',
  component: MyPluginComponent,
  menuItems: [
    {
      label: 'Open My Plugin',
      action: () => { /* open plugin */ }
    }
  ]
};
```

### **Utility Plugins**
Background plugins that extend functionality:
```typescript
export const MyUtilityPlugin: Plugin = {
  id: 'my-utility-plugin',
  name: 'My Utility Plugin',
  version: '1.0.0',
  initialize: (context) => {
    // Setup background functionality
  },
  onVariableChange: (variable, value) => {
    // React to variable changes
  }
};
```

### **Asset Plugins**
Plugins that manage external assets:
```typescript
export const MyAssetPlugin: Plugin = {
  id: 'my-asset-plugin',
  name: 'My Asset Plugin',
  version: '1.0.0',
  initialize: (context) => {
    // Load and manage assets
  }
};
```

## 🎮 **Example: Murderboard Plugin**

### **Plugin Structure**
```
src/plugins/murderboard/
├── index.ts              # Plugin definition
├── MurderboardComponent.tsx # Main UI component
├── assets/               # Evidence images and data
├── types.ts              # TypeScript interfaces
└── utils.ts              # Helper functions
```

### **Implementation**
```typescript
// index.ts
export const MurderboardPlugin: Plugin = {
  id: 'murderboard',
  name: 'Murderboard Evidence Tracker',
  version: '1.0.0',
  description: 'Interactive evidence board with variable-based visibility',
  component: MurderboardComponent,
  
  initialize: (context) => {
    // Setup evidence tracking
  },
  
  onVariableChange: (variable, value) => {
    // Update evidence visibility based on variables
    if (variable.endsWith('_found')) {
      updateEvidenceVisibility(variable, value);
    }
  }
};
```

### **Component Integration**
```typescript
// MurderboardComponent.tsx
const MurderboardComponent: React.FC<PluginProps> = ({ context }) => {
  const [evidenceItems, setEvidenceItems] = useState([]);
  
  useEffect(() => {
    // Load evidence based on current variables
    const evidence = loadEvidenceItems(context.getAllVariables());
    setEvidenceItems(evidence);
  }, [context.variables]);
  
  return (
    <div className="murderboard">
      {evidenceItems.map(item => (
        <EvidenceItem 
          key={item.id} 
          item={item} 
          onClick={() => showEvidenceDialog(item)}
        />
      ))}
    </div>
  );
};
```

## 🔄 **Plugin Lifecycle**

### **Loading Process**
1. **Discovery**: Scan `src/plugins/` directory
2. **Import**: Dynamically import plugin modules
3. **Validation**: Verify plugin interface compliance
4. **Registration**: Add to plugin registry
5. **Initialization**: Call plugin `initialize()` hooks

### **Runtime Integration**
1. **Context Creation**: Provide plugin context with app state
2. **Event Binding**: Connect plugin event handlers
3. **UI Mounting**: Render plugin components
4. **State Synchronization**: Keep plugin state in sync with app

### **Cleanup Process**
1. **Event Unbinding**: Remove plugin event listeners
2. **UI Unmounting**: Clean up plugin components
3. **Resource Cleanup**: Call plugin `cleanup()` hooks
4. **Memory Management**: Release plugin resources

## 🎛️ **Configuration Integration**

### **Plugin Auto-Loading**
```json
// config.json
{
  "plugins": {
    "autoLoad": ["murderboard", "evidence-tracker"],
    "disabled": ["debug-plugin"],
    "settings": {
      "murderboard": {
        "showHints": true,
        "autoReveal": false
      }
    }
  }
}
```

### **User Preferences**
- **Plugin Toggle**: Users can enable/disable plugins from loading screen
- **Settings Persistence**: Plugin preferences saved in localStorage
- **Default Configuration**: Config file sets initial plugin state

## 🧪 **Development & Testing**

### **Plugin Development Workflow**
1. Create plugin directory in `src/plugins/`
2. Implement plugin interface
3. Add TypeScript definitions
4. Test with hot reloading
5. Document plugin functionality

### **Testing Considerations**
- **Error Handling**: Plugins should gracefully handle missing data
- **Performance**: Avoid blocking main thread
- **Memory Leaks**: Proper cleanup in lifecycle hooks
- **Compatibility**: Test with different dataset formats

### **Debug Tools**
- **Plugin Registry**: Console access to loaded plugins
- **Error Reporting**: Plugin errors logged with context
- **Performance Monitoring**: Plugin execution timing
- **State Inspection**: Plugin state visible in dev tools

## 📚 **Best Practices**

### **Plugin Design**
- **Single Responsibility**: Each plugin should have one clear purpose
- **Minimal Dependencies**: Avoid heavy external dependencies
- **Error Resilience**: Handle missing assets and data gracefully
- **Performance Conscious**: Use efficient algorithms and caching

### **Code Organization**
- **Clear Structure**: Organize files logically within plugin directory
- **TypeScript**: Use strong typing for better development experience
- **Documentation**: Include README and inline code documentation
- **Version Management**: Use semantic versioning for plugin releases

### **Integration Guidelines**
- **Context Usage**: Use provided context for all app interactions
- **Event Handling**: Respond to relevant application events
- **State Management**: Keep plugin state synchronized with app state
- **UI Consistency**: Follow application design patterns

## ⚠️ **Common Pitfalls**

### **Development Issues**
- **Missing Assets**: Ensure all plugin assets are properly bundled
- **Context Misuse**: Don't directly manipulate app state outside context
- **Memory Leaks**: Always clean up event listeners and timers
- **Type Errors**: Maintain proper TypeScript definitions

### **Runtime Problems**
- **Plugin Conflicts**: Avoid conflicting with other plugins
- **Performance Impact**: Monitor plugin performance impact
- **Error Propagation**: Don't let plugin errors crash the app
- **State Inconsistency**: Keep plugin state in sync with app

---

> **🔌 Note**: The plugin system is designed for extensibility while maintaining application stability. Follow the established patterns and interfaces for best results.
