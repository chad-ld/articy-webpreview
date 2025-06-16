import React from 'react';
import { Button } from 'antd';

interface EndOfFlowPanelProps {
  onRestart: () => void;
  selected?: boolean;
}

const EndOfFlowPanel: React.FC<EndOfFlowPanelProps> = ({ onRestart, selected }) => {
  const selectionStyle = selected ? {
    border: '3px solid #ffa619',
    boxShadow: '0 0 15px rgba(255, 166, 25, 0.5)',
    borderRadius: '10px'
  } : {};

  return (
    <div
      className="node"
      style={{
        textAlign: 'center',
        padding: '40px 20px',
        backgroundColor: '#2c3e50',
        border: '2px solid #34495e',
        color: '#ecf0f1',
        ...selectionStyle
      }}
    >
      <h2
        style={{
          color: '#e74c3c',
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}
      >
        END OF FLOW
      </h2>

      <p
        style={{
          fontSize: '16px',
          marginBottom: '30px',
          color: '#bdc3c7'
        }}
      >
        You have reached the end of this story flow.
      </p>

      <Button
        size="large"
        onClick={onRestart}
        style={{
          backgroundColor: '#e74c3c',
          borderColor: '#e74c3c',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          height: '45px',
          padding: '0 30px'
        }}
      >
        RESTART
      </Button>
    </div>
  );
};

export default EndOfFlowPanel;
