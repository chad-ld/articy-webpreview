/**
 * Mysteryworks Murderboard Plugin
 * A plugin for displaying and managing murder mystery investigation boards
 */

import React from 'react';
import { Modal } from 'antd';
import { FileSearchOutlined } from '@ant-design/icons';
import { IPlugin, PluginMetadata, PluginButtonConfig, PluginModalProps, PluginContext } from '../types';

export class MysteryworksMurderboardPlugin implements IPlugin {
  metadata: PluginMetadata = {
    id: 'mysteryworks-murderboard',
    name: 'Mysteryworks Murderboard',
    description: 'Interactive murder mystery investigation board for tracking suspects, evidence, and connections',
    version: '1.0.0',
    author: 'Mysteryworks',
    icon: 'file-search',
    enabled: false
  };

  private context?: PluginContext;

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
    return (
      <Modal
        title={props.title || this.metadata.name}
        open={props.isVisible}
        onCancel={props.onClose}
        footer={null}
        width={props.width || 1280}
        style={{ top: 20 }}
        bodyStyle={{
          height: props.height || 720,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '20px',
            background: 'linear-gradient(45deg, #8B0000, #DC143C)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Mysteryworks Murderboard 🔍
          </div>

          <div style={{
            fontSize: '18px',
            color: '#666',
            marginBottom: '30px',
            maxWidth: '600px',
            lineHeight: '1.6'
          }}>
            Interactive investigation board for tracking suspects, evidence, and connections in your murder mystery. Organize clues and build your case as the story unfolds.
          </div>

          {this.context?.project && (
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#1890ff' }}>Current Project Info</h3>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Project Name:</strong> {this.context.project.Name || 'Unknown'}
              </p>
              {this.context.currentNode && (
                <p style={{ margin: '5px 0', color: '#666' }}>
                  <strong>Current Node:</strong> {this.context.currentNode.Properties?.DisplayName || this.context.currentNode.Properties?.Id || 'Unknown'}
                </p>
              )}
            </div>
          )}

          <div style={{
            fontSize: '14px',
            color: '#999',
            fontStyle: 'italic'
          }}>
            Plugin Version: {this.metadata.version} | Author: {this.metadata.author}
          </div>
        </div>
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
