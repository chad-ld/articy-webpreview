import { useEffect, useState } from "react";
import { Button, Input, Tooltip } from "antd";
import { SearchOutlined, EyeInvisibleOutlined, PlusOutlined, MinusOutlined, EyeOutlined } from "@ant-design/icons";

interface SearchNodesPanelProps {
    project: any;
    currentNode: any;
    onWidthChange: (width: number) => void;
    onNavigateToNode: (nodeId: string) => void;
    isVisible: boolean;
    onToggleVisibility: () => void;
    onToggleVariablesPanel: () => void;
    isVariablesPanelVisible: boolean;
}

function SearchNodesPanel(props: SearchNodesPanelProps) {
    const [panelWidth, setPanelWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [fontSize, setFontSize] = useState(12);
    const [selectedResultIndex, setSelectedResultIndex] = useState(0);

    useEffect(() => {
        props.onWidthChange(props.isVisible ? panelWidth : 0);
    }, [props.isVisible, panelWidth, props]);

    useEffect(() => {
        // Perform search when search term changes
        if (props.project && searchTerm.trim().length > 0) {
            const results = props.project.SearchNodes(searchTerm);
            setSearchResults(results);
            setSelectedResultIndex(0);
        } else {
            setSearchResults([]);
            setSelectedResultIndex(0);
        }
    }, [searchTerm, props.project]);

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

    const handleGoToNode = (nodeId: string) => {
        props.onNavigateToNode(nodeId);
    };

    const handleResultDoubleClick = (nodeId: string) => {
        handleGoToNode(nodeId);
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchResults.length > 0) {
            handleGoToNode(searchResults[selectedResultIndex].node.Properties.Id);
        }
    };

    const renderSearchResults = () => {
        if (searchTerm.trim().length === 0) {
            return (
                <div style={{
                    color: '#666',
                    fontSize: '14px',
                    textAlign: 'center',
                    marginTop: '20px',
                    fontStyle: 'italic'
                }}>
                    Enter search terms to find nodes
                </div>
            );
        }

        if (searchResults.length === 0) {
            return (
                <div style={{
                    color: '#666',
                    fontSize: '14px',
                    textAlign: 'center',
                    marginTop: '20px',
                    fontStyle: 'italic'
                }}>
                    No nodes found matching "{searchTerm}"
                </div>
            );
        }

        return searchResults.map((result, index) => (
            <div
                key={result.node.Properties.Id}
                onDoubleClick={() => handleResultDoubleClick(result.node.Properties.Id)}
                style={{
                    fontSize: `${fontSize}px`,
                    color: '#fff',
                    marginBottom: '8px',
                    fontFamily: 'monospace',
                    backgroundColor: index === selectedResultIndex ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: index === selectedResultIndex ? '1px solid #555' : '1px solid transparent',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={() => setSelectedResultIndex(index)}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '4px'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            color: '#4CAF50',
                            fontSize: `${fontSize - 1}px`,
                            fontWeight: 'bold'
                        }}>
                            {result.node.Type}
                        </div>
                        <div style={{
                            color: '#2196F3',
                            fontSize: `${fontSize - 1}px`,
                            wordBreak: 'break-all'
                        }}>
                            {result.node.Properties.DisplayName || 'Unnamed'}
                        </div>
                    </div>
                    <Button
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleGoToNode(result.node.Properties.Id);
                        }}
                        style={{
                            fontSize: '10px',
                            height: '20px',
                            padding: '0 6px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            border: '1px solid #444',
                            color: '#fff'
                        }}
                    >
                        Go
                    </Button>
                </div>
                <div style={{
                    color: '#ccc',
                    fontSize: `${fontSize - 2}px`,
                    lineHeight: '1.3',
                    wordBreak: 'break-word'
                }}>
                    {result.preview}
                </div>
            </div>
        ));
    };

    if (!props.project) {
        return null;
    }

    return (
        <>
            {/* Only show buttons when this panel is visible and variables panel is not visible */}
            {props.isVisible && !props.isVariablesPanelVisible && (
                <>
                    {/* Toggle Button */}
                    <Button
                        icon={<EyeInvisibleOutlined />}
                        onClick={props.onToggleVisibility}
                        style={{
                            position: 'fixed',
                            left: panelWidth + 10,
                            top: 10,
                            zIndex: 1001,
                            transition: 'left 0.3s ease'
                        }}
                        size="small"
                    >
                        Hide Nodes
                    </Button>

                    {/* Variables Button */}
                    <Button
                        icon={<EyeOutlined />}
                        onClick={props.onToggleVariablesPanel}
                        style={{
                            position: 'fixed',
                            left: panelWidth + 10,
                            top: 45,
                            zIndex: 1001,
                            transition: 'left 0.3s ease'
                        }}
                        size="small"
                    >
                        Show Variables
                    </Button>
                </>
            )}

            {/* Search Nodes Panel */}
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
                        <span>Search Nodes</span>

                        {/* Search Input */}
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleSearchKeyPress}
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
                            {!searchTerm && (
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
                                    search nodes
                                </div>
                            )}
                        </div>

                        {/* Font Size Controls */}
                        <div style={{ display: 'flex', gap: '2px' }}>
                            <Tooltip title="debiggen text">
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
                            <Tooltip title="embiggen text">
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

                    {/* Results List */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '10px'
                    }}>
                        {renderSearchResults()}
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

export default SearchNodesPanel;
