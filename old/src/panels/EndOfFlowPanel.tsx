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
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center',
            padding: '40px',
            ...selectionStyle
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
