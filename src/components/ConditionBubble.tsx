import React, { useState, useEffect } from 'react';

interface ConditionBubbleProps {
  condition: string;
  nodeRef: React.RefObject<HTMLDivElement>;
  disabled: boolean;
}

const ConditionBubble: React.FC<ConditionBubbleProps> = ({ condition, nodeRef, disabled }) => {
  const [position, setPosition] = useState({ top: 0, left: -200 }); // Start far left for visibility

  // Safety check: don't render if nodeRef is undefined
  if (!nodeRef) {
    return null;
  }

  useEffect(() => {
    if (nodeRef?.current) {
      const rect = nodeRef.current.getBoundingClientRect();

      // Position relative to the node's container
      // The notch should align with the left edge of the node, with some padding
      setPosition({
        top: nodeRef.current.offsetTop + (rect.height / 2) - 15, // Center vertically on the node
        left: nodeRef.current.offsetLeft - 10 // Position so notch aligns with left edge + padding (reduced spacing)
      });
    } else {
      // Fallback positioning
      setPosition({
        top: 10,
        left: -220
      });
    }
  }, [nodeRef, condition]);

  // Parse condition to color code like variables panel
  const parseConditionWithColors = (conditionText: string) => {
    // Regex to match different parts: namespace.variable, operators, booleans, numbers
    const regex = /(\w+)(\.)(\w+)(==|!=|>=|<=|>|<)(\btrue\b|\bfalse\b|\d+|"[^"]*")/g;

    return conditionText.replace(regex, (_match, namespace, dot, variable, operator, value) => {
      const namespaceColor = '#00ff00'; // Green for namespace (like TestFlowVariables)
      const variableColor = '#569cd6'; // Blue for variable names
      const operatorColor = '#d4d4d4'; // Grey for operators
      let valueColor = '#d4d4d4'; // Default grey

      // Color code the value based on type
      if (value === 'true') {
        valueColor = '#00ff00'; // Green for true
      } else if (value === 'false') {
        valueColor = '#ff0000'; // Red for false
      } else if (value.startsWith('"')) {
        valueColor = '#ce9178'; // Purple/brown for strings
      } else if (/^\d+$/.test(value)) {
        valueColor = '#b5cea8'; // Light green for numbers
      }

      return `<span style="color: ${namespaceColor}">${namespace}</span><span style="color: ${operatorColor}">${dot}</span><span style="color: ${variableColor}">${variable}</span><span style="color: ${operatorColor}">${operator}</span><span style="color: ${valueColor}">${value}</span>`;
    });
  };

  const bubbleStyle: React.CSSProperties = {
    position: 'absolute',
    top: position.top,
    left: position.left,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Dark background like original
    color: 'white',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px', // Smaller font like original
    whiteSpace: 'normal', // Allow text wrapping
    maxWidth: '300px',
    wordBreak: 'break-word',
    zIndex: 1000,
    border: 'none', // No border like original
    opacity: 1,
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    textAlign: 'right', // Right-align like original
    minWidth: '150px', // Reasonable minimum width
    transform: 'translateX(-100%)', // Anchor bubble to its right edge, so notch aligns with node
    lineHeight: '1.3' // Better line spacing for wrapped text
  };



  return (
    <div style={bubbleStyle}>
      <span style={{
        fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)' // Add text shadow for brightness
      }} dangerouslySetInnerHTML={{ __html: parseConditionWithColors(condition) }}>
      </span>
      {/* Notch pointing right */}
      <div style={{
        position: 'absolute',
        left: '100%', // Position at right edge of bubble
        top: '50%',
        transform: 'translateY(-50%)',
        width: '0',
        height: '0',
        borderLeft: '8px solid rgba(0, 0, 0, 0.9)',
        borderTop: '6px solid transparent',
        borderBottom: '6px solid transparent'
      }} />
    </div>
  );
};

export default ConditionBubble;
