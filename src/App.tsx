import { useState, useEffect } from 'react';
import { ConfigProvider, message, Spin } from 'antd';
import InteractiveArticyViewer from './components/InteractiveArticyViewer';
// @ts-ignore
import DataRouter from './utils/dataRouter';
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
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [panelWidth, setPanelWidth] = useState(0);
  const [hideFooter, setHideFooter] = useState(false);

  const loadMposData = async () => {
    setIsLoading(true);

    try {
      console.log('🔄 Loading hardcoded MPOS dataset...');

      // List of JSON files to load (customize for your dataset)
      const mposFiles = [
        'global_variables.json',
        'hierarchy.json',
        'manifest.json',
        'object_definitions.json',
        'object_definitions_localization.json',
        'package_010000060000401C_localization.json',
        'package_010000060000401C_objects.json',
        'script_methods.json'
      ];

      // Load all files with cache-busting
      const fileContents: { [key: string]: string } = {};

      // Add cache-busting timestamp to ensure fresh data loads
      const cacheBuster = Date.now();

      for (const fileName of mposFiles) {
        try {
          const response = await fetch(`./mpos.json/${fileName}?v=${cacheBuster}`);
          if (response.ok) {
            const content = await response.text();
            fileContents[fileName] = content;
            console.log(`✅ Loaded ${fileName} (cache-busted)`);
          } else {
            console.warn(`⚠️ Could not load ${fileName}: ${response.status}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error loading ${fileName}:`, error);
        }
      }

      // Process the loaded files using DataRouter
      if (Object.keys(fileContents).length > 0) {
        const dataRouter = new DataRouter();
        dataRouter.setDebugMode(true);

        const processedData = await dataRouter.processData(fileContents);
        const report = dataRouter.createProcessingReport(processedData);

        // Update report to indicate hardcoded loading
        report.processingInfo.inputType = 'Hardcoded MPOS dataset';

        handleDataLoaded(processedData, report);

        console.log('🎉 MPOS dataset loaded successfully!');
      } else {
        throw new Error('No MPOS files could be loaded');
      }

    } catch (error: any) {
      console.error('❌ Failed to load MPOS dataset:', error);
      message.error(`Failed to load MPOS dataset: ${error?.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Log app startup
    console.log('%c[Articy Web Viewer v4.x - MPOS Hardcoded] Starting application...',
      'color: #1890ff; background: #f0f8ff; font-size: 16px; padding: 4px 8px; border-radius: 4px;');
    console.log('✅ Hardcoded MPOS dataset loading enabled');
    console.log('✅ 4.x format support enabled');
    console.log('✅ Automatic format detection active');

    // Auto-load mpos.json data
    loadMposData();
  }, []);

  const handleDataLoaded = (data: any, report: ProcessingReport) => {
    console.log('🎉 Data loaded successfully:', report);

    setArticyData(data);
    setProcessingReport(report);
    setIsLoading(false); // Add this line

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
            <h1>Articy Web Viewer v4.x - MPOS Edition</h1>
            <p>Hardcoded viewer for MPOS dataset (4.x format)</p>

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
              /* Loading Screen */
              <div className="upload-section" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Spin size="large" spinning={isLoading} />
                <h2 style={{ marginTop: '20px', color: '#1890ff' }}>
                  {isLoading ? 'Loading MPOS Dataset...' : 'MPOS Dataset Ready'}
                </h2>
                <p style={{ color: '#666', fontSize: '16px' }}>
                  {isLoading ? 'Automatically loading hardcoded MPOS data from 4.x format files' : 'Dataset loaded successfully'}
                </p>

                {/* Update feature cards to reflect hardcoded nature */}
                <div className="features-info" style={{ marginTop: '40px' }}>
                  <h3 style={{ color: 'rgba(255, 255, 255, 0.7)' }}>MPOS Edition Features</h3>
                  <div className="features-grid">
                    <div className="feature-card">
                      <h4>🎯 Hardcoded Dataset</h4>
                      <p>Pre-configured to load MPOS data automatically on startup</p>
                    </div>
                    <div className="feature-card">
                      <h4>🚀 Instant Loading</h4>
                      <p>No file selection needed - data loads immediately</p>
                    </div>
                    <div className="feature-card">
                      <h4>📊 4.x Format</h4>
                      <p>Optimized for Articy Draft 4.x multi-file format</p>
                    </div>
                    <div className="feature-card">
                      <h4>🌐 Web Ready</h4>
                      <p>Perfect for web deployment with embedded dataset</p>
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
