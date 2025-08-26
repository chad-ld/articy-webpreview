/**
 * Plugin Discovery Service
 * Automatically discovers and loads plugins from the plugins directory
 * Supports both bundled (development) and dynamic (production) loading
 */

import { IPlugin } from './types';
import { pluginRegistry } from './registry';
import { configService } from '../services/configService';

interface PluginModule {
  default?: IPlugin;
  [key: string]: any;
}

interface PluginManifest {
  available: Array<{
    id: string;
    name: string;
    file: string;
    version?: string;
    description?: string;
    author?: string;
  }>;
}

class PluginDiscoveryService {
  private discoveredPlugins = new Map<string, IPlugin>();
  private loadingPromises = new Map<string, Promise<IPlugin | null>>();
  private isDevelopment = false;

  constructor() {
    // Detect if we're in development mode
    this.isDevelopment = this.detectDevelopmentMode();
    console.log(`🔧 Plugin discovery mode: ${this.isDevelopment ? 'Development (bundled)' : 'Production (dynamic)'}`);
    console.log(`🔧 Environment detection fix applied - v2.0`);
  }

  /**
   * Detect if we're running in development mode
   */
  private detectDevelopmentMode(): boolean {
    // Primary check: Vite environment variable
    if (import.meta.env?.DEV === true) {
      console.log('🔧 Development mode detected: import.meta.env.DEV = true');
      return true;
    }

    // If DEV is explicitly false, we're definitely in production
    if (import.meta.env?.DEV === false) {
      console.log('🔧 Production mode detected: import.meta.env.DEV = false');
      return false;
    }

    // Secondary check: Development server indicators
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port;

      console.log(`🔧 Environment detection - hostname: ${hostname}, port: ${port}`);

      // Common development ports (Vite dev server and other dev servers)
      if (port === '5173' || port === '3000' || port === '3001') {
        console.log(`🔧 Development mode detected: development port ${port}`);
        return true;
      }

      // Production testing ports (should be treated as production)
      if (port === '8080' || port === '8081' || port === '8082' || port === '8083' || port === '8084') {
        console.log(`🔧 Production mode detected: production testing port ${port}`);
        return false;
      }

      // Only treat localhost as development if no port is specified (default HTTP/HTTPS)
      if ((hostname === 'localhost' || hostname === '127.0.0.1') && !port) {
        console.log('🔧 Development mode detected: localhost without specific port');
        return true;
      }
    }

    // Tertiary check: Look for development-specific files/paths
    // In development, we have access to import.meta.glob
    // In production, this should be undefined or throw an error
    try {
      // This will only work in development with Vite
      const testGlob = import.meta.glob;
      if (testGlob && typeof testGlob === 'function') {
        // Additional check: see if we can access source files
        const hasSourceFiles = import.meta.glob('./*/index.ts', { eager: false });
        if (hasSourceFiles && Object.keys(hasSourceFiles).length > 0) {
          console.log('🔧 Development mode detected: source files accessible');
          return true;
        }
      }
    } catch (error) {
      // import.meta.glob not available, definitely production
      console.log('🔧 import.meta.glob not available, using production mode');
    }

