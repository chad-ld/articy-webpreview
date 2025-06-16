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

      // Background color (50% darker version to preserve color relationships)
      // Pure blue rgb(0, 0, 255) becomes rgb(0, 0, 128)
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
      backgroundColor: 'rgb(90, 102, 104)',
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
    <div className="node" style={selectionStyle}>
      {/* Debug Color Squares */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '10px',
        alignItems: 'center',
        fontSize: '12px',
        color: 'white'
      }}>
        <div style={{
          width: '50px',
          height: '30px',
          backgroundColor: frameColor,
          border: '1px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'black',
          fontWeight: 'bold'
        }}>
          BORDER
        </div>
        <div style={{
          width: '50px',
          height: '30px',
          backgroundColor: backgroundColor,
          border: '1px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'white',
          fontWeight: 'bold'
        }}>
          BG
        </div>
        <span style={{ color: 'white' }}>
          Border: {frameColor} | Background: {backgroundColor}
        </span>
      </div>

      {title && (
        <div
          className="articy-node-header"
          style={{
            backgroundColor: frameColor,
            borderColor: frameColor,
            color: headerTextColor
          }}
        >
          {title}
        </div>
      )}

      <TextBlock borderColor={frameColor} backgroundColor={backgroundColor}>
        {text}
      </TextBlock>

      <div style={{ marginTop: '15px' }}>
        {choices.map((choice, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <Button
              size="large"
              onClick={choice.onClick}
              disabled={choice.disabled}
              style={{
                width: '100%',
                backgroundColor: choice.disabled ? '#666' : undefined,
                borderColor: choice.disabled ? '#666' : undefined,
                color: choice.disabled ? '#ccc' : undefined,
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
  );
};

export default QuestionPanel;
