import TextBlock from "../components/TextBlock";
import { Button } from "antd";

interface InstructionPanelProps {
  text: string;
  title?: string;
  color?: { r: number; g: number; b: number; };
  button: {
    hidden: boolean;
    disabled?: boolean;
    text: string;
    onClick: Function;
  };
  selected?: boolean;
}

function InstructionPanel(props: InstructionPanelProps) {
  // Convert Articy color (0.0-1.0) to CSS RGB (0-255) and create darker background
  const getColors = () => {
    if (props.color) {
      const r = Math.round(props.color.r * 255);
      const g = Math.round(props.color.g * 255);
      const b = Math.round(props.color.b * 255);

      // Frame/border color (original color)
      const frameColor = `rgb(${r}, ${g}, ${b})`;

      // Background color (darker version - about 50% darker)
      const darkR = Math.round(r * 0.5);
      const darkG = Math.round(g * 0.5);
      const darkB = Math.round(b * 0.5);
      const backgroundColor = `rgb(${darkR}, ${darkG}, ${darkB})`;

      // Calculate relative luminance to determine text color
      // Formula: (0.299*R + 0.587*G + 0.114*B) / 255
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const headerTextColor = luminance > 0.5 ? 'black' : 'white';

      return { frameColor, backgroundColor, headerTextColor };
    }

    // Default colors (teal is light, so use black text)
    return {
      frameColor: 'rgb(147, 193, 204)',
      backgroundColor: 'rgb(73, 96, 102)',
      headerTextColor: 'black'
    };
  };

  const { frameColor, backgroundColor, headerTextColor } = getColors();

  // Apply grayed out effect if disabled
  const isDisabled = props.button.disabled || props.button.hidden;
  const nodeStyle = isDisabled ? {
    opacity: 0.5,
    filter: 'grayscale(50%)',
    pointerEvents: 'none' as const
  } : {};

  // Apply selection styling
  const selectionStyle = props.selected ? {
    border: '3px solid #ffa619',
    boxShadow: '0 0 15px rgba(255, 166, 25, 0.5)',
    transform: 'scale(1.02)',
    transition: 'all 0.2s ease'
  } : {};

  const combinedStyle = { ...nodeStyle, ...selectionStyle };

  if (!props.button.hidden) {
    return (
      <div
        style={{
          border: `2px solid ${frameColor}`,
          borderRadius: '10px',
          backgroundColor: frameColor,
          padding: '0',
          margin: '20px 0',
          maxWidth: '600px',
          ...combinedStyle
        }}
      >
        {props.title && (
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
            {props.title}
          </div>
        )}
        
        <div style={{ padding: '15px' }}>
          <TextBlock borderColor={frameColor} backgroundColor={backgroundColor}>
            {props.text}
          </TextBlock>
          
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                if (!isDisabled) props.button.onClick();
              }}
              style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                fontWeight: 'bold'
              }}
            >
              {props.button.text}
            </Button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div
        style={{
          border: `2px solid ${frameColor}`,
          borderRadius: '10px',
          backgroundColor: frameColor,
          padding: '0',
          margin: '20px 0',
          maxWidth: '600px',
          ...combinedStyle
        }}
      >
        {props.title && (
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
            {props.title}
          </div>
        )}
        
        <div style={{ padding: '15px' }}>
          <TextBlock borderColor={frameColor} backgroundColor={backgroundColor}>
            {props.text}
          </TextBlock>
        </div>
      </div>
    );
  }
}

export default InstructionPanel;
