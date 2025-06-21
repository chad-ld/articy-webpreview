# Hardcoded Loader Setup Guide

This document explains how to modify the Articy Web Viewer to automatically load a specific dataset on startup, bypassing the file selection interface.

## Overview

The hardcoded loader setup allows you to:
- Automatically load a specific JSON dataset on app startup
- Deploy a self-contained web application with embedded data
- Bypass browser caching issues with cache-busting
- Create dataset-specific builds for web deployment

## Files Modified

### 1. `src/App.tsx` - Main Application Logic

#### Import Changes
```typescript
// Add these imports
import { ConfigProvider, message, Spin } from 'antd';
// @ts-ignore
import DataRouter from './utils/dataRouter';

// Remove unused import
// import EnhancedFileInput from './components/EnhancedFileInput';
```

#### State Changes
```typescript
// Change initial loading state to true
const [isLoading, setIsLoading] = useState(true); // Start with loading true
```

#### Add Hardcoded Loading Function
```typescript
const loadMposData = async () => {
  setIsLoading(true);
  
  try {
    console.log('🔄 Loading hardcoded MPOS dataset...');
    
    // List of JSON files to load (customize for your dataset)
    const mposFiles = [
      'global_variables.json',
      'hierarchy.json', 
      'manifest.json',
      'object_definitions.json',
      'object_definitions_localization.json',
      'package_010000060000401C_localization.json',
      'package_010000060000401C_objects.json',
      'script_methods.json'
    ];
    
    // Load all files with cache-busting
    const fileContents: { [key: string]: string } = {};
    
    // Add cache-busting timestamp to ensure fresh data loads
    const cacheBuster = Date.now();
    
    for (const fileName of mposFiles) {
      try {
        const response = await fetch(`./mpos.json/${fileName}?v=${cacheBuster}`);
        if (response.ok) {
          const content = await response.text();
          fileContents[fileName] = content;
          console.log(`✅ Loaded ${fileName} (cache-busted)`);
        } else {
          console.warn(`⚠️ Could not load ${fileName}: ${response.status}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error loading ${fileName}:`, error);
      }
    }
    
    // Process the loaded files using DataRouter
    if (Object.keys(fileContents).length > 0) {
      const dataRouter = new DataRouter();
      dataRouter.setDebugMode(true);
      
      const processedData = await dataRouter.processData(fileContents);
      const report = dataRouter.createProcessingReport(processedData);
      
      // Update report to indicate hardcoded loading
      report.processingInfo.inputType = 'Hardcoded MPOS dataset';
      
      handleDataLoaded(processedData, report);
      
      console.log('🎉 MPOS dataset loaded successfully!');
    } else {
      throw new Error('No MPOS files could be loaded');
    }
    
  } catch (error: any) {
    console.error('❌ Failed to load MPOS dataset:', error);
    message.error(`Failed to load MPOS dataset: ${error?.message || 'Unknown error'}`);
    setIsLoading(false);
  }
};
```

#### Update useEffect Hook
```typescript
useEffect(() => {
  // Log app startup
  console.log('%c[Articy Web Viewer v4.x - MPOS Hardcoded] Starting application...', 
    'color: #1890ff; background: #f0f8ff; font-size: 16px; padding: 4px 8px; border-radius: 4px;');
  console.log('✅ Hardcoded MPOS dataset loading enabled');
  console.log('✅ 4.x format support enabled');
  console.log('✅ Automatic format detection active');
  
  // Auto-load mpos.json data
  loadMposData();
}, []);
```

#### Update handleDataLoaded Function
```typescript
const handleDataLoaded = (data: any, report: ProcessingReport) => {
  console.log('🎉 Data loaded successfully:', report);
  
  setArticyData(data);
  setProcessingReport(report);
  setIsLoading(false); // Add this line
  
  // Show success message with format info
  message.success({
    content: `Successfully loaded ${report.format} format data! (${report.summary.totalModels} models)`,
    duration: 4
  });
};
```

#### Update UI Text
```typescript
// Update header text
<h1>Articy Web Viewer v4.x - MPOS Edition</h1>
<p>Hardcoded viewer for MPOS dataset (4.x format)</p>

// Replace file upload interface with loading screen
{!articyData ? (
  /* Loading Screen */
  <div className="upload-section" style={{ textAlign: 'center', padding: '60px 20px' }}>
    <Spin size="large" />
    <h2 style={{ marginTop: '20px', color: '#1890ff' }}>Loading MPOS Dataset...</h2>
    <p style={{ color: '#666', fontSize: '16px' }}>
      Automatically loading hardcoded MPOS data from 4.x format files
    </p>
    
    {/* Update feature cards to reflect hardcoded nature */}
    <div className="features-info" style={{ marginTop: '40px' }}>
      <h3 style={{ color: 'rgba(255, 255, 255, 0.7)' }}>MPOS Edition Features</h3>
      <div className="features-grid">
        <div className="feature-card">
          <h4>🎯 Hardcoded Dataset</h4>
          <p>Pre-configured to load MPOS data automatically on startup</p>
        </div>
        <div className="feature-card">
          <h4>🚀 Instant Loading</h4>
          <p>No file selection needed - data loads immediately</p>
        </div>
        <div className="feature-card">
          <h4>📊 4.x Format</h4>
          <p>Optimized for Articy Draft 4.x multi-file format</p>
        </div>
        <div className="feature-card">
          <h4>🌐 Web Ready</h4>
          <p>Perfect for web deployment with embedded dataset</p>
        </div>
      </div>
    </div>
  </div>
) : (
```

### 2. `vite.config.ts` - Build Configuration

Add the base path for your deployment directory:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/articy/v4.1/', // Add this line - customize for your deployment path
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

## File Structure Setup

### 1. Copy Dataset to Public Directory
```bash
xcopy "your-dataset-folder" "public\mpos.json" /E /I /Y
```

### 2. Copy Dataset to Dist Directory (After Build)
```bash
xcopy "public\mpos.json" "dist\mpos.json" /E /I /Y
```

## Build Process

### 1. Build the Application
```bash
npx vite build
```

### 2. Copy Dataset to Build Output
```bash
xcopy "public\mpos.json" "dist\mpos.json" /E /I /Y
```

### 3. Create Deployment Package (Optional)
```bash
powershell -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'builds\your-app-name.zip' -Force"
```

## Deployment

Upload the entire contents of the `dist` folder to your web server directory.

The application will automatically:
- Load the embedded dataset on startup
- Use cache-busting to ensure fresh data
- Work correctly at your specified base path

## Customization

### For Different Datasets
1. Update the `mposFiles` array with your JSON file names
2. Change the dataset folder name from `mpos.json` to your preferred name
3. Update console messages and UI text to reflect your dataset name

### For Different Deployment Paths
1. Update the `base` property in `vite.config.ts`
2. Rebuild the application

## Cache-Busting Feature

The cache-busting implementation adds a timestamp parameter to all JSON requests:
```typescript
const response = await fetch(`./mpos.json/${fileName}?v=${cacheBuster}`);
```

This ensures browsers always fetch fresh data when JSON files are updated on the server.
