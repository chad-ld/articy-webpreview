/**
 * Plugin Discovery Service
 * Automatically discovers and loads plugins from the plugins directory
 */

import { IPlugin } from './types';
import { pluginRegistry } from './registry';

interface PluginModule {
  default?: IPlugin;
  [key: string]: any;
}

class PluginDiscoveryService {
  private discoveredPlugins = new Map<string, IPlugin>();
  private loadingPromises = new Map<string, Promise<IPlugin | null>>();

  /**
   * Discover and load all plugins automatically
   */
  async discoverPlugins(): Promise<void> {
    console.log('🔍 Starting automatic plugin discovery...');

    try {
      // Get all plugin modules using Vite's import.meta.glob
      // This will find all index.ts files in plugin subdirectories
      const pluginModules = import.meta.glob('./*/index.ts');
      
      console.log(`📁 Found ${Object.keys(pluginModules).length} potential plugin modules`);

      // Load each plugin module
      const loadPromises = Object.entries(pluginModules).map(async ([path, importFn]) => {
        const pluginName = this.extractPluginNameFromPath(path);
        console.log(`🔌 Loading plugin: ${pluginName} from ${path}`);
        
        try {
          const module = await importFn() as PluginModule;
          const plugin = this.extractPluginFromModule(module, pluginName);
          
          if (plugin) {
            this.discoveredPlugins.set(plugin.metadata.id, plugin);
            pluginRegistry.register(plugin);
            console.log(`✅ Successfully loaded plugin: ${plugin.metadata.name} (${plugin.metadata.id})`);
            return plugin;
          } else {
            console.warn(`⚠️ No valid plugin found in module: ${path}`);
            return null;
          }
        } catch (error) {
          console.error(`❌ Failed to load plugin from ${path}:`, error);
          return null;
        }
      });

      // Wait for all plugins to load
      const results = await Promise.all(loadPromises);
      const successfulPlugins = results.filter(plugin => plugin !== null);
      
      console.log(`🎉 Plugin discovery complete: ${successfulPlugins.length} plugins loaded successfully`);
      
    } catch (error) {
      console.error('❌ Plugin discovery failed:', error);
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
