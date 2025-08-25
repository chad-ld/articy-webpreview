/**
 * Plugin Discovery Service
 * Automatically discovers and loads plugins from the plugins directory
 */

import { IPlugin } from './types';
import { pluginRegistry } from './registry';
import { configService } from '../services/configService';

interface PluginModule {
  default?: IPlugin;
  [key: string]: any;
}

class PluginDiscoveryService {
  private discoveredPlugins = new Map<string, IPlugin>();
  private loadingPromises = new Map<string, Promise<IPlugin | null>>();

  /**
   * Discover all available plugins without registering them
   */
  async discoverPlugins(): Promise<void> {
    console.log('🔍 Starting automatic plugin discovery...');

    try {
      // Get all plugin modules using Vite's import.meta.glob
      // This will find all index.ts files in plugin subdirectories
      const pluginModules = import.meta.glob('./*/index.ts');

      console.log(`📁 Found ${Object.keys(pluginModules).length} potential plugin modules`);

      // Load each plugin module but DON'T register them yet
      const loadPromises = Object.entries(pluginModules).map(async ([path, importFn]) => {
        const pluginName = this.extractPluginNameFromPath(path);
        console.log(`🔌 Discovering plugin: ${pluginName} from ${path}`);

        try {
          const module = await importFn() as PluginModule;
          const plugin = this.extractPluginFromModule(module, pluginName);

          if (plugin) {
            this.discoveredPlugins.set(plugin.metadata.id, plugin);
            console.log(`✅ Successfully discovered plugin: ${plugin.metadata.name} (${plugin.metadata.id})`);
            return plugin;
          } else {
            console.warn(`⚠️ No valid plugin found in module: ${path}`);
            return null;
          }
        } catch (error) {
          console.error(`❌ Failed to discover plugin from ${path}:`, error);
          return null;
        }
      });

      // Wait for all plugins to be discovered
      const results = await Promise.all(loadPromises);
      const successfulPlugins = results.filter(plugin => plugin !== null);

      console.log(`🎉 Plugin discovery complete: ${successfulPlugins.length} plugins discovered (not yet registered)`);

    } catch (error) {
      console.error('❌ Plugin discovery failed:', error);
    }
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
    // Try different export patterns
    
    // 1. Default export
    if (module.default && this.isValidPlugin(module.default)) {
      return module.default;
    }
    
    // 2. Named export matching plugin name (e.g., helloWorldPlugin)
    const camelCaseName = this.toCamelCase(fallbackName) + 'Plugin';
    if (module[camelCaseName] && this.isValidPlugin(module[camelCaseName])) {
      return module[camelCaseName];
    }
    
    // 3. Look for any export that implements IPlugin
    for (const [key, value] of Object.entries(module)) {
      if (key !== 'default' && this.isValidPlugin(value)) {
        return value as IPlugin;
      }
    }
    
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
