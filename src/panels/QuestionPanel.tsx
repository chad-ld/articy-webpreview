import React from 'react';
import { Button } from 'antd';
import TextBlock from '../components/TextBlock';

interface QuestionPanelProps {
  text: string;
  title?: string;
  color?: { r: number; g: number; b: number; };
  choices: Array<{
    text: string;
    disabled?: boolean;
    onClick: () => void;
  }>;
  selected?: boolean;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({ text, title, color, choices, selected }) => {
  // Convert Articy color (0.0-1.0) to CSS RGB (0-255) and create darker background
  const getColors = () => {
    if (color) {
      const r = Math.round(color.r * 255);
      const g = Math.round(color.g * 255);
      const b = Math.round(color.b * 255);

      // Frame/border color (original color)
      const frameColor = `rgb(${r}, ${g}, ${b})`;

      // Background color (darker version - about 50% darker)
      const darkR = Math.round(r * 0.5);
      const darkG = Math.round(g * 0.5);
      const darkB = Math.round(b * 0.5);
      const backgroundColor = `rgb(${darkR}, ${darkG}, ${darkB})`;

      // Calculate relative luminance to determine text color
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const headerTextColor = luminance > 0.5 ? 'black' : 'white';

      return { frameColor, backgroundColor, headerTextColor };
    }

    // Default colors
    return {
      frameColor: 'rgb(147, 193, 204)',
      backgroundColor: 'rgb(73, 96, 102)',
      headerTextColor: 'black'
    };
  };

  const { frameColor, backgroundColor, headerTextColor } = getColors();

  // Apply selection styling
  const selectionStyle = selected ? {
    border: '3px solid #ffa619',
    boxShadow: '0 0 15px rgba(255, 166, 25, 0.5)',
    transform: 'scale(1.02)',
    transition: 'all 0.2s ease'
  } : {};

  return (
    <div
      style={{
        border: `2px solid ${frameColor}`,
        borderRadius: '10px',
        backgroundColor: frameColor,
        padding: '0',
        margin: '20px 0',
        maxWidth: '600px',
        ...selectionStyle
      }}
    >
      {title && (
        <div
          style={{
            backgroundColor: frameColor,
            color: headerTextColor,
            padding: '10px 15px',
            borderRadius: '8px 8px 0 0',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          {title}
        </div>
      )}
      
      <div style={{ padding: '15px' }}>
        <TextBlock borderColor={frameColor} backgroundColor={backgroundColor}>
          {text}
        </TextBlock>
        
        <div style={{ marginTop: '15px' }}>
          {choices.map((choice, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <Button
                type="primary"
                size="large"
                onClick={choice.onClick}
                disabled={choice.disabled}
                style={{
                  width: '100%',
                  backgroundColor: choice.disabled ? '#666' : '#1890ff',
                  borderColor: choice.disabled ? '#666' : '#1890ff',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  height: 'auto',
                  padding: '10px 15px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}
              >
                {choice.text}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionPanel;
