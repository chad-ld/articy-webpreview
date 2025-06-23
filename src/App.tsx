import { useState, useEffect } from 'react';
import { ConfigProvider, message, Spin, Select, Button, Divider } from 'antd';
import InteractiveArticyViewer from './components/InteractiveArticyViewer';
import EnhancedFileInput from './components/EnhancedFileInput';
// @ts-ignore
import DataRouter from './utils/dataRouter';
import './App.css';

const { Option } = Select;

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

interface Dataset {
  name: string;
  folder: string;
  displayName: string;
  description?: string;
}

function App() {
  const [articyData, setArticyData] = useState<any>(null);
  const [processingReport, setProcessingReport] = useState<ProcessingReport | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [panelWidth, setPanelWidth] = useState(0);
  const [hideFooter, setHideFooter] = useState(false);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [showDatasetSelection, setShowDatasetSelection] = useState(false);
  const [dataSource, setDataSource] = useState<'hardcoded' | 'manual' | null>(null);

  // Auto-detect available datasets
  const detectAvailableDatasets = async (): Promise<Dataset[]> => {
    // Comprehensive list of possible dataset names
    const possibleDatasets = [
      // Common names
      'mpos', 'demo', 'demo4', 'test', 'latest', 'current', 'main',
      // Project names
      'project-alpha', 'project-beta', 'project-gamma', 'project-delta',
      // Environment names
      'dev', 'staging', 'prod', 'qa', 'development', 'production',
      // Version names
      'v1', 'v2', 'v3', 'v4', 'v5',
      // Date-based (current year)
      '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
      '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
      // Common project names
      'sample', 'example', 'tutorial', 'guide', 'template',
      // Game-specific
      'chapter1', 'chapter2', 'chapter3', 'prologue', 'epilogue',
      'act1', 'act2', 'act3', 'scene1', 'scene2'
    ];

    const available: Dataset[] = [];
    console.log('🔍 Detecting available datasets...');

    for (const name of possibleDatasets) {
      try {
        // Test if manifest.json exists in the dataset folder
        const response = await fetch(`./${name}.json/manifest.json`);
        if (response.ok) {
          const manifest = await response.json();

          available.push({
            name,
            folder: `${name}.json`,
            displayName: manifest.Project?.Name || name.charAt(0).toUpperCase() + name.slice(1),
            description: manifest.Project?.DetailName || `${name} dataset`
          });

          console.log(`✅ Found dataset: ${name}`);
        }
      } catch (error) {
        // Dataset doesn't exist or manifest is invalid, skip silently
      }
    }

    console.log(`🎯 Detected ${available.length} available datasets`);
    return available;
  };

  const loadDataset = async (datasetName: string) => {
    setIsLoading(true);

    try {
      console.log(`🔄 Loading ${datasetName} dataset...`);

      // List of JSON files to load
      const datasetFiles = [
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
      const cacheBuster = Date.now();

      for (const fileName of datasetFiles) {
        try {
          const response = await fetch(`./${datasetName}.json/${fileName}?v=${cacheBuster}`);
          if (response.ok) {
            const content = await response.text();
            fileContents[fileName] = content;
            console.log(`✅ Loaded ${fileName} from ${datasetName} (cache-busted)`);
          } else {
            console.warn(`⚠️ Could not load ${fileName} from ${datasetName}: ${response.status}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error loading ${fileName} from ${datasetName}:`, error);
        }
      }

      // Process the loaded files using DataRouter
      if (Object.keys(fileContents).length > 0) {
        const dataRouter = new DataRouter();
        dataRouter.setDebugMode(true);

        const processedData = await dataRouter.processData(fileContents);
        const report = dataRouter.createProcessingReport(processedData);

        // Update report to indicate dataset source
        report.processingInfo.inputType = `Hardcoded ${datasetName} dataset`;

        setDataSource('hardcoded');
        handleDataLoaded(processedData, report);

        console.log(`🎉 ${datasetName} dataset loaded successfully!`);
      } else {
        throw new Error(`No files could be loaded from ${datasetName} dataset`);
      }

    } catch (error: any) {
      console.error(`❌ Failed to load ${datasetName} dataset:`, error);
      message.error(`Failed to load ${datasetName} dataset: ${error?.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Log app startup
    console.log('%c[Articy Web Viewer v4.x - Hybrid Edition] Starting application...',
      'color: #1890ff; background: #f0f8ff; font-size: 16px; padding: 4px 8px; border-radius: 4px;');
    console.log('✅ Auto-detection enabled');
    console.log('✅ 4.x format support enabled');
    console.log('✅ Drag-and-drop functionality enabled');

    // Initialize app with dataset detection
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);

    try {
      // Detect available datasets
      const datasets = await detectAvailableDatasets();
      setAvailableDatasets(datasets);

      // Check URL parameter for specific dataset auto-load
      const urlParams = new URLSearchParams(window.location.search);
      const requestedDataset = urlParams.get('dataset');

      if (requestedDataset && datasets.find(d => d.name === requestedDataset)) {
        // Auto-load specific dataset if requested via URL
        console.log(`🎯 Auto-loading requested dataset: ${requestedDataset}`);
        setSelectedDataset(requestedDataset);
        await loadDataset(requestedDataset);
      } else {
        // Always show selection interface first (unless specific dataset requested)
        console.log(`📁 Showing dataset selection interface (${datasets.length} datasets detected)`);
        if (datasets.length > 0) {
          setSelectedDataset(datasets[0].name); // Pre-select first dataset
        }
        setShowDatasetSelection(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      setShowDatasetSelection(true);
      setIsLoading(false);
    }
  };

  const handleDataLoaded = (data: any, report: ProcessingReport) => {
    console.log('🎉 Data loaded successfully:', report);

    setArticyData(data);
    setProcessingReport(report);
    setIsLoading(false);
    setShowDatasetSelection(false);

    // Show success message with format info
    message.success({
      content: `Successfully loaded ${report.format} format data! (${report.summary.totalModels} models)`,
      duration: 4
    });
  };

  const handleManualDataLoaded = (data: any, report: ProcessingReport) => {
    // Update report to indicate manual upload
    report.processingInfo.inputType = 'Manual file upload';
    setDataSource('manual');
    handleDataLoaded(data, report);
  };

  const handleReset = () => {
    setArticyData(null);
    setProcessingReport(null);
    setPanelWidth(0);
    setDataSource(null);
    setShowDatasetSelection(true);
    setIsLoading(false);
    console.log('🔄 Application reset - ready for dataset selection');
  };

  const handleDatasetSwitch = async (datasetName: string) => {
    setSelectedDataset(datasetName);
    setArticyData(null);
    setProcessingReport(null);

    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('dataset', datasetName);
    window.history.pushState({}, '', url);

    await loadDataset(datasetName);
  };

  const handleSwitchToManual = () => {
    setArticyData(null);
    setProcessingReport(null);
    setDataSource(null);
    setShowDatasetSelection(true);
    setIsLoading(false);
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
            <h1>Articy Web Viewer v4.x - Hybrid Edition</h1>
            <p>Auto-detection + drag-and-drop viewer for Articy Draft datasets</p>

            {processingReport && (
              <div className="format-badge">
                <span className="format-label">Format:</span>
                <span className="format-value">{processingReport.format} v{processingReport.version}</span>
                <span className="confidence">({(processingReport.confidence * 100).toFixed(0)}% confidence)</span>
                {dataSource && (
                  <>
                    <span style={{ margin: '0 8px', color: '#666' }}>|</span>
                    <span className="source-label">Source:</span>
                    <span className="source-value">
                      {dataSource === 'hardcoded' ? `${selectedDataset} dataset` : 'Manual upload'}
                    </span>
                    {dataSource === 'hardcoded' && availableDatasets.length > 1 && (
                      <Button
                        size="small"
                        style={{ marginLeft: '8px' }}
                        onClick={handleSwitchToManual}
                      >
                        Switch Dataset
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="app-main">
          <div className="container">
            {!articyData ? (
              isLoading ? (
                /* Loading Screen */
                <div className="upload-section" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Spin size="large" />
                  <h2 style={{ marginTop: '20px', color: '#1890ff' }}>
                    {selectedDataset ? `Loading ${selectedDataset} Dataset...` : 'Detecting Available Datasets...'}
                  </h2>
                  <p style={{ color: '#666', fontSize: '16px' }}>
                    {selectedDataset ? `Loading ${selectedDataset} data from 4.x format files` : 'Scanning for available datasets...'}
                  </p>
                </div>
              ) : showDatasetSelection ? (
                /* Dataset Selection Interface */
                <div className="upload-section" style={{ padding: '40px 20px' }}>
                  <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', color: '#1890ff', marginBottom: '30px' }}>
                      Select Dataset or Upload Files
                    </h2>

                    {availableDatasets.length > 0 && (
                      <>
                        <div style={{ marginBottom: '30px' }}>
                          <h3 style={{ marginBottom: '16px' }}>📁 Available Datasets</h3>
                          <Select
                            value={selectedDataset}
                            onChange={setSelectedDataset}
                            style={{ width: '100%', marginBottom: '16px' }}
                            size="large"
                            placeholder="Select a dataset to load"
                          >
                            {availableDatasets.map(dataset => (
                              <Option key={dataset.name} value={dataset.name}>
                                <div>
                                  <strong>{dataset.displayName}</strong>
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    {dataset.description}
                                  </div>
                                </div>
                              </Option>
                            ))}
                          </Select>
                          <Button
                            type="primary"
                            size="large"
                            block
                            disabled={!selectedDataset}
                            onClick={() => selectedDataset && handleDatasetSwitch(selectedDataset)}
                          >
                            Load {availableDatasets.find(d => d.name === selectedDataset)?.displayName || 'Selected Dataset'}
                          </Button>
                        </div>

                        <Divider>OR</Divider>
                      </>
                    )}

                    <div>
                      <h3 style={{ marginBottom: '16px' }}>📤 Upload Custom Files</h3>
                      <EnhancedFileInput
                        onDataLoaded={handleManualDataLoaded}
                        isLoading={false}
                        setIsLoading={setIsLoading}
                      />
                    </div>

                    {/* Feature Information */}
                    <div className="features-info" style={{ marginTop: '40px' }}>
                      <h3 style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Hybrid Edition Features</h3>
                      <div className="features-grid">
                        <div className="feature-card">
                          <h4>🔍 Auto-Detection</h4>
                          <p>Automatically finds and lists available datasets</p>
                        </div>
                        <div className="feature-card">
                          <h4>📁 Multiple Datasets</h4>
                          <p>Switch between different embedded datasets easily</p>
                        </div>
                        <div className="feature-card">
                          <h4>📤 Drag & Drop</h4>
                          <p>Upload custom files when needed</p>
                        </div>
                        <div className="feature-card">
                          <h4>🔄 Universal Format</h4>
                          <p>Supports both 3.x and 4.x Articy Draft formats</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null
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
