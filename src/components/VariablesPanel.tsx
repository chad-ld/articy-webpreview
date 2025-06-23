import { useEffect, useState, useRef, useCallback } from "react";
import { Button, Input, Tooltip, Dropdown, Checkbox, message } from "antd";

import { EyeOutlined, EyeInvisibleOutlined, PlusOutlined, MinusOutlined, SearchOutlined, UnorderedListOutlined, AppstoreOutlined, BookOutlined, DownOutlined, EditOutlined, UploadOutlined } from "@ant-design/icons";

interface StoryModeSettings {
    enabled: boolean;
    hideInstructions: boolean;
    hideConditions: boolean;
    hideInactiveChoices: boolean;
    hidePreviousChoices: boolean;
    hideDebugInfo: boolean;
}

interface VariablesPanelProps {
    project: any;
    currentNode: any;
    onWidthChange: (width: number) => void;
    onVariableUpdate?: () => void; // Callback to trigger re-render when variables change
    onEditingStateChange?: (isEditing: boolean) => void; // Callback to notify parent when editing state changes
    // showPrevious, onTogglePrevious, hasPreviousChoice - REMOVED: Previous choice visibility now controlled via Story Mode dropdown
    isVisible: boolean;
    onToggleVisibility: () => void;
    onToggleSearchPanel: () => void;
    isSearchPanelVisible: boolean;
    storyOnlyMode: boolean;
    storyModeSettings: StoryModeSettings;
    tempStoryModeSettings: Omit<StoryModeSettings, 'enabled'>;
    onToggleStoryOnlyMode: () => void;
    onTempStoryModeSettingChange: (setting: keyof Omit<StoryModeSettings, 'enabled'>, value: boolean) => void;
    onStoryModeApply: () => void;
    onStoryModePreset: (preset: 'all' | 'none') => void;
    onDropdownOpenChange: (open: boolean) => void;
    dropdownOpen: boolean;
}

