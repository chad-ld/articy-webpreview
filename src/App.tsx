import { useState, useEffect, useMemo } from 'react';
import { ConfigProvider, message, Spin, Select, Button, Divider, Tooltip } from 'antd';
import { SortAscendingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import InteractiveArticyViewer from './components/InteractiveArticyViewer';
import EnhancedFileInput from './components/EnhancedFileInput';
// @ts-ignore
import DataRouter from './utils/dataRouter';
// @ts-ignore
import HybridDatasetDetector from './utils/hybridDatasetDetector';
// @ts-ignore
import DatasetDisplayFormatter from './utils/datasetDisplayFormatter';
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
  folder?: string; // For 4.x format (folder structure)
  file?: string; // For 3.x format (single file)
  displayName: string;
  description?: string;
  lastModified?: number;
  lastModifiedFormatted?: string;
  articyVersion?: string; // e.g., "3.x v1.0", "4.x v2.1"
  format?: string; // "3.x" or "4.x"
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
  const [detectionMethod, setDetectionMethod] = useState<string>('detecting...');
  const [sortMode, setSortMode] = useState<'alphabetical' | 'date'>('date');

  // Initialize hybrid dataset detector and display formatter
  const hybridDetector = new HybridDatasetDetector();
  hybridDetector.setDebugMode(true);

  const displayFormatter = new DatasetDisplayFormatter();
  displayFormatter.setDebugMode(true);

  // Get sorted datasets for display using useMemo to ensure recalculation when dependencies change
  const sortedDatasets = useMemo(() => {
    // Only sort if we have actual datasets
    if (!availableDatasets || availableDatasets.length === 0) {
      console.log('🔄 No datasets available for sorting yet');
      return [];
    }

    console.log(`🔄 Sorting ${availableDatasets.length} datasets in ${sortMode} mode:`, availableDatasets.map(d => ({
      name: d.name,
      displayName: d.displayName,
      lastModified: d.lastModified,
      lastModifiedFormatted: d.lastModifiedFormatted
    })));

    const sorted = [...availableDatasets].sort((a, b) => {
      if (sortMode === 'date') {
        // Sort by newest file first (descending)
        const timeA = a.lastModified || 0;
        const timeB = b.lastModified || 0;
        console.log(`📅 Comparing ${a.name} (${timeA}) vs ${b.name} (${timeB}) = ${timeB - timeA}`);
        return timeB - timeA;
      } else {
        // Sort alphabetically by display name
        const result = a.displayName.localeCompare(b.displayName);
        console.log(`🔤 Comparing "${a.displayName}" vs "${b.displayName}" = ${result}`);
        return result;
      }
    });

    console.log(`✅ Sorted result:`, sorted.map(d => `${d.name}: "${d.displayName}" (${d.lastModifiedFormatted || 'no timestamp'})`));
    return sorted;
  }, [availableDatasets, sortMode]);

  // Auto-detect available datasets using hybrid detection
  const detectAvailableDatasets = async (): Promise<Dataset[]> => {
    console.log('🔍 Starting hybrid dataset detection...');
    setDetectionMethod('detecting...');

    try {
      // Step 1: Detect datasets using any available method
      const rawDatasets = await hybridDetector.detectDatasets();
      console.log(`🎯 Hybrid detection found ${rawDatasets.length} available datasets`);

      // Step 2: Enhance display names with subtitles (centralized formatting)
      const datasets = await displayFormatter.formatDatasetDisplayNames(rawDatasets);
      console.log(`🎨 Enhanced ${datasets.length} dataset display names`);
      console.log('🎨 Final enhanced datasets:', datasets.map(d => `${d.name}: "${d.displayName}"`));

      // Determine which method was actually used by checking the successful method
      const actualMethod = hybridDetector.getLastSuccessfulMethod();
      const env = hybridDetector.environmentDetector.detectEnvironment();

      if (actualMethod === 'php-api') {
        if (env.isDevelopment) {
          setDetectionMethod('PHP API (development server)');
        } else {
          setDetectionMethod('PHP API (web server)');
        }
      } else if (actualMethod === 'fallback') {
        if (env.isDevelopment) {
          setDetectionMethod('JavaScript Fallback (development server)');
        } else {
          setDetectionMethod('JavaScript Fallback');
        }
      } else if (actualMethod === 'dev-server-scan') {
        setDetectionMethod('Dev Server Scan (development server)');
      } else if (actualMethod === 'file-system') {
        setDetectionMethod('File System (desktop app)');
      } else {
        setDetectionMethod('Unknown detection method');
      }

      return datasets;
    } catch (error) {
      console.error('❌ Hybrid detection failed:', error);

      // Fallback to legacy detection method
      console.log('🔄 Falling back to legacy detection method...');
      setDetectionMethod('Legacy fallback detection');
      return await detectAvailableDatasetsLegacy();
    }
  };

  // Legacy detection method as fallback
  const detectAvailableDatasetsLegacy = async (): Promise<Dataset[]> => {
    // NOTE: This is a limited fallback method that only checks predefined names
    // The PHP API provides true dynamic detection of ANY .json files/folders
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
    console.log('🔍 Using legacy detection method...');

    for (const name of possibleDatasets) {
      try {
        // Try 4.x format first (folder with manifest)
        const response = await fetch(`./${name}.json/manifest.json`);
        if (response.ok) {
          const manifest = await response.json();

          const articyVersion = manifest.Settings?.ExportVersion ?
                               `4.x v${manifest.Settings.ExportVersion}` : '4.x';

          let displayName = manifest.Project?.Name || name.charAt(0).toUpperCase() + name.slice(1);

          // Try to find and extract subtitle from HTMLPREVIEW node
          const subtitle = await findHtmlPreviewSubtitleLegacy(name);
          if (subtitle) {
            displayName = displayName + ' - ' + subtitle;
          }

          available.push({
            name,
            folder: `${name}.json`,
            displayName,
            description: manifest.Project?.DetailName || `${name} dataset`,
            articyVersion,
            format: '4.x'
          });

          console.log(`✅ Found 4.x dataset: ${name}`);
        } else {
          // Try 3.x format (single JSON file)
          const fileResponse = await fetch(`./${name}.json`);
          if (fileResponse.ok) {
            const jsonData = await fileResponse.json();

            // Check if it looks like 3.x format
            const is3xFormat = jsonData.Packages && jsonData.Project && jsonData.GlobalVariables;

            if (is3xFormat) {
              const articyVersion = jsonData.Settings?.ExportVersion ?
                                   `3.x v${jsonData.Settings.ExportVersion}` : '3.x';

              available.push({
                name,
                file: `${name}.json`,
                displayName: jsonData.Project?.Name || name.charAt(0).toUpperCase() + name.slice(1),
                description: jsonData.Project?.DetailName || `${name} dataset (3.x format)`,
                articyVersion,
                format: '3.x'
              });

              console.log(`✅ Found 3.x dataset: ${name}`);
            }
          }
        }
      } catch (error) {
        // Dataset doesn't exist or manifest is invalid, skip silently
      }
    }

    console.log(`🎯 Legacy detection found ${available.length} available datasets`);
    return available;
  };

  // Helper function to find HTMLPREVIEW subtitle in legacy detection
  const findHtmlPreviewSubtitleLegacy = async (datasetName: string): Promise<string | null> => {
    try {
      // Try to fetch the objects file that contains the node data
      const objectsResponse = await fetch(`./${datasetName}.json/package_010000060000401C_objects.json`);
      if (!objectsResponse.ok) {
        return null;
      }

      const objectsData = await objectsResponse.json();
      if (!objectsData || !objectsData.Objects) {
        return null;
      }

      // Search through all objects for HTMLPREVIEW marker
      for (const model of objectsData.Objects) {
        if (!model.Properties) {
          continue;
        }

        const properties = model.Properties;
        let textContent = '';

        // Check both Text and Expression properties for HTMLPREVIEW marker
        if (properties.Text && properties.Text.includes('HTMLPREVIEW')) {
          textContent = properties.Text;
        } else if (properties.Expression && properties.Expression.includes('HTMLPREVIEW')) {
          textContent = properties.Expression;
        }

        if (textContent) {
          // Extract subtitle from "Project Sub Name:" line
          const lines = textContent.split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('//Project Sub Name:')) {
              const subtitle = trimmedLine.substring('//Project Sub Name:'.length).trim();
              if (subtitle) {
                return subtitle;
              }
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.warn(`⚠️ Could not extract subtitle from ${datasetName}:`, error);
      return null;
    }
  };

  const loadDataset = async (datasetName: string) => {
    setIsLoading(true);

    try {
      console.log(`🔄 Loading ${datasetName} dataset...`);

      // Find the dataset info to determine format
      const datasetInfo = availableDatasets.find(d => d.name === datasetName);
      const is3xFormat = datasetInfo?.format === '3.x';

      if (is3xFormat) {
        // Load 3.x single JSON file
        console.log(`📄 Loading 3.x single file: ${datasetName}.json`);
        const cacheBuster = Date.now();
        const response = await fetch(`./${datasetName}.json?v=${cacheBuster}`);

        if (!response.ok) {
          throw new Error(`Failed to load ${datasetName}.json: ${response.status}`);
        }

        const content = await response.text();
        const jsonData = JSON.parse(content);

        // Process the 3.x data using DataRouter
        const dataRouter = new DataRouter();
        dataRouter.setDebugMode(true);

        const processedData = await dataRouter.processData(jsonData);
        const report = dataRouter.createProcessingReport(processedData);

        // Update report to indicate dataset source
        report.processingInfo.inputType = `Hardcoded ${datasetName} dataset (3.x format)`;

        setDataSource('hardcoded');
        handleDataLoaded(processedData, report);

        console.log(`🎉 ${datasetName} 3.x dataset loaded successfully!`);
      } else {
        // Load 4.x folder structure
        console.log(`📁 Loading 4.x folder structure: ${datasetName}.json/`);

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
          report.processingInfo.inputType = `Hardcoded ${datasetName} dataset (4.x format)`;

          setDataSource('hardcoded');
          handleDataLoaded(processedData, report);

          console.log(`🎉 ${datasetName} 4.x dataset loaded successfully!`);
        } else {
          throw new Error(`No files could be loaded from ${datasetName} dataset`);
        }
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
    console.log('✅ Hybrid dataset detection enabled');
    console.log('✅ Relative path support enabled');
    console.log('✅ Multi-environment compatibility enabled');
    console.log('✅ 4.x format support enabled');
    console.log('✅ Drag-and-drop functionality enabled');

    // Log environment information
    hybridDetector.environmentDetector.logEnvironmentInfo();

    // Initialize app with dataset detection
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);

    try {
      // Detect available datasets
      const datasets = await detectAvailableDatasets();

      setAvailableDatasets(datasets);
      console.log('🎯 Stored in state:', datasets.map(d => `${d.name}: "${d.displayName}"`));

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
          // Pre-select first dataset based on current sort mode
          const sortedDatasets = [...datasets].sort((a, b) => {
            if (sortMode === 'date') {
              const timeA = a.lastModified || 0;
              const timeB = b.lastModified || 0;
              return timeB - timeA;
            } else {
              return a.displayName.localeCompare(b.displayName);
            }
          });
          setSelectedDataset(sortedDatasets[0].name);
          console.log(`📌 Pre-selected dataset: ${sortedDatasets[0].name} (${sortedDatasets[0].displayName}) based on ${sortMode} sort`);
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
    const url = new URL(window.location.href);
    url.searchParams.set('dataset', datasetName);
    window.history.pushState({}, '', url.toString());

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
            <h1>Articy Web Viewer v4.x</h1>
            <p style={{ marginBottom: '10px' }}>{detectionMethod}</p>

            {processingReport && (
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 20px',
                  background: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  borderRadius: '12px'
                }}>
                  <span className="format-label">Format: </span>
                  <span className="format-value">{processingReport.format} v{processingReport.version}</span>
                  <span className="confidence"> ({(processingReport.confidence * 100).toFixed(0)}% confidence)</span>
                  {dataSource && (
                    <>
                      <span className="source-label" style={{ color: 'black' }}> || Source: </span>
                      <span className="source-value" style={{ color: 'black' }}>
                        {dataSource === 'hardcoded' ? `${selectedDataset} dataset` : 'Manual upload'}
                      </span>
                    </>
                  )}
                </div>
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
                <div className="upload-section" style={{ padding: '20px 20px 0 20px' }}>
                  <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', color: '#1890ff', marginBottom: '15px' }}>
                      Select Dataset or Upload Files
                    </h2>

                    {availableDatasets.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <h3 style={{ margin: 0 }}>📁 Available Datasets</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
                              {sortMode === 'date' ? 'Sorting By Latest Files' : 'Sorting A-Z By Folder Name'}
                            </span>
                            <Tooltip title={sortMode === 'alphabetical' ? 'Sort by newest files' : 'Sort alphabetically'}>
                              <Button
                                size="small"
                                icon={sortMode === 'alphabetical' ? <ClockCircleOutlined /> : <SortAscendingOutlined />}
                                onClick={() => {
                                  const newMode = sortMode === 'alphabetical' ? 'date' : 'alphabetical';
                                  console.log(`🔄 Changing sort mode from ${sortMode} to ${newMode}`);
                                  setSortMode(newMode);

                                  // Update selected dataset to the first item in the new sort order
                                  if (availableDatasets.length > 0) {
                                    const newSortedDatasets = [...availableDatasets].sort((a, b) => {
                                      if (newMode === 'date') {
                                        const timeA = a.lastModified || 0;
                                        const timeB = b.lastModified || 0;
                                        return timeB - timeA;
                                      } else {
                                        return a.displayName.localeCompare(b.displayName);
                                      }
                                    });
                                    setSelectedDataset(newSortedDatasets[0].name);
                                    console.log(`📌 Updated selected dataset to: ${newSortedDatasets[0].name} (${newSortedDatasets[0].displayName})`);
                                  }
                                }}
                                style={{
                                  backgroundColor: sortMode === 'date' ? '#1890ff' : undefined,
                                  borderColor: sortMode === 'date' ? '#1890ff' : undefined,
                                  color: sortMode === 'date' ? '#fff' : undefined
                                }}
                              />
                            </Tooltip>
                          </div>
                        </div>
                        <Select
                          value={selectedDataset}
                          onChange={setSelectedDataset}
                          style={{ width: '100%', marginBottom: '12px' }}
                          size="large"
                          placeholder="Select a dataset to load"
                        >
                          {sortedDatasets.map(dataset => (
                            <Option key={dataset.name} value={dataset.name}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong>{dataset.displayName}</strong>
                                  {dataset.articyVersion && (
                                    <span style={{
                                      fontSize: '11px',
                                      color: dataset.format === '3.x' ? '#ff6b35' : '#1890ff',
                                      backgroundColor: dataset.format === '3.x' ? '#fff2e8' : '#e6f7ff',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: '500'
                                    }}>
                                      {dataset.articyVersion}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {dataset.description}
                                  {sortMode === 'date' && dataset.lastModifiedFormatted && (
                                    <span style={{ marginLeft: '8px', color: '#999' }}>
                                      • {dataset.lastModifiedFormatted}
                                    </span>
                                  )}
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
                          Load {sortedDatasets.find(d => d.name === selectedDataset)?.displayName || 'Selected Dataset'}
                        </Button>
                      </div>
                    )}

                    <div>
                      <h3 style={{ marginBottom: '12px' }}>📤 Upload Custom Files</h3>
                      <EnhancedFileInput
                        onDataLoaded={handleManualDataLoaded}
                        isLoading={false}
                        setIsLoading={setIsLoading}
                      />
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
