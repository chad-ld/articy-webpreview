import TextBlock from "../components/TextBlock";
import { Button } from "antd";

interface InstructionPanelProps {
  text: string;
  title?: string;
  stageDirections?: string;
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

      // Background color (50% darker version to preserve color relationships)
      // Pure blue rgb(0, 0, 255) becomes rgb(0, 0, 128)
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
    // Using target background color for good readability
    return {
      frameColor: 'rgb(147, 193, 204)',
      backgroundColor: 'rgb(90, 102, 104)',
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
      <div className="node" style={combinedStyle}>


        {props.title && (
          <div
            className="articy-node-header"
            style={{
              backgroundColor: frameColor,
              borderColor: frameColor,
              color: headerTextColor
            }}
          >
            {props.title}
          </div>
        )}
        {props.stageDirections && (
          <div
            className="articy-stage-directions"
            style={{
              backgroundColor: backgroundColor,
              borderLeft: `10px solid ${frameColor}`,
              borderRight: `10px solid ${frameColor}`,
              color: 'white',
              padding: '8px 12px',
              fontStyle: 'italic',
              fontSize: '0.9em',
              textAlign: 'center'
            }}
          >
            {props.stageDirections}
          </div>
        )}
        {props.text && props.text.trim() && (
          <TextBlock borderColor={frameColor} backgroundColor={backgroundColor}>
            {props.text}
          </TextBlock>
        )}
        <br />
        <div style={{ textAlign: 'right' }}>
          <Button
            danger={props.button.hidden}
            disabled={isDisabled}
            onClick={() => {
              if (!isDisabled) props.button.onClick();
            }}
          >
            {props.button.text}
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="node" style={combinedStyle}>


        {props.title && (
          <div
            className="articy-node-header"
            style={{
              backgroundColor: frameColor,
              borderColor: frameColor,
              color: headerTextColor
            }}
          >
            {props.title}
          </div>
        )}
        {props.stageDirections && (
          <div
            className="articy-stage-directions"
            style={{
              backgroundColor: backgroundColor,
              borderLeft: `10px solid ${frameColor}`,
              borderRight: `10px solid ${frameColor}`,
              color: 'white',
              padding: '8px 12px',
              fontStyle: 'italic',
              fontSize: '0.9em',
              textAlign: 'center'
            }}
          >
            {props.stageDirections}
          </div>
        )}
        {props.text && props.text.trim() && (
          <TextBlock borderColor={frameColor} backgroundColor={backgroundColor}>
            {props.text}
          </TextBlock>
        )}
      </div>
    );
  }
}

export default InstructionPanel;
