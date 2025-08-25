# Configuration System

## 🎯 **Overview**

The Articy Web Viewer includes a flexible configuration system that allows developers to set default behaviors for first-time users while preserving user preferences through localStorage persistence. The system follows a clear hierarchy where configuration files set initial defaults and user interactions create persistent overrides.

## 🏗️ **Architecture**

### **Configuration Philosophy**
- **Config File = Initial Defaults** - Sets the experience for first-time visitors
- **localStorage = User Overrides** - User choices always take precedence after first interaction
- **Expandable Design** - Built to support future configuration options

### **Configuration Hierarchy**
1. **Hardcoded Defaults** - Fallback values in code
2. **Config File** - `public/config.json` sets project defaults
3. **User Preferences** - localStorage overrides for user choices
4. **Session State** - Temporary runtime preferences

## 🔧 **Implementation Details**

### **Configuration Manager**
```typescript
class ConfigManager {
  private config: AppConfig;
  private userPreferences: UserPreferences;
  
  async loadConfig(): Promise<AppConfig> {
    // 1. Load base configuration from file
    const baseConfig = await this.loadConfigFile();
    
    // 2. Load user preferences from localStorage
    const userPrefs = this.loadUserPreferences();
    
    // 3. Merge with user preferences taking precedence
    return this.mergeConfigurations(baseConfig, userPrefs);
  }
  
  saveUserPreference(key: string, value: any): void {
    this.userPreferences[key] = value;
    localStorage.setItem('user-preferences', JSON.stringify(this.userPreferences));
  }
}
```

### **Configuration File Structure**
```json
{
  "plugins": {
    "autoLoad": ["murderboard"],
    "disabled": [],
    "settings": {
      "murderboard": {
        "showHints": true,
        "autoReveal": false
      }
    }
  },
  "ui": {
    "theme": "default",
    "showVariablesPanel": false,
    "enableKeyboardShortcuts": true
  },
  "datasets": {
    "defaultDataset": null,
    "autoLoad": false,
    "sortBy": "lastModified"
  },
  "logging": {
    "enabled": false,
    "autoSave": true,
    "sessionTracking": true
  }
}
```

## ⚙️ **Configuration Categories**

### **Plugin Configuration**
```typescript
interface PluginConfig {
  autoLoad: string[];           // Plugins to load automatically
  disabled: string[];           // Plugins to disable
  settings: Record<string, any>; // Plugin-specific settings
}
```

**Usage Example**:
```json
{
  "plugins": {
    "autoLoad": ["murderboard", "evidence-tracker"],
    "disabled": ["debug-plugin"],
    "settings": {
      "murderboard": {
        "showHints": true,
        "autoReveal": false,
        "evidenceLayout": "grid"
      }
    }
  }
}
```

### **UI Configuration**
```typescript
interface UIConfig {
  theme: string;                    // UI theme selection
  showVariablesPanel: boolean;      // Variables panel visibility
  enableKeyboardShortcuts: boolean; // Keyboard navigation
  storyMode: boolean;              // Story mode default state
}
```

### **Dataset Configuration**
```typescript
interface DatasetConfig {
  defaultDataset: string | null;   // Auto-select dataset
  autoLoad: boolean;               // Skip loading screen
  sortBy: 'name' | 'date' | 'size'; // Default sort order
  showVersionTags: boolean;        // Display version indicators
}
```

### **Logging Configuration**
```typescript
interface LoggingConfig {
  enabled: boolean;                // Console logging enabled
  autoSave: boolean;              // Automatic log saving
  sessionTracking: boolean;       // Session-based logging
  maxLogSize: number;             // Maximum log file size
}
```

## 🔄 **Configuration Lifecycle**

### **Application Startup**
1. **Load Config File** - Read `public/config.json`
2. **Load User Preferences** - Read from localStorage
3. **Merge Configurations** - User preferences override config file
4. **Apply Settings** - Configure application components
5. **Initialize Plugins** - Load plugins based on configuration

### **User Interaction**
1. **User Makes Choice** - Plugin toggle, setting change, etc.
2. **Update Runtime State** - Immediate application of change
3. **Save to localStorage** - Persist user preference
4. **Maintain Override** - User choice persists across sessions

### **Configuration Updates**
1. **Config File Changes** - New defaults for first-time users
2. **Existing Users** - Continue using their saved preferences
3. **Reset Option** - Users can reset to new defaults if desired

