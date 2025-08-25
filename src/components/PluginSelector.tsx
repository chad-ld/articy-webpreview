/**
 * Plugin Selector Component
 * Displays available plugins on the loading screen for user selection
 */

import React, { useState, useEffect } from 'react';
import { Card, Checkbox, Collapse, Badge, Tooltip, Space, Tag } from 'antd';
import { ApiOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PluginMetadata } from '../plugins/types';
import { pluginRegistry } from '../plugins/registry';
import { pluginDiscoveryService } from '../plugins/discovery';
import { configService } from '../services/configService';

const { Panel } = Collapse;

interface PluginSelectorProps {
  onPluginToggle?: (pluginId: string, enabled: boolean) => void;
}

interface ExtendedPluginMetadata extends PluginMetadata {
  isDefault?: boolean; // Indicates if this plugin is enabled by default in config
}

const PluginSelector: React.FC<PluginSelectorProps> = ({ onPluginToggle }) => {
  const [plugins, setPlugins] = useState<ExtendedPluginMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [defaultPlugins, setDefaultPlugins] = useState<string[]>([]);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    setLoading(true);

    try {
      // First, discover all available plugins (supports both bundled and dynamic)
      await pluginDiscoveryService.discoverPlugins();

      // Get all discovered plugins (not just registered ones)
      const discoveredPlugins = pluginDiscoveryService.getDiscoveredPlugins();

      console.log(`🔌 Plugin Selector: Found ${discoveredPlugins.length} available plugins`);

      // Load default plugins from config
      let configDefaultPlugins: string[] = [];
      try {
        const config = await configService.loadConfig();
        configDefaultPlugins = config.plugins.defaultEnabled;
        setDefaultPlugins(configDefaultPlugins);
        console.log('🔌 Plugin Selector: Config default plugins:', configDefaultPlugins);
      } catch (error) {
        console.error('Failed to load config for plugin selector:', error);
      }

      // Convert to metadata format and check enabled state from localStorage
      const savedState = localStorage.getItem('articy-plugin-state');
      let enabledPluginIds: string[] = [];

      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          enabledPluginIds = Object.entries(state)
            .filter(([_, config]: [string, any]) => config.enabled)
            .map(([pluginId, _]) => pluginId);
          console.log('🔌 Plugin Selector: Enabled plugins from localStorage:', enabledPluginIds);
        } catch (error) {
          console.error('Failed to parse plugin state:', error);
        }
      } else {
        console.log('🔌 Plugin Selector: No saved state found, will use config defaults');
      }

      const availablePlugins = discoveredPlugins.map(plugin => {
        const enabled = enabledPluginIds.includes(plugin.metadata.id);
        const isDefault = configDefaultPlugins.includes(plugin.metadata.id);
        console.log(`🔌 Plugin ${plugin.metadata.name}: ${enabled ? 'enabled' : 'disabled'}${isDefault ? ' (default)' : ''}`);

        return {
          ...plugin.metadata,
          enabled,
          isDefault
        };
      });

      setPlugins(availablePlugins);

    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePluginToggle = async (pluginId: string, enabled: boolean) => {
    setLoading(true);

    try {
      // Get the discovered plugin
      const discoveredPlugin = pluginDiscoveryService.getPlugin(pluginId);

      if (!discoveredPlugin) {
        console.error(`Plugin ${pluginId} not found in discovered plugins`);
        return;
      }

      // Update plugin registry state
      if (enabled) {
        // Register the plugin when enabled
        pluginRegistry.register(discoveredPlugin);
        pluginRegistry.enablePlugin(pluginId);
      } else {
        // Unregister the plugin when disabled
        pluginRegistry.disablePlugin(pluginId);
        pluginRegistry.unregister(pluginId);
      }

      // Save state to localStorage
      const state = pluginRegistry.getPluginState();
      localStorage.setItem('articy-plugin-state', JSON.stringify(state));

      // Update local state
      setPlugins(prev => prev.map(plugin =>
        plugin.id === pluginId
          ? { ...plugin, enabled }
          : plugin
      ));

      // Notify parent component
      onPluginToggle?.(pluginId, enabled);

    } catch (error) {
      console.error('Failed to toggle plugin:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPluginIcon = (iconName?: string) => {
    switch (iconName) {
      case 'api':
        return <ApiOutlined />;
      case 'setting':
        return <SettingOutlined />;
      default:
        return <ApiOutlined />;
    }
  };

  const enabledCount = plugins.filter(p => p.enabled).length;

  if (plugins.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <Collapse
        ghost
        expandIconPosition="end"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #d9d9d9',
          borderRadius: '6px'
        }}
      >
        <Panel
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ApiOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: '500' }}>Configure Plugins</span>
              <Badge 
                count={enabledCount} 
                style={{ 
                  backgroundColor: enabledCount > 0 ? '#52c41a' : '#d9d9d9',
                  color: enabledCount > 0 ? '#fff' : '#666'
                }} 
              />
              <Tooltip title="Select which plugins to load with your dataset">
                <InfoCircleOutlined style={{ color: '#999', fontSize: '14px' }} />
              </Tooltip>
            </div>
          }
          key="plugins"
        >
          <div style={{
            padding: '15px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '6px'
          }}>
            <p style={{
              margin: '0 0 15px 0',
              color: '#666',
              fontSize: '14px'
            }}>
              Choose which plugins to enable for this session. Plugins provide additional functionality and can be toggled on or off.
            </p>
            
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {plugins.map(plugin => (
                <Card
                  key={plugin.id}
                  size="small"
                  style={{
                    backgroundColor: plugin.enabled ? '#f6ffed' : '#ffffff',
                    border: plugin.enabled ? '1px solid #b7eb8f' : '1px solid #000000',
                    borderRadius: '6px'
                  }}
                  bodyStyle={{ padding: '12px 16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Checkbox
                      checked={plugin.enabled}
                      onChange={(e) => handlePluginToggle(plugin.id, e.target.checked)}
                      disabled={loading}
                      style={{ marginTop: '2px' }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {getPluginIcon(plugin.icon)}
                        <span style={{
                          fontWeight: '500',
                          fontSize: '14px',
                          color: plugin.enabled ? '#389e0d' : '#262626'
                        }}>
                          {plugin.name}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: '#999',
                          backgroundColor: '#f0f0f0',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          v{plugin.version}
                        </span>
                        {plugin.isDefault && (
                          <Tag
                            color="blue"
                            size="small"
                            style={{
                              fontSize: '11px',
                              margin: 0,
                              padding: '1px 6px',
                              lineHeight: '16px'
                            }}
                          >
                            Default
                          </Tag>
                        )}
                      </div>
                      
                      <p style={{ 
                        margin: '0', 
                        fontSize: '13px', 
                        color: '#666',
                        lineHeight: '1.4'
                      }}>
                        {plugin.description}
                      </p>
                      
                      {plugin.author && (
                        <p style={{ 
                          margin: '4px 0 0 0', 
                          fontSize: '12px', 
                          color: '#999',
                          fontStyle: 'italic'
                        }}>
                          by {plugin.author}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </Space>
            
            {enabledCount > 0 && (
              <div style={{
                marginTop: '15px',
                padding: '8px 12px',
                backgroundColor: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#0050b3'
              }}>
                ✓ {enabledCount} plugin{enabledCount !== 1 ? 's' : ''} will be loaded with your dataset
              </div>
            )}
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

export default PluginSelector;
