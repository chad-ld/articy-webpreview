import packageJson from "../package.json";
import React, { useEffect, useState, useRef, createRef } from "react";
import ArticyProject from "./ArticyProject";
import InstructionPanel from "./panels/InstructionPanel";
import EndOfFlowPanel from "./panels/EndOfFlowPanel";
import VariablesPanel from "./components/VariablesPanel";
import SearchNodesPanel from "./components/SearchNodesPanel";
import { Button, message } from "antd";
import { InboxOutlined, CommentOutlined } from "@ant-design/icons";

// Interface for tracking previous choices
interface PreviousChoice {
    node: any;
    choiceText: string;
    choiceTitle?: string;
    color?: { r: number; g: number; b: number };
    nodeList: any[];
    variables: any;
    fromMultiChoice?: boolean; // Track if this choice came from a multi-choice screen
}

// Component for displaying previous choice
function PreviousChoiceDisplay({ previousChoice, onBack, selected = false }: { previousChoice: PreviousChoice, onBack: () => void, selected?: boolean }) {
    // Convert Articy color (0.0-1.0) to CSS RGB (0-255) and create darker background
    const getColors = () => {
        if (previousChoice.color) {
            const r = Math.round(previousChoice.color.r * 255);
            const g = Math.round(previousChoice.color.g * 255);
            const b = Math.round(previousChoice.color.b * 255);

            // Frame/border color (original color but greyed out)
            const frameColor = `rgba(${r}, ${g}, ${b}, 0.5)`;

            // Background color (darker version - about 50% darker and greyed out)
            const darkR = Math.round(r * 0.5);
            const darkG = Math.round(g * 0.5);
            const darkB = Math.round(b * 0.5);
            const backgroundColor = `rgba(${darkR}, ${darkG}, ${darkB}, 0.5)`;

            // Calculate relative luminance to determine text color
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            const headerTextColor = luminance > 0.5 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';

            return { frameColor, backgroundColor, headerTextColor };
        }
        // Default colors (teal is light, so use black text)
        return {
            frameColor: 'rgba(147, 193, 204, 0.5)',
            backgroundColor: 'rgba(73, 96, 102, 0.5)',
            headerTextColor: 'rgba(0,0,0,0.6)'
        };
    };

    const { frameColor, backgroundColor, headerTextColor } = getColors();

    return (
        <div style={{ marginBottom: '20px' }}>
            <h3 style={{
                color: '#999',
                fontSize: '16px',
                marginBottom: '10px',
                fontWeight: 'normal'
            }}>
                Previous Choice
            </h3>
            <div className="node" style={{
                opacity: 0.6,
                filter: 'grayscale(30%)',
                pointerEvents: 'none',
                // Apply golden selection style to entire node container
                boxShadow: selected ? '0 0 0 3px rgba(255, 193, 7, 0.6)' : 'none',
                borderRadius: '4px'
            }}>
                {previousChoice.choiceTitle && (
                    <div
                        className="articy-node-header"
                        style={{
                            backgroundColor: frameColor,
                            borderColor: frameColor,
                            color: headerTextColor
                        }}
                    >
                        {previousChoice.choiceTitle}
                    </div>
                )}
                <div style={{
                    border: `2px solid ${frameColor}`,
                    backgroundColor: backgroundColor,
                    color: 'rgba(255,255,255,0.6)',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    lineHeight: '1.4'
                }}>
                    {previousChoice.choiceText}
                </div>
            </div>
            <Button
                onClick={onBack}
                style={{ marginTop: '10px' }}
                size="small"
            >
                Back
            </Button>
        </div>
    );
}

// Component for condition bubbles with notches
function ConditionBubble({ condition, nodeRef, disabled }: { condition: string, nodeRef: React.RefObject<HTMLDivElement>, disabled: boolean }) {
    const [position, setPosition] = useState({ top: 0, left: -10 }); // Set to -10 for close positioning

    useEffect(() => {
        if (nodeRef.current) {
            const rect = nodeRef.current.getBoundingClientRect();
            const containerRect = nodeRef.current.offsetParent?.getBoundingClientRect();
            if (containerRect) {
                setPosition({
                    top: rect.top - containerRect.top + (rect.height / 2) - 15, // Center vertically on the node
                    left: -10 // Set to -10 for close positioning
                });
            }
        }
    }, [nodeRef]);

    // Parse condition to color code like variables panel
    const parseConditionWithColors = (conditionText: string) => {
        // Regex to match different parts: namespace.variable, operators, booleans, numbers
        const regex = /(\w+)(\.)(\w+)(==|!=|>=|<=|>|<)(\btrue\b|\bfalse\b|\d+|"[^"]*")/g;

        return conditionText.replace(regex, (match, namespace, dot, variable, operator, value) => {
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
        left: `${position.left}px`, // Use left positioning (simpler)
        top: `${position.top}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '13px',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        maxWidth: '250px', // 25% wider (was 200px)
        wordBreak: 'break-word',
        zIndex: 1000,
        border: 'none',
        opacity: 1, // Always full opacity, don't grey out
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        textAlign: 'right', // Right-align the text content
        transform: 'translateX(-100%)' // Anchor to right edge - this makes left position act like right position
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
}

// File upload component
function FileUploadArea({ isDragOver, handleDrop, handleDragOver, handleDragEnter, handleDragLeave, handleFileSelect, isLoading }: {
    isDragOver: boolean;
    handleDrop: (e: React.DragEvent) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragEnter: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isLoading: boolean;
}) {
    return (
        <div
            className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
            style={{
                padding: '40px',
                textAlign: 'center',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
        >
            <div style={{ marginBottom: '20px' }}>
                <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </div>
            <h2>Articy Web Viewer</h2>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>
                Drag & drop your Articy JSON export file here, or click to browse
            </p>
            <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-input"
            />
            <Button
                type="primary"
                size="large"
                loading={isLoading}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                {isLoading ? 'Loading...' : 'Select JSON File'}
            </Button>
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                <p>Supported: Articy Draft JSON exports</p>
                <p>No web server required - runs completely locally!</p>
            </div>
        </div>
    );
}

function InteractiveArticyViewer(){

    const [project, setProject] = useState(undefined as unknown as ArticyProject);
    const [nodeList, setNodeList] = useState([] as any[]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [variablesPanelWidth, setVariablesPanelWidth] = useState(0);
    const [searchPanelWidth, setSearchPanelWidth] = useState(0);
    const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);
    const [previousChoiceHistory, setPreviousChoiceHistory] = useState<PreviousChoice[]>([]);
    const [showPrevious, setShowPrevious] = useState(true);
    const [isVariablesPanelVisible, setIsVariablesPanelVisible] = useState(false);
    const [isSearchPanelVisible, setIsSearchPanelVisible] = useState(false);

    var currentNode = nodeList.length>0?nodeList[nodeList.length-1]:undefined;
    var lastNode = nodeList.length>1?nodeList[nodeList.length-2]:undefined;

    useEffect(()=>{
        console.log("%c[Articy HTML Viewer - JSON export] version: "+packageJson.version,
         'color: #ffa619; background: #1c282a; font-size: 20px');
        console.log('Ready for file upload - drag and drop a JSON file or click to browse');
    },[]);

    // Keyboard navigation handler
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle keyboard events when a project is loaded
            if (!project || !currentNode) return;

            // Get current available choices
            const availableChoices = getCurrentAvailableChoices();

            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    if (availableChoices.length > 1) {
                        setSelectedChoiceIndex(prev =>
                            prev > 0 ? prev - 1 : availableChoices.length - 1
                        );
                    }
                    break;

                case 'ArrowDown':
                    event.preventDefault();
                    if (availableChoices.length > 1) {
                        setSelectedChoiceIndex(prev =>
                            prev < availableChoices.length - 1 ? prev + 1 : 0
                        );
                    }
                    break;

                case 'Enter':
                    event.preventDefault();
                    handleEnterKey(availableChoices);
                    break;

                case 'r':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        restartFlow();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [project, currentNode, selectedChoiceIndex]);

    useEffect(()=>{
        if (project != undefined){
            setCurrentNode(project.GetStartNode());
        }
    }, [project]);
      
    useEffect(()=>{
        console.log("currentNode updated:", nodeList[nodeList.length-1]);
        if (currentNode == undefined)
            return;
        //if we are exiting a child node, we should proceed to its output connection
        if (currentNode != undefined && lastNode != undefined){
            //check if node has output pin connections
            if (currentNode.Properties.OutputPins == undefined || lastNode.Properties.OutputPins == undefined)
                return;
            if (currentNode.Properties.OutputPins[0].Connections == undefined)
                return;
            // Add additional safety checks for lastNode properties
            if (lastNode.Properties.OutputPins[0] == undefined ||
                lastNode.Properties.OutputPins[0].Connections == undefined ||
                lastNode.Properties.OutputPins[0].Connections.length === 0)
                return;
            //check if we are exiting children node
            if (lastNode.Properties.OutputPins[0].Connections[0].Target == lastNode.Properties.Parent){
                setTimeout(()=>{
                    setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
                },0);
            }
        }
    }, [nodeList]);

    // Reset selected choice index when node changes
    useEffect(() => {
        // Always start focus on first forward choice (skip previous choice if visible)
        const hasPreviousChoice = showPrevious && previousChoiceHistory.length > 0;
        setSelectedChoiceIndex(hasPreviousChoice ? 1 : 0);
    }, [currentNode, showPrevious, previousChoiceHistory.length]);

    function setCurrentNode(node:any, choiceInfo?: { text: string, title?: string, color?: { r: number; g: number; b: number }, fromMultiChoice?: boolean }){
        // Handle Jump nodes immediately - redirect to target
        if (node.Type === "Jump" && node.Properties.Target) {
            const targetNode = project.GetNodeByID(node.Properties.Target);
            if (targetNode) {
                console.log("🔄 JUMP REDIRECT:", node.Properties.Id, "→", targetNode.Properties.Id);
                // Recursively call setCurrentNode with the target, preserving choice info
                setCurrentNode(targetNode, choiceInfo);
                return;
            }
        }

        // Handle Condition nodes immediately - evaluate and auto-navigate
        if (node.Type === "Condition") {
            // Extract the condition expression (skip comment lines)
            const expression = node.Properties.Expression || "";
            const lines = expression.split('\n');
            const conditionLine = lines.find(line => line.trim() && !line.trim().startsWith('//'));
            const result = conditionLine ? project.CheckConditionString(conditionLine.trim()) : false;
            console.log("🔄 CONDITION EVALUATION:", conditionLine, "→", result);

            // Navigate to appropriate output based on condition result
            if (node.Properties.OutputPins && node.Properties.OutputPins.length >= 2) {
                const targetPin = result ? 0 : 1; // True = first output, False = second output
                if (node.Properties.OutputPins[targetPin] &&
                    node.Properties.OutputPins[targetPin].Connections &&
                    node.Properties.OutputPins[targetPin].Connections.length > 0) {

                    const targetNodeId = node.Properties.OutputPins[targetPin].Connections[0].Target;
                    const targetNode = project.GetNodeByID(targetNodeId);
                    console.log("🔄 CONDITION AUTO-NAVIGATE:", result ? "TRUE" : "FALSE", "→", targetNodeId);

                    // Recursively call setCurrentNode with the target, preserving choice info
                    setCurrentNode(targetNode, choiceInfo);
                    return;
                }
            }
        }

        // Store previous choice if we have choice info and a current node
        if (choiceInfo && currentNode) {
            const previousChoice: PreviousChoice = {
                node: currentNode,
                choiceText: choiceInfo.text,
                choiceTitle: choiceInfo.title,
                color: choiceInfo.color,
                nodeList: [...nodeList],
                variables: project ? { ...project.variables } : {},
                fromMultiChoice: choiceInfo.fromMultiChoice || false
            };
            setPreviousChoiceHistory([...previousChoiceHistory, previousChoice]);
        }

        // Store variables from the CURRENT node before navigating away (if we have a current node)
        if (currentNode && (currentNode.Type == "Instruction" || currentNode.Type == "WaypointTemplate" || currentNode.Type == "PlayerActionTemplate" || currentNode.Type == "AreaEventTemplate" || currentNode.Type == "CraftingTemplate" || currentNode.Type == "CombatTemplate")) {
            console.log("🔄 STORING VARIABLES from node:", currentNode.Properties.Id, currentNode.Type);
            console.log("Node Text:", currentNode.Properties.Text);
            console.log("Node Expression:", currentNode.Properties.Expression);
            project.StoreVariablesFromNode(currentNode);
        }

        // console.log("setting current Node:",node);
        setNodeList([...nodeList,node]);
    }

    function restartFlow(){
        // Reset variables to their initial state
        if (project) {
            project.ResetVariablesToInitialState();
        }

        setNodeList([]);
        setPreviousChoiceHistory([]);
        setTimeout(() => {
            setCurrentNode(project.GetStartNode());
        }, 0);
    }

    function goBack(){
        if (previousChoiceHistory.length > 0) {
            const lastChoice = previousChoiceHistory[previousChoiceHistory.length - 1];

            // Restore variables state
            if (project && lastChoice.variables) {
                project.variables = { ...lastChoice.variables };
            }

            // Restore node list
            setNodeList(lastChoice.nodeList);

            // Remove the last choice from history
            setPreviousChoiceHistory(previousChoiceHistory.slice(0, -1));
        }
    }

    // Handle panel visibility - ensure mutual exclusivity
    function handleVariablesPanelToggle() {
        if (isSearchPanelVisible) {
            setIsSearchPanelVisible(false);
        }
        setIsVariablesPanelVisible(!isVariablesPanelVisible);
    }

    function handleSearchPanelToggle() {
        if (isVariablesPanelVisible) {
            setIsVariablesPanelVisible(false);
        }
        setIsSearchPanelVisible(!isSearchPanelVisible);
    }

    // Handle navigation to a specific node from search
    function handleNavigateToNode(nodeId: string) {
        const targetNode = project.GetNodeByID(nodeId);
        if (targetNode) {
            // Reset variables to initial state when jumping to a specific node
            if (project) {
                project.ResetVariablesToInitialState();
            }

            // Clear current flow and start fresh from the target node
            setNodeList([]);
            setPreviousChoiceHistory([]);
            setTimeout(() => {
                setCurrentNode(targetNode);
            }, 0);
        }
    }

    // Calculate total panel width for margin adjustment
    const totalPanelWidth = isVariablesPanelVisible ? variablesPanelWidth :
                           isSearchPanelVisible ? searchPanelWidth : 0;

    // Unified function to get all outputs from current node
    function getCurrentNodeOutputs(): any[] {
        if (!currentNode) return [];

        // Handle VirtualChoice nodes (special case for choice collections)
        if (currentNode.Type === "VirtualChoice" && currentNode.Properties.Options) {
            return currentNode.Properties.Options.filter((option: any) => !option.hidden);
        }



        // Handle FlowFragment nodes (enter first child)
        if (currentNode.Type === "FlowFragment" ||
            currentNode.Type === "CombatFlowTemplate" ||
            currentNode.Type === "CraftingFlowTemplate" ||
            currentNode.Type === "TravelFlowTemplate" ||
            currentNode.Type === "PlayerActionFlowTemplate" ||
            currentNode.Type === "LocationFlowTemplate" ||
            currentNode.Type === "EnemyGenericFlowTemplate" ||
            currentNode.Type === "NPCFlowTemplate" ||
            currentNode.Type === "PCFlowTemplate" ||
            currentNode.Type === "WeaponFlowTemplate") {
            const childNode = project.GetFirstChildOfNode(currentNode);
            if (childNode) {
                // Auto-navigate to first child
                setTimeout(() => setCurrentNode(childNode), 0);
                return [];
            }
        }



        // Standard case: get all output connections
        if (currentNode.Properties.OutputPins &&
            currentNode.Properties.OutputPins[0] &&
            currentNode.Properties.OutputPins[0].Connections) {
            return currentNode.Properties.OutputPins[0].Connections;
        }

        return [];
    }

    // Unified navigation function - handles all node transitions
    function navigateToNode(targetNode: any, choiceText?: string, choiceTitle?: string, choiceColor?: { r: number; g: number; b: number }, fromMultiChoice?: boolean) {
        const choiceInfo = choiceText ? {
            text: choiceText,
            title: choiceTitle,
            color: choiceColor,
            fromMultiChoice: fromMultiChoice || false
        } : undefined;

        console.log("🔄 NAVIGATING TO NODE:", targetNode?.Properties?.Id, targetNode?.Type);
        setCurrentNode(targetNode, choiceInfo);
    }

    function hasOutputConnections(node: any): boolean {
        return node.Properties.OutputPins &&
               node.Properties.OutputPins[0] &&
               node.Properties.OutputPins[0].Connections &&
               node.Properties.OutputPins[0].Connections.length > 0;
    }

    function getConditionText(node:any){
        const targetNode = project.GetNodeByID(node.Target);
        return targetNode.Properties.InputPins && targetNode.Properties.InputPins[0] ? targetNode.Properties.InputPins[0].Text : "";
    }

    // Helper function to get speaker name with icon for display
    function getSpeakerNameWithIcon(node: any) {
        if (node.Properties.Speaker) {
            const speakerNode = project.GetNodeByID(node.Properties.Speaker);
            if (speakerNode) {
                return (
                    <span>
                        <CommentOutlined style={{ marginRight: '6px' }} />
                        {speakerNode.Properties.DisplayName}
                    </span>
                );
            }
        }
        return null;
    }

    // Helper function to get speaker name as string (without JSX)
    function getSpeakerNameString(node: any): string {
        if (node.Properties.Speaker) {
            const speakerNode = project.GetNodeByID(node.Properties.Speaker);
            if (speakerNode) {
                return speakerNode.Properties.DisplayName;
            }
        }
        return node.Properties.DisplayName || '';
    }

    // Unified function to create choice options from any outputs
    function createChoiceOptions(outputs: any[]): any[] {
        return outputs.map((output: any) => {
            // Handle different output types
            let targetNode: any;
            let conditionText = "";

            if (output.Target) {
                // Standard connection output
                targetNode = project.GetNodeByID(output.Target);
                conditionText = getConditionText(output);
            } else if (output.nodeData) {
                // Already processed output (like VirtualChoice options)
                targetNode = output.nodeData;
                conditionText = output.conditionText || "";
            } else {
                // Direct node reference
                targetNode = output;
            }

            const conditionMet = conditionText === "" ? true : project.CheckConditionString(conditionText);

            return {
                disabled: !conditionMet,
                nodeData: targetNode,
                conditionText: conditionText,
                onClick: () => {
                    if (conditionMet) {
                        const choiceText = targetNode.Properties.Text || targetNode.Properties.Expression;
                        const choiceTitle = getSpeakerNameString(targetNode) || targetNode.Properties.DisplayName;
                        navigateToNode(targetNode, choiceText, choiceTitle, targetNode.Properties.Color, true);
                    }
                }
            };
        });
    }

    // Unified function to handle Next button press - shows all outputs
    function handleNextButton() {
        const outputs = getCurrentNodeOutputs();

        if (outputs.length === 0) {
            // No outputs - end of flow
            return;
        } else if (outputs.length === 1) {
            // Single output - navigate directly
            const targetNode = project.GetNodeByID(outputs[0].Target);
            const choiceText = currentNode.Properties.Text || currentNode.Properties.Expression;
            const choiceTitle = getSpeakerNameString(currentNode) || currentNode.Properties.DisplayName;
            navigateToNode(targetNode, choiceText, choiceTitle, currentNode.Properties.Color, false);
        } else {
            // Multiple outputs - show as choices
            const choiceOptions = createChoiceOptions(outputs);
            const virtualChoiceNode = {
                Type: "VirtualChoice",
                Properties: {
                    Options: choiceOptions
                }
            };
            const choiceInfo = {
                text: currentNode.Properties.Text || currentNode.Properties.Expression,
                title: getSpeakerNameString(currentNode) || currentNode.Properties.DisplayName,
                color: currentNode.Properties.Color
            };
            setCurrentNode(virtualChoiceNode, choiceInfo);
        }
    }

    // Consolidated function to render hub-style choice displays with condition bubbles
    // Note: showConditionBubbles should always be true for uniform display across the app
    function renderHubChoices(options: any[], showConditionBubbles: boolean = true, isPreviousChoiceSelected: boolean = false): JSX.Element {
        const nodeRefs = useRef<(React.RefObject<HTMLDivElement>)[]>(
            options.map(() => createRef<HTMLDivElement>())
        );

        return (
            <div style={{ position: 'relative' }}>
                {/* Condition bubbles on the left */}
                {showConditionBubbles && options.map((option: any, index: number) => {
                    return option.conditionText && (
                        <ConditionBubble
                            key={`condition-${index}`}
                            condition={option.conditionText}
                            nodeRef={nodeRefs.current[index]}
                            disabled={option.disabled}
                        />
                    );
                })}

                {/* Choice nodes */}
                {options.map((option: any, index: number) => {
                    // Calculate offset for previous choice (if visible, it takes index 0)
                    const hasPreviousChoice = showPrevious && previousChoiceHistory.length > 0;
                    const choiceOffset = hasPreviousChoice ? 1 : 0;
                    const forwardChoiceIndex = index + choiceOffset;
                    const isSelected = !isPreviousChoiceSelected && (forwardChoiceIndex === selectedChoiceIndex);

                    const speakerName = getSpeakerNameWithIcon(option.nodeData);

                    return (
                        <div key={index} ref={nodeRefs.current[index]} style={{ marginBottom: '20px' }}>
                            <InstructionPanel
                                title={speakerName || option.nodeData.Properties.DisplayName}
                                text={option.nodeData.Properties.Text || option.nodeData.Properties.Expression}
                                color={option.nodeData.Properties.Color}
                                selected={isSelected}
                                button={{
                                    hidden: false,
                                    disabled: option.disabled,
                                    text: "Next",
                                    onClick: option.onClick
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    // Unified function to get current available choices for keyboard navigation
    function getCurrentAvailableChoices(): any[] {
        if (!currentNode) return [];

        let choices: any[] = [];

        // Add previous choice as first option if available and visible
        if (showPrevious && previousChoiceHistory.length > 0) {
            choices.push({
                isPreviousChoice: true,
                onClick: goBack
            });
        }

        // Get outputs using unified function
        const outputs = getCurrentNodeOutputs();

        if (outputs.length === 0) {
            choices.push({ isEndOfFlow: true });
        } else if (outputs.length === 1) {
            choices.push({ isSingleChoice: true });
        } else {
            // Multiple outputs - add as choice options
            const choiceOptions = createChoiceOptions(outputs);
            choices.push(...choiceOptions);
        }

        return choices;
    }

    // Unified function to handle Enter key press
    function handleEnterKey(availableChoices: any[]) {
        if (availableChoices.length === 0) return;

        const selectedChoice = availableChoices[selectedChoiceIndex];

        if (selectedChoice.isPreviousChoice) {
            goBack();
            return;
        }

        if (selectedChoice.isEndOfFlow) {
            restartFlow();
            return;
        }

        if (selectedChoice.isSingleChoice) {
            // Handle using unified next button function
            handleNextButton();
        } else {
            // Handle multiple choice selection
            if (selectedChoice.onClick && !selectedChoice.disabled) {
                selectedChoice.onClick();
            }
        }
    }

    // Handle file upload/drop
    const handleFileLoad = (file: File) => {
        setIsLoading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const jsonContent = e.target?.result as string;
                const data = JSON.parse(jsonContent);
                setProject(new ArticyProject(data));
                message.success(`Loaded ${file.name} successfully!`);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                message.error('Invalid JSON file. Please select a valid Articy export.');
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            message.error('Error reading file');
            setIsLoading(false);
        };

        reader.readAsText(file);
    };

    // Handle drag and drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const jsonFile = files.find(file =>
            file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
        );

        if (jsonFile) {
            handleFileLoad(jsonFile);
        } else {
            message.error('Please drop a JSON file');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        // Only set to false if we're leaving the drop area entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    // Handle file input
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileLoad(file);
        }
    };
    
    // Unified DisplayNode function - handles all node types the same way
    function DisplayNode({ isPreviousChoiceSelected = false }: { isPreviousChoiceSelected?: boolean } = {}){
        if (!currentNode) {
            return <>No Current Node</>;
        }

        console.log("DisplayNode - Current node type:", currentNode.Type);
        console.log("DisplayNode - Current node:", currentNode);

        // Handle special auto-navigation cases first
        if (currentNode.Type === "Condition" ||
            currentNode.Type === "FlowFragment" ||
            currentNode.Type === "CombatFlowTemplate" ||
            currentNode.Type === "CraftingFlowTemplate" ||
            currentNode.Type === "TravelFlowTemplate" ||
            currentNode.Type === "PlayerActionFlowTemplate" ||
            currentNode.Type === "LocationFlowTemplate" ||
            currentNode.Type === "EnemyGenericFlowTemplate" ||
            currentNode.Type === "NPCFlowTemplate" ||
            currentNode.Type === "PCFlowTemplate" ||
            currentNode.Type === "WeaponFlowTemplate") {
            return <>Please wait...</>;
        }

        // Get outputs using unified function
        const outputs = getCurrentNodeOutputs();

        // Handle VirtualChoice (special case for choice collections)
        if (currentNode.Type === "VirtualChoice") {
            const visibleOptions = currentNode.Properties.Options.filter((option: any) => !option.hidden);
            return renderHubChoices(visibleOptions, true, isPreviousChoiceSelected);
        }

        // Handle end of flow
        if (outputs.length === 0) {
            return <EndOfFlowPanel onRestart={restartFlow} selected={!isPreviousChoiceSelected} />;
        }

        // Handle multiple outputs - show as choices
        if (outputs.length > 1) {
            const choiceOptions = createChoiceOptions(outputs);
            // Always show condition bubbles uniformly across the entire app
            return renderHubChoices(choiceOptions, true, isPreviousChoiceSelected);
        }

        // Handle single output - show node content with Next button
        const nodeTitle = getSpeakerNameWithIcon(currentNode) || currentNode.Properties.DisplayName;
        const nodeText = currentNode.Properties.Text || currentNode.Properties.Expression;

        return (
            <InstructionPanel
                title={nodeTitle}
                text={nodeText}
                color={currentNode.Properties.Color}
                selected={!isPreviousChoiceSelected}
                button={{
                    hidden: false,
                    text: "Next",
                    onClick: handleNextButton
                }}
            />
        );
    }









    return (
        <div>
            {project && (
                <>
                    <VariablesPanel
                        project={project}
                        currentNode={currentNode}
                        onWidthChange={setVariablesPanelWidth}
                        showPrevious={showPrevious}
                        onTogglePrevious={() => setShowPrevious(!showPrevious)}
                        hasPreviousChoice={previousChoiceHistory.length > 0}
                        isVisible={isVariablesPanelVisible}
                        onToggleVisibility={handleVariablesPanelToggle}
                        onToggleSearchPanel={handleSearchPanelToggle}
                        isSearchPanelVisible={isSearchPanelVisible}
                    />
                    <SearchNodesPanel
                        project={project}
                        currentNode={currentNode}
                        onWidthChange={setSearchPanelWidth}
                        onNavigateToNode={handleNavigateToNode}
                        isVisible={isSearchPanelVisible}
                        onToggleVisibility={handleSearchPanelToggle}
                        onToggleVariablesPanel={handleVariablesPanelToggle}
                        isVariablesPanelVisible={isVariablesPanelVisible}
                    />
                </>
            )}
            <div style={{
                marginLeft: totalPanelWidth,
                transition: 'margin-left 0.3s ease',
                minHeight: '100vh'
            }}>
                {project && (
                    <div style={{
                        position: 'fixed',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        zIndex: 1000,
                        fontFamily: 'monospace'
                    }}>
                        ↑↓ Navigate • Enter Select • Ctrl+R Restart
                    </div>
                )}
                {project ? (
                    <div>
                        {/* Previous Choice Display */}
                        {showPrevious && previousChoiceHistory.length > 0 && (
                            <>
                                <PreviousChoiceDisplay
                                    previousChoice={previousChoiceHistory[previousChoiceHistory.length - 1]}
                                    onBack={goBack}
                                    selected={selectedChoiceIndex === 0} // First choice is previous choice
                                />
                                {/* Divider Line */}
                                <div style={{
                                    width: '100%',
                                    height: '1px',
                                    backgroundColor: '#666',
                                    margin: '20px 0',
                                    opacity: 0.5
                                }} />
                                <h3 style={{
                                    color: '#999',
                                    fontSize: '16px',
                                    marginBottom: '20px',
                                    fontWeight: 'normal'
                                }}>
                                    Available Choices
                                </h3>
                            </>
                        )}
                        <DisplayNode isPreviousChoiceSelected={showPrevious && previousChoiceHistory.length > 0 && selectedChoiceIndex === 0} />
                    </div>
                ) : <FileUploadArea
                    isDragOver={isDragOver}
                    handleDrop={handleDrop}
                    handleDragOver={handleDragOver}
                    handleDragEnter={handleDragEnter}
                    handleDragLeave={handleDragLeave}
                    handleFileSelect={handleFileSelect}
                    isLoading={isLoading}
                />}
            </div>
        </div>
    )
}

export default InteractiveArticyViewer;