/**
 * usePlugins Hook
 * React hook for managing plugin state and interactions
 */

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { pluginManager } from '../plugins/manager';
import { isolatedRenderManager } from '../plugins/isolatedRenderManager';
import { IPlugin, PluginContext } from '../plugins/types';

interface UsePluginsProps {
  project?: any;
  currentNode?: any;
  variables?: any;
  isVariablesPanelVisible?: boolean;
  isSearchPanelVisible?: boolean;
  storyOnlyMode?: boolean;
  onNavigateToNode?: (nodeId: string) => void;
}

export const usePlugins = (props: UsePluginsProps) => {
  const [enabledPlugins, setEnabledPlugins] = useState<IPlugin[]>([]);
  const [pluginModals, setPluginModals] = useState<{ [pluginId: string]: boolean }>({});
  const [initialized, setInitialized] = useState(false);

  // Initialize plugin manager
  useEffect(() => {
    const initializePlugins = async () => {
      if (initialized) return;

      const context: PluginContext = {
        project: props.project,
        currentNode: props.currentNode,
        variables: props.variables,
        isVariablesPanelVisible: props.isVariablesPanelVisible || false,
        isSearchPanelVisible: props.isSearchPanelVisible || false,
        storyOnlyMode: props.storyOnlyMode || false,
        showMessage: (content: string, type = 'info') => {
          message[type](content);
        },
        navigateToNode: props.onNavigateToNode,
        emitEvent: (eventName: string, data?: any) => {
          // Plugin manager will handle event emission
        },
        onEvent: (eventName: string, handler: (data?: any) => void) => {
          // Plugin manager will handle event subscription
        }
      };

      try {
        await pluginManager.initialize(context);
        const enabled = pluginManager.getEnabledPlugins();

        // Register plugins that need isolated rendering
        enabled.forEach(plugin => {
          if (plugin.useIsolatedRendering && plugin.useIsolatedRendering()) {
            isolatedRenderManager.registerPlugin(plugin);
            console.log(`🔄 Plugin ${plugin.metadata.name} registered for isolated rendering`);
          }
        });

        setEnabledPlugins(enabled);
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize plugin manager:', error);
      }
    };

    initializePlugins();

    // Cleanup on unmount
    return () => {
      if (initialized) {
        // Clean up isolated plugins
        isolatedRenderManager.destroy();
        pluginManager.destroy();
        setInitialized(false);
      }
    };
  }, [initialized]);

  // Update plugin context when props change
  useEffect(() => {
    if (!initialized) return;

    const contextUpdate: Partial<PluginContext> = {
      project: props.project,
      currentNode: props.currentNode,
      variables: props.variables,
      isVariablesPanelVisible: props.isVariablesPanelVisible || false,
      isSearchPanelVisible: props.isSearchPanelVisible || false,
      storyOnlyMode: props.storyOnlyMode || false,
      navigateToNode: props.onNavigateToNode
    };

    pluginManager.updateContext(contextUpdate);

    // Notify plugins of data changes
    if (props.project) {
      // Emit dataset loaded event
      // pluginRegistry.emitEvent('dataset-loaded', props.project);
    }
    
    if (props.currentNode) {
      // Notify plugins of node changes
      const plugins = pluginManager.getEnabledPlugins();
      plugins.forEach(plugin => {
        if (plugin.onNodeChange) {
          plugin.onNodeChange(props.currentNode);
        }
      });
    }

    if (props.variables) {
      // Notify plugins of variable changes
      const plugins = pluginManager.getEnabledPlugins();
      plugins.forEach(plugin => {
        if (plugin.onVariableChange) {
          plugin.onVariableChange(props.variables);
        }

        // Refresh isolated plugins to update their rendering
        if (plugin.useIsolatedRendering && plugin.useIsolatedRendering()) {
          isolatedRenderManager.refreshPlugin(plugin.metadata.id);
        }
      });
    }
  }, [props.project, props.currentNode, props.variables, props.isVariablesPanelVisible, props.isSearchPanelVisible, props.storyOnlyMode, props.onNavigateToNode, initialized]);

  // Open plugin modal
  const openPluginModal = useCallback((pluginId: string) => {
    setPluginModals(prev => ({ ...prev, [pluginId]: true }));
  }, []);

  // Close plugin modal
  const closePluginModal = useCallback((pluginId: string) => {
    // Check if this plugin uses isolated rendering
    const plugin = enabledPlugins.find(p => p.metadata.id === pluginId);
    if (plugin && plugin.useIsolatedRendering && plugin.useIsolatedRendering()) {
      // Use isolated render manager
      isolatedRenderManager.hidePlugin(pluginId);
    }
    // Always update state for button active status
    setPluginModals(prev => ({ ...prev, [pluginId]: false }));
  }, [enabledPlugins]);

  // Toggle plugin modal (open if closed, close if open)
  const togglePluginModal = useCallback((pluginId: string) => {
    // Check if this plugin uses isolated rendering
    const plugin = enabledPlugins.find(p => p.metadata.id === pluginId);
    if (plugin && plugin.useIsolatedRendering && plugin.useIsolatedRendering()) {
      // Use isolated render manager
      isolatedRenderManager.togglePlugin(pluginId);
      // Update state for button active status
      setPluginModals(prev => ({
        ...prev,
        [pluginId]: isolatedRenderManager.isPluginVisible(pluginId)
      }));
    } else {
      // Use standard modal rendering
      setPluginModals(prev => ({
        ...prev,
        [pluginId]: !prev[pluginId]
      }));
    }
  }, [enabledPlugins]);

  // Get plugin button configurations
  const getPluginButtons = useCallback(() => {
    return enabledPlugins.map(plugin => {
      const isIsolated = plugin.useIsolatedRendering && plugin.useIsolatedRendering();
      const isActive = isIsolated
        ? isolatedRenderManager.isPluginVisible(plugin.metadata.id)
        : (pluginModals[plugin.metadata.id] || false);

      return {
        plugin,
        config: plugin.getButtonConfig(),
        onClick: () => togglePluginModal(plugin.metadata.id),
        isActive
      };
    }).sort((a, b) => (a.config.position || 999) - (b.config.position || 999));
  }, [enabledPlugins, togglePluginModal, pluginModals]);

  // Render plugin modals (only for non-isolated plugins)
  const renderPluginModals = useCallback(() => {
    return enabledPlugins
      .filter(plugin => !(plugin.useIsolatedRendering && plugin.useIsolatedRendering()))
      .map(plugin => {
        const isVisible = pluginModals[plugin.metadata.id] || false;

        return plugin.renderModal({
          isVisible,
          onClose: () => closePluginModal(plugin.metadata.id),
          width: 1280,
          height: 720,
          title: plugin.metadata.name
        });
      });
  }, [enabledPlugins, pluginModals, closePluginModal]);

  return {
    enabledPlugins,
    pluginButtons: getPluginButtons(),
    renderPluginModals,
    openPluginModal,
    closePluginModal,
    initialized
  };
};
