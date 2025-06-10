import React from 'react';
import { Button } from 'antd';

interface EndOfFlowPanelProps {
    onRestart: () => void;
}

const EndOfFlowPanel: React.FC<EndOfFlowPanelProps> = ({ onRestart }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center',
            padding: '40px'
        }}>
            <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '40px',
                letterSpacing: '2px'
            }}>
                END OF FLOW
            </h1>
            
            <Button 
                type="primary" 
                size="large"
                onClick={onRestart}
                style={{
                    fontSize: '16px',
                    padding: '12px 24px',
                    height: 'auto',
                    borderRadius: '4px'
                }}
            >
                RESTART
            </Button>
        </div>
    );
};

export default EndOfFlowPanel;
