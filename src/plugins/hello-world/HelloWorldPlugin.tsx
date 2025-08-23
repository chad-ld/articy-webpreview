/**
 * Hello World Plugin
 * A simple example plugin that demonstrates the plugin system
 */

import React from 'react';
import { Modal } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { IPlugin, PluginMetadata, PluginButtonConfig, PluginModalProps, PluginContext } from '../types';

export class HelloWorldPlugin implements IPlugin {
  metadata: PluginMetadata = {
    id: 'hello-world',
    name: 'Hello World',
    description: 'A simple test plugin that displays a Hello World message',
    version: '1.0.0',
    author: 'Articy Web Viewer',
    icon: 'api',
    enabled: false
  };

  private context?: PluginContext;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    console.log('🌍 Hello World Plugin initialized');
    
    // Show a welcome message when plugin is loaded
    context.showMessage('Hello World plugin loaded!', 'success');
    
    // Subscribe to dataset load events
    context.onEvent('dataset-loaded', this.onDatasetLoad.bind(this));
  }

  async destroy(): Promise<void> {
    console.log('🌍 Hello World Plugin destroyed');
    this.context = undefined;
  }

  getButtonConfig(): PluginButtonConfig {
    return {
      text: 'Hello World',
      icon: <ApiOutlined />,
      position: 1
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
            background: 'linear-gradient(45deg, #1890ff, #52c41a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Hello World! 🌍
          </div>

          <div style={{
            fontSize: '18px',
            color: '#666',
            marginBottom: '30px',
            maxWidth: '600px',
            lineHeight: '1.6'
          }}>
            Welcome to the Articy Web Viewer Plugin System! This is a demonstration of how plugins can be loaded dynamically and provide custom functionality.
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
    console.log('🌍 Hello World Plugin: Dataset loaded', data);
    if (this.context) {
      this.context.showMessage('Hello World plugin detected dataset load!', 'info');
    }
  }

  onNodeChange(node: any): void {
    console.log('🌍 Hello World Plugin: Node changed', node);
  }

  onVariableChange(variables: any): void {
    console.log('🌍 Hello World Plugin: Variables changed', variables);
  }
}

// Export plugin instance
export const helloWorldPlugin = new HelloWorldPlugin();
