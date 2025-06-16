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

  // Apply syntax highlighting for all content (copied from original v3.x)
  const renderCodeLine = (line: string): JSX.Element | JSX.Element[] => {
    if (line.trim().startsWith("//")) {
      return <span className="hljs-comment">{renderTextWithLinks(line)}</span>;
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
            return <span className="hljs-number">{val}</span>;
          } else if (isBooleanOrKeyword) {
            return <span className="hljs-literal">{val}</span>;
          } else if (isString) {
            return <span>{val}</span>; // String values remain default color (white)
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
                    return <span key={index} className="hljs-number">{token}</span>;
                  } else if (/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(trimmedToken)) {
                    // Variable names (letters, numbers, dots, underscores)
                    return <span key={index} className="hljs-property">{token}</span>;
                  } else if (/^[\+\-\*\/=;]$/.test(trimmedToken)) {
                    // Operators
                    return <span key={index}>{token}</span>; // Keep operators default color
                  } else {
                    // Other symbols
                    return <span key={index} className="hljs-literal">{token}</span>;
                  }
                })}
              </>
            );
          }
        };

        return [
          <span key="var" className="hljs-property">{variable}</span>,
          <span key="eq">=</span>,
          <span key="val">{renderValue(value)}</span>,
          ...(line.includes(";") ? [<span key="semi">;</span>] : [])
        ];
      }
    }

    return renderTextWithLinks(line);
  };



  if (isCodeBlock) {
    return (
      <div
        className="articy-codeblock"
        style={{
          borderColor: props.borderColor || 'rgb(147, 193, 204)',
          backgroundColor: props.backgroundColor || 'rgb(90, 102, 104)',
          color: 'white' // Ensure white text for readability
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
        className="articy-textblock"
        style={{
          borderColor: props.borderColor || 'rgb(147, 193, 204)',
          backgroundColor: props.backgroundColor || 'rgb(90, 102, 104)',
          color: 'white' // Ensure white text for readability
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
