/**
 * Plugin Manager
 * Handles plugin lifecycle, loading, and state management
 */

import { message } from 'antd';
import { IPlugin, PluginContext, PluginState } from './types';
import { pluginRegistry } from './registry';

class PluginManager {
  private context?: PluginContext;
  private initialized = false;

  /**
   * Initialize the plugin manager with app context
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.initialized = true;
    
    console.log('🔌 Plugin Manager initialized');
    
    // Load plugin state from localStorage
    this.loadPluginState();
    
    // Initialize all enabled plugins
    await this.initializeEnabledPlugins();
  }

  /**
   * Destroy the plugin manager and all plugins
   */
  async destroy(): Promise<void> {
    if (!this.initialized) return;

    // Destroy all enabled plugins
    const enabledPlugins = pluginRegistry.getEnabledPlugins();
    for (const plugin of enabledPlugins) {
      try {
        await plugin.destroy();
      } catch (error) {
        console.error(`Error destroying plugin ${plugin.metadata.id}:`, error);
      }
    }

    // Clear event handlers
    pluginRegistry.clearEventHandlers();
    
    this.context = undefined;
    this.initialized = false;
    
    console.log('🔌 Plugin Manager destroyed');
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    if (!this.initialized || !this.context) {
      console.error('Plugin Manager not initialized');
      return false;
    }

    const plugin = pluginRegistry.getPlugin(pluginId);
    if (!plugin) {
      console.error(`Plugin ${pluginId} not found`);
      return false;
    }

    if (pluginRegistry.isPluginEnabled(pluginId)) {
      console.log(`Plugin ${pluginId} is already enabled`);
      return true;
    }

    try {
      // Initialize the plugin
      await plugin.initialize(this.context);
      
      // Enable in registry
      pluginRegistry.enablePlugin(pluginId);
      
      // Save state
      this.savePluginState();
      
      console.log(`✅ Plugin enabled: ${plugin.metadata.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error);
      message.error(`Failed to enable plugin: ${plugin.metadata.name}`);
      return false;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    const plugin = pluginRegistry.getPlugin(pluginId);
    if (!plugin) {
      console.error(`Plugin ${pluginId} not found`);
      return false;
    }

    if (!pluginRegistry.isPluginEnabled(pluginId)) {
      console.log(`Plugin ${pluginId} is already disabled`);
      return true;
    }

    try {
      // Destroy the plugin
      await plugin.destroy();
      
      // Disable in registry
      pluginRegistry.disablePlugin(pluginId);
      
      // Save state
      this.savePluginState();
      
      console.log(`❌ Plugin disabled: ${plugin.metadata.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error);
      message.error(`Failed to disable plugin: ${plugin.metadata.name}`);
      return false;
    }
  }

  /**
   * Toggle plugin enabled state
   */
  async togglePlugin(pluginId: string): Promise<boolean> {
    if (pluginRegistry.isPluginEnabled(pluginId)) {
      return await this.disablePlugin(pluginId);
    } else {
      return await this.enablePlugin(pluginId);
    }
  }

  /**
   * Initialize all enabled plugins
   */
  private async initializeEnabledPlugins(): Promise<void> {
    if (!this.context) return;

    const enabledPlugins = pluginRegistry.getEnabledPlugins();
    
    for (const plugin of enabledPlugins) {
      try {
        await plugin.initialize(this.context);
        console.log(`✅ Plugin initialized: ${plugin.metadata.name}`);
      } catch (error) {
        console.error(`Failed to initialize plugin ${plugin.metadata.id}:`, error);
        // Disable the plugin if initialization fails
        pluginRegistry.disablePlugin(plugin.metadata.id);
      }
    }
  }

  /**
   * Load plugin state from localStorage
   */
  private loadPluginState(): void {
    try {
      const savedState = localStorage.getItem('articy-plugin-state');
      if (savedState) {
        const state: PluginState = JSON.parse(savedState);
        pluginRegistry.setPluginState(state);
      }
    } catch (error) {
      console.error('Failed to load plugin state:', error);
    }
  }

  /**
   * Save plugin state to localStorage
   */
  private savePluginState(): void {
    try {
      const state = pluginRegistry.getPluginState();
      localStorage.setItem('articy-plugin-state', JSON.stringify(state));
      console.log('💾 Plugin state saved to localStorage');
    } catch (error) {
      console.error('Failed to save plugin state:', error);
    }
  }

  /**
   * Update plugin context (when app state changes)
   */
  updateContext(context: Partial<PluginContext>): void {
    if (this.context) {
      this.context = { ...this.context, ...context };
      
      // Notify plugins of context changes
      pluginRegistry.emitEvent('context-updated', context);
    }
  }

  /**
   * Get all available plugins for UI display
   */
  getAvailablePlugins() {
    return pluginRegistry.getPluginMetadata();
  }

  /**
   * Get enabled plugins for UI rendering
   */
  getEnabledPlugins() {
    return pluginRegistry.getEnabledPlugins();
  }
}

// Global plugin manager instance
export const pluginManager = new PluginManager();

export default PluginManager;
