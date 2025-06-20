import React, { useState, useEffect } from 'react';
import { ConfigProvider, message } from 'antd';
import EnhancedFileInput from './components/EnhancedFileInput';
import InteractiveArticyViewer from './components/InteractiveArticyViewer';
import './App.css';

interface ProcessingReport {
  success: boolean;
  format: string;
  version: string;
  confidence: number;
  summary: {
    packages: number;
    totalModels: number;
    globalVariables: number;
    objectDefinitions: number;
  };
  nodeTypes: { [key: string]: number };
  features: {
    hasHierarchy: boolean;
    hasScriptMethods: boolean;
  };
  processingInfo: {
    timestamp: string;
    inputType: string;
  };
}

function App() {
  const [articyData, setArticyData] = useState<any>(null);
  const [processingReport, setProcessingReport] = useState<ProcessingReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [panelWidth, setPanelWidth] = useState(0);
  const [hideFooter, setHideFooter] = useState(false);

  useEffect(() => {
    // Log app startup
    console.log('%c[Articy Web Viewer v4.x] Starting application...', 
      'color: #1890ff; background: #f0f8ff; font-size: 16px; padding: 4px 8px; border-radius: 4px;');
    console.log('✅ Enhanced file input ready');
    console.log('✅ 3.x and 4.x format support enabled');
    console.log('✅ Automatic format detection active');
  }, []);

  const handleDataLoaded = (data: any, report: ProcessingReport) => {
    console.log('🎉 Data loaded successfully:', report);
    
    setArticyData(data);
    setProcessingReport(report);
    
    // Show success message with format info
    message.success({
      content: `Successfully loaded ${report.format} format data! (${report.summary.totalModels} models)`,
      duration: 4
    });
  };

  const handleReset = () => {
    setArticyData(null);
    setProcessingReport(null);
    setPanelWidth(0);
    console.log('🔄 Application reset - ready for new file');
  };

  // Calculate gradual margin for header responsiveness
  const calculateHeaderMargin = (panelWidth: number) => {
    if (panelWidth === 0) return 'auto';

    // Buffer zone: no shifting until panel is wider than 320px
    const bufferThreshold = 320;
    if (panelWidth <= bufferThreshold) return 'auto';

    // Gradual shifting: start with minimal shift, increase gradually
    const excessWidth = panelWidth - bufferThreshold;
    const gradualShift = Math.min(excessWidth * 0.8, panelWidth); // 80% of excess width, capped at panel width
    return `${gradualShift + 40}px`; // Add 40px buffer between panel and content
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <div className="app">
        {/* Header */}
        <header className="app-header">
          <div className="container" style={{
            marginLeft: articyData ? calculateHeaderMargin(panelWidth) : 'auto',
            transition: 'margin-left 0.3s ease'
          }}>
            <h1>Articy Web Viewer v4.x</h1>
            <p>Universal viewer for Articy Draft 3.x and 4.x JSON exports</p>

            {processingReport && (
              <div className="format-badge">
                <span className="format-label">Format:</span>
                <span className="format-value">{processingReport.format} v{processingReport.version}</span>
                <span className="confidence">({(processingReport.confidence * 100).toFixed(0)}% confidence)</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="app-main">
          <div className="container">
            {!articyData ? (
              /* File Upload Interface */
              <div className="upload-section">
                <EnhancedFileInput
                  onDataLoaded={handleDataLoaded}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
                
                {/* Feature Information */}
                <div className="features-info">
                  <h3 style={{ color: 'rgba(255, 255, 255, 0.7)' }}>What's New in v4.x</h3>
                  <div className="features-grid">
                    <div className="feature-card">
                      <h4>🔄 Universal Format Support</h4>
                      <p>Automatically detects and processes both Articy Draft 3.x and 4.x formats</p>
                    </div>
                    <div className="feature-card">
                      <h4>📁 Multiple Input Methods</h4>
                      <p>Single JSON files, multiple files, folder uploads, and drag & drop</p>
                    </div>
                    <div className="feature-card">
                      <h4>🚀 Enhanced Performance</h4>
                      <p>Optimized loading and processing with real-time progress feedback</p>
                    </div>
                    <div className="feature-card">
                      <h4>🔍 Smart Detection</h4>
                      <p>Intelligent format detection with 95%+ accuracy and detailed reporting</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Articy Viewer Interface */
              <div className="viewer-section">
                <InteractiveArticyViewer
                  data={articyData}
                  onReset={handleReset}
                  onPanelWidthChange={setPanelWidth}
                  onLoadScreen={handleReset}
                  onHideFooterChange={setHideFooter}
                />
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        {!hideFooter && (
          <footer className="app-footer">
            <div className="container" style={{
              marginLeft: articyData ? calculateHeaderMargin(panelWidth) : 'auto',
              transition: 'margin-left 0.3s ease'
            }}>
              <div className="footer-content">
                <div className="footer-info">
                  <p>Articy Web Viewer v4.x - Universal JSON Viewer</p>
                  <p>Supports Articy Draft 3.x and 4.x formats</p>
                  {processingReport && (
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px' }}>
                      Processed: {new Date(processingReport.processingInfo.timestamp).toLocaleString()} |
                      Input: {processingReport.processingInfo.inputType} |
                      Features: {processingReport.features.hasHierarchy ? 'Hierarchy' : ''} {processingReport.features.hasScriptMethods ? 'Scripts' : ''}
                    </p>
                  )}
                </div>
                <div className="footer-stats">
                  {processingReport && (
                    <>
                      <span>📦 {processingReport.summary.packages} packages</span>
                      <span>🎯 {processingReport.summary.totalModels} models</span>
                      <span>🔧 {processingReport.summary.globalVariables} variables</span>
                      <span>📋 {Object.keys(processingReport.nodeTypes).length} node types</span>
                      <span>🏗️ {processingReport.summary.objectDefinitions} object definitions</span>
                      <span>⚙️ {processingReport.format} v{processingReport.version}</span>
                      <span>📊 {(processingReport.confidence * 100).toFixed(0)}% confidence</span>
                      {/* Show top 3 node types */}
                      {Object.entries(processingReport.nodeTypes)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 3)
                        .map(([type, count]) => (
                          <span key={type} style={{ fontSize: '11px', opacity: 0.8 }}>
                            {type}: {count}
                          </span>
                        ))
                      }
                    </>
                  )}
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>
    </ConfigProvider>
  );
}

export default App;
