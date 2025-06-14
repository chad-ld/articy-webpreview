import packageJson from "../package.json";
import React, { useEffect, useState, useRef, createRef } from "react";
import ArticyProject from "./ArticyProject";
import InstructionPanel from "./panels/InstructionPanel";
import EndOfFlowPanel from "./panels/EndOfFlowPanel";
import VariablesPanel from "./components/VariablesPanel";
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

function InteractiveArticyViewer(){

    const [project, setProject] = useState(undefined as unknown as ArticyProject);
    const [nodeList, setNodeList] = useState([] as any[]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [variablesPanelWidth, setVariablesPanelWidth] = useState(0);
    const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);
    const [previousChoiceHistory, setPreviousChoiceHistory] = useState<PreviousChoice[]>([]);
    const [showPrevious, setShowPrevious] = useState(true);

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

        // console.log("setting current Node:",node);
        if (node.Type == "Instruction" || node.Type == "WaypointTemplate")
            project.StoreVariablesFromNode(node);
        setNodeList([...nodeList,node]);
    }

    function restartFlow(){
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

    // Helper function to check if current node has multiple choices
    function currentNodeHasMultipleChoices(): boolean {
        if (!currentNode || !currentNode.Properties.OutputPins || !currentNode.Properties.OutputPins[0]) {
            return false;
        }

        const connections = currentNode.Properties.OutputPins[0].Connections;
        if (!connections) return false;

        // Check for multiple connections
        if (connections.length > 1) return true;

        // For VirtualChoice nodes, check if they have multiple visible options
        if (currentNode.Type === "VirtualChoice" && currentNode.Properties.Options) {
            const visibleOptions = currentNode.Properties.Options.filter((option: any) => !option.hidden);
            return visibleOptions.length > 1;
        }

        return false;
    }

    // Helper function to navigate with choice tracking
    function navigateWithChoice(targetNode: any, choiceText: string, choiceTitle?: string, choiceColor?: { r: number; g: number; b: number }, sourceNode?: any, fromMultiChoice?: boolean) {
        // Use explicit fromMultiChoice parameter if provided, otherwise auto-detect
        const actualFromMultiChoice = fromMultiChoice !== undefined ? fromMultiChoice : currentNodeHasMultipleChoices();

        const choiceInfo = {
            text: choiceText,
            title: choiceTitle,
            color: choiceColor,
            fromMultiChoice: actualFromMultiChoice
        };

        console.log("=== NAVIGATION DEBUG ===");
        console.log("Current node:", currentNode?.Properties?.Id, currentNode?.Type, currentNode?.Properties?.Text);
        console.log("Target node:", targetNode?.Properties?.Id, targetNode?.Type, targetNode?.Properties?.Text);
        console.log("Choice text:", choiceText);
        console.log("Are IDs same?", currentNode?.Properties?.Id === targetNode?.Properties?.Id);
        console.log("Are texts same?", currentNode?.Properties?.Text === targetNode?.Properties?.Text);

        // Bulletproof duplicate detection: Check for both identical node IDs and identical content
        const sameNodeId = currentNode && targetNode.Properties.Id === currentNode.Properties.Id;

        // Check if text content is the same
        const sameTextContent = currentNode &&
                               currentNode.Properties.Text &&
                               targetNode.Properties.Text &&
                               currentNode.Properties.Text === targetNode.Properties.Text;

        // Check if speaker/title is the same
        const currentSpeaker = getSpeakerNameString(currentNode) || currentNode?.Properties?.DisplayName;
        const targetSpeaker = getSpeakerNameString(targetNode) || targetNode?.Properties?.DisplayName;
        const sameSpeaker = currentSpeaker === targetSpeaker;

        // Check if previous page had multiple choices (indicating we came from a choice selection)
        const cameFromMultiChoice = previousChoiceHistory.length > 0 &&
                                   previousChoiceHistory[previousChoiceHistory.length - 1]?.fromMultiChoice;

        console.log("Duplicate detection checks:");
        console.log("- Same node ID:", sameNodeId);
        console.log("- Same text content:", sameTextContent);
        console.log("- Same speaker:", sameSpeaker, `(${currentSpeaker} vs ${targetSpeaker})`);
        console.log("- Came from multi-choice:", cameFromMultiChoice);

        // Skip only if: same node ID OR (same text AND same speaker AND came from multi-choice)
        const shouldSkip = sameNodeId || (sameTextContent && sameSpeaker && cameFromMultiChoice);

        if (shouldSkip) {
            if (sameNodeId) {
                console.log("🚫 SKIPPING duplicate node - target node is the same as current node");
            } else {
                console.log("🚫 SKIPPING duplicate dialogue - same text, same speaker, came from multi-choice");
            }

            // Skip to the target's output if it has exactly one connection
            if (hasOutputConnections(targetNode) && targetNode.Properties.OutputPins[0].Connections.length === 1) {
                const nextNode = project.GetNodeByID(targetNode.Properties.OutputPins[0].Connections[0].Target);
                console.log("Skipping to next node:", nextNode?.Properties?.Id, nextNode?.Type, nextNode?.Properties?.Text);
                navigateWithChoice(nextNode, choiceText, choiceTitle, choiceColor, sourceNode, actualFromMultiChoice);
            } else {
                // If no single output connection, just set the target node anyway
                console.log("No single output connection, setting target node anyway");
                setCurrentNode(targetNode, choiceInfo);
            }
        } else {
            console.log("✅ Navigating to new node:", targetNode.Properties.Id);
            setCurrentNode(targetNode, choiceInfo);
        }
        console.log("========================");
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

    // Consolidated function to create choice options for multi-output nodes
    function createChoiceOptions(connections: any[], useNavigateWithChoice: boolean = true): any[] {
        return connections.map((conn: any) => {
            const targetNode = project.GetNodeByID(conn.Target);
            const conditionText = getConditionText(conn);
            const conditionMet = conditionText === "" ? true : project.CheckConditionString(conditionText);

            return {
                disabled: !conditionMet,
                nodeData: targetNode,
                conditionText: conditionText,
                onClick: () => {
                    if (conditionMet) {
                        // FIXED: Store the choice text (what the player actually clicked) for history,
                        // not the target node's text. This prevents creating intermediate pages.
                        const choiceInfo = {
                            text: targetNode.Properties.Text || targetNode.Properties.Expression, // What the player selected (the choice button text)
                            title: getSpeakerNameString(targetNode) || targetNode.Properties.DisplayName,
                            color: targetNode.Properties.Color,
                            fromMultiChoice: true // This is always from a multi-choice context
                        };

                        // Go directly to the target node without creating intermediate pages
                        setCurrentNode(targetNode, choiceInfo);
                    }
                }
            };
        });
    }

    // Consolidated function to handle single choice navigation
    function handleSingleChoiceNavigation(node: any) {
        console.log("🔄 SINGLE CHOICE NAVIGATION - From node:", node.Properties.Id, node.Type, node.Properties.Text);
        if (!hasOutputConnections(node)) {
            console.log("🔄 SINGLE CHOICE NAVIGATION - No output connections found");
            return null; // Caller should handle end of flow
        }

        const targetNode = project.GetNodeByID(node.Properties.OutputPins[0].Connections[0].Target);
        console.log("🔄 SINGLE CHOICE NAVIGATION - To node:", targetNode.Properties.Id, targetNode.Type, targetNode.Properties.Text);
        const choiceText = node.Properties.Text || node.Properties.Expression;
        const choiceTitle = getSpeakerNameString(node) || node.Properties.DisplayName;

        // For single choice navigation, we're NOT coming from a multi-choice screen
        const choiceInfo = {
            text: choiceText,
            title: choiceTitle,
            color: node.Properties.Color,
            fromMultiChoice: false // Always false for single choice navigation
        };

        // FIXED: Go directly to target node without showing the choice as an intermediate page
        // This prevents the extra "choice confirmation" pages from appearing
        setCurrentNode(targetNode, choiceInfo);
    }

    // Consolidated function to render hub-style choice displays with condition bubbles
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

    // Helper function to get current available choices for keyboard navigation
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

        switch (currentNode.Type) {
            case "VirtualChoice":
                const virtualChoices = currentNode.Properties.Options.filter((option: any) => !option.hidden);
                choices.push(...virtualChoices);
                break;

            case "Instruction":
                if (currentNode.Properties.OutputPins &&
                    currentNode.Properties.OutputPins[0] &&
                    currentNode.Properties.OutputPins[0].Connections &&
                    currentNode.Properties.OutputPins[0].Connections.length > 1) {

                    const instructionHubOptions = createChoiceOptions(currentNode.Properties.OutputPins[0].Connections, false);
                    choices.push(...instructionHubOptions);
                } else {
                    choices.push({ isSingleChoice: true }); // Single choice indicator
                }
                break;

            case "DialogueInteractiveFragmentTemplate":
            case "DialogueIntActionTemplate":
            case "DialogueInternalActionTemplate":
            case "DialogueNode":
                if (currentNode.Properties.OutputPins &&
                    currentNode.Properties.OutputPins[0] &&
                    currentNode.Properties.OutputPins[0].Connections &&
                    currentNode.Properties.OutputPins[0].Connections.length > 1) {

                    const dialogueOptions = createChoiceOptions(currentNode.Properties.OutputPins[0].Connections, true);
                    choices.push(...dialogueOptions);
                } else {
                    choices.push({ isSingleChoice: true });
                }
                break;

            default:
                // For other node types that have single "Next" buttons
                if (hasOutputConnections(currentNode)) {
                    choices.push({ isSingleChoice: true });
                } else {
                    choices.push({ isEndOfFlow: true }); // End of flow
                }
                break;
        }

        return choices;
    }

    // Helper function to handle Enter key press
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
            // Handle single choice navigation using consolidated function
            handleSingleChoiceNavigation(currentNode);
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
    
    function DisplayNode({ isPreviousChoiceSelected = false }: { isPreviousChoiceSelected?: boolean } = {}){
        if (currentNode != undefined){
            console.log("DisplayNode - Current node type:", currentNode.Type);
            console.log("DisplayNode - Current node:", currentNode);
            switch (currentNode.Type){
                case "VirtualChoice":
                    const visibleOptions = currentNode.Properties.Options.filter((option: any) => !option.hidden);
                    return renderHubChoices(visibleOptions, false, isPreviousChoiceSelected); // No condition bubbles for virtual choices
                case "Instruction":
                    // Check if this Instruction node has multiple output connections (acts like a Hub)
                    if (currentNode.Properties.OutputPins[0].Connections && currentNode.Properties.OutputPins[0].Connections.length > 1) {
                        console.log("Instruction with multiple outputs (Hub-like) triggered! Current node:", currentNode);
                        const instructionHubOptions = createChoiceOptions(currentNode.Properties.OutputPins[0].Connections, true);
                        return renderHubChoices(instructionHubOptions, true, isPreviousChoiceSelected);
                    } else {
                        // Regular single-path Instruction
                        if (!hasOutputConnections(currentNode)) {
                            return <EndOfFlowPanel onRestart={restartFlow} selected={!isPreviousChoiceSelected} />;
                        }

                        return (
                            <InstructionPanel
                                title={currentNode.Properties.DisplayName}
                                text={currentNode.Properties.Expression}
                                color={currentNode.Properties.Color}
                                selected={!isPreviousChoiceSelected}
                                button={{
                                    hidden: false,
                                    text: "Next",
                                    onClick: () => handleSingleChoiceNavigation(currentNode)
                                }}
                            />
                        );
                    }
                case "WaypointTemplate":
                case "JournalEntryTemplate":
                case "PlayerActionTemplate":
                case "CraftingTemplate":
                case "CombatTemplate":
                case "TravelTemplate":
                case "AreaEventTemplate":
                    // Check if this node has no output connections - show end of flow
                    if (!hasOutputConnections(currentNode)) {
                        return <EndOfFlowPanel onRestart={restartFlow} selected={!isPreviousChoiceSelected} />;
                    }

                    return (
                        <InstructionPanel
                            title={currentNode.Properties.DisplayName}
                            text={currentNode.Properties.Expression}
                            color={currentNode.Properties.Color}
                            selected={!isPreviousChoiceSelected}
                            button={{
                                hidden: false,
                                text: "Next",
                                onClick: () => handleSingleChoiceNavigation(currentNode)
                            }}
                        />
                    );
                case "LocationTemplate":
                case "EnemyGenericTemplate":
                case "innervoice_template":
                case "NPCTemplate":
                case "PCTemplate":
                case "WeaponTemplate":
                case "DialogueExplorationActionTemplate":
                    // Check if this node has no output connections - show end of flow
                    if (!hasOutputConnections(currentNode)) {
                        return <EndOfFlowPanel onRestart={restartFlow} selected={!isPreviousChoiceSelected} />;
                    }

                    return (
                        <InstructionPanel
                            title={currentNode.Properties.DisplayName}
                            text={currentNode.Properties.Text}
                            color={currentNode.Properties.Color}
                            selected={!isPreviousChoiceSelected}
                            button={{
                                hidden: false,
                                text: "Next",
                                onClick: () => {
                                    // Check if this node has multiple output connections
                                    if (currentNode.Properties.OutputPins[0].Connections && currentNode.Properties.OutputPins[0].Connections.length > 1) {
                                        // Create a virtual choice node to show multiple options
                                        const choiceOptions = currentNode.Properties.OutputPins[0].Connections.map((conn: any) => {
                                            const targetNode = project.GetNodeByID(conn.Target);
                                            const conditionText = targetNode.Properties.InputPins && targetNode.Properties.InputPins[0] ? targetNode.Properties.InputPins[0].Text : "";
                                            return {
                                                hidden: conditionText === "" ? false : !project.CheckConditionString(conditionText),
                                                nodeData: targetNode,
                                                onClick: () => {
                                                    // Pass the VirtualChoice node as the source
                                                    const virtualChoiceNode = {
                                                        Type: "VirtualChoice",
                                                        Properties: {
                                                            Options: choiceOptions
                                                        }
                                                    };
                                                    // FIXED: Go directly to target node to prevent duplicate pages
                                                    const choiceInfo = {
                                                        text: targetNode.Properties.Text || targetNode.Properties.Expression,
                                                        title: targetNode.Properties.DisplayName,
                                                        color: targetNode.Properties.Color,
                                                        fromMultiChoice: true // This is from a multi-choice context
                                                    };
                                                    setCurrentNode(targetNode, choiceInfo);
                                                }
                                            };
                                        });

                                        // Set a virtual choice node with choice info to store current node in history
                                        const choiceInfo = {
                                            text: currentNode.Properties.Text || currentNode.Properties.Expression,
                                            title: currentNode.Properties.DisplayName,
                                            color: currentNode.Properties.Color
                                        };
                                        setCurrentNode({
                                            Type: "VirtualChoice",
                                            Properties: {
                                                Options: choiceOptions
                                            }
                                        }, choiceInfo);
                                    } else {
                                        // Single connection - navigate normally
                                        handleSingleChoiceNavigation(currentNode);
                                    }
                                }
                            }}
                        />
                    );
                case "DialogueFragment":
                case "DialogueInteractiveFragmentTemplate":
                    // Check if this node has no output connections - show end of flow
                    if (!hasOutputConnections(currentNode)) {
                        return <EndOfFlowPanel onRestart={restartFlow} selected={!isPreviousChoiceSelected} />;
                    }

                    const speakerName = getSpeakerNameWithIcon(currentNode);

                    // Check if we came from a multi-choice context - if so, skip this dialogue fragment entirely
                    const cameFromMultiChoice = previousChoiceHistory.length > 0 &&
                                               previousChoiceHistory[previousChoiceHistory.length - 1]?.fromMultiChoice;

                    if (cameFromMultiChoice) {
                        console.log("DialogueInteractiveFragmentTemplate: Came from multi choice, skipping dialogue fragment entirely");
                        // Skip this dialogue fragment and navigate directly to the first output
                        setTimeout(() => {
                            handleSingleChoiceNavigation(currentNode);
                        }, 0);
                        return (
                            <>Please wait...</>
                        );
                    }

                    // Check if this node has multiple output connections
                    if (currentNode.Properties.OutputPins &&
                        currentNode.Properties.OutputPins[0] &&
                        currentNode.Properties.OutputPins[0].Connections &&
                        currentNode.Properties.OutputPins[0].Connections.length > 1) {

                        console.log("DialogueInteractiveFragmentTemplate with multiple outputs detected! Connections:", currentNode.Properties.OutputPins[0].Connections);

                        // Show dialogue first, then when clicked, show the multiple choice options
                        return (
                            <InstructionPanel
                                title={speakerName || currentNode.Properties.DisplayName}
                                text={currentNode.Properties.Text}
                                color={currentNode.Properties.Color}
                                selected={!isPreviousChoiceSelected}
                                button={{
                                    hidden: false,
                                    text: "Next",
                                    onClick: () => {
                                        // Create choice options for all output connections
                                        const dialogueChoiceOptions = currentNode.Properties.OutputPins[0].Connections.map((conn: any) => {
                                            const targetNode = project.GetNodeByID(conn.Target);
                                            const conditionText = getConditionText(conn);
                                            const conditionMet = conditionText === "" ? true : project.CheckConditionString(conditionText);

                                            return {
                                                disabled: !conditionMet,
                                                nodeData: targetNode,
                                                conditionText: conditionText,
                                                onClick: () => {
                                                    if (conditionMet) {
                                                        const choiceInfo = {
                                                            text: targetNode.Properties.Text || targetNode.Properties.Expression,
                                                            title: getSpeakerNameString(targetNode),
                                                            color: targetNode.Properties.Color,
                                                            fromMultiChoice: true
                                                        };
                                                        setCurrentNode(targetNode, choiceInfo);
                                                    }
                                                }
                                            };
                                        });

                                        // Store current dialogue in history and show choice screen
                                        const choiceInfo = {
                                            text: currentNode.Properties.Text,
                                            title: getSpeakerNameString(currentNode),
                                            color: currentNode.Properties.Color
                                        };

                                        setCurrentNode({
                                            Type: "VirtualChoice",
                                            Properties: {
                                                Options: dialogueChoiceOptions
                                            }
                                        }, choiceInfo);
                                    }
                                }}
                            />
                        );
                    } else {
                        // Single connection - show as single dialogue fragment
                        return (
                            <InstructionPanel
                                title={speakerName || currentNode.Properties.DisplayName}
                                text={currentNode.Properties.Text}
                                color={currentNode.Properties.Color}
                                selected={!isPreviousChoiceSelected}
                                button={{
                                    hidden: false,
                                    text: "Next",
                                    onClick: () => handleSingleChoiceNavigation(currentNode)
                                }}
                            />
                        );
                    }
                case "Hub":
                    console.log("Hub case triggered! Current node:", currentNode);
                    const hubOptions = createChoiceOptions(currentNode.Properties.OutputPins[0].Connections, true);
                    return renderHubChoices(hubOptions, true, isPreviousChoiceSelected);
                case "Jump":
                    setTimeout(()=>{
                        setCurrentNode(project.GetNodeByID(currentNode.Properties.Target));
                    },0);
                    return (
                        <>Please wait...</>
                    )
                    break;
                case "DialogueIntActionTemplate":
                case "DialogueInternalActionTemplate":
                    // These should act like Hub nodes - show all output connections as choices
                    console.log("DialogueIntActionTemplate node details:", currentNode);

                    // Check if this node has no output connections - show end of flow
                    if (!hasOutputConnections(currentNode)) {
                        console.log("No output connections - showing end of flow");
                        return <EndOfFlowPanel onRestart={restartFlow} selected={!isPreviousChoiceSelected} />;
                    }

                    // Check if this node has multiple output connections (acts like a Hub)
                    if (currentNode.Properties.OutputPins[0].Connections && currentNode.Properties.OutputPins[0].Connections.length > 1) {
                        console.log("DialogueIntActionTemplate with multiple outputs (Hub-like) triggered! Current node:", currentNode);
                        const dialogueHubOptions = createChoiceOptions(currentNode.Properties.OutputPins[0].Connections, true);
                        return renderHubChoices(dialogueHubOptions, true, isPreviousChoiceSelected);
                    } else {
                        // Single connection - navigate normally like DialogueInteractiveFragmentTemplate
                        const speakerName = getSpeakerNameWithIcon(currentNode);

                        return (
                            <InstructionPanel
                                title={speakerName || currentNode.Properties.DisplayName}
                                text={currentNode.Properties.Text}
                                color={currentNode.Properties.Color}
                                selected={!isPreviousChoiceSelected}
                                button={{
                                    hidden: false,
                                    text: "Next",
                                    onClick: () => handleSingleChoiceNavigation(currentNode)
                                }}
                            />
                        );
                    }
                case "FlowFragment":
                case "CombatFlowTemplate":
                case "CraftingFlowTemplate":
                case "TravelFlowTemplate":
                case "PlayerActionFlowTemplate":
                case "LocationFlowTemplate":
                case "EnemyGenericFlowTemplate":
                case "NPCFlowTemplate":
                case "PCFlowTemplate":
                case "WeaponFlowTemplate":
                    let childnode = project.GetFirstChildOfNode(currentNode);
                    if (childnode != undefined){
                        setTimeout(()=>{
                            setCurrentNode(childnode);
                        },0);
                        return (
                            <>Please wait...</>
                        )
                    }
                    else{
                        // No child found - show end of flow
                        return <EndOfFlowPanel onRestart={restartFlow} selected={!isPreviousChoiceSelected} />;
                    }
                case "Condition":
                    let conditions = project.GetVariablesFromNode(currentNode);
                    let result = false;
                    if (conditions){
                        result = project.CheckCondition(conditions);
                    }
                    console.log("result",result);
                    if (result){
                        setTimeout(()=>{
                            setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
                        },0);
                    }
                    else{
                        setTimeout(()=>{
                            setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[1].Connections[0].Target));
                        },0);
                    }
                    
                    return (
                        <>Please wait...</>
                    )
                case "DialogueNode":
                    // DialogueNode with NavigationTemplate - handle like other choice nodes
                    console.log("DialogueNode triggered! Current node:", currentNode);

                    // Check if this node has no output connections - show end of flow
                    if (!hasOutputConnections(currentNode)) {
                        return <EndOfFlowPanel onRestart={restartFlow} selected={!isPreviousChoiceSelected} />;
                    }

                    // Check if this node has multiple output connections
                    if (currentNode.Properties.OutputPins &&
                        currentNode.Properties.OutputPins[0] &&
                        currentNode.Properties.OutputPins[0].Connections &&
                        currentNode.Properties.OutputPins[0].Connections.length > 1) {

                        console.log("DialogueNode with multiple outputs detected! Connections:", currentNode.Properties.OutputPins[0].Connections);
                        const dialogueNodeOptions = createChoiceOptions(currentNode.Properties.OutputPins[0].Connections, true);
                        return renderHubChoices(dialogueNodeOptions, false, isPreviousChoiceSelected); // No condition bubbles for DialogueNode
                    } else {
                        // Single connection - show as single choice
                        return (
                            <InstructionPanel
                                title={currentNode.Properties.DisplayName}
                                text={currentNode.Properties.Text || currentNode.Properties.Expression}
                                color={currentNode.Properties.Color}
                                selected={!isPreviousChoiceSelected}
                                button={{
                                    hidden: false,
                                    text: "Next",
                                    onClick: () => handleSingleChoiceNavigation(currentNode)
                                }}
                            />
                        );
                    }
                default:
                    console.error("Cannot render node",currentNode);
                    return (
                        <>
                        <div>Node of type {currentNode.Type} has not yet been implemented.</div>
                        </>
                    )
            }
        }
        else return (<>No Current Node</>)
    }

    // File upload component
    function FileUploadArea() {
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

    return (
        <div>
            {project && (
                <VariablesPanel
                    project={project}
                    currentNode={currentNode}
                    onWidthChange={setVariablesPanelWidth}
                    showPrevious={showPrevious}
                    onTogglePrevious={() => setShowPrevious(!showPrevious)}
                    hasPreviousChoice={previousChoiceHistory.length > 0}
                />
            )}
            <div style={{
                marginLeft: variablesPanelWidth,
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
                ) : <FileUploadArea />}
            </div>
        </div>
    )
}

export default InteractiveArticyViewer;