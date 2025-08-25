# Dataset Management System

## 🎯 **Overview**

The Articy Web Viewer includes a sophisticated dataset management system that automatically detects, loads, and manages Articy Draft project files in both 3.x and 4.x formats. The system provides seamless switching between different projects and versions.

## 🆕 **Dataset Separation System (August 2025)**

### **Clean Development/Production Separation**
- **Development Datasets**: Located in `datasets-dev/` folder (isolated from production builds)
- **Production Builds**: Clean `dist/` folder without any development datasets
- **Custom Middleware**: Vite plugin serves development datasets during development only
- **Identical Functionality**: All deployment types work identically despite different data sources

### **How It Works Across Deployments**
| Deployment Type | Dataset Source | File Serving Method |
|----------------|----------------|-------------------|
| **Development** | `datasets-dev/` folder | Custom Vite middleware |
| **Web Build** | Server dataset folder | Standard web server |
| **Desktop Build** | App dataset folder | Embedded PHP server |

### **Benefits**
- ✅ **Clean Deployments** - No development test data in production builds
- ✅ **Smaller Builds** - Reduced deployment size without development datasets
- ✅ **Better Security** - No accidental exposure of development data
- ✅ **Seamless Development** - Full dataset functionality during development

## 🏗️ **Architecture**

### **Core Components**
- **Hybrid Dataset Detector** (`src/utils/hybridDatasetDetector.js`) - Multi-method dataset discovery
- **Dataset Loading Interface** (`src/components/LoadingScreen.tsx`) - User interface for dataset selection
- **Server Endpoint** (`public/datasets.php`) - Server-side dataset enumeration
- **Configuration System** - Default dataset and auto-loading preferences

### **Detection Methods**
1. **Server-Side Detection** - PHP script scans server directories
2. **Client-Side Fallback** - JavaScript-based detection for static hosting
3. **Manual File Upload** - Drag-and-drop file loading
4. **Hybrid Approach** - Combines multiple methods for maximum compatibility

## 🔧 **Implementation Details**

### **Hybrid Dataset Detector Class**
```javascript
class HybridDatasetDetector {
  constructor() {
    this.lastSuccessfulMethod = null;  // Track working detection method
    this.detectionMethods = [
      'serverSideDetection',
      'clientSideFallback',
      'staticFileDetection'
    ];
  }
  
  async detectDatasets() {
    // Try each method until one succeeds
    for (const method of this.detectionMethods) {
      try {
        const result = await this[method]();
        if (result && result.length > 0) {
          this.lastSuccessfulMethod = method;
          return result;
        }
      } catch (error) {
        console.warn(`Detection method ${method} failed:`, error);
      }
    }
    return [];
  }
  
  getLastSuccessfulMethod() {
    return this.lastSuccessfulMethod;
  }
}
```

### **Dataset Format Support**

#### **Articy Draft 3.x Format**
```json
{
  "Settings": { /* project settings */ },
  "Hierarchy": { /* node hierarchy */ },
  "Packages": { /* content packages */ }
}
```

#### **Articy Draft 4.x Format**
```
project-folder/
├── manifest.json          # Project metadata
├── settings.json          # Project settings
├── hierarchy.json         # Node structure
├── packages/              # Content packages
│   ├── package1.json
│   └── package2.json
└── assets/               # Media assets
```

### **Server-Side Detection (datasets.php)**
```php
// Scan directories for Articy projects
function scanForDatasets($directory) {
  $datasets = [];
  
  // Look for 3.x single JSON files
  foreach (glob("$directory/*.json") as $file) {
    if (isArticy3xFile($file)) {
      $datasets[] = createDatasetInfo($file, '3.x');
    }
  }
  
  // Look for 4.x project folders
  foreach (glob("$directory/*/manifest.json") as $manifest) {
    $projectDir = dirname($manifest);
    $datasets[] = createDatasetInfo($projectDir, '4.x');
  }
  
  return $datasets;
}
```

## 📊 **Dataset Information Structure**