## 💾 **Persistence Strategy**

### **localStorage Structure**
```javascript
// User preferences stored in localStorage
{
  "user-preferences": {
    "plugins": {
      "enabled": ["murderboard", "custom-plugin"],
      "settings": {
        "murderboard": {
          "showHints": false  // User override
        }
      }
    },
    "ui": {
      "showVariablesPanel": true,  // User preference
      "theme": "dark"              // User choice
    },
    "logging": {
      "enabled": true              // User enabled logging
    }
  }
}
```

### **Merge Logic**
```typescript
function mergeConfigurations(baseConfig: AppConfig, userPrefs: UserPreferences): AppConfig {
  return {
    plugins: {
      ...baseConfig.plugins,
      enabled: userPrefs.plugins?.enabled ?? baseConfig.plugins.autoLoad,
      settings: deepMerge(baseConfig.plugins.settings, userPrefs.plugins?.settings)
    },
    ui: {
      ...baseConfig.ui,
      ...userPrefs.ui
    },
    // ... other categories
  };
}
```

## 🎛️ **Configuration API**

### **Reading Configuration**
```typescript
// Get current configuration value
const showHints = configManager.get('plugins.murderboard.showHints');

// Get with fallback
const theme = configManager.get('ui.theme', 'default');

// Check if user has overridden a setting
const isUserOverride = configManager.isUserOverride('ui.showVariablesPanel');
```

### **Updating Configuration**
```typescript
// Save user preference (persists to localStorage)
configManager.setUserPreference('ui.theme', 'dark');

// Update runtime setting (temporary)
configManager.setRuntimeSetting('ui.showVariablesPanel', true);

// Reset to config file defaults
configManager.resetToDefaults('plugins.murderboard');
```

### **Plugin Integration**
```typescript
// Plugin reads its configuration
const PluginComponent: React.FC = () => {
  const config = useConfig('plugins.murderboard');
  const showHints = config.showHints;
  
  const toggleHints = () => {
    configManager.setUserPreference('plugins.murderboard.showHints', !showHints);
  };
  
  return (
    <div>
      <button onClick={toggleHints}>
        {showHints ? 'Hide' : 'Show'} Hints
      </button>
    </div>
  );
};
```

## 🧪 **Testing & Validation**

### **Configuration Validation**
```typescript
function validateConfig(config: any): AppConfig {
  const schema = {
    plugins: {
      autoLoad: 'array',
      disabled: 'array',
      settings: 'object'
    },
    ui: {
      theme: 'string',
      showVariablesPanel: 'boolean'
    }
  };
  
  return validateAgainstSchema(config, schema);
}
```

### **Test Scenarios**
- **First-Time User** - Uses config file defaults
- **Returning User** - Uses saved preferences
- **Config File Update** - New defaults don't override user choices
- **Invalid Config** - Graceful fallback to hardcoded defaults

## 🔧 **Development Tools**

### **Configuration Inspector**
```javascript
// Debug configuration in browser console
window.configManager.inspect();

// View current configuration
console.log(window.configManager.getCurrentConfig());

// View user overrides
console.log(window.configManager.getUserOverrides());

// Reset all user preferences
window.configManager.resetAllUserPreferences();
```

### **Configuration Testing**
```bash
# Test configuration loading
npm run test:config

# Validate configuration file
npm run validate:config

# Reset development preferences
npm run reset:preferences
```

## ⚠️ **Best Practices**

### **Configuration Design**
- **Sensible Defaults** - Config file should provide good first-time experience
- **User Choice Respect** - Never override user preferences without permission
- **Backward Compatibility** - Handle missing or invalid configuration gracefully
- **Performance Conscious** - Avoid expensive operations during config loading

### **Plugin Configuration**
- **Namespace Settings** - Use plugin-specific configuration sections
- **Validation** - Validate plugin configuration on load
- **Fallback Values** - Provide sensible defaults for all settings
- **User Control** - Allow users to override plugin settings

### **Migration Strategy**
- **Version Tracking** - Track configuration schema version
- **Migration Scripts** - Handle configuration format changes
- **User Communication** - Inform users of significant changes
- **Rollback Support** - Allow reverting to previous configuration

---

> **⚙️ Note**: The configuration system is designed to be flexible and user-friendly while maintaining developer control over default behaviors. Always respect user preferences and provide clear ways to reset to defaults when needed.
