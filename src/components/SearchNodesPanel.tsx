import { useEffect, useState } from "react";
import { Button, Input, Tooltip } from "antd";
import { EyeInvisibleOutlined, PlusOutlined, MinusOutlined, EyeOutlined } from "@ant-design/icons";

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
    const [panelWidth, setPanelWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedResultIndex, setSelectedResultIndex] = useState(0);
    const [fontSize, setFontSize] = useState(12);

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
                const newWidth = Math.max(300, Math.min(800, e.clientX));
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (searchResults.length === 0) return;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                setSelectedResultIndex(prev => 
                    prev > 0 ? prev - 1 : searchResults.length - 1
                );
                break;
            case 'ArrowDown':
                e.preventDefault();
                setSelectedResultIndex(prev => 
                    prev < searchResults.length - 1 ? prev + 1 : 0
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (searchResults[selectedResultIndex]) {
                    props.onNavigateToNode(searchResults[selectedResultIndex].node.Properties.Id);
                }
                break;
        }
    };

    const handleResultClick = (index: number) => {
        setSelectedResultIndex(index);
        props.onNavigateToNode(searchResults[index].node.Properties.Id);
    };

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(20, prev + 1));
    };

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(8, prev - 1));
    };

    const highlightSearchTerm = (text: string, term: string): JSX.Element => {
        if (!term.trim()) return <span>{text}</span>;
        
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        
        return (
            <span>
                {parts.map((part, index) => 
                    regex.test(part) ? (
                        <span key={index} style={{ backgroundColor: '#faad14', color: '#000' }}>
                            {part}
                        </span>
                    ) : (
                        <span key={index}>{part}</span>
                    )
                )}
            </span>
        );
    };

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

            {/* Search Panel */}
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
                        
                        {/* Font Size Controls */}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                            <Tooltip title="Decrease font size">
                                <Button
                                    icon={<MinusOutlined />}
                                    size="small"
                                    onClick={decreaseFontSize}
                                    style={{ width: '24px', height: '24px' }}
                                />
                            </Tooltip>
                            <Tooltip title="Increase font size">
                                <Button
                                    icon={<PlusOutlined />}
                                    size="small"
                                    onClick={increaseFontSize}
                                    style={{ width: '24px', height: '24px' }}
                                />
                            </Tooltip>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div style={{ padding: '10px' }}>
                        <Input
                            placeholder="search nodes"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid #444',
                                color: '#fff'
                            }}
                            className="search-nodes-input"
                            size="small"
                            autoFocus
                        />
                        {searchResults.length > 0 && (
                            <div style={{
                                marginTop: '8px',
                                fontSize: '12px',
                                color: '#666'
                            }}>
                                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                            </div>
                        )}
                    </div>

                    {/* Search Results */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        color: '#fff'
                    }}>
                        {searchResults.map((result, index) => (
                            <div
                                key={result.node.Properties.Id}
                                onClick={() => handleResultClick(index)}
                                style={{
                                    padding: '12px',
                                    borderBottom: '1px solid #333',
                                    cursor: 'pointer',
                                    backgroundColor: index === selectedResultIndex ? 'rgba(24, 144, 255, 0.2)' : 'transparent',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={() => setSelectedResultIndex(index)}
                            >
                                <div style={{
                                    fontSize: `${fontSize}px`,
                                    fontWeight: 'bold',
                                    color: '#1890ff',
                                    marginBottom: '4px'
                                }}>
                                    {result.node.Properties.DisplayName || result.node.Type}
                                </div>
                                <div style={{
                                    fontSize: `${Math.max(10, fontSize - 2)}px`,
                                    color: '#999',
                                    marginBottom: '4px'
                                }}>
                                    ID: {result.node.Properties.Id} • Type: {result.node.Type}
                                </div>
                                <div style={{
                                    fontSize: `${Math.max(10, fontSize - 1)}px`,
                                    color: '#ccc',
                                    lineHeight: '1.4'
                                }}>
                                    {highlightSearchTerm(result.preview, searchTerm)}
                                </div>
                            </div>
                        ))}
                        
                        {searchTerm.trim() && searchResults.length === 0 && (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#666',
                                fontStyle: 'italic'
                            }}>
                                No nodes found matching "{searchTerm}"
                            </div>
                        )}
                        
                        {!searchTerm.trim() && (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#666',
                                fontStyle: 'italic'
                            }}>
                                Enter a search term to find nodes
                            </div>
                        )}
                    </div>

                    {/* Resize Handle */}
                    <div
                        onMouseDown={handleMouseDown}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            width: '4px',
                            height: '100%',
                            cursor: 'col-resize',
                            backgroundColor: isResizing ? '#1890ff' : 'transparent',
                            transition: 'background-color 0.2s'
                        }}
                    />
                </div>
            )}
        </>
    );
}

export default SearchNodesPanel;