    // Default to production mode
    console.log('🔧 Defaulting to production mode');
    return false;
  }

  /**
   * Discover all available plugins without registering them
   */
  async discoverPlugins(): Promise<void> {
    console.log('🔍 Starting automatic plugin discovery...');

    // Ensure all required globals are available for UMD plugins
    await this.ensureGlobalsForUMD();

    try {
      if (this.isDevelopment) {
        console.log('🔧 Using development mode: bundled plugins');
        await this.discoverBundledPlugins();
      } else {
        console.log('🔧 Using production mode: dynamic plugins');
        await this.discoverDynamicPlugins();
      }
    } catch (error) {
      console.error('❌ Primary plugin discovery failed:', error);

      // Fallback logic
      if (this.isDevelopment) {
        console.log('🔄 Development mode failed, trying dynamic discovery...');
        try {
          await this.discoverDynamicPlugins();
        } catch (fallbackError) {
          console.error('❌ Fallback to dynamic discovery also failed:', fallbackError);
          throw new Error('Both bundled and dynamic plugin discovery failed');
        }
      } else {
        console.log('🔄 Production mode failed, trying bundled discovery...');
        try {
          await this.discoverBundledPlugins();
        } catch (fallbackError) {
          console.error('❌ Fallback to bundled discovery also failed:', fallbackError);
          // Don't throw here - just continue with no plugins
          console.log('⚠️ No plugins available, continuing without plugins');
        }
      }
    }
  }

  /**
   * Discover plugins using Vite's import.meta.glob (development mode)
   */
  private async discoverBundledPlugins(): Promise<void> {
    console.log('📦 Discovering bundled plugins (development mode)...');

    try {
      // Get all plugin modules using Vite's import.meta.glob
      // This will find all index.ts files in plugin subdirectories
      const pluginModules = import.meta.glob('./*/index.ts');

      console.log(`📁 Found ${Object.keys(pluginModules).length} potential plugin modules`);

      // If no modules found, this might be production mode
      if (Object.keys(pluginModules).length === 0) {
        console.log('⚠️ No bundled plugins found, this might be production mode');
        throw new Error('No bundled plugins available');
      }

      // Load each plugin module but DON'T register them yet
      const loadPromises = Object.entries(pluginModules).map(async ([path, importFn]) => {
        const pluginName = this.extractPluginNameFromPath(path);
        console.log(`🔌 Discovering bundled plugin: ${pluginName} from ${path}`);

        try {
          const module = await importFn() as PluginModule;
          const plugin = this.extractPluginFromModule(module, pluginName);

          if (plugin) {
            this.discoveredPlugins.set(plugin.metadata.id, plugin);
            console.log(`✅ Successfully discovered bundled plugin: ${plugin.metadata.name} (${plugin.metadata.id})`);
            return plugin;
          } else {
            console.warn(`⚠️ No valid plugin found in module: ${path}`);
            return null;
          }
        } catch (error) {
          console.error(`❌ Failed to discover bundled plugin from ${path}:`, error);
          return null;
        }
      });

      // Wait for all plugins to be discovered
      const results = await Promise.all(loadPromises);
      const successfulPlugins = results.filter(plugin => plugin !== null);

      console.log(`🎉 Bundled plugin discovery complete: ${successfulPlugins.length} plugins discovered`);

    } catch (error) {
      console.error('❌ Bundled plugin discovery failed:', error);
      throw error; // Re-throw to trigger fallback
    }
  }

  /**
   * Discover plugins dynamically from external files (production mode)
   */
  private async discoverDynamicPlugins(): Promise<void> {
    console.log('🌐 Discovering dynamic plugins (production mode)...');

    try {
      // Load plugin manifest
      const manifest = await this.loadPluginManifest();

      if (!manifest || !manifest.available || manifest.available.length === 0) {
        console.log('📝 No plugins found in manifest');
        throw new Error('No plugins available in manifest');
      }

      console.log(`📋 Found ${manifest.available.length} plugins in manifest`);

      // Load each plugin dynamically
      const loadPromises = manifest.available.map(async (pluginInfo) => {
        console.log(`🔌 Loading dynamic plugin: ${pluginInfo.name} from ${pluginInfo.file}`);

        try {
          const plugin = await this.loadDynamicPlugin(pluginInfo);

          if (plugin) {
            this.discoveredPlugins.set(plugin.metadata.id, plugin);
            console.log(`✅ Successfully loaded dynamic plugin: ${plugin.metadata.name} (${plugin.metadata.id})`);
            return plugin;
          } else {
            console.warn(`⚠️ Failed to load plugin from: ${pluginInfo.file}`);
            return null;
          }
        } catch (error) {
          console.error(`❌ Failed to load dynamic plugin ${pluginInfo.name}:`, error);
          return null;
        }
      });

      // Wait for all plugins to be loaded
      const results = await Promise.all(loadPromises);
      const successfulPlugins = results.filter(plugin => plugin !== null);

      if (successfulPlugins.length === 0) {
        throw new Error('No plugins could be loaded successfully');
      }

      console.log(`🎉 Dynamic plugin discovery complete: ${successfulPlugins.length} plugins loaded`);

    } catch (error) {
      console.error('❌ Dynamic plugin discovery failed:', error);
      throw error;
    }
  }

  /**
   * Load plugin manifest from plugins.json
   */
  private async loadPluginManifest(): Promise<PluginManifest | null> {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`./plugins/plugins.json?v=${timestamp}`);

      if (!response.ok) {
        console.log(`📝 Plugin manifest not found (${response.status}), this is normal for development or first-time setups`);
        return null;
      }

      const manifest = await response.json() as PluginManifest;
      console.log('📋 Plugin manifest loaded successfully:', manifest);
      return manifest;

    } catch (error) {
      console.log('📝 Plugin manifest not available:', error.message);
      return null;
    }
  }

  /**
   * Load a single plugin dynamically from external file
   */
  private async loadDynamicPlugin(pluginInfo: PluginManifest['available'][0]): Promise<IPlugin | null> {
    try {
      // Use relative path for proper deployment compatibility
      const pluginUrl = `./plugins/${pluginInfo.file}`;
      console.log(`📥 Loading dynamic plugin from: ${pluginUrl}`);

      // For .js files, assume they are UMD and skip ES module import
      if (pluginInfo.file.endsWith('.js')) {
        console.log(`🔧 Detected .js file, using UMD loading for: ${pluginUrl}`);
        return await this.loadUMDPlugin(pluginUrl, pluginInfo.id);
      }

      // Try ES module import for .mjs files or other module formats
      try {
        const module = await import(/* @vite-ignore */ pluginUrl) as PluginModule;
        const plugin = this.extractPluginFromModule(module, pluginInfo.id);

        if (plugin) {
          // Validate that the plugin ID matches the manifest
          if (plugin.metadata.id !== pluginInfo.id) {
            console.warn(`⚠️ Plugin ID mismatch: manifest says "${pluginInfo.id}", plugin says "${plugin.metadata.id}"`);
          }
          return plugin;
        }
      } catch (esError) {
        console.log(`📥 ES module import failed, trying UMD script loading...`);

        // Fallback to UMD script loading
        return await this.loadUMDPlugin(pluginUrl, pluginInfo.id);
      }

      console.error(`❌ No valid plugin found in dynamic module: ${pluginUrl}`);
      return null;

    } catch (error) {
      console.error(`❌ Failed to load dynamic plugin ${pluginInfo.name}:`, error);
      return null;
    }
  }

  /**
   * Load UMD plugin using script tag
   */
  private async loadUMDPlugin(pluginUrl: string, pluginId: string): Promise<IPlugin | null> {
    // Globals should already be set up by ensureGlobalsForUMD(), but ensure process exists
    if (typeof (window as any).process === 'undefined') {
      (window as any).process = { env: { NODE_ENV: 'production' } };
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = pluginUrl;
      script.type = 'text/javascript';

      script.onload = () => {
        try {
          // Debug: Check if globals are available
          console.log(`🔍 UMD script loaded. Checking globals:`, {
            React: typeof (window as any).React,
            ReactDOM: typeof (window as any).ReactDOM,
            antd: typeof (window as any).antd,
            process: typeof (window as any).process
          });

          // UMD plugins expose themselves on window using the plugin ID as the key
          // Try multiple possible global names
          const possibleNames = [
            pluginId,                           // "hello-world"
            this.toCamelCase(pluginId),        // "helloWorld"
            this.toCamelCase(pluginId) + 'Plugin', // "helloWorldPlugin"
            pluginId.replace(/-/g, '_'),       // "hello_world"
          ];

          let plugin = null;
          for (const name of possibleNames) {
            // Use bracket notation to handle names with hyphens
            plugin = (window as any)[name];
            console.log(`🔍 Checking window["${name}"]:`, typeof plugin, plugin);
            if (plugin && this.isValidPlugin(plugin)) {
              console.log(`✅ Successfully loaded UMD plugin: ${pluginId} (found as window["${name}"])`);
              resolve(plugin);
              return;
            }
          }

          // If not found, log what's actually available on window
          console.error(`❌ UMD plugin not found on window. Tried: ${possibleNames.join(', ')}`);
          console.log(`🔍 Available window properties containing "${pluginId}":`,
            Object.keys(window).filter(key => key.includes(pluginId.replace(/-/g, ''))));

          // Debug: Check what the plugin actually exported
          const actualPlugin = (window as any)[pluginId];
          if (actualPlugin) {
            console.log(`🔍 Found window["${pluginId}"] but it's not a valid plugin:`, actualPlugin);
            console.log(`🔍 Plugin validation result:`, this.isValidPlugin(actualPlugin));
            if (typeof actualPlugin === 'object') {
              console.log(`🔍 Plugin properties:`, Object.keys(actualPlugin));
            }
          }

          resolve(null);
        } catch (error) {
          console.error(`❌ Error extracting UMD plugin:`, error);
          resolve(null);
        } finally {
          // Clean up script tag
          document.head.removeChild(script);
        }
      };

      script.onerror = (error) => {
        console.error(`❌ Failed to load UMD script:`, error);
        document.head.removeChild(script);
        resolve(null);
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Register only the plugins that are enabled by the user
   * Uses localStorage first, then falls back to config defaults for first-time users
   */
  async registerEnabledPlugins(): Promise<void> {
    console.log('📋 Registering enabled plugins...');

    let enabledPluginIds: string[] = [];
    let isFirstTimeUser = false;

    // Step 1: Check localStorage for existing user preferences
    const savedState = localStorage.getItem('articy-plugin-state');

    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        enabledPluginIds = Object.entries(state)
          .filter(([_, config]: [string, any]) => config.enabled)
          .map(([pluginId, _]) => pluginId);
        console.log('🔌 Found existing user preferences in localStorage:', enabledPluginIds);
      } catch (error) {
        console.error('Failed to parse plugin state:', error);
        isFirstTimeUser = true;
      }
    } else {
      isFirstTimeUser = true;
    }

    // Step 2: If no localStorage (first-time user), use config defaults
    if (isFirstTimeUser) {
      console.log('👋 First-time user detected, loading default configuration...');

      try {
        const config = await configService.loadConfig();
        enabledPluginIds = config.plugins.defaultEnabled;
        console.log('🔧 Using default plugins from config:', enabledPluginIds);

        // Save the default configuration to localStorage for future use
        if (enabledPluginIds.length > 0) {
          const defaultState: { [key: string]: { enabled: boolean } } = {};

          // Set all discovered plugins to disabled first
          for (const plugin of this.discoveredPlugins.values()) {
            defaultState[plugin.metadata.id] = { enabled: false };
          }

          // Enable only the default plugins
          for (const pluginId of enabledPluginIds) {
            if (this.discoveredPlugins.has(pluginId)) {
              defaultState[pluginId] = { enabled: true };
            }
          }

          localStorage.setItem('articy-plugin-state', JSON.stringify(defaultState));
          console.log('💾 Saved default configuration to localStorage for future sessions');
        }
      } catch (error) {
        console.error('❌ Failed to load configuration, using empty defaults:', error);
        enabledPluginIds = [];
      }
    }

    // Step 3: Register the enabled plugins
    let registeredCount = 0;
    for (const pluginId of enabledPluginIds) {
      const plugin = this.discoveredPlugins.get(pluginId);
      if (plugin) {
        pluginRegistry.register(plugin);
        registeredCount++;
        console.log(`✅ Registered enabled plugin: ${plugin.metadata.name}`);
      } else {
        console.warn(`⚠️ Enabled plugin not found: ${pluginId}`);
      }
    }

    console.log(`📋 Registration complete: ${registeredCount} plugins registered`);

    if (isFirstTimeUser && enabledPluginIds.length > 0) {
      console.log('🎉 Welcome! Default plugins have been enabled for your first visit.');
    }
  }

  /**
   * Extract plugin name from file path
   */
  private extractPluginNameFromPath(path: string): string {
    // Extract plugin name from path like "./hello-world/index.ts"
    const match = path.match(/\.\/([^\/]+)\/index\.ts$/);
    return match ? match[1] : 'unknown-plugin';
  }

  /**
   * Extract plugin instance from module
   */
  private extractPluginFromModule(module: PluginModule, fallbackName: string): IPlugin | null {
    console.log(`🔍 Extracting plugin from module for: ${fallbackName}`);
    console.log(`🔍 Module type:`, typeof module);
    console.log(`🔍 Module keys:`, Object.keys(module));
    console.log(`🔍 Module.default:`, typeof module.default, module.default);

    // Try different export patterns

    // 1. Default export
    if (module.default && this.isValidPlugin(module.default)) {
      console.log(`✅ Found valid plugin in default export`);
      return module.default;
    } else if (module.default) {
      console.log(`🔍 Default export exists but not valid plugin:`, this.isValidPlugin(module.default));
      console.log(`🔍 Default export properties:`, Object.keys(module.default));
    }

    // 2. Named export matching plugin name (e.g., helloWorldPlugin)
    const camelCaseName = this.toCamelCase(fallbackName) + 'Plugin';
    console.log(`🔍 Checking for named export: ${camelCaseName}`);
    if (module[camelCaseName] && this.isValidPlugin(module[camelCaseName])) {
      console.log(`✅ Found valid plugin in named export: ${camelCaseName}`);
      return module[camelCaseName];
    }

    // 3. Look for any export that implements IPlugin
    console.log(`🔍 Checking all exports for valid plugins...`);
    for (const [key, value] of Object.entries(module)) {
      console.log(`🔍 Checking export "${key}":`, typeof value, this.isValidPlugin(value));
      if (key !== 'default' && this.isValidPlugin(value)) {
        console.log(`✅ Found valid plugin in export: ${key}`);
        return value as IPlugin;
      }
    }

    console.log(`❌ No valid plugin found in module for: ${fallbackName}`);
    return null;
  }

  /**
   * Validate if an object is a valid plugin
   */
  private isValidPlugin(obj: any): obj is IPlugin {
    return obj &&
           typeof obj === 'object' &&
           obj.metadata &&
           typeof obj.metadata.id === 'string' &&
           typeof obj.metadata.name === 'string' &&
           typeof obj.initialize === 'function' &&
           typeof obj.destroy === 'function' &&
           typeof obj.getButtonConfig === 'function' &&
           typeof obj.renderModal === 'function';
  }

  /**
   * Convert kebab-case to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Ensure all required globals exist for UMD plugins
   */
  private async ensureGlobalsForUMD(): Promise<void> {
    console.log('🔧 Setting up globals for UMD plugin compatibility...');

    // Add process global for React
    if (typeof (window as any).process === 'undefined') {
      (window as any).process = {
        env: {
          NODE_ENV: 'production'
        }
      };
      console.log('🔧 Added process global');
    }

    try {
      // Add React global if not already present
      if (typeof (window as any).React === 'undefined') {
        const React = await import('react');
        (window as any).React = React;
        console.log('🔧 Added React global');
      }

      // Add ReactDOM global if not already present
      if (typeof (window as any).ReactDOM === 'undefined') {
        const ReactDOM = await import('react-dom');
        (window as any).ReactDOM = ReactDOM;
        console.log('🔧 Added ReactDOM global');
      }

      // Add antd global if not already present
      if (typeof (window as any).antd === 'undefined') {
        const antd = await import('antd');
        (window as any).antd = antd;
        console.log('🔧 Added antd global');
      }

      console.log('✅ All UMD globals ready');
    } catch (error) {
      console.error('❌ Failed to set up UMD globals:', error);
      throw error;
    }
  }

  /**
   * Get all discovered plugins
   */
  getDiscoveredPlugins(): IPlugin[] {
    return Array.from(this.discoveredPlugins.values());
  }

  /**
   * Get metadata for all discovered plugins
   */
  getDiscoveredPluginsMetadata(): Array<{ id: string; name: string; description: string; version: string; author?: string; icon?: string }> {
    return Array.from(this.discoveredPlugins.values()).map(plugin => ({
      id: plugin.metadata.id,
      name: plugin.metadata.name,
      description: plugin.metadata.description,
      version: plugin.metadata.version,
      author: plugin.metadata.author,
      icon: plugin.metadata.icon
    }));
  }

  /**
   * Check if a plugin was discovered
   */
  hasPlugin(pluginId: string): boolean {
    return this.discoveredPlugins.has(pluginId);
  }

  /**
   * Get a specific discovered plugin
   */
  getPlugin(pluginId: string): IPlugin | undefined {
    return this.discoveredPlugins.get(pluginId);
  }

  /**
   * Reload a specific plugin (for development)
   */
  async reloadPlugin(pluginName: string): Promise<boolean> {
    try {
      console.log(`🔄 Reloading plugin: ${pluginName}`);
      
      // This would require more advanced hot-reloading setup
      // For now, just log that it's not implemented
      console.warn('🚧 Plugin hot-reloading not yet implemented');
      
      return false;
    } catch (error) {
      console.error(`❌ Failed to reload plugin ${pluginName}:`, error);
      return false;
    }
  }
}

// Global plugin discovery service instance
export const pluginDiscoveryService = new PluginDiscoveryService();

export default PluginDiscoveryService;
