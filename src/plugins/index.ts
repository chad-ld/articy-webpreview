/**
 * Plugin System Entry Point
 * Automatically discovers and registers all available plugins
 */

import { pluginRegistry } from './registry';
import { pluginDiscoveryService } from './discovery';

// Track initialization state to prevent double initialization
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the plugin system with automatic plugin discovery
 * This only discovers plugins, doesn't register them until user enables them
 */
export async function initializePluginSystem(): Promise<void> {
  // Return existing promise if already initializing
  if (initializationPromise) {
    return initializationPromise;
  }

  // Return immediately if already initialized
  if (isInitialized) {
    console.log('🔌 Plugin system already initialized, skipping...');
    return;
  }

  console.log('🔌 Initializing Plugin System with Auto-Discovery...');

  // Create and store the initialization promise
  initializationPromise = (async () => {
    try {
      // Step 1: Discover all available plugins (but don't register them yet)
      await pluginDiscoveryService.discoverPlugins();

      // Step 2: Register only the plugins that are enabled by the user (now async)
      await pluginDiscoveryService.registerEnabledPlugins();

      const discoveredCount = pluginDiscoveryService.getDiscoveredPlugins().length;
      const registeredCount = pluginRegistry.getAllPlugins().length;

      console.log(`✅ Plugin System initialized: ${discoveredCount} plugins discovered, ${registeredCount} plugins registered`);

      // Log registered plugins
      const plugins = pluginRegistry.getAllPlugins();
      if (plugins.length > 0) {
        console.log('📋 Registered plugins:', plugins.map(p => `${p.metadata.name} (${p.metadata.id})`));
      }

      isInitialized = true;

    } catch (error) {
      console.error('❌ Failed to initialize plugin system:', error);

      // Fallback to manual registration if auto-discovery fails
      console.log('🔄 Falling back to manual plugin registration...');
      await fallbackManualRegistration();
      isInitialized = true;
    }
  })();

  return initializationPromise;
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

// Auto-initialize when imported (now async) - but App.tsx will also call this explicitly
initializePluginSystem().catch(error => {
  console.error('❌ Plugin system auto-initialization failed:', error);
});
