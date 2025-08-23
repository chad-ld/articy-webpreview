/**
 * Plugin System Entry Point
 * Registers all available plugins and initializes the plugin system
 */

import { pluginRegistry } from './registry';
import { helloWorldPlugin } from './hello-world/HelloWorldPlugin';

/**
 * Initialize the plugin system by registering all available plugins
 */
export function initializePluginSystem(): void {
  console.log('🔌 Initializing Plugin System...');
  
  // Register all available plugins
  pluginRegistry.register(helloWorldPlugin);
  
  console.log(`✅ Plugin System initialized with ${pluginRegistry.getAllPlugins().length} plugins`);
}

// Export plugin system components
export { pluginRegistry } from './registry';
export { pluginManager } from './manager';
export { type IPlugin, type PluginMetadata, type PluginContext } from './types';

// Auto-initialize when imported
initializePluginSystem();
