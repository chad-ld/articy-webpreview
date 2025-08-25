/**
 * Isolated Render Manager
 * Manages separate React roots for plugins that need isolation from the main component tree
 * This prevents infinite re-render loops when plugins interfere with complex choice rendering logic
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { IPlugin, PluginModalProps } from './types';

interface IsolatedPluginInstance {
  plugin: IPlugin;
  container: HTMLElement;
  root: Root;
  isVisible: boolean;
  onVisibilityChange?: (pluginId: string, isVisible: boolean) => void;
}

class IsolatedRenderManager {
  private isolatedPlugins: Map<string, IsolatedPluginInstance> = new Map();

  /**
   * Register a plugin for isolated rendering
   */
  registerPlugin(plugin: IPlugin, onVisibilityChange?: (pluginId: string, isVisible: boolean) => void): void {
    const pluginId = plugin.metadata.id;

    // Skip if already registered
    if (this.isolatedPlugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} is already registered for isolated rendering`);
      return;
    }

    // Create isolated DOM container
    const container = document.createElement('div');
    container.id = `isolated-plugin-${pluginId}`;
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none'; // Allow clicks to pass through when hidden
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    // Create isolated React root
    const root = createRoot(container);

    // Store the isolated plugin instance
    const instance: IsolatedPluginInstance = {
      plugin,
      container,
      root,
      isVisible: false,
      onVisibilityChange
    };

    this.isolatedPlugins.set(pluginId, instance);

    // Initial render (hidden)
    this.renderPlugin(pluginId, false);

    console.log(`✅ Plugin ${plugin.metadata.name} registered for isolated rendering`);
  }

  /**
   * Unregister a plugin from isolated rendering
   */
  unregisterPlugin(pluginId: string): void {
    const instance = this.isolatedPlugins.get(pluginId);
    if (!instance) return;

    // Unmount React tree
    instance.root.unmount();

    // Remove DOM container
    document.body.removeChild(instance.container);

    // Remove from map
    this.isolatedPlugins.delete(pluginId);

    console.log(`✅ Plugin ${pluginId} unregistered from isolated rendering`);
  }

  /**
   * Show/hide an isolated plugin modal
   */
  togglePlugin(pluginId: string): void {
    const instance = this.isolatedPlugins.get(pluginId);
    if (!instance) {
      console.warn(`Plugin ${pluginId} is not registered for isolated rendering`);
      return;
    }

    const newVisibility = !instance.isVisible;
    this.renderPlugin(pluginId, newVisibility);
  }

  /**
   * Show an isolated plugin modal
   */
  showPlugin(pluginId: string): void {
    const instance = this.isolatedPlugins.get(pluginId);
    if (!instance) {
      console.warn(`Plugin ${pluginId} is not registered for isolated rendering`);
      return;
    }

    this.renderPlugin(pluginId, true);
  }

  /**
   * Hide an isolated plugin modal
   */
  hidePlugin(pluginId: string): void {
    const instance = this.isolatedPlugins.get(pluginId);
    if (!instance) {
      console.warn(`Plugin ${pluginId} is not registered for isolated rendering`);
      return;
    }

    this.renderPlugin(pluginId, false);
  }

  /**
   * Check if a plugin is currently visible
   */
  isPluginVisible(pluginId: string): boolean {
    const instance = this.isolatedPlugins.get(pluginId);
    return instance ? instance.isVisible : false;
  }

  /**
   * Get all isolated plugin IDs
   */
  getIsolatedPluginIds(): string[] {
    return Array.from(this.isolatedPlugins.keys());
  }

  /**
   * Force re-render an isolated plugin (useful when plugin data changes)
   */
  refreshPlugin(pluginId: string): void {
    const instance = this.isolatedPlugins.get(pluginId);
    if (!instance) {
      console.warn(`Plugin ${pluginId} is not registered for isolated rendering`);
      return;
    }

    // Re-render with current visibility state
    this.renderPlugin(pluginId, instance.isVisible);
    console.log(`🔄 Plugin ${pluginId} refreshed in isolated tree`);
  }

  /**
   * Render a plugin in its isolated container
   */
  private renderPlugin(pluginId: string, isVisible: boolean): void {
    const instance = this.isolatedPlugins.get(pluginId);
    if (!instance) return;

    // Update visibility state
    const wasVisible = instance.isVisible;
    instance.isVisible = isVisible;

    // Notify visibility change if callback is provided and state actually changed
    if (instance.onVisibilityChange && wasVisible !== isVisible) {
      instance.onVisibilityChange(pluginId, isVisible);
    }

    // Update container pointer events
    instance.container.style.pointerEvents = isVisible ? 'auto' : 'none';

    // Create modal props
    const modalProps: PluginModalProps = {
      isVisible,
      onClose: () => this.hidePlugin(pluginId),
      width: 1280,
      height: 720,
      title: instance.plugin.metadata.name
    };

    // Render the plugin modal in isolated React tree
    const modalElement = instance.plugin.renderModal(modalProps);
    
    // Wrap in a container that handles the isolation
    const isolatedWrapper = React.createElement('div', {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: isVisible ? 'block' : 'none',
        zIndex: 9999
      }
    }, modalElement);

    instance.root.render(isolatedWrapper);

    console.log(`🔄 Plugin ${pluginId} rendered in isolated tree (visible: ${isVisible})`);
  }

  /**
   * Clean up all isolated plugins
   */
  destroy(): void {
    const pluginIds = Array.from(this.isolatedPlugins.keys());
    pluginIds.forEach(pluginId => this.unregisterPlugin(pluginId));
    console.log('🧹 Isolated Render Manager destroyed');
  }
}

// Global isolated render manager instance
export const isolatedRenderManager = new IsolatedRenderManager();

export default IsolatedRenderManager;
