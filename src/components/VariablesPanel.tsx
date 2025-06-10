import { useEffect, useState } from "react";
import { Button, Input, Tooltip } from "antd";
import { EyeOutlined, EyeInvisibleOutlined, PlusOutlined, MinusOutlined } from "@ant-design/icons";

interface VariablesPanelProps {
    project: any;
    currentNode: any;
    onWidthChange: (width: number) => void;
}

function VariablesPanel(props: VariablesPanelProps) {
    const [variables, setVariables] = useState<any>({});
    const [isVisible, setIsVisible] = useState(true);
    const [panelWidth, setPanelWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);
    const [searchFilter, setSearchFilter] = useState("");
    const [fontSize, setFontSize] = useState(12);

    useEffect(() => {
        if (props.project) {
            setVariables(props.project.variables || {});
        }
    }, [props.project, props.currentNode]);

    useEffect(() => {
        props.onWidthChange(isVisible ? panelWidth : 0);
    }, [isVisible, panelWidth, props]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing) {
                const newWidth = Math.max(200, Math.min(600, e.clientX));
                setPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const parseVariableValue = (value: string) => {
        // Check if the value contains expressions like "TestFlowVariables.TestPlayerHitPoints+1"
        const expressionRegex = /([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)([\+\-\*\/])(\d+)/;
        const match = value.match(expressionRegex);

        if (match) {
            const [, varRef, operator, number] = match;
            const [namespace, varName] = varRef.split('.');
            return (
                <>
                    <span style={{ color: '#4CAF50' }}>{namespace}</span>
                    <span style={{ color: '#fff' }}>.</span>
                    <span style={{ color: '#2196F3' }}>{varName}</span>
                    <span style={{ color: '#fff' }}>{operator}</span>
                    <span style={{ color: '#999' }}>{number}</span>
                </>
            );
        }

        // Handle simple numeric values
        if (/^\d+$/.test(value)) {
            return <span style={{ color: '#999' }}>{value}</span>;
        }

        // Handle boolean values with green/red coloring
        if (value === 'true') {
            return <span style={{ color: '#00ff00' }}>{value}</span>; // Green for true
        }
        if (value === 'false') {
            return <span style={{ color: '#ff0000' }}>{value}</span>; // Red for false
        }

        // Handle string values
        return <span style={{ color: '#9C27B0' }}>{value}</span>;
    };

    const renderVariables = () => {
        const entries: JSX.Element[] = [];

        Object.keys(variables).forEach(namespace => {
            const namespaceVars = variables[namespace];
            Object.keys(namespaceVars).forEach(varName => {
                const value = namespaceVars[varName];
                const fullVarName = `${namespace}.${varName}`;
                const valueStr = value.toString();

                // Apply search filter
                if (searchFilter && !fullVarName.toLowerCase().includes(searchFilter.toLowerCase()) &&
                    !valueStr.toLowerCase().includes(searchFilter.toLowerCase())) {
                    return;
                }

                entries.push(
                    <div key={`${namespace}.${varName}`} style={{
                        fontSize: `${fontSize}px`,
                        color: '#fff',
                        marginBottom: '2px',
                        fontFamily: 'monospace',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        padding: '2px 5px',
                        borderRadius: '2px',
                        wordBreak: 'break-all'
                    }}>
                        <span style={{ color: '#4CAF50' }}>{namespace}</span>
                        <span style={{ color: '#fff' }}>.</span>
                        <span style={{ color: '#2196F3' }}>{varName}</span>
                        <span style={{ color: '#fff' }}> = </span>
                        {parseVariableValue(value)}
                    </div>
                );
            });
        });

        return entries;
    };

    if (Object.keys(variables).length === 0) {
        return null;
    }

    return (
        <>
            {/* Toggle Button */}
            <Button
                icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setIsVisible(!isVisible)}
                style={{
                    position: 'fixed',
                    left: isVisible ? panelWidth + 10 : 10,
                    top: 10,
                    zIndex: 1001,
                    transition: 'left 0.3s ease'
                }}
                size="small"
            >
                {isVisible ? 'Hide' : 'Show'} Variables
            </Button>

            {/* Variables Panel */}
            {isVisible && (
                <div style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: panelWidth,
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: 'none',
                    borderRight: '1px solid #444',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Header */}
                    <div style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#fff',
                        padding: '15px 10px 10px 10px',
                        borderBottom: '1px solid #444',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>Variables</span>

                        {/* Search Filter */}
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Input
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                size="small"
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    border: '1px solid #444',
                                    color: '#fff'
                                }}
                                styles={{
                                    input: {
                                        backgroundColor: 'transparent',
                                        color: '#fff'
                                    }
                                }}
                            />
                            {!searchFilter && (
                                <div style={{
                                    position: 'absolute',
                                    left: '11px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#666',
                                    fontSize: '12px',
                                    pointerEvents: 'none',
                                    fontFamily: 'inherit'
                                }}>
                                    search variables
                                </div>
                            )}
                        </div>

                        {/* Font Size Controls */}
                        <div style={{ display: 'flex', gap: '2px' }}>
                            <Tooltip title="debiggen variables">
                                <Button
                                    icon={<MinusOutlined />}
                                    size="small"
                                    onClick={() => setFontSize(Math.max(8, fontSize - 1))}
                                    style={{
                                        minWidth: '24px',
                                        height: '24px',
                                        padding: '0',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        border: '1px solid #444',
                                        color: '#fff'
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title="embiggen variables">
                                <Button
                                    icon={<PlusOutlined />}
                                    size="small"
                                    onClick={() => setFontSize(Math.min(20, fontSize + 1))}
                                    style={{
                                        minWidth: '24px',
                                        height: '24px',
                                        padding: '0',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        border: '1px solid #444',
                                        color: '#fff'
                                    }}
                                />
                            </Tooltip>
                        </div>
                    </div>

                    {/* Variables List */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '10px'
                    }}>
                        {renderVariables()}
                    </div>

                    {/* Resize Handle */}
                    <div
                        onMouseDown={handleMouseDown}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            width: '5px',
                            height: '100%',
                            cursor: 'col-resize',
                            backgroundColor: isResizing ? '#555' : 'transparent',
                            borderRight: '1px solid #666'
                        }}
                    />
                </div>
            )}
        </>
    );
}

export default VariablesPanel;