function VariablesPanel(props: VariablesPanelProps) {
    const [variables, setVariables] = useState<any>({});
    const [panelWidth, setPanelWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);
    const [searchFilter, setSearchFilter] = useState("");
    const [fontSize, setFontSize] = useState(12);
    const [isGroupedView, setIsGroupedView] = useState(false);

    // Edit mode state
    const [editingVariable, setEditingVariable] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedVariable, setSelectedVariable] = useState<string | null>(null);

    // Touch/mobile support
    const longPressTimer = useRef<number | null>(null);
    const isTouchDevice = 'ontouchstart' in window;

    // Drag and drop state
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessingFile, setIsProcessingFile] = useState(false);

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

    // Helper functions for variable editing
    const startEdit = (variablePath: string, currentValue: any) => {
        setEditingVariable(variablePath);
        setEditValue(String(currentValue));
        setContextMenuVisible(false);

        // Notify parent that editing has started
        if (props.onEditingStateChange) {
            props.onEditingStateChange(true);
        }
    };

    const cancelEdit = () => {
        setEditingVariable(null);
        setEditValue("");

        // Notify parent that editing has ended
        if (props.onEditingStateChange) {
            props.onEditingStateChange(false);
        }
    };

    const saveEdit = (variablePath: string) => {
        if (!props.project || editingVariable !== variablePath) return;

        const pathParts = variablePath.split('.');
        let convertedValue: any = editValue;

        // Try to convert to appropriate type
        if (editValue.toLowerCase() === 'true') {
            convertedValue = true;
        } else if (editValue.toLowerCase() === 'false') {
            convertedValue = false;
        } else if (!isNaN(Number(editValue)) && editValue.trim() !== '') {
            convertedValue = Number(editValue);
        }

        console.log(`🔧 VariablesPanel: Saving variable edit: ${variablePath} = ${convertedValue} (type: ${typeof convertedValue})`);

        // Update the variable in the project
        props.project.UpdateVariableDirectly(pathParts, convertedValue);

        // Update local state immediately
        const newVariables = { ...props.project.variables };
        setVariables(newVariables);

        console.log(`✅ VariablesPanel: Variable updated successfully, local state refreshed`);

        // Notify parent component (optional, for other components that might need to update)
        if (props.onVariableUpdate) {
            props.onVariableUpdate();
        }

        cancelEdit();
    };

    // Context menu and touch handlers
    const handleContextMenu = (e: React.MouseEvent, variablePath: string, _currentValue: any) => {
        e.preventDefault();
        setSelectedVariable(variablePath);
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setContextMenuVisible(true);
    };

    const handleLongPressStart = (variablePath: string, currentValue: any) => {
        if (!isTouchDevice) return;

        longPressTimer.current = setTimeout(() => {
            startEdit(variablePath, currentValue);
        }, 500);
    };

    const handleLongPressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set drag over to false if we're leaving the panel entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length === 0) {
            message.error('No files dropped');
            return;
        }

        if (files.length > 1) {
            message.error('Please drop only one file at a time');
            return;
        }

        const file = files[0];
        await processVariableFile(file);
    }, []);

    // File processing function
    const processVariableFile = useCallback(async (file: File) => {
        // Validate file type
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.txt', '.csv'];
        const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));

        if (!isValidFile) {
            message.error(`Invalid file type. Please use ${validExtensions.join(' or ')} files.`);
            return;
        }

        setIsProcessingFile(true);

        try {
            // Read file content
            const content = await readFileAsText(file);

            // Parse and update variables
            const result = await parseAndUpdateVariables(content, fileName.endsWith('.csv'));

            // Show success message
            if (result.successCount > 0) {
                message.success(`Successfully updated ${result.successCount} variable(s)${result.errorCount > 0 ? ` (${result.errorCount} errors)` : ''}`);
            }

            if (result.errorCount > 0 && result.successCount === 0) {
                message.error(`Failed to update variables. ${result.errorCount} error(s) encountered.`);
            }

            // Trigger re-render if variables were updated
            if (result.successCount > 0 && props.onVariableUpdate) {
                props.onVariableUpdate();
            }

        } catch (error) {
            console.error('❌ Error processing variable file:', error);
            message.error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsProcessingFile(false);
        }
    }, [props]);

    // Read file as text
    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };

    // Parse and update variables from file content
    const parseAndUpdateVariables = useCallback(async (content: string, isCSV: boolean): Promise<{successCount: number, errorCount: number}> => {
        let successCount = 0;
        let errorCount = 0;
        const lines = content.split(/\r?\n/);

        console.log(`🔧 VariablesPanel: Processing ${lines.length} lines from ${isCSV ? 'CSV' : 'text'} file`);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines and comments
            if (line.length === 0 || line.startsWith('//') || line.startsWith('#')) {
                continue;
            }

            try {
                let variablePath: string;
                let value: any;

                if (isCSV) {
                    // Parse CSV format: "VariableName","Value" or VariableName,Value
                    const csvMatch = line.match(/^"?([^",]+)"?\s*,\s*"?([^"]*)"?$/);
                    if (csvMatch) {
                        variablePath = csvMatch[1].trim();
                        value = csvMatch[2].trim();
                    } else {
                        throw new Error(`Invalid CSV format on line ${i + 1}: ${line}`);
                    }
                } else {
                    // Parse text format: VariableName = Value
                    const textMatch = line.match(/^([^=]+)\s*=\s*(.*)$/);
                    if (textMatch) {
                        variablePath = textMatch[1].trim();
                        value = textMatch[2].trim();
                    } else {
                        throw new Error(`Invalid format on line ${i + 1}: ${line}`);
                    }
                }

                // Convert value to appropriate type
                const convertedValue = convertStringValue(value);

                // Split variable path into namespace and variable name
                const pathParts = variablePath.split('.');
                if (pathParts.length < 2) {
                    throw new Error(`Invalid variable path on line ${i + 1}: ${variablePath} (must include namespace)`);
                }

                // Update the variable using the existing method
                if (props.project) {
                    props.project.UpdateVariableDirectly(pathParts, convertedValue);
                    console.log(`✅ Updated variable: ${variablePath} = ${convertedValue} (type: ${typeof convertedValue})`);
                    successCount++;
                } else {
                    throw new Error('No project available for variable update');
                }

            } catch (error) {
                console.error(`❌ Error processing line ${i + 1}:`, error instanceof Error ? error.message : 'Unknown error');
                errorCount++;
            }
        }

        // Update local variables state to reflect changes
        if (successCount > 0 && props.project) {
            setVariables({ ...props.project.variables });
        }

        console.log(`🔧 VariablesPanel: File processing complete. Success: ${successCount}, Errors: ${errorCount}`);
        return { successCount, errorCount };
    }, [props.project]);

    // Convert string value to appropriate type (boolean, number, or string)
    const convertStringValue = (value: string): any => {
        // Remove quotes if present
        const trimmedValue = value.replace(/^["']|["']$/g, '');

        // Convert boolean values
        if (trimmedValue.toLowerCase() === 'true') {
            return true;
        } else if (trimmedValue.toLowerCase() === 'false') {
            return false;
        }

        // Convert numeric values
        if (!isNaN(Number(trimmedValue)) && trimmedValue.trim() !== '') {
            return Number(trimmedValue);
        }

        // Return as string
        return trimmedValue;
    };

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenuVisible(false);
        };

        if (contextMenuVisible) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenuVisible]);

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

    // Helper to render a single variable row with edit support
    const renderVariableRow = (namespace: string, varName: string, value: any, isGrouped: boolean = false) => {
        const variablePath = `${namespace}.${varName}`;
        const isEditing = editingVariable === variablePath;

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                saveEdit(variablePath);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                cancelEdit();
            }
        };

        const rowStyle = {
            fontSize: `${fontSize}px`,
            color: '#fff',
            marginBottom: '2px',
            marginLeft: isGrouped ? '15px' : '0px',
            fontFamily: 'monospace',
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '2px 5px',
            borderRadius: '2px',
            wordBreak: 'break-all' as const,
            cursor: 'context-menu',
            position: 'relative' as const
        };

        return (
            <div
                key={variablePath}
                style={rowStyle}
                onContextMenu={(e) => handleContextMenu(e, variablePath, value)}
                onTouchStart={() => handleLongPressStart(variablePath, value)}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
            >
                {!isGrouped && (
                    <>
                        <span style={{ color: '#4CAF50' }}>{namespace}</span>
                        <span style={{ color: '#fff' }}>.</span>
                    </>
                )}
                <span style={{ color: '#2196F3' }}>{varName}</span>
                <span style={{ color: '#fff' }}> = </span>
                {isEditing ? (
                    <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => saveEdit(variablePath)}
                        autoFocus
                        size="small"
                        style={{
                            width: '120px',
                            fontSize: `${fontSize}px`,
                            fontFamily: 'monospace',
                            display: 'inline-block',
                            verticalAlign: 'baseline'
                        }}
                    />
                ) : (
                    parseVariableValue(value)
                )}
            </div>
        );
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

                entries.push(renderVariableRow(namespace, varName, value, false));
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

                entries.push(renderVariableRow(namespace, varName, value, true));
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

                    {/* Story Only Split Button - below Search Nodes */}
                    <div style={{
                        position: 'fixed',
                        left: props.isVisible ? panelWidth + 10 : 10,
                        top: 80,
                        zIndex: 1001,
                        transition: 'left 0.3s ease',
                        display: 'flex'
                    }}>
                        {/* Main Story Only Button */}
                        <Button
                            icon={<BookOutlined />}
                            onClick={props.onToggleStoryOnlyMode}
                            style={{
                                backgroundColor: props.storyModeSettings.enabled ? '#1890ff' : undefined,
                                borderTopColor: props.storyModeSettings.enabled ? '#1890ff' : undefined,
                                borderBottomColor: props.storyModeSettings.enabled ? '#1890ff' : undefined,
                                borderLeftColor: props.storyModeSettings.enabled ? '#1890ff' : undefined,
                                borderRightColor: 'transparent',
                                color: props.storyModeSettings.enabled ? '#fff' : undefined,
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                                borderRightWidth: 0
                            }}
                            size="small"
                        >
                            Story Only
                        </Button>

                        {/* Dropdown Arrow Button */}
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'hideInstructions',
                                        label: (
                                            <Checkbox
                                                checked={props.tempStoryModeSettings.hideInstructions}
                                                onChange={(e) => props.onTempStoryModeSettingChange('hideInstructions', e.target.checked)}
                                            >
                                                Hide Instructions
                                            </Checkbox>
                                        ),
                                    },
                                    {
                                        key: 'hideConditions',
                                        label: (
                                            <Checkbox
                                                checked={props.tempStoryModeSettings.hideConditions}
                                                onChange={(e) => props.onTempStoryModeSettingChange('hideConditions', e.target.checked)}
                                            >
                                                Hide Conditions
                                            </Checkbox>
                                        ),
                                    },
                                    {
                                        key: 'hideInactiveChoices',
                                        label: (
                                            <Checkbox
                                                checked={props.tempStoryModeSettings.hideInactiveChoices}
                                                onChange={(e) => props.onTempStoryModeSettingChange('hideInactiveChoices', e.target.checked)}
                                            >
                                                Hide Inactive Choices
                                            </Checkbox>
                                        ),
                                    },
                                    {
                                        key: 'hidePreviousChoices',
                                        label: (
                                            <Checkbox
                                                checked={props.tempStoryModeSettings.hidePreviousChoices}
                                                onChange={(e) => props.onTempStoryModeSettingChange('hidePreviousChoices', e.target.checked)}
                                            >
                                                Hide Previous Choices
                                            </Checkbox>
                                        ),
                                    },
                                    {
                                        key: 'hideDebugInfo',
                                        label: (
                                            <Checkbox
                                                checked={props.tempStoryModeSettings.hideDebugInfo}
                                                onChange={(e) => props.onTempStoryModeSettingChange('hideDebugInfo', e.target.checked)}
                                            >
                                                Hide Debug Info
                                            </Checkbox>
                                        ),
                                    },
                                    {
                                        type: 'divider',
                                    },
                                    {
                                        key: 'hideAll',
                                        label: (
                                            <span>
                                                <EyeInvisibleOutlined style={{ marginRight: '8px' }} />
                                                Hide All
                                            </span>
                                        ),
                                        onClick: () => props.onStoryModePreset('all'),
                                    },
                                    {
                                        key: 'showEverything',
                                        label: '👁 Show Everything',
                                        onClick: () => props.onStoryModePreset('none'),
                                    },
                                    {
                                        type: 'divider',
                                    },
                                    {
                                        key: 'apply',
                                        label: (
                                            <Button
                                                type="primary"
                                                size="small"
                                                onClick={props.onStoryModeApply}
                                                style={{ width: '100%' }}
                                            >
                                                Apply
                                            </Button>
                                        ),
                                    },
                                ],
                            }}
                            trigger={['click']}
                            placement="bottomLeft"
                            open={props.dropdownOpen}
                            onOpenChange={props.onDropdownOpenChange}
                        >
                            <Button
                                icon={<DownOutlined />}
                                style={{
                                    backgroundColor: props.storyModeSettings.enabled ? '#1890ff' : undefined,
                                    borderTopColor: props.storyModeSettings.enabled ? '#1890ff' : undefined,
                                    borderBottomColor: props.storyModeSettings.enabled ? '#1890ff' : undefined,
                                    borderRightColor: props.storyModeSettings.enabled ? '#1890ff' : undefined,
                                    borderLeftColor: 'transparent',
                                    color: props.storyModeSettings.enabled ? '#fff' : undefined,
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0,
                                    borderLeftWidth: 0,
                                    minWidth: '24px',
                                    padding: '0 4px'
                                }}
                                size="small"
                            />
                        </Dropdown>
                    </div>

                    {/* Show Previous Button - REMOVED: Previous choice visibility is now controlled via Story Mode dropdown */}
                </>
            )}

            {/* Variables Panel */}
            {props.isVisible && (
                <div
                    style={{
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: panelWidth,
                        height: '100vh',
                        backgroundColor: isDragOver ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.9)',
                        border: 'none',
                        borderRight: isDragOver ? '2px solid #1890ff' : '1px solid #444',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease'
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                >
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
                        padding: '10px',
                        position: 'relative'
                    }}>
                        {/* Drag-over indicator */}
                        {isDragOver && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(24, 144, 255, 0.1)',
                                border: '2px dashed #1890ff',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                pointerEvents: 'none'
                            }}>
                                <div style={{
                                    color: '#1890ff',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                }}>
                                    <UploadOutlined style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }} />
                                    Drop variable file here
                                    <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                                        Supports .txt and .csv files
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Processing indicator */}
                        {isProcessingFile && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10
                            }}>
                                <div style={{
                                    color: '#fff',
                                    fontSize: '16px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ marginBottom: '8px' }}>Processing variables...</div>
                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                        Please wait while we update your variables
                                    </div>
                                </div>
                            </div>
                        )}

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

            {/* Context Menu */}
            {contextMenuVisible && selectedVariable && (
                <div
                    style={{
                        position: 'fixed',
                        left: contextMenuPosition.x,
                        top: contextMenuPosition.y,
                        backgroundColor: '#1f1f1f',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        padding: '4px 0',
                        zIndex: 2000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        style={{
                            padding: '6px 12px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onClick={() => {
                            const pathParts = selectedVariable.split('.');
                            const namespace = pathParts[0];
                            const varName = pathParts[1];
                            const currentValue = variables[namespace]?.[varName];
                            startEdit(selectedVariable, currentValue);
                        }}
                        onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = '#333';
                        }}
                        onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                    >
                        <EditOutlined />
                        Edit Value
                    </div>
                </div>
            )}
        </>
    );
}

export default VariablesPanel;
