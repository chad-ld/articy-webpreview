import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import ArticyProject from '../utils/ArticyProject';
import InstructionPanel from '../panels/InstructionPanel';
import EndOfFlowPanel from '../panels/EndOfFlowPanel';

interface InteractiveArticyViewerProps {
  data: any;
  onReset: () => void;
}

const InteractiveArticyViewer: React.FC<InteractiveArticyViewerProps> = ({ data, onReset }) => {
  const [project, setProject] = useState<ArticyProject | undefined>(undefined);
  const [currentNode, setCurrentNode] = useState<any>(null);
  const [nodeHistory, setNodeHistory] = useState<any[]>([]);

  // Initialize project when data is provided
  useEffect(() => {
    if (data) {
      try {
        console.log('🔄 InteractiveArticyViewer: Initializing ArticyProject with data:', {
          hasPackages: !!data.Packages,
          packageCount: data.Packages?.length || 0,
          totalModels: data.Packages?.reduce((sum: number, pkg: any) => sum + (pkg.Models?.length || 0), 0) || 0
        });

        const articyProject = new ArticyProject(data);
        setProject(articyProject);

        console.log('🔍 InteractiveArticyViewer: Calling GetStartNode()...');

        // Find and set the start node
        const startNode = articyProject.GetStartNode();

        console.log('🔍 InteractiveArticyViewer: GetStartNode() returned:', startNode ? {
          id: startNode.Properties.Id,
          type: startNode.Type,
          hasText: !!startNode.Properties.Text,
          hasExpression: !!startNode.Properties.Expression
        } : null);

        if (startNode) {
          setCurrentNode(startNode);
          setNodeHistory([startNode]);
          console.log('✅ InteractiveArticyViewer: Start node set successfully');
        } else {
          console.warn('⚠️ InteractiveArticyViewer: No start node found (looking for HTMLPREVIEW marker)');
          message.warning('No start node found. Looking for a node with HTMLPREVIEW marker.');
        }
      } catch (error) {
        console.error('❌ InteractiveArticyViewer: Error creating ArticyProject:', error);
        message.error('Error processing Articy data');
      }
    }
  }, [data]);



  // Handle Next button - basic navigation
  const handleNext = () => {
    if (!project || !currentNode) return;

    // Check if node has output connections
    if (currentNode.Properties.OutputPins && 
        currentNode.Properties.OutputPins[0] && 
        currentNode.Properties.OutputPins[0].Connections &&
        currentNode.Properties.OutputPins[0].Connections.length > 0) {
      
      const connection = currentNode.Properties.OutputPins[0].Connections[0];
      const nextNode = project.GetNodeByID(connection.Target);
      
      if (nextNode) {
        setCurrentNode(nextNode);
        setNodeHistory([...nodeHistory, nextNode]);
        console.log('🔄 Navigated to:', nextNode.Properties.Id, nextNode.Type);
      }
    } else {
      // End of flow
      const endNode = { Type: "EndOfFlow", Properties: {} };
      setCurrentNode(endNode);
    }
  };

  // Handle restart
  const handleRestart = () => {
    if (project) {
      project.ResetVariablesToInitialState();
      const startNode = project.GetStartNode();
      if (startNode) {
        setCurrentNode(startNode);
        setNodeHistory([startNode]);
      }
    }
  };

  // Show loading state if no project loaded yet
  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <InboxOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        <h3>Initializing Interactive Viewer...</h3>
        <p>Processing Articy data...</p>
      </div>
    );
  }

  // Render current node
  if (!currentNode) {
    return <div>No current node</div>;
  }

  // Handle end of flow
  if (currentNode.Type === "EndOfFlow") {
    return <EndOfFlowPanel onRestart={handleRestart} />;
  }

  // Render regular node
  const nodeText = currentNode.Properties.Text || currentNode.Properties.Expression || 'No content';
  const nodeTitle = currentNode.Properties.DisplayName || undefined;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <Button onClick={onReset}>Load New File</Button>
      </div>
      
      <InstructionPanel
        text={nodeText}
        title={nodeTitle}
        color={currentNode.Properties.Color}
        button={{
          hidden: false,
          text: "Next",
          onClick: handleNext
        }}
      />
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <strong>Debug Info:</strong><br />
        Node ID: {currentNode.Properties.Id}<br />
        Node Type: {currentNode.Type}<br />
        History Length: {nodeHistory.length}
      </div>
    </div>
  );
};

export default InteractiveArticyViewer;
