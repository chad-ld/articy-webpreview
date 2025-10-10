# Environment Detection System

## 🎯 **Overview**

The Articy Web Viewer includes a sophisticated environment detection system (`src/utils/environmentDetector.js`) that automatically identifies the deployment environment and adapts dataset detection strategies accordingly. This system is critical for the hybrid dataset detection to work correctly across different deployment types.

## 🏗️ **Architecture**

### **Core Purpose**

The Environment Detector serves three main purposes:
1. **Identify Deployment Type** - Determine if running in development, production, or portable desktop
2. **Recommend Detection Strategy** - Choose optimal dataset detection method for environment
3. **Provide Environment Configuration** - Supply environment-specific settings and capabilities

### **Detected Environments**

| Environment Type | Description | Detection Criteria |
|-----------------|-------------|-------------------|
| **web (development)** | Vite dev server | Port 5173, 3000, or 3001 |
| **web (production)** | Live web server | Standard HTTP/HTTPS ports or web hosting |
| **portable-desktop** | Local PHP server | Localhost:8080/8081 with desktop indicators |
| **electron** | Electron app | `window.process.type` exists |
| **node** | Node.js server | `global` and `require` available |

## 🔧 **Implementation Details**

### **Environment Detector Class**

```javascript
class EnvironmentDetector {
  constructor() {
    this.debugMode = false;
  }

  detectEnvironment() {
    const env = {
      type: 'unknown',
      isWeb: false,
      isElectron: false,
      isDesktop: false,
      isDevelopment: false,
      isProduction: false,
      hasFileSystemAccess: false,
      hasPHPSupport: false,
      capabilities: []
    };

    // Detection logic based on window, port, hostname
    // ...

    return env;
  }
}
```

### **Environment Properties**

```typescript
interface Environment {
  type: 'web' | 'electron' | 'portable-desktop' | 'node' | 'unknown';
  isWeb: boolean;              // Running in web browser
  isElectron: boolean;         // Running in Electron
  isDesktop: boolean;          // Desktop deployment (Electron or portable)
  isDevelopment: boolean;      // Development mode (Vite, etc.)
  isProduction: boolean;       // Production deployment
  hasFileSystemAccess: boolean; // Can access file system directly
  hasPHPSupport: boolean;      // PHP backend available
  capabilities: string[];      // List of available capabilities
}
```

## 🌐 **Environment Types**

### **1. Web Development**

**Detection**:
- Port 5173 (Vite default)
- Port 3000 or 3001 (common dev servers)
- Localhost without specific port

**Characteristics**:
```javascript
{
  type: 'web',
  isWeb: true,
  isDevelopment: true,
  hasPHPSupport: true,
  capabilities: ['development', 'hot-reload', 'php-api', 'server-side-scanning', 'fetch-api', 'cors']
}
```

**Dataset Detection Strategy**: PHP API with dev server scan fallback

---

### **2. Web Production**

**Detection**:
- Standard HTTP/HTTPS ports (80, 443)
- Web hosting patterns (dreamhost, hostgator, etc.)
- Ports 8082-8084 (production testing)

**Characteristics**:
```javascript
{
  type: 'web',
  isWeb: true,
  isProduction: true,
  hasPHPSupport: true,
  capabilities: ['production', 'php-api', 'server-side-scanning', 'fetch-api', 'cors']
}
```

**Dataset Detection Strategy**: PHP API only

---

### **3. Portable Desktop**

**Detection**:
- Localhost with port 8080 or 8081
- Root-served application (pathname === '/' or '/index.html')
- Has desktop indicators

**Characteristics**:
```javascript
{
  type: 'portable-desktop',
  isWeb: true,
  isDesktop: true,
  isProduction: true,
  hasPHPSupport: true,
  capabilities: ['portable-desktop', 'local-php-server', 'php-api', 'server-side-scanning', 'fetch-api', 'cors']
}
```

**Dataset Detection Strategy**: PHP API (scans local datasets folder)

**Note**: Portable desktop is treated as production for dataset detection purposes, but uses local PHP server for dataset scanning.

---

### **4. Electron (Future Support)**

**Detection**:
- `window.process.type` exists

**Characteristics**:
```javascript
{
  type: 'electron',
  isElectron: true,
  isDesktop: true,
  hasFileSystemAccess: true,
  capabilities: ['file-system', 'native-directory-scan']
}
```

**Dataset Detection Strategy**: Direct file system access

---

### **5. Node.js (Server-side)**

**Detection**:
- `global` and `require` available

**Characteristics**:
```javascript
{
  type: 'node',
  hasFileSystemAccess: true,
  capabilities: ['file-system', 'node-modules']
}
```

## 📊 **Detection Methods by Environment**

The environment detector recommends different dataset detection methods based on the detected environment:

### **Detection Method Priority**

```javascript
getAvailableDetectionMethods() {
  if (env.isElectron) {
    return ['file-system', 'fallback'];
  } else if (env.type === 'portable-desktop') {
    return ['php-api', 'fallback'];
  } else if (env.isWeb) {
    const methods = [];
    if (env.hasPHPSupport) {
      methods.push('php-api');
    }
    methods.push('fallback');
    if (env.isDevelopment) {
      methods.push('dev-server-scan');
    }
    return methods;
  }
  return ['fallback'];
}
```

### **Method Descriptions**

| Method | Description | When Used |
|--------|-------------|-----------|
| **php-api** | Server-side PHP script scans dataset folders | Production web, portable desktop |
| **file-system** | Direct file system access | Electron apps (future) |
| **fallback** | JavaScript-based detection with hardcoded dataset names | Static hosting, failure fallback |
| **dev-server-scan** | Development server special handling | Development mode only |

