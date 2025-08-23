/**
 * Test Plugin
 * A simple test plugin to demonstrate auto-discovery
 */

import React from 'react';
import { Modal } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import { IPlugin, PluginMetadata, PluginButtonConfig, PluginModalProps, PluginContext } from '../types';

export class TestPlugin implements IPlugin {
  metadata: PluginMetadata = {
    id: 'test-plugin',
    name: 'Test Plugin',
    description: 'A simple test plugin to demonstrate auto-discovery functionality',
    version: '1.0.0',
    author: 'Auto-Discovery System',
    icon: 'experiment',
    enabled: false
  };

  private context?: PluginContext;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    console.log('🧪 Test Plugin initialized via auto-discovery!');
    
    // Show a welcome message when plugin is loaded
    context.showMessage('Test plugin auto-discovered and loaded!', 'success');
  }

  async destroy(): Promise<void> {
    console.log('🧪 Test Plugin destroyed');
    this.context = undefined;
  }

  getButtonConfig(): PluginButtonConfig {
    return {
      text: 'Test Plugin',
      icon: <ExperimentOutlined />,
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
        width={props.width || 800}
        style={{ top: 20 }}
        bodyStyle={{ 
          height: props.height || 500, 
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
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: '20px',
            background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🧪 Test Plugin
          </div>
          
          <div style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '20px',
            maxWidth: '500px',
            lineHeight: '1.6'
          }}>
            This plugin was automatically discovered and loaded by the plugin system! 
            No manual registration required.
          </div>

          <div style={{
            backgroundColor: '#fff7e6',
            border: '1px solid #ffd591',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#fa8c16' }}>Auto-Discovery Features:</h4>
            <ul style={{ margin: '0', paddingLeft: '20px', textAlign: 'left', color: '#666' }}>
              <li>Automatic plugin folder scanning</li>
              <li>Dynamic plugin import and registration</li>
              <li>No manual code changes required</li>
              <li>Drop-in plugin support</li>
            </ul>
          </div>

          <div style={{
            fontSize: '14px',
            color: '#999',
            fontStyle: 'italic'
          }}>
            Plugin ID: {this.metadata.id} | Version: {this.metadata.version}
          </div>
        </div>
      </Modal>
    );
  }

  // Optional event handlers
  onDatasetLoad(data: any): void {
    console.log('🧪 Test Plugin: Dataset loaded', data);
  }

  onNodeChange(node: any): void {
    console.log('🧪 Test Plugin: Node changed', node);
  }

  onVariableChange(variables: any): void {
    console.log('🧪 Test Plugin: Variables changed', variables);
  }
}

// Export plugin instance
export const testPlugin = new TestPlugin();
