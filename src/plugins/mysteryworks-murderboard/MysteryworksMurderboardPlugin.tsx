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

// Simple murderboard component - just center and shrink by 20%
const MurderboardCanvasWithResize: React.FC = () => {
  const layout = layoutData as LayoutRoot;

  // Simple 30% scale
  const scale = 0.30;

  console.log('Simple murderboard scaling:', {
    originalWidth: layout.size.width,
    originalHeight: layout.size.height,
    scale: scale
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

          // Reverse z-index so background (last element) has lowest z-index
          const zIndex = layout.children.length - 1 - index;

          console.log(`Loading image: ${fileName} from ${imagePath} (z-index: ${zIndex})`);

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
                border: '1px solid rgba(255,255,255,0.2)' // Debug border
              }}
              onLoad={() => {
                console.log(`Successfully loaded: ${fileName}`);
              }}
              onError={(e) => {
                console.warn(`Failed to load image: ${fileName} from ${imagePath}`);
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

  /**
   * Enable isolated rendering to prevent infinite re-render loops
   * on multiple choice nodes
   */
  useIsolatedRendering(): boolean {
    return true;
  }

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    console.log('🔍 Mysteryworks Murderboard Plugin initialized');

    // Show a welcome message when plugin is loaded
    context.showMessage('Mysteryworks Murderboard plugin loaded!', 'success');

    // Subscribe to dataset load events
    context.onEvent('dataset-loaded', this.onDatasetLoad.bind(this));
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
        <MurderboardCanvasWithResize />
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
  }
}

// Export plugin instance
export const mysteryworksMurderboardPlugin = new MysteryworksMurderboardPlugin();
