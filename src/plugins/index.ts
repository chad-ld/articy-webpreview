/**
 * Plugin System Entry Point
 * Automatically discovers and registers all available plugins
 */

import { pluginRegistry } from './registry';
import { pluginDiscoveryService } from './discovery';

/**
 * Initialize the plugin system with automatic plugin discovery
 * This only discovers plugins, doesn't register them until user enables them
 */
export async function initializePluginSystem(): Promise<void> {
  console.log('🔌 Initializing Plugin System with Auto-Discovery...');

  try {
    // Step 1: Discover all available plugins (but don't register them yet)
    await pluginDiscoveryService.discoverPlugins();

    // Step 2: Register only the plugins that are enabled by the user
    pluginDiscoveryService.registerEnabledPlugins();

    const discoveredCount = pluginDiscoveryService.getDiscoveredPlugins().length;
    const registeredCount = pluginRegistry.getAllPlugins().length;

    console.log(`✅ Plugin System initialized: ${discoveredCount} plugins discovered, ${registeredCount} plugins registered`);

    // Log registered plugins
    const plugins = pluginRegistry.getAllPlugins();
    if (plugins.length > 0) {
      console.log('📋 Registered plugins:', plugins.map(p => `${p.metadata.name} (${p.metadata.id})`));
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