### **Dataset Metadata**
```typescript
interface DatasetInfo {
  name: string;              // Display name
  filename: string;          // File/folder name
  path: string;              // Full path
  version: '3.x' | '4.x';    // Format version
  size: number;              // File size in bytes
  lastModified: Date;        // Last modification time
  projectName?: string;      // Project name from metadata
  description?: string;      // Project description
  isValid: boolean;          // Validation status
}
```

### **Version Detection**
```javascript
// Detect 3.x format
function isArticy3xFile(content) {
  return content.Settings && 
         content.Hierarchy && 
         content.Packages;
}

// Detect 4.x format
function isArticy4xProject(directory) {
  return fs.existsSync(path.join(directory, 'manifest.json')) &&
         fs.existsSync(path.join(directory, 'settings.json'));
}
```

## 🎛️ **Loading Interface**

### **Dataset Selection UI**
- **Dropdown List** - Available datasets with version indicators
- **Drag & Drop Zone** - Direct file upload capability
- **Version Tags** - Visual indicators for 3.x vs 4.x
- **Metadata Display** - Project names, sizes, and timestamps
- **Sorting Options** - By name, date, or size

### **Loading Process**
1. **Detection Phase** - Scan for available datasets
2. **Validation Phase** - Verify file format and integrity
3. **Selection Phase** - User chooses dataset or uploads file
4. **Loading Phase** - Parse and process dataset content
5. **Initialization Phase** - Setup application state

### **Error Handling**
- **Invalid Files** - Clear error messages for unsupported formats
- **Network Issues** - Graceful fallback to client-side detection
- **Parsing Errors** - Detailed error reporting with suggestions
- **Missing Assets** - Warnings for missing referenced files

## 🔄 **Caching & Performance**

### **Dataset Caching**
- **Browser Cache** - Loaded datasets cached in memory
- **LocalStorage** - User preferences and recent datasets
- **Server Cache** - PHP-side caching of directory scans
- **Cache Busting** - Timestamp-based cache invalidation

### **Performance Optimizations**
- **Lazy Loading** - Load dataset content on demand
- **Chunked Processing** - Process large datasets in chunks
- **Background Loading** - Pre-load datasets in background
- **Memory Management** - Clean up unused dataset content

## 🧪 **Testing & Validation**

### **Dataset Validation**
```javascript
function validateDataset(dataset) {
  const validations = [
    validateFormat,
    validateStructure,
    validateReferences,
    validateAssets
  ];
  
  return validations.every(validation => validation(dataset));
}
```

### **Test Datasets**
- **demo.json** - Articy 3.x sample project
- **demo4.json** - Articy 4.x sample project  
- **mpos.json** - Complex 3.x project for testing
- **Test Projects** - Various edge cases and formats

### **Validation Checks**
- **Format Compliance** - Verify JSON structure
- **Reference Integrity** - Check node and asset references
- **Asset Availability** - Verify referenced files exist
- **Performance Impact** - Monitor loading times

## ⚙️ **Configuration**

### **Default Dataset Settings**
```json
{
  "datasets": {
    "defaultDataset": "demo4.json",
    "autoLoad": false,
    "sortBy": "lastModified",
    "showVersionTags": true,
    "enableDragDrop": true
  }
}
```

### **Detection Preferences**
- **Method Priority** - Order of detection methods to try
- **Timeout Settings** - Maximum time for each detection method
- **Fallback Behavior** - What to do when detection fails
- **Cache Duration** - How long to cache detection results

## 🔍 **Troubleshooting**

### **Common Issues**
- **No Datasets Found** - Check directory permissions and file formats
- **Detection Failures** - Verify server endpoint accessibility
- **Loading Errors** - Check file format and JSON validity
- **Performance Issues** - Monitor dataset size and complexity

### **Debug Information**
- **Detection Logs** - Detailed logging of detection attempts
- **Method Tracking** - Which detection method succeeded
- **Performance Metrics** - Loading times and memory usage
- **Error Details** - Specific error messages and stack traces

### **Recovery Procedures**
1. **Clear Cache** - Reset cached detection results
2. **Retry Detection** - Re-run detection process
3. **Manual Upload** - Use drag-and-drop as fallback
4. **Check Logs** - Review console output for errors

---

> **💡 Note**: The hybrid detection system ensures maximum compatibility across different hosting environments while providing optimal performance for each scenario.
