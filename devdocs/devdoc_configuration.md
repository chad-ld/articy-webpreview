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
  "version": "1.0.0",
  "description": "Articy Web Viewer Configuration - Sets default behaviors for first-time users",
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

## ⚙️ **Configuration Categories**

### **Plugin Configuration**
```typescript
interface PluginConfig {
  defaultEnabled: string[];      // Plugins enabled by default for first-time users
}
```

**Usage Example**:
```json
{
  "plugins": {
    "defaultEnabled": ["mysteryworks-murderboard", "evidence-tracker"]
  }
}
```

**Note**: The config file sets which plugins are enabled by default for first-time users. User preferences in localStorage override these defaults after the first interaction.

### **UI Configuration**
```typescript
interface UIConfig {
  storyMode: boolean;              // Enable story mode by default (hides technical nodes)
  variablesPanel: boolean;         // Show variables panel by default
  searchPanel: boolean;            // Show search panel by default
}
```

**Story Mode**: When enabled, story mode hides backend technical nodes (Instruction and Condition nodes) to let users focus on the narrative experience. Users can toggle story mode during runtime with customizable filter settings:
- Hide Instructions (Instruction nodes with variables/logic)
- Hide Conditions (Condition nodes with branching logic)
- Hide Inactive Choices (choices that don't meet conditions)
- Hide Previous Choices (hide the back navigation UI)
- Hide Debug Info (hide footer with technical information)

### **Dataset Configuration**
```typescript
interface DatasetConfig {
  autoLoad: string | null;              // Dataset name to auto-load (e.g., "mpos1.5")
  skipLoadingScreen: boolean;           // Skip loading screen and load immediately
  allowUserOverride: boolean;           // Allow Ctrl+L to access loading screen
  fallbackBehavior: 'showLoadingScreen' | 'showError'; // What to do if auto-load fails
}
```

**Usage Example**:
```json
{
  "datasets": {
    "autoLoad": "mpos1.5",
    "skipLoadingScreen": false,
    "allowUserOverride": true,
    "fallbackBehavior": "showLoadingScreen"
  }
}
```

**Behavior**:
- If `autoLoad` is set and dataset exists, it will be pre-selected
- If `skipLoadingScreen` is `true`, the dataset loads immediately without showing the selection screen
- If `allowUserOverride` is `true`, users can press `Ctrl+L` to access the loading screen even when auto-loading
- URL parameter `?dataset=name` overrides config settings (highest priority)

### **Advanced Configuration**
```typescript
interface AdvancedConfig {
  debugging: {
    enableConsoleLogging: boolean;   // Enable console logging (future feature)
    logLevel: 'error' | 'warn' | 'info' | 'debug'; // Log level filter (future feature)
  }
}
```

**Usage Example**:
```json
{
  "advanced": {
    "debugging": {
      "enableConsoleLogging": false,
      "logLevel": "error"
    }
  }
}
```

**Note**: These settings are defined for future use. Console logging is currently always active and controlled via the floating log button in the UI. See [Logging System](devdoc_logging.md) for details on the current logging implementation.

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
// Plugin selection preferences are managed separately by the plugin system
{
  "articyWebViewer": {
    "lastSelectedDataset": "mpos1.5",
    "lastSortMode": "date"
  },
  "enabledPlugins": ["mysteryworks-murderboard", "custom-plugin"]
}
```

**Note**: The application primarily relies on configuration file defaults. localStorage is used for:
- Plugin enable/disable preferences (overrides config file)
- Last selected dataset and sort mode
- Future: UI preferences and user customizations

## 🎛️ **Configuration API**

### **Configuration Service** (`src/services/configService.ts`)

The configuration service provides methods to access configuration values:

```typescript
import { configService } from './services/configService';

// Load configuration (done automatically at app startup)
await configService.loadConfig();

// Get default enabled plugins
const plugins = configService.getDefaultEnabledPlugins();
// Returns: ["mysteryworks-murderboard"]

// Check dataset configuration
const shouldAutoLoad = configService.shouldAutoLoadDataset();
const datasetName = configService.getAutoLoadDataset();
const shouldSkip = configService.shouldSkipLoadingScreen();

// Check UI configuration
const showStoryMode = configService.shouldEnableStoryMode();
const showVariables = configService.shouldShowVariablesPanel();
const showSearch = configService.shouldShowSearchPanel();
```

### **Available Methods**

| Method | Returns | Description |
|--------|---------|-------------|
| `loadConfig()` | `Promise<AppConfig>` | Load configuration from config.json |
| `getDefaultEnabledPlugins()` | `string[]` | Get list of plugins to enable by default |
| `shouldAutoLoadDataset()` | `boolean` | Check if auto-loading is enabled |
| `getAutoLoadDataset()` | `string \| null` | Get dataset name to auto-load |
| `shouldSkipLoadingScreen()` | `boolean` | Check if loading screen should be skipped |
| `shouldEnableStoryMode()` | `boolean` | Check if story mode enabled by default |
| `shouldShowVariablesPanel()` | `boolean` | Check if variables panel shown by default |
| `shouldShowSearchPanel()` | `boolean` | Check if search panel shown by default |
| `getConfig()` | `AppConfig \| null` | Get full configuration object |
| `isLoaded()` | `boolean` | Check if configuration is loaded |

### **Usage in Components**

```typescript
// Example: Using config service in App.tsx
import { configService } from './services/configService';

useEffect(() => {
  const initApp = async () => {
    const config = await configService.loadConfig();

    if (configService.shouldAutoLoadDataset()) {
      const dataset = configService.getAutoLoadDataset();
      if (dataset && configService.shouldSkipLoadingScreen()) {
        await loadDataset(dataset);
      }
    }

    if (configService.shouldEnableStoryMode()) {
      setStoryModeSettings({ ...storyModeSettings, enabled: true });
    }
  };

  initApp();
}, []);
```

## 🧪 **Testing & Validation**

### **Configuration Validation**

The configuration service validates the structure automatically during loading:

```typescript
private validateConfig(config: any): void {
  if (!config || typeof config !== 'object') {
    throw new Error('Configuration must be a valid JSON object');
  }

  if (!config.version || typeof config.version !== 'string') {
    throw new Error('Configuration must have a valid version string');
  }

  if (!config.plugins || typeof config.plugins !== 'object') {
    throw new Error('Configuration must have a plugins section');
  }

  if (!Array.isArray(config.plugins.defaultEnabled)) {
    throw new Error('plugins.defaultEnabled must be an array');
  }

  // Validate plugin IDs are strings
  for (const pluginId of config.plugins.defaultEnabled) {
    if (typeof pluginId !== 'string') {
      throw new Error(`Invalid plugin ID: ${pluginId} (must be string)`);
    }
  }
}
```

**Fallback Behavior**: If validation fails, the service automatically falls back to a minimal configuration:

```typescript
{
  version: '1.0.0-fallback',
  plugins: {
    defaultEnabled: []
  }
}
```

### **Test Scenarios**
- **First-Time User** - Uses config file defaults
- **Returning User** - Uses saved localStorage preferences (for plugins)
- **Config File Update** - New defaults apply to first-time users only
- **Invalid Config** - Graceful fallback to minimal configuration
- **Missing Config** - Fallback configuration allows app to run

## 🔧 **Development Tools**

### **Configuration Inspector**
```javascript
// View current configuration in browser console
import { configService } from './services/configService';

console.log('Configuration:', configService.getConfig());
console.log('Is Loaded:', configService.isLoaded());
console.log('Default Plugins:', configService.getDefaultEnabledPlugins());
```

### **Testing Configuration Changes**
1. Edit `public/config.json` with desired settings
2. Clear browser localStorage (Application > Storage > Clear all)
3. Refresh the page to load new configuration
4. Verify settings are applied correctly

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
