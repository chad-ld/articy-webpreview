import { PropsWithChildren } from "react";

interface TextBlockProps extends PropsWithChildren {
  borderColor?: string;
  backgroundColor?: string;
}

// Function to detect and convert URLs to clickable links
function renderTextWithLinks(text: string): JSX.Element[] {
  // URL regex pattern that matches http:// and https:// URLs
  const urlRegex = /(https?:\/\/[^\s\r\n]+)/g;
  const parts = text.split(urlRegex);
  const elements: JSX.Element[] = [];

  parts.forEach((part, index) => {
    // Use a fresh regex for each test to avoid global regex issues
    const testRegex = /^https?:\/\/[^\s\r\n]+$/;
    const isUrl = testRegex.test(part);

    if (isUrl) {
      // This is a URL - make it clickable
      elements.push(
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#87CEEB',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#ADD8E6'; // Lighter blue on hover
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#87CEEB'; // Back to original color
          }}
        >
          {part}
        </a>
      );
    } else if (part) {
      // Regular text
      elements.push(<span key={index}>{part}</span>);
    }
  });

  return elements;
}

function TextBlock(props: TextBlockProps) {
  const text = props.children as string;
  
  // Handle both \r\n (Windows) and \n (Unix) line endings
  const textChunks = text.split(/\r?\n/);
  
  // Detect if this is code content (contains variable assignments, comments, etc.)
  const isCodeBlock = text.includes("=") && (text.includes("//") || text.includes("."));
  
  var i = 0;

  // Apply syntax highlighting for all content
  const renderCodeLine = (line: string): JSX.Element | JSX.Element[] => {
    if (line.trim().startsWith("//")) {
      return <span style={{ color: '#6A9955' }}>{renderTextWithLinks(line)}</span>;
    }

    // Simple variable assignment highlighting
    // Only treat as variable assignment if it looks like proper code (starts with identifier)
    if (line.includes("=") && /^\s*[a-zA-Z_][a-zA-Z0-9_.]*\s*=/.test(line)) {
      const parts = line.split("=");
      if (parts.length === 2) {
        const variable = parts[0].trim();
        const value = parts[1].trim().replace(";", "");

        // Check different value types
        const cleanValue = value.trim();
        const isNumber = /^\d+(\.\d+)?$/.test(cleanValue);
        const isString = cleanValue.startsWith('"') && cleanValue.endsWith('"');
        const isBooleanOrKeyword = ['true', 'false', 'null', 'undefined'].includes(cleanValue.toLowerCase());

        // For complex expressions, apply syntax highlighting to parts
        const renderValue = (val: string) => {
          if (isNumber) {
            return <span style={{ color: '#b5cea8' }}>{val}</span>;
          } else if (isBooleanOrKeyword) {
            return <span style={{ color: '#569cd6' }}>{val}</span>;
          } else if (isString) {
            return <span style={{ color: '#ce9178' }}>{val}</span>; // String values remain default color (white)
          } else {
            // For complex expressions, use a more sophisticated approach
            // Split by operators and numbers while preserving them
            const tokens = val.split(/(\+|\-|\*|\/|=|;|\d+)/);
            return (
              <>
                {tokens.map((token, index) => {
                  const trimmedToken = token.trim();
                  if (trimmedToken === '') {
                    return <span key={index}>{token}</span>; // Preserve whitespace
                  } else if (/^\d+$/.test(trimmedToken)) {
                    return <span key={index} style={{ color: '#b5cea8' }}>{token}</span>;
                  } else if (/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(trimmedToken)) {
                    // Variable names (letters, numbers, dots, underscores)
                    return <span key={index} style={{ color: '#9cdcfe' }}>{token}</span>;
                  } else if (/^[\+\-\*\/=;]$/.test(trimmedToken)) {
                    // Operators
                    return <span key={index} style={{ color: '#d4d4d4' }}>{token}</span>; // Keep operators default color
                  } else {
                    // Other symbols
                    return <span key={index}>{token}</span>;
                  }
                })}
              </>
            );
          }
        };

        return [
          <span key="var" style={{ color: '#9cdcfe' }}>{variable}</span>,
          <span key="eq" style={{ color: '#d4d4d4' }}>=</span>,
          <span key="val">{renderValue(value)}</span>,
          ...(line.includes(";") ? [<span key="semi" style={{ color: '#d4d4d4' }}>;</span>] : [])
        ];
      }
    }

    return renderTextWithLinks(line);
  };

  const borderColor = props.borderColor || 'rgb(147, 193, 204)';
  const bgColor = props.backgroundColor || '#5a6668'; // Default dark gray-blue from old version

  if (isCodeBlock) {
    return (
      <div
        style={{
          border: `2px solid ${borderColor}`,
          backgroundColor: bgColor,
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '14px',
          lineHeight: '1.4',
          color: '#d4d4d4',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {textChunks.map((chunk) => {
          const renderedContent = renderCodeLine(chunk);
          return (
            <div key={i++} style={{ minHeight: '1.4em' }}>
              {Array.isArray(renderedContent) ? renderedContent : renderedContent}&nbsp;
            </div>
          );
        })}
      </div>
    );
  } else {
    return (
      <div
        style={{
          border: `2px solid ${borderColor}`,
          backgroundColor: bgColor,
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          lineHeight: '1.6',
          color: '#ffffff',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {textChunks.map((chunk) => {
          const renderedContent = renderCodeLine(chunk);
          return (
            <div key={i++} style={{ minHeight: '1.6em' }}>
              {Array.isArray(renderedContent) ? renderedContent : renderedContent}&nbsp;
            </div>
          );
        })}
      </div>
    );
  }
}

export default TextBlock;
