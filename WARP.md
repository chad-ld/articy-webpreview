# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Starting Development
```bash
# ALWAYS use safe mode for development (never use npm run dev directly)
powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1

# This provides:
# - Dual server setup (PHP on port 8080 + Vite on port 3000)
# - File integrity protection and cache prevention
# - Automatic server cleanup
# - Development datasets from datasets-dev/ folder
```

### Building & Testing
```bash
# Build for production web deployment
npm run build

# Build and test production locally with cache busting
npm run build:test

# Build portable desktop version (~35MB package)
npm run build:desktop

# Verify file integrity before major work
npm run check:integrity

# Test cache configuration (12 prevention features)
npm run test:cache

# Clean all build artifacts
npm run clean

# Stop all development servers
npm run cleanup:servers
```

### Code Quality
```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix

# TypeScript type checking
npm run type-check
```

## High-Level Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Ant Design 5.x
- **Backend**: PHP for server operations (dataset detection, logging)
- **Build Tool**: Vite with custom plugins for dataset separation
- **Deployment**: Dual deployment (web server + portable desktop)

### Core Architecture Patterns

#### 1. Dataset Separation System
The project uses environment-specific dataset loading:
- **Development**: Uses `datasets-dev/` folder (isolated from builds)
- **Production Web**: Uses `dist/datasets/` folder (empty, user adds files)
- **Desktop**: Uses `app/datasets/` folder
- **Middleware**: Custom Vite middleware serves dev datasets during development

#### 2. Plugin Architecture
Extensible plugin system with post-build customization:
- **Development**: Plugins bundled with hot-reloading
- **Production**: Plugins compiled separately to `dist/plugins/`
- **Dynamic Loading**: Runtime plugin loading from external UMD files
- **Config Integration**: Plugin defaults controlled via `config.json`
- **Plugin Manager**: `src/plugins/manager.ts` handles registration and lifecycle

#### 3. Dual Format Support
Handles both Articy Draft versions:
- **3.x Format**: Single JSON file processing (`src/utils/ArticyProject.ts`)
- **4.x Format**: Multi-file manifest-based loading (`src/utils/test4xLoader.js`)
- **Hybrid Detection**: `src/utils/hybridDatasetDetector.js` auto-detects format

#### 4. State Management
React-based state management without external libraries:
- **App.tsx**: Central state container for navigation and variables
- **Context-Free**: Props drilling for predictable data flow
- **Session Storage**: Browser storage for user preferences

### Key Components & Services

#### Core Components
- `src/App.tsx` - Main application container, routing, and state management
- `src/components/InteractiveArticyViewer.tsx` - Story node rendering engine
- `src/components/VariablesPanel.tsx` - Variable tracking and editing interface
- `src/components/PluginSelector.tsx` - Plugin loading UI

#### Services & Utilities
- `src/services/configService.ts` - Configuration loading and management
- `src/utils/consoleLogger.ts` - Console log capture and batch save system
- `src/utils/nodeProcessor.ts` - Story node parsing and processing
- `src/utils/hybridDatasetDetector.js` - Dataset discovery (PHP API + JS fallback)

#### Panel System
Specialized panels for different node types:
- `src/panels/QuestionPanel.tsx` - Choice-based interactions
- `src/panels/InstructionPanel.tsx` - Instruction nodes
- `src/panels/EndOfFlowPanel.tsx` - Story endpoints

### Build & Deployment Flow

#### Web Deployment
1. `npm run build` compiles to `dist/`
2. Plugins built separately via `scripts/build-plugins.js`
3. Config files copied from `datasets-dev/config.json`
4. `.htaccess` auto-generated for Apache servers
5. Empty `datasets/` folder created with README

#### Desktop Deployment
1. `npm run build:desktop` creates portable package
2. `scripts/create-desktop-package.js` orchestrates:
   - Copies built app to `builds/articy-desktop-*/app/`
   - Includes portable PHP from `php-portable/`
   - Creates launcher scripts (`start-articy.bat`)
   - Removes unnecessary development datasets

### Critical Implementation Details

#### File Protection System
Development includes safeguards against file corruption:
- **Safe Mode Script**: `start-dev-safe.ps1` prevents cache issues
- **Integrity Checking**: `check-file-integrity.ps1` validates critical files
- **Backup System**: `.backup` versions for automatic restoration
- **Cache Busting**: Vite config disables caching (`cacheDir: false`)

#### PHP Proxy Configuration
Development requires PHP for several features:
- **Port 8080**: PHP server for dataset detection
- **Port 3000**: Vite dev server with proxy to PHP
- **Endpoints**: `/datasets.php`, `/save-log.php`
- **Proxy Rules**: Defined in `vite.config.ts`

#### Plugin System Implementation
- **Plugin Interface**: `src/plugins/types.ts` defines contracts
- **Registry**: `src/plugins/registry.ts` manages available plugins
- **Discovery**: `src/plugins/discovery.ts` finds plugins at runtime
- **Isolation**: `src/plugins/isolatedRenderManager.ts` sandboxes rendering

### Important Conventions

#### Dataset Structure
```
datasets-dev/                    # Development datasets
├── myproject.json/              # 4.x format (folder)
│   ├── manifest.json
│   ├── global_variables.json
│   └── package_*.json
└── oldproject.json              # 3.x format (single file)
```

#### Configuration Hierarchy
1. Hardcoded defaults in code
2. `config.json` sets project defaults
3. localStorage stores user preferences
4. Session state for temporary settings

#### Error Handling
- Console logging captured automatically
- Floating button for on-demand log save
- Logs saved to `logs/` directory
- Session-based log management

### Development Workflow Best Practices

1. **Always use safe mode** - Never run `npm run dev` directly
2. **Check integrity first** - Run `npm run check:integrity` before major work
3. **Test builds locally** - Use `npm run build:test` before deployment
4. **Commit frequently** - Prevent work loss with regular commits
5. **Respect user data** - Never override user preferences without permission

### Testing Approach

While there are no formal unit tests, the project includes:
- **Runtime Tests**: `test-runtime-simple.ps1` for server behavior
- **Cache Tests**: `test-cache-busting.ps1` for cache prevention
- **Integrity Tests**: `check-file-integrity.ps1` for file validation
- **Manual Testing**: Test with both 3.x and 4.x datasets

### Known Constraints

- **PHP Required**: Many features need PHP server for operations
- **Windows-Focused**: Desktop version targets Windows users
- **No Hot Module Replacement**: HMR disabled to prevent cache corruption
- **File Size Limits**: Large datasets may require optimization
