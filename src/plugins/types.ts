/**
 * Plugin System Types and Interfaces
 * Defines the contract for all plugins in the Articy Web Viewer
 */

import React from 'react';

export interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  icon?: string;
  enabled: boolean;
}

export interface PluginButtonConfig {
  text: string;
  icon?: React.ReactNode;
  position?: number; // For ordering plugins
}

export interface PluginModalProps {
  isVisible: boolean;
  onClose: () => void;
  width?: number;
  height?: number;
  title?: string;
}

export interface PluginContext {
  // App data access
  project?: any;
  currentNode?: any;
  variables?: any;
  
  // App state access
  isVariablesPanelVisible: boolean;
  isSearchPanelVisible: boolean;
  storyOnlyMode: boolean;
  
  // Utility functions
  showMessage: (content: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  navigateToNode?: (nodeId: string) => void;
  
  // Plugin communication
  emitEvent: (eventName: string, data?: any) => void;
  onEvent: (eventName: string, handler: (data?: any) => void) => void;
}

export interface IPlugin {
  // Plugin metadata
  metadata: PluginMetadata;
  
  // Lifecycle methods
  initialize(context: PluginContext): Promise<void>;
  destroy(): Promise<void>;
  
  // UI Integration
  getButtonConfig(): PluginButtonConfig;
  renderModal(props: PluginModalProps): React.ReactNode;
  
  // Optional hooks
  onDatasetLoad?(data: any): void;
  onNodeChange?(node: any): void;
  onVariableChange?(variables: any): void;
}

export interface PluginState {
  [pluginId: string]: {
    enabled: boolean;
    config?: any;
  };
}

export interface PluginRegistry {
  plugins: Map<string, IPlugin>;
  enabledPlugins: Set<string>;
}

// Plugin events
export type PluginEvent = {
  name: string;
  data?: any;
  source: string; // plugin ID that emitted the event
};

// Plugin storage interface
export interface PluginStorage {
  get(key: string): any;
  set(key: string, value: any): void;
  remove(key: string): void;
  clear(): void;
}
