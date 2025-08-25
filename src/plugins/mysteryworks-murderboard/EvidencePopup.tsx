/**
 * Evidence Popup Component
 * Displays detailed evidence information with dynamic content states
 */

import React from 'react';
import { Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

interface EvidencePopupProps {
  isVisible: boolean;
  onClose: () => void;
  evidenceName: string;
  content: string;
}

const EvidencePopup: React.FC<EvidencePopupProps> = ({
  isVisible,
  onClose,
  evidenceName,
  content
}) => {
  return (
    <Modal
      title={null}
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={500}
      zIndex={10000} // Above murderboard modal (9999)
      centered
      maskClosable={true}
      closable={false}
      style={{
        top: 'auto'
      }}
      bodyStyle={{
        padding: 0,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      modalRender={(modal) => (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3
              style={{
                margin: 0,
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
            >
              {evidenceName}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '4px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <CloseOutlined style={{ fontSize: '14px' }} />
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              padding: '24px',
              background: '#242424', // Match app background
              color: 'rgba(255, 255, 255, 0.87)', // Match app text color
              lineHeight: '1.6',
              fontSize: '15px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {content}
            </div>
          </div>
        </div>
      )}
    />
  );
};

export default EvidencePopup;
