/**
 * Enhanced File Input Component for Articy 3.x and 4.x formats
 * Supports single JSON files, multiple files, folders, and ZIP files
 */

import React, { useState, useCallback } from 'react';
import { Button, message, Progress, Alert } from 'antd';
import { InboxOutlined, FileOutlined, FolderOutlined, FileZipOutlined } from '@ant-design/icons';
import DataRouter from '../utils/dataRouter';

interface EnhancedFileInputProps {
  onDataLoaded: (data: any, report: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface FileProcessingState {
  isProcessing: boolean;
  progress: number;
  currentFile: string;
  totalFiles: number;
  processedFiles: number;
}

const EnhancedFileInput: React.FC<EnhancedFileInputProps> = ({
  onDataLoaded,
  isLoading,
  setIsLoading
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingState, setProcessingState] = useState<FileProcessingState>({
    isProcessing: false,
    progress: 0,
    currentFile: '',
    totalFiles: 0,
    processedFiles: 0
  });

  const dataRouter = new DataRouter();
  dataRouter.setDebugMode(true); // Enable debug logging

  // Process files using the data router
  const processFiles = useCallback(async (input: any, inputType: string) => {
    setIsLoading(true);
    setProcessingState({
      isProcessing: true,
      progress: 0,
      currentFile: inputType,
      totalFiles: 1,
      processedFiles: 0
    });

    try {
      console.log('🔄 Processing input:', inputType);
      
      // Update progress
      setProcessingState(prev => ({ ...prev, progress: 25 }));
      
      // Process data using router
      const processedData = await dataRouter.processData(input);
      
      setProcessingState(prev => ({ ...prev, progress: 75 }));
      
      // Create processing report
      const report = dataRouter.createProcessingReport(processedData);
      
      setProcessingState(prev => ({ ...prev, progress: 100 }));
      
      // Success!
      message.success(`Successfully loaded ${report.format} format data!`);
      onDataLoaded(processedData, report);
      
    } catch (error) {
      console.error('❌ File processing failed:', error);
      message.error(`Failed to process files: ${error.message}`);
    } finally {
      setIsLoading(false);
      setProcessingState({
        isProcessing: false,
        progress: 0,
        currentFile: '',
        totalFiles: 0,
        processedFiles: 0
      });
    }
  }, [dataRouter, onDataLoaded, setIsLoading]);

  // Read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Handle single file
  const handleSingleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      message.error('Please select a JSON file');
      return;
    }

    try {
      const content = await readFileAsText(file);
      await processFiles(content, `Single JSON file: ${file.name}`);
    } catch (error) {
      message.error(`Failed to read file: ${error.message}`);
    }
  };

  // Handle multiple files (4.x format)
  const handleMultipleFiles = async (files: FileList) => {
    const jsonFiles = Array.from(files).filter(file => 
      file.name.toLowerCase().endsWith('.json')
    );

    if (jsonFiles.length === 0) {
      message.error('No JSON files found');
      return;
    }

    // Check if this looks like a 4.x format (has manifest.json)
    const hasManifest = jsonFiles.some(file => file.name === 'manifest.json');
    
    if (jsonFiles.length === 1 && !hasManifest) {
      // Single JSON file - handle as 3.x
      await handleSingleFile(jsonFiles[0]);
      return;
    }

    try {
      setProcessingState({
        isProcessing: true,
        progress: 0,
        currentFile: 'Reading files...',
        totalFiles: jsonFiles.length,
        processedFiles: 0
      });

      // Read all JSON files
      const fileContents: { [key: string]: string } = {};
      
      for (let i = 0; i < jsonFiles.length; i++) {
        const file = jsonFiles[i];
        setProcessingState(prev => ({
          ...prev,
          currentFile: file.name,
          processedFiles: i,
          progress: (i / jsonFiles.length) * 50 // First 50% for reading
        }));
        
        const content = await readFileAsText(file);
        fileContents[file.name] = content;
      }

      setProcessingState(prev => ({
        ...prev,
        currentFile: 'Processing data...',
        progress: 50
      }));

      await processFiles(fileContents, `Multiple JSON files (${jsonFiles.length} files)`);
      
    } catch (error) {
      message.error(`Failed to process multiple files: ${error.message}`);
      setIsLoading(false);
      setProcessingState({
        isProcessing: false,
        progress: 0,
        currentFile: '',
        totalFiles: 0,
        processedFiles: 0
      });
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    
    if (files.length === 1) {
      handleSingleFile(files[0]);
    } else if (files.length > 1) {
      handleMultipleFiles(files);
    } else {
      message.error('No files selected');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (files.length === 1) {
      handleSingleFile(files[0]);
    } else if (files.length > 1) {
      handleMultipleFiles(files);
    }
  }, []);

  // Handle folder input (webkitdirectory)
  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    handleMultipleFiles(files);
  }, []);

  return (
    <div
      className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
      style={{
        padding: '20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: `2px dashed ${isDragOver ? '#1890ff' : '#d9d9d9'}`,
        borderRadius: '8px',
        backgroundColor: isDragOver ? '#f0f8ff' : '#fafafa',
        transition: 'all 0.3s ease'
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {/* Loading/Processing State */}
      {(isLoading || processingState.isProcessing) && (
        <div style={{ width: '100%', maxWidth: '400px', marginBottom: '30px' }}>
          <Progress 
            percent={processingState.progress} 
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            {processingState.currentFile && (
              <div>Processing: {processingState.currentFile}</div>
            )}
            {processingState.totalFiles > 1 && (
              <div>
                Files: {processingState.processedFiles} / {processingState.totalFiles}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Upload Area */}
      {!isLoading && !processingState.isProcessing && (
        <>
          <div style={{ marginBottom: '10px' }}>
            <div className="drag-drop-text">DRAG AND DROP FILES HERE</div>
          </div>

          <p style={{ fontSize: '16px', marginBottom: '15px', color: '#666' }}>
            Supports both Articy Draft 3.x and 4.x formats
          </p>

          {/* Format Information */}
          <Alert
            message="Supported Formats"
            description={
              <div style={{ textAlign: 'left' }}>
                <div><strong>3.x Format:</strong> Single JSON file (demo.json)</div>
                <div><strong>4.x Format:</strong> Multiple JSON files or folder (demo4.json/)</div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '15px', maxWidth: '500px' }}
          />

          {/* Upload Options */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'nowrap' }}>
            {/* Single File Upload */}
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="single-file-input"
            />
            <Button
              type="primary"
              size="large"
              icon={<FileOutlined />}
              onClick={() => document.getElementById('single-file-input')?.click()}
            >
              Select JSON File
            </Button>

            {/* Multiple Files Upload */}
            <input
              type="file"
              accept=".json,application/json"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="multiple-files-input"
            />
            <Button
              size="large"
              icon={<FileOutlined />}
              onClick={() => document.getElementById('multiple-files-input')?.click()}
            >
              Select Multiple Files
            </Button>

            {/* Folder Upload */}
            <input
              type="file"
              // @ts-ignore - webkitdirectory is not in TypeScript types but is supported
              webkitdirectory=""
              onChange={handleFolderSelect}
              style={{ display: 'none' }}
              id="folder-input"
            />
            <Button
              size="large"
              icon={<FolderOutlined />}
              onClick={() => document.getElementById('folder-input')?.click()}
            >
              Select Folder
            </Button>
          </div>

        </>
      )}
    </div>
  );
};

export default EnhancedFileInput;
