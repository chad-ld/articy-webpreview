import { PropsWithChildren } from "react";

interface TextBlockProps extends PropsWithChildren {
    borderColor?: string;
    backgroundColor?: string;
}

function TextBlock (props:TextBlockProps){

    const text = props.children as string;
    const textChunks = text.split("\n");

    // Detect if this is code content (contains variable assignments, comments, etc.)
    const isCodeBlock = text.includes("=") && (text.includes("//") || text.includes("."));

    var i = 0;

    // Apply syntax highlighting for all content
    const renderCodeLine = (line: string) => {
        if (line.trim().startsWith("//")) {
            return <span className="hljs-comment">{line}</span>;
        }

        // Simple variable assignment highlighting
        if (line.includes("=")) {
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

                return (
                    <>
                        <span className="hljs-property">{variable}</span>
                        <span>=</span>
                        {renderValue(value)}
                        {line.includes(";") && <span>;</span>}
                    </>
                );
            }
        }

        return line;
    };

    const borderColor = props.borderColor || 'rgb(147, 193, 204)';
    const bgColor = props.backgroundColor || '#5a6668'; // Default dark gray-blue from old version

    if (isCodeBlock) {
        return(
            <div
                className="articy-codeblock"
                style={{
                    borderColor: borderColor,
                    backgroundColor: bgColor,
                    color: 'white' // Ensure white text for readability
                }}
            >
                {textChunks.map((chunk) => (
                    <div key={i++}>
                        {renderCodeLine(chunk)}
                        <br/>
                    </div>
                ))}
            </div>
        );
    } else {
        return(
            <div
                className="articy-textblock"
                style={{
                    borderColor: borderColor,
                    backgroundColor: bgColor,
                    color: 'white' // Ensure white text for readability
                }}
            >
                {textChunks.map((chunk) => (
                    <div key={i++}>
                        {renderCodeLine(chunk)}
                        <br/>
                    </div>
                ))}
            </div>
        );
    }
}

export default TextBlock