/**
 * Plugin System Entry Point
 * Automatically discovers and registers all available plugins
 */

import { pluginRegistry } from './registry';
import { pluginDiscoveryService } from './discovery';

/**
 * Initialize the plugin system with automatic plugin discovery
 */
export async function initializePluginSystem(): Promise<void> {
  console.log('🔌 Initializing Plugin System with Auto-Discovery...');

  try {
    // Discover and register all plugins automatically
    await pluginDiscoveryService.discoverPlugins();

    const pluginCount = pluginRegistry.getAllPlugins().length;
    console.log(`✅ Plugin System initialized with ${pluginCount} plugins`);

    // Log discovered plugins
    const plugins = pluginRegistry.getAllPlugins();
    if (plugins.length > 0) {
      console.log('📋 Discovered plugins:', plugins.map(p => `${p.metadata.name} (${p.metadata.id})`));
    }

  } catch (error) {
    console.error('❌ Failed to initialize plugin system:', error);

    // Fallback to manual registration if auto-discovery fails
    console.log('🔄 Falling back to manual plugin registration...');
    await fallbackManualRegistration();
  }
}

/**
 * Fallback manual registration for development/debugging
 */
async function fallbackManualRegistration(): Promise<void> {
  try {
    // Import and register Hello World plugin manually as fallback
    const { helloWorldPlugin } = await import('./hello-world/HelloWorldPlugin');
    pluginRegistry.register(helloWorldPlugin);
    console.log('✅ Fallback registration complete');
  } catch (error) {
    console.error('❌ Fallback registration failed:', error);
  }
}

// Export plugin system components
export { pluginRegistry } from './registry';
export { pluginManager } from './manager';
export { pluginDiscoveryService } from './discovery';
export { type IPlugin, type PluginMetadata, type PluginContext } from './types';

// Auto-initialize when imported (now async)
initializePluginSystem().catch(error => {
  console.error('❌ Plugin system initialization failed:', error);
});