## 🎛️ **Usage**

### **Basic Usage**

```javascript
import EnvironmentDetector from './utils/environmentDetector';

const detector = new EnvironmentDetector();
detector.setDebugMode(true);

const env = detector.detectEnvironment();
console.log('Environment:', env.type);
console.log('Capabilities:', env.capabilities);

const strategy = detector.getRecommendedStrategy();
console.log('Recommended detection strategy:', strategy);
```

### **Integration with Dataset Detection**

The hybrid dataset detector uses the environment detector to choose the optimal detection strategy:

```javascript
class HybridDatasetDetector {
  constructor() {
    this.environmentDetector = new EnvironmentDetector();
  }

  async detectDatasets() {
    const env = this.environmentDetector.detectEnvironment();
    const methods = this.environmentDetector.getAvailableDetectionMethods();

    // Try each method until one succeeds
    for (const method of methods) {
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
}
```

### **Environment-Specific Configuration**

```javascript
const config = detector.getEnvironmentConfig();
// Returns:
{
  apiEndpoint: './datasets.php',
  fallbackDatasets: ['mpos', 'demo', 'demo4', ...],
  timeout: 5000,                    // 3000 for portable desktop
  retryAttempts: 2,                 // 1 for portable desktop
  isPortableDesktop: false          // true for portable desktop
}
```

## 🔍 **Detection Logic**

### **Port-Based Detection**

Development vs. Production is primarily determined by port number:

```javascript
// Development ports
if (port === '5173' || port === '3000' || port === '3001') {
  env.isDevelopment = true;
  env.capabilities.push('development', 'hot-reload');
}

// Production testing ports
else if (port === '8080' || port === '8081' || port === '8082' || port === '8083' || port === '8084') {
  env.isProduction = true;
  env.capabilities.push('production');
}
```

### **Portable Desktop Detection**

Portable desktop requires multiple indicators:

```javascript
isPortableDesktop() {
  const hostname = window.location.hostname;
  const port = window.location.port;

  // Must be localhost with specific ports
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isDesktopPort = port === '8080' || port === '8081';

  // Must have desktop indicators
  const hasDesktopIndicators = this.hasDesktopIndicators();

  return isLocalhost && isDesktopPort && hasDesktopIndicators;
}

hasDesktopIndicators() {
  const pathname = window.location.pathname;
  // Desktop version serves from root
  return pathname === '/' || pathname === '/index.html';
}
```

### **PHP Support Detection**

```javascript
canTestPHPSupport() {
  const hostname = window.location.hostname;

  // Common hosting patterns
  const hostingPatterns = [
    /\.com$/, /\.net$/, /\.org$/, /\.dev$/,
    /dreamhost/i, /hostgator/i, /bluehost/i, /godaddy/i
  ];

  return hostingPatterns.some(pattern => pattern.test(hostname));
}
```

## 🧪 **Testing & Debugging**

### **Debug Mode**

Enable detailed logging to troubleshoot environment detection:

```javascript
const detector = new EnvironmentDetector();
detector.setDebugMode(true);
detector.detectEnvironment();
// Logs detailed detection information to console
```

### **Environment Report**

Log comprehensive environment information:

```javascript
detector.logEnvironmentInfo();

// Outputs:
// 🔍 Environment Detection Report
// Environment Type: web
// Capabilities: ['development', 'hot-reload', 'php-api', ...]
// Recommended Strategy: php-api
// Available Methods: ['php-api', 'fallback', 'dev-server-scan']
// Configuration: { apiEndpoint: './datasets.php', ... }
```

### **Manual Testing**

Test different environments by accessing the app on different ports:

```bash
# Development (port 5173)
npm run dev:safe

# Production testing (port 8082)
npm run build:test

# Portable desktop (port 8080)
cd builds/articy-desktop-viewer-v4.x
./start-articy.bat
```

## ⚠️ **Common Issues**

### **Incorrect Environment Detection**

**Problem**: App detects wrong environment type

**Solutions**:
1. Check port number matches expected range
2. Verify hostname (localhost vs. domain)
3. Enable debug mode to see detection logic
4. Check for conflicting indicators

### **PHP Support Not Detected**

**Problem**: PHP API not available despite PHP server running

**Solutions**:
1. Verify `datasets.php` is accessible
2. Check port matches PHP support detection
3. Test PHP endpoint manually: `curl http://localhost:8080/datasets.php`
4. Review web server configuration

### **Portable Desktop Misidentified**

**Problem**: Desktop version detected as web production

**Solutions**:
1. Verify serving from root path (`/` or `/index.html`)
2. Check port is 8080 or 8081
3. Ensure localhost/127.0.0.1 hostname
4. Review `hasDesktopIndicators()` logic

## 📚 **Best Practices**

### **For Developers**

1. **Always test in target environment** - Development detection differs from production
2. **Enable debug mode during development** - Helps understand detection decisions
3. **Test all deployment types** - Web, desktop, and production testing
4. **Use environment detection results** - Don't hardcode assumptions about environment

### **For Deployment**

1. **Verify correct environment detected** - Check environment report in console
2. **Test dataset detection** - Ensure correct strategy selected
3. **Monitor detection failures** - Log and handle fallback scenarios
4. **Document environment requirements** - Port ranges, hosting setup, etc.

---

> **🔍 Note**: The environment detection system is designed to be automatic and transparent. It should "just work" in most scenarios, but understanding the detection logic helps troubleshoot issues in unusual deployment configurations.
