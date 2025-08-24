/**
 * Mysteryworks Murderboard Plugin
 * A plugin for displaying and managing murder mystery investigation boards
 */

import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { FileSearchOutlined } from '@ant-design/icons';
import { IPlugin, PluginMetadata, PluginButtonConfig, PluginModalProps, PluginContext } from '../types';

// Import the layout structure
import layoutData from './murderboard_template.psd-structure.json';

// Define types for the layout structure
interface LayoutElement {
  name: string;
  type: string;
  options: any;
  offset: { left: number; top: number };
  size: { width: number; height: number };
  relativePath: string;
  children: any[];
}

interface LayoutRoot {
  type: string;
  options: any;
  size: { width: number; height: number };
  children: LayoutElement[];
}

// Function to get asset URL for Vite
const getAssetUrl = (fileName: string) => {
  return new URL(`./murderboard_template.psd-assets/${fileName}`, import.meta.url).href;
};

// Dynamic murderboard component with variable-based visibility
interface MurderboardCanvasProps {
  variables?: any;
}

const MurderboardCanvasWithResize: React.FC<MurderboardCanvasProps> = ({ variables }) => {
  const layout = layoutData as LayoutRoot;

  // Simple 30% scale
  const scale = 0.30;

  // Function to check if an element should be visible
  const isElementVisible = (elementName: string): boolean => {
    // Always show background
    if (elementName === 'bg') {
      return true;
    }

    // For all other elements, check for corresponding "_found" variable
    const foundVariableName = `${elementName}_found`;

    // Look through all variable namespaces for the found variable
    if (variables) {
      // Check in all possible variable namespaces
      for (const namespace in variables) {
        const namespaceVars = variables[namespace];
        if (namespaceVars) {
          // Check for exact match first
          if (namespaceVars[foundVariableName] === true) {
            console.log(`🔍 Found evidence: ${elementName} (${foundVariableName} = true)`);
            return true;
          }

          // Check for case-insensitive match
          for (const varName in namespaceVars) {
            if (varName.toLowerCase() === foundVariableName.toLowerCase() && namespaceVars[varName] === true) {
              console.log(`🔍 Found evidence (case-insensitive): ${elementName} (${varName} = true, looking for ${foundVariableName})`);
              return true;
            }
          }
        }
      }
    }

    // Default to hidden if variable not found or false
    console.log(`🔒 Hidden evidence: ${elementName} (${foundVariableName} not found or false)`);
    return false;
  };

  console.log('🎨 Murderboard rendering with variables:', {
    originalWidth: layout.size.width,
    originalHeight: layout.size.height,
    scale: scale,
    variablesAvailable: !!variables,
    variableNamespaces: variables ? Object.keys(variables) : []
  });

  return (
    <div
      style={{
        position: 'relative',
        width: layout.size.width * scale,
        height: layout.size.height * scale,
        overflow: 'hidden',
        border: '2px solid red' // Debug border
      }}
    >
        {layout.children.map((element, index) => {
          const fileName = `${element.relativePath}.${element.type}`;
          const imagePath = getAssetUrl(fileName);
          const isVisible = isElementVisible(element.name);

          // Reverse z-index so background (last element) has lowest z-index
          const zIndex = layout.children.length - 1 - index;

          console.log(`🖼️ Processing image: ${fileName} (visible: ${isVisible}, z-index: ${zIndex})`);

          return (
            <img
              key={index}
              src={imagePath}
              alt={element.name}
              style={{
                position: 'absolute',
                left: element.offset.left * scale,
                top: element.offset.top * scale,
                width: element.size.width * scale,
                height: element.size.height * scale,
                objectFit: 'contain',
                zIndex: zIndex, // Reversed z-order so background is at bottom
                border: '1px solid rgba(255,255,255,0.2)', // Debug border
                display: isVisible ? 'block' : 'none' // Hide/show based on variables
              }}
              onLoad={() => {
                console.log(`✅ Successfully loaded: ${fileName} (visible: ${isVisible})`);
              }}
              onError={(e) => {
                console.warn(`❌ Failed to load image: ${fileName} from ${imagePath}`);
                // Show a placeholder instead of hiding
                e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.3)';
                e.currentTarget.style.border = '2px solid red';
              }}
            />
          );
        })}
    </div>
  );
};

