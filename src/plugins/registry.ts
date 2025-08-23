/**
 * Plugin Registry
 * Central registry for all available plugins
 */

import { IPlugin, PluginMetadata, PluginState } from './types';

class PluginRegistry {
  private plugins = new Map<string, IPlugin>();
  private enabledPlugins = new Set<string>();
  private eventHandlers = new Map<string, Array<(data?: any) => void>>();

  /**
   * Register a plugin with the registry
   */
  register(plugin: IPlugin): void {
    if (this.plugins.has(plugin.metadata.id)) {
      console.warn(`Plugin ${plugin.metadata.id} is already registered`);
      return;
    }

    this.plugins.set(plugin.metadata.id, plugin);
    console.log(`✅ Plugin registered: ${plugin.metadata.name} (${plugin.metadata.id})`);
  }

  /**
   * Unregister a plugin from the registry
   */
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      this.plugins.delete(pluginId);
      this.enabledPlugins.delete(pluginId);
      console.log(`❌ Plugin unregistered: ${plugin.metadata.name} (${pluginId})`);
    }
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all enabled plugins
   */
  getEnabledPlugins(): IPlugin[] {
    return Array.from(this.enabledPlugins)
      .map(id => this.plugins.get(id))
      .filter(plugin => plugin !== undefined) as IPlugin[];
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Enable a plugin
   */
  enablePlugin(pluginId: string): void {
    if (this.plugins.has(pluginId)) {
      this.enabledPlugins.add(pluginId);
      console.log(`🔌 Plugin enabled: ${pluginId}`);
    }
  }

  /**
   * Disable a plugin
   */
  disablePlugin(pluginId: string): void {
    this.enabledPlugins.delete(pluginId);
    console.log(`🔌 Plugin disabled: ${pluginId}`);
  }

  /**
   * Check if plugin is enabled
   */
  isPluginEnabled(pluginId: string): boolean {
    return this.enabledPlugins.has(pluginId);
  }

  /**
   * Get plugin metadata for all plugins
   */
  getPluginMetadata(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      ...plugin.metadata,
      enabled: this.isPluginEnabled(plugin.metadata.id)
    }));
  }

  /**
   * Set plugin state from saved configuration
   */
  setPluginState(state: PluginState): void {
    this.enabledPlugins.clear();

    for (const [pluginId, pluginConfig] of Object.entries(state)) {
      if (pluginConfig.enabled && this.plugins.has(pluginId)) {
        this.enabledPlugins.add(pluginId);
      }
    }
  }

  /**
   * Get current plugin state for saving
   */
  getPluginState(): PluginState {
    const state: PluginState = {};
    
    for (const plugin of this.plugins.values()) {
      state[plugin.metadata.id] = {
        enabled: this.isPluginEnabled(plugin.metadata.id)
      };
    }
    
    return state;
  }

  /**
   * Event system for plugin communication
   */
  emitEvent(eventName: string, data?: any, source?: string): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to plugin events
   */
  onEvent(eventName: string, handler: (data?: any) => void): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);
  }

  /**
   * Clear all event handlers
   */
  clearEventHandlers(): void {
    this.eventHandlers.clear();
  }
}

// Global plugin registry instance
export const pluginRegistry = new PluginRegistry();

export default PluginRegistry;
