import { useEffect, useState } from "react";
import { Button, Input, Tooltip } from "antd";
import { EyeOutlined, EyeInvisibleOutlined, PlusOutlined, MinusOutlined, HistoryOutlined, SearchOutlined, UnorderedListOutlined, AppstoreOutlined } from "@ant-design/icons";

interface VariablesPanelProps {
    project: any;
    currentNode: any;
    onWidthChange: (width: number) => void;
    showPrevious: boolean;
    onTogglePrevious: () => void;
    hasPreviousChoice: boolean;
    isVisible: boolean;
    onToggleVisibility: () => void;
    onToggleSearchPanel: () => void;
    isSearchPanelVisible: boolean;
}

function VariablesPanel(props: VariablesPanelProps) {
    const [variables, setVariables] = useState<any>({});
    const [panelWidth, setPanelWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);
    const [searchFilter, setSearchFilter] = useState("");
    const [fontSize, setFontSize] = useState(12);
    const [isGroupedView, setIsGroupedView] = useState(false);

    useEffect(() => {
        if (props.project) {
            setVariables(props.project.variables || {});
        }
    }, [props.project, props.currentNode]);

    useEffect(() => {
        props.onWidthChange(props.isVisible ? panelWidth : 0);
    }, [props.isVisible, panelWidth, props]);

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

    const parseVariableValue = (value: any) => {
        const valueStr = value.toString();

        // Handle boolean values first (check actual boolean type)
        if (typeof value === 'boolean') {
            return <span style={{ color: value ? '#00ff00' : '#ff0000' }}>{valueStr}</span>;
        }

        // Check if the value contains expressions like "TestFlowVariables.TestPlayerHitPoints+1"
        const expressionRegex = /([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)([\+\-\*\/])(\d+)/;
        const match = valueStr.match(expressionRegex);

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
        if (typeof value === 'number' || /^\d+$/.test(valueStr)) {
            return <span style={{ color: '#999' }}>{valueStr}</span>;
        }

        // Handle boolean string values (for string representations - both lowercase and capitalized)
        if (valueStr.toLowerCase() === 'true') {
            return <span style={{ color: '#00ff00' }}>{valueStr}</span>; // Green for true
        }
        if (valueStr.toLowerCase() === 'false') {
            return <span style={{ color: '#ff0000' }}>{valueStr}</span>; // Red for false
        }

        // Handle string values
        return <span style={{ color: '#CE93D8' }}>{valueStr}</span>;
    };

    const renderVariablesFlat = () => {
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

    const renderVariablesGrouped = () => {
        const entries: JSX.Element[] = [];

        Object.keys(variables).forEach(namespace => {
            const namespaceVars = variables[namespace];

            // Check if any variables in this namespace match the search filter
            const hasMatchingVars = Object.keys(namespaceVars).some(varName => {
                const value = namespaceVars[varName];
                const fullVarName = `${namespace}.${varName}`;
                const valueStr = value.toString();

                return !searchFilter ||
                       fullVarName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                       valueStr.toLowerCase().includes(searchFilter.toLowerCase());
            });

            if (!hasMatchingVars) return;

            // Add namespace header
            entries.push(
                <div key={`header-${namespace}`} style={{
                    fontSize: `${fontSize + 1}px`,
                    color: '#4CAF50',
                    fontWeight: 'bold',
                    marginTop: entries.length > 0 ? '10px' : '0px',
                    marginBottom: '5px',
                    fontFamily: 'monospace',
                    borderBottom: '1px solid #4CAF50',
                    paddingBottom: '2px'
                }}>
                    {namespace}
                </div>
            );

            // Add variables in this namespace
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
                        marginLeft: '15px',
                        fontFamily: 'monospace',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        padding: '2px 5px',
                        borderRadius: '2px',
                        wordBreak: 'break-all'
                    }}>
                        <span style={{ color: '#2196F3' }}>{varName}</span>
                        <span style={{ color: '#fff' }}> = </span>
                        {parseVariableValue(value)}
                    </div>
                );
            });
        });

        return entries;
    };

    const renderVariables = () => {
        return isGroupedView ? renderVariablesGrouped() : renderVariablesFlat();
    };

    if (Object.keys(variables).length === 0) {
        return null;
    }

    return (
        <>
            {/* Only show buttons when search panel is not visible */}
            {!props.isSearchPanelVisible && (
                <>
                    {/* Variables Toggle Button */}
                    <Button
                        icon={props.isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        onClick={props.onToggleVisibility}
                        style={{
                            position: 'fixed',
                            left: props.isVisible ? panelWidth + 10 : 10,
                            top: 10,
                            zIndex: 1001,
                            transition: 'left 0.3s ease'
                        }}
                        size="small"
                    >
                        {props.isVisible ? 'Hide' : 'Show'} Variables
                    </Button>

                    {/* Search Nodes Button - always visible when search panel is not open */}
                    <Button
                        icon={<SearchOutlined />}
                        onClick={props.onToggleSearchPanel}
                        style={{
                            position: 'fixed',
                            left: props.isVisible ? panelWidth + 10 : 10,
                            top: 45,
                            zIndex: 1001,
                            transition: 'left 0.3s ease'
                        }}
                        size="small"
                    >
                        Search Nodes
                    </Button>

                    {/* Show Previous Button - only when variables panel is visible */}
                    {props.isVisible && props.hasPreviousChoice && (
                        <Button
                            icon={<HistoryOutlined />}
                            onClick={props.onTogglePrevious}
                            style={{
                                position: 'fixed',
                                left: props.isVisible ? panelWidth + 10 : 10,
                                top: 80,
                                zIndex: 1001,
                                transition: 'left 0.3s ease'
                            }}
                            size="small"
                        >
                            {props.showPrevious ? 'Hide' : 'Show'} Previous
                        </Button>
                    )}
                </>
            )}

            {/* Variables Panel */}
            {props.isVisible && (
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

                        {/* View Toggle and Font Size Controls */}
                        <div style={{ display: 'flex', gap: '2px' }}>
                            <Tooltip title={isGroupedView ? "Switch to flat view" : "Switch to grouped view"}>
                                <Button
                                    icon={isGroupedView ? <UnorderedListOutlined /> : <AppstoreOutlined />}
                                    size="small"
                                    onClick={() => setIsGroupedView(!isGroupedView)}
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