export class MysteryworksMurderboardPlugin implements IPlugin {
  metadata: PluginMetadata = {
    id: 'mysteryworks-murderboard',
    name: 'Mysteryworks Murderboard',
    description: 'Interactive murder mystery investigation board for tracking suspects, evidence, and connections',
    version: '1.0.0',
    author: 'Mysteryworks',
    icon: 'file-search',
    enabled: true
  };

  private context?: PluginContext;
  private currentVariables?: any;

  /**
   * Enable isolated rendering to prevent infinite re-render loops
   * on multiple choice nodes
   */
  useIsolatedRendering(): boolean {
    return true;
  }

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.currentVariables = context.variables;
    console.log('🔍 Mysteryworks Murderboard Plugin initialized');

    // Show a welcome message when plugin is loaded
    context.showMessage('Mysteryworks Murderboard plugin loaded!', 'success');

    // Subscribe to dataset load events
    context.onEvent('dataset-loaded', this.onDatasetLoad.bind(this));

    // Log initial variable state for debugging
    console.log('🔍 Initial variables:', this.currentVariables);
  }

  async destroy(): Promise<void> {
    console.log('🔍 Mysteryworks Murderboard Plugin destroyed');
    this.context = undefined;
  }

  getButtonConfig(): PluginButtonConfig {
    return {
      text: 'Murderboard',
      icon: <FileSearchOutlined />,
      position: 2
    };
  }

  renderModal(props: PluginModalProps): React.ReactNode {
    // Calculate exact modal size based on content - no padding needed
    const layout = layoutData as LayoutRoot;
    const scale = 0.30; // Match the scale in the component
    const contentWidth = layout.size.width * scale;
    const contentHeight = layout.size.height * scale;

    // Log current variables when modal is rendered
    console.log('🎨 Rendering murderboard modal with variables:', this.currentVariables);

    return (
      <Modal
        title={props.title || this.metadata.name}
        open={props.isVisible}
        onCancel={props.onClose}
        footer={null}
        width={contentWidth + 48}
        zIndex={9999}
        style={{ top: 20 }}
        bodyStyle={{
          height: contentHeight,
          padding: '0px',
          backgroundColor: '#000'
        }}
      >
        <MurderboardCanvasWithResize variables={this.currentVariables} />
      </Modal>
    );
  }

  // Optional event handlers
  onDatasetLoad(data: any): void {
    console.log('🔍 Mysteryworks Murderboard Plugin: Dataset loaded', data);
    if (this.context) {
      this.context.showMessage('Mysteryworks Murderboard plugin detected dataset load!', 'info');
    }
  }

  onNodeChange(node: any): void {
    console.log('🔍 Mysteryworks Murderboard Plugin: Node changed', node);
  }

  onVariableChange(variables: any): void {
    console.log('🔍 Mysteryworks Murderboard Plugin: Variables changed', variables);
    this.currentVariables = variables;

    // Log any "_found" variables for debugging
    if (variables) {
      const foundVariables: any = {};
      for (const namespace in variables) {
        const namespaceVars = variables[namespace];
        if (namespaceVars) {
          for (const varName in namespaceVars) {
            if (varName.toLowerCase().endsWith('_found') && namespaceVars[varName] === true) {
              foundVariables[`${namespace}.${varName}`] = namespaceVars[varName];
            }
          }
        }
      }

      if (Object.keys(foundVariables).length > 0) {
        console.log('🔍 Found evidence variables (case-insensitive):', foundVariables);
      }
    }
  }
}

// Export plugin instance
export const mysteryworksMurderboardPlugin = new MysteryworksMurderboardPlugin();
