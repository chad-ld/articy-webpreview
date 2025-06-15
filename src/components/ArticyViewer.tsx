import React, { useState } from 'react';
import { Button, Card, Descriptions, Tabs, Table, Tag, Space, Statistic, Row, Col } from 'antd';
import { 
  ReloadOutlined, 
  InfoCircleOutlined, 
  DatabaseOutlined, 
  NodeIndexOutlined,
  SettingOutlined,
  FileTextOutlined
} from '@ant-design/icons';

interface ArticyViewerProps {
  data: any;
  report: any;
  onReset: () => void;
}

const ArticyViewer: React.FC<ArticyViewerProps> = ({ data, report, onReset }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Get first package for display
  const firstPackage = data.Packages?.[0];
  const firstModels = firstPackage?.Models?.slice(0, 10) || [];

  // Get global variables for display
  const globalVariables = data.GlobalVariables || [];
  const firstVariables = globalVariables.flatMap(ns => 
    (ns.Variables || []).slice(0, 5).map(v => ({ ...v, namespace: ns.Namespace }))
  ).slice(0, 10);

  // Node type statistics
  const nodeTypeStats = Object.entries(report.nodeTypes || {})
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10);

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <InfoCircleOutlined />
          Overview
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Format"
                  value={`${report.format} v${report.version}`}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Models"
                  value={report.summary.totalModels}
                  prefix={<NodeIndexOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Global Variables"
                  value={report.summary.globalVariables}
                  prefix={<SettingOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Node Types"
                  value={Object.keys(report.nodeTypes).length}
                  prefix={<DatabaseOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Project Information" style={{ marginBottom: 16 }}>
            <Descriptions column={2}>
              <Descriptions.Item label="Project Name">
                {data.Project?.Name || 'Unknown'}
              </Descriptions.Item>
              <Descriptions.Item label="Export Version">
                {data.Settings?.ExportVersion || 'Unknown'}
              </Descriptions.Item>
              <Descriptions.Item label="Processing Time">
                {new Date(report.processingInfo.timestamp).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Input Type">
                {report.processingInfo.inputType}
              </Descriptions.Item>
              <Descriptions.Item label="Confidence">
                <Tag color={report.confidence > 0.9 ? 'green' : 'orange'}>
                  {(report.confidence * 100).toFixed(1)}%
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Script Support">
                {data.Settings?.set_UseScriptSupport || 'Unknown'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Node Type Distribution">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {nodeTypeStats.map(([type, count]) => (
                <Tag key={type} color="blue">
                  {type}: {count}
                </Tag>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'models',
      label: (
        <span>
          <NodeIndexOutlined />
          Models ({report.summary.totalModels})
        </span>
      ),
      children: (
        <div>
          <Card title={`Sample Models from "${firstPackage?.Name}"`}>
            <Table
              dataSource={firstModels}
              rowKey={(record) => record.Properties?.Id || Math.random()}
              pagination={{ pageSize: 5 }}
              size="small"
              columns={[
                {
                  title: 'Type',
                  dataIndex: 'Type',
                  key: 'type',
                  render: (type) => <Tag color="blue">{type}</Tag>,
                },
                {
                  title: 'ID',
                  dataIndex: ['Properties', 'Id'],
                  key: 'id',
                  render: (id) => <code style={{ fontSize: '11px' }}>{id}</code>,
                },
                {
                  title: 'Display Name',
                  dataIndex: ['Properties', 'DisplayName'],
                  key: 'displayName',
                  ellipsis: true,
                },
                {
                  title: 'Technical Name',
                  dataIndex: ['Properties', 'TechnicalName'],
                  key: 'technicalName',
                  ellipsis: true,
                },
                {
                  title: 'Text Preview',
                  dataIndex: ['Properties', 'Text'],
                  key: 'text',
                  ellipsis: true,
                  render: (text) => text ? (
                    <span style={{ color: '#666' }}>
                      {text.length > 50 ? text.substring(0, 50) + '...' : text}
                    </span>
                  ) : '-',
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'variables',
      label: (
        <span>
          <SettingOutlined />
          Variables ({report.summary.globalVariables})
        </span>
      ),
      children: (
        <div>
          <Card title="Global Variables">
            <Table
              dataSource={firstVariables}
              rowKey={(record) => `${record.namespace}.${record.Variable}`}
              pagination={{ pageSize: 10 }}
              size="small"
              columns={[
                {
                  title: 'Namespace',
                  dataIndex: 'namespace',
                  key: 'namespace',
                  render: (namespace) => <Tag color="green">{namespace}</Tag>,
                },
                {
                  title: 'Variable',
                  dataIndex: 'Variable',
                  key: 'variable',
                  render: (variable) => <code style={{ color: '#1890ff' }}>{variable}</code>,
                },
                {
                  title: 'Type',
                  dataIndex: 'Type',
                  key: 'type',
                  render: (type) => <Tag>{type}</Tag>,
                },
                {
                  title: 'Value',
                  dataIndex: 'Value',
                  key: 'value',
                  render: (value, record) => {
                    if (record.Type === 'Boolean') {
                      return <Tag color={value === 'True' ? 'green' : 'red'}>{value}</Tag>;
                    }
                    return <span style={{ color: '#666' }}>{value}</span>;
                  },
                },
                {
                  title: 'Description',
                  dataIndex: 'Description',
                  key: 'description',
                  ellipsis: true,
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'raw',
      label: (
        <span>
          <DatabaseOutlined />
          Raw Data
        </span>
      ),
      children: (
        <div>
          <Card title="Raw JSON Data" extra={
            <Button 
              size="small" 
              onClick={() => {
                const jsonStr = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `articy-data-${report.format}-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download JSON
            </Button>
          }>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              fontSize: '12px',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {JSON.stringify(data, null, 2).substring(0, 2000)}
              {JSON.stringify(data, null, 2).length > 2000 && '\n... (truncated)'}
            </pre>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#1890ff' }}>
            {data.Project?.Name || 'Articy Project'}
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            Loaded {report.format} format • {report.summary.totalModels} models • {Object.keys(report.nodeTypes).length} node types
          </p>
        </div>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={onReset}
            type="default"
          >
            Load New File
          </Button>
        </Space>
      </div>

      {/* Content Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default ArticyViewer;
