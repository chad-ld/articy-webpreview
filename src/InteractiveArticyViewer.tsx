import packageJson from "../package.json";
import React, { useEffect, useState, useRef, createRef } from "react";
import QuestionPanel from "./panels/QuestionPanel";
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

    function setCurrentNode(node:any, choiceInfo?: { text: string, title?: string, color?: { r: number; g: number; b: number } }){
        // Store previous choice if we have choice info and a current node
        if (choiceInfo && currentNode) {
            const previousChoice: PreviousChoice = {
                node: currentNode,
                choiceText: choiceInfo.text,
                choiceTitle: choiceInfo.title,
                color: choiceInfo.color,
                nodeList: [...nodeList],
                variables: project ? { ...project.variables } : {}
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
    function navigateWithChoice(targetNode: any, choiceText: string, choiceTitle?: string, choiceColor?: { r: number; g: number; b: number }, sourceNode?: any) {
        const choiceInfo = {
            text: choiceText,
            title: choiceTitle,
            color: choiceColor
        };

        // Use the provided sourceNode or fall back to currentNode
        const actualSourceNode = sourceNode || currentNode;

        // Special handling for dialogue fragments and action templates:
        // Only skip if ALL of these conditions are met:
        // 1. Target is a dialogue fragment or action template
        // 2. Choice was made from a multi-choice screen (VirtualChoice, DialogueIntActionTemplate, etc.)
        // 3. Target has exactly one output connection
        // 4. The target's text matches the choice text (indicating it's the same content)
        const isFromMultiChoiceScreen = actualSourceNode && (
            (actualSourceNode.Type === "VirtualChoice" && actualSourceNode.Properties.Options && actualSourceNode.Properties.Options.filter((opt: any) => !opt.hidden).length > 1) ||
            (actualSourceNode.Type === "DialogueIntActionTemplate" && actualSourceNode.Properties.OutputPins?.[0]?.Connections?.length > 1) ||
            (actualSourceNode.Type === "DialogueInternalActionTemplate" && actualSourceNode.Properties.OutputPins?.[0]?.Connections?.length > 1)
        );

        if ((targetNode.Type === "DialogueFragment" ||
             targetNode.Type === "DialogueInteractiveFragmentTemplate" ||
             targetNode.Type === "DialogueIntActionTemplate" ||
             targetNode.Type === "DialogueInternalActionTemplate") &&
            isFromMultiChoiceScreen &&
            hasOutputConnections(targetNode) &&
            targetNode.Properties.OutputPins[0].Connections.length === 1 &&
            (targetNode.Properties.Text === choiceText || targetNode.Properties.Expression === choiceText)) { // Text must match

            console.log("Skipping dialogue node because it's a duplicate of the choice just made from multi-choice screen");
            // Skip the dialogue node and go directly to its target
            const nextNode = project.GetNodeByID(targetNode.Properties.OutputPins[0].Connections[0].Target);
            setCurrentNode(nextNode, choiceInfo);
        } else {
            console.log("Showing dialogue node - not skipping because:", {
                isDialogueNode: targetNode.Type === "DialogueFragment" ||
                               targetNode.Type === "DialogueInteractiveFragmentTemplate" ||
                               targetNode.Type === "DialogueIntActionTemplate" ||
                               targetNode.Type === "DialogueInternalActionTemplate",
                isFromMultiChoiceScreen: isFromMultiChoiceScreen,
                currentNodeType: actualSourceNode?.Type,
                hasOutputConnections: hasOutputConnections(targetNode),
                outputConnectionsCount: targetNode.Properties.OutputPins?.[0]?.Connections?.length || 0,
                textMatches: targetNode.Properties.Text === choiceText || targetNode.Properties.Expression === choiceText,
                targetText: targetNode.Properties.Text || targetNode.Properties.Expression,
                choiceText: choiceText
            });
            setCurrentNode(targetNode, choiceInfo);
        }
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

                    const instructionHubOptions = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>{
                        const targetNode = project.GetNodeByID(conn.Target);
                        const conditionText = getConditionText(conn);
                        const conditionMet = conditionText==="" ? true : project.CheckConditionString(conditionText);
                        return {
                            disabled: !conditionMet,
                            nodeData: targetNode,
                            conditionText: conditionText,
                            onClick:()=>{
                                if (conditionMet) {
                                    setCurrentNode(targetNode);
                                }
                            }
                        };
                    });
                    // Include all options (enabled and disabled) for navigation
                    choices.push(...instructionHubOptions);
                } else {
                    choices.push({ isSingleChoice: true }); // Single choice indicator
                }
                break;

            case "DialogueInteractiveFragmentTemplate":
                if (currentNode.Properties.OutputPins &&
                    currentNode.Properties.OutputPins[0] &&
                    currentNode.Properties.OutputPins[0].Connections &&
                    currentNode.Properties.OutputPins[0].Connections.length > 1) {

                    const hubOptions = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>{
                        const targetNode = project.GetNodeByID(conn.Target);
                        const conditionText = getConditionText(conn);
                        const conditionMet = conditionText==="" ? true : project.CheckConditionString(conditionText);
                        return {
                            disabled: !conditionMet,
                            nodeData: targetNode,
                            conditionText: conditionText,
                            onClick:()=>{
                                if (conditionMet) {
                                    navigateWithChoice(
                                        targetNode,
                                        targetNode.Properties.Text || targetNode.Properties.Expression,
                                        targetNode.Properties.DisplayName,
                                        targetNode.Properties.Color
                                    );
                                }
                            }
                        };
                    });
                    // Include all options (enabled and disabled) for navigation
                    choices.push(...hubOptions);
                } else {
                    choices.push({ isSingleChoice: true });
                }
                break;

            case "DialogueIntActionTemplate":
            case "DialogueInternalActionTemplate":
                if (currentNode.Properties.OutputPins &&
                    currentNode.Properties.OutputPins[0] &&
                    currentNode.Properties.OutputPins[0].Connections &&
                    currentNode.Properties.OutputPins[0].Connections.length > 1) {

                    const dialogueHubOptions = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>{
                        const targetNode = project.GetNodeByID(conn.Target);
                        const conditionText = getConditionText(conn);
                        const conditionMet = conditionText==="" ? true : project.CheckConditionString(conditionText);
                        return {
                            disabled: !conditionMet,
                            nodeData: targetNode,
                            conditionText: conditionText,
                            onClick:()=>{
                                if (conditionMet) {
                                    setCurrentNode(targetNode);
                                }
                            }
                        };
                    });
                    // Include all options (enabled and disabled) for navigation
                    choices.push(...dialogueHubOptions);
                } else {
                    choices.push({ isSingleChoice: true });
                }
                break;

            case "DialogueNode":
                if (currentNode.Properties.OutputPins &&
                    currentNode.Properties.OutputPins[0] &&
                    currentNode.Properties.OutputPins[0].Connections &&
                    currentNode.Properties.OutputPins[0].Connections.length > 1) {

                    const dialogueNodeOptions = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>{
                        const targetNode = project.GetNodeByID(conn.Target);
                        const conditionText = getConditionText(conn);
                        const conditionMet = conditionText==="" ? true : project.CheckConditionString(conditionText);
                        return {
                            disabled: !conditionMet,
                            nodeData: targetNode,
                            conditionText: conditionText,
                            onClick:()=>{
                                if (conditionMet) {
                                    navigateWithChoice(
                                        targetNode,
                                        targetNode.Properties.Text || targetNode.Properties.Expression,
                                        targetNode.Properties.DisplayName,
                                        targetNode.Properties.Color
                                    );
                                }
                            }
                        };
                    });
                    // Include all options (enabled and disabled) for navigation
                    choices.push(...dialogueNodeOptions);
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
            // Handle single choice navigation
            if (currentNode.Type === "Instruction") {
                if (currentNode.Properties.OutputPins &&
                    currentNode.Properties.OutputPins[0] &&
                    currentNode.Properties.OutputPins[0].Connections &&
                    currentNode.Properties.OutputPins[0].Connections.length === 1) {
                    const targetNode = project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target);
                    navigateWithChoice(
                        targetNode,
                        currentNode.Properties.Expression,
                        currentNode.Properties.DisplayName,
                        currentNode.Properties.Color
                    );
                }
            } else {
                // Handle other single-choice node types
                if (hasOutputConnections(currentNode)) {
                    const targetNode = project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target);
                    navigateWithChoice(
                        targetNode,
                        currentNode.Properties.Text || currentNode.Properties.Expression,
                        currentNode.Properties.DisplayName,
                        currentNode.Properties.Color
                    );
                }
            }
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
                    // Calculate offset for previous choice (if visible, it takes index 0)
                    const hasPreviousChoice = showPrevious && previousChoiceHistory.length > 0;
                    const choiceOffset = hasPreviousChoice ? 1 : 0;

                    return (
                        <div>
                            {currentNode.Properties.Options.map((option: any, index: number) => {
                                if (option.hidden) return null;
                                const visibleIndex = visibleOptions.indexOf(option);
                                // Only select if previous choice is NOT selected
                                const isSelected = !isPreviousChoiceSelected && (visibleIndex + choiceOffset === selectedChoiceIndex);
                                return (
                                    <div key={index} style={{ marginBottom: '20px' }}>
                                        <InstructionPanel
                                            title={option.nodeData.Properties.DisplayName}
                                            text={option.nodeData.Properties.Text || option.nodeData.Properties.Expression}
                                            color={option.nodeData.Properties.Color}
                                            selected={isSelected}
                                            button={{
                                                hidden: false,
                                                text: "Next",
                                                onClick: option.onClick
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )
                case "Instruction":
                    // Check if this Instruction node has multiple output connections (acts like a Hub)
                    if (currentNode.Properties.OutputPins[0].Connections && currentNode.Properties.OutputPins[0].Connections.length > 1) {
                        // Treat as Hub with multiple choices - use same logic as Hub case
                        console.log("Instruction with multiple outputs (Hub-like) triggered! Current node:", currentNode);

                        const instructionHubOptions = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>{
                            const targetNode = project.GetNodeByID(conn.Target);
                            const conditionText = getConditionText(conn);
                            const conditionMet = conditionText==="" ? true : project.CheckConditionString(conditionText);
                            return {
                                disabled: !conditionMet,
                                nodeData: targetNode,
                                conditionText: conditionText, // Store condition text for display
                                onClick:()=>{
                                    if (conditionMet) {
                                        navigateWithChoice(
                                            targetNode,
                                            targetNode.Properties.Text || targetNode.Properties.Expression,
                                            targetNode.Properties.DisplayName,
                                            targetNode.Properties.Color
                                        );
                                    }
                                }
                            };
                        });

                        const nodeRefs = useRef<(React.RefObject<HTMLDivElement>)[]>(
                            instructionHubOptions.map(() => createRef<HTMLDivElement>())
                        );

                        return (
                            <div style={{ position: 'relative' }}>
                                {/* Condition bubbles on the left */}
                                {instructionHubOptions.map((option: any, index: number) => {
                                    console.log('Instruction Hub Option:', { index, conditionText: option.conditionText, disabled: option.disabled });
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
                                {instructionHubOptions.map((option: any, index: number) => {
                                    // Calculate offset for previous choice (if visible, it takes index 0)
                                    const hasPreviousChoice = showPrevious && previousChoiceHistory.length > 0;
                                    const choiceOffset = hasPreviousChoice ? 1 : 0;
                                    // Selection index is based on position in all options (including disabled)
                                    const forwardChoiceIndex = index + choiceOffset;
                                    // Only select if previous choice is NOT selected
                                    const isSelected = !isPreviousChoiceSelected && (forwardChoiceIndex === selectedChoiceIndex);

                                    return (
                                        <div key={index} ref={nodeRefs.current[index]} style={{ marginBottom: '20px' }}>
                                            <InstructionPanel
                                                title={option.nodeData.Properties.DisplayName}
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
                        )
                    } else {
                        // Regular single-path Instruction
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
                                    hidden:false,
                                    text:"Next",
                                    onClick:()=>{
                                        const targetNode = project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target);
                                        navigateWithChoice(
                                            targetNode,
                                            currentNode.Properties.Expression,
                                            currentNode.Properties.DisplayName,
                                            currentNode.Properties.Color
                                        );
                                    }
                                }}
                            />
                        )
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
                                hidden:false,
                                text:"Next",
                                onClick:()=>{
                                    const targetNode = project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target);
                                    navigateWithChoice(
                                        targetNode,
                                        currentNode.Properties.Expression,
                                        currentNode.Properties.DisplayName,
                                        currentNode.Properties.Color
                                    );
                                }
                            }}
                        />
                    )
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
                                text:"Next",
                                onClick:()=>{
                                    // Check if this node has multiple output connections
                                    if (currentNode.Properties.OutputPins[0].Connections && currentNode.Properties.OutputPins[0].Connections.length > 1) {
                                        // Create a virtual choice node to show multiple options
                                        const choiceOptions = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>{
                                            const targetNode = project.GetNodeByID(conn.Target);
                                            const conditionText = targetNode.Properties.InputPins && targetNode.Properties.InputPins[0] ? targetNode.Properties.InputPins[0].Text : "";
                                            return {
                                                hidden: conditionText===""?false:!project.CheckConditionString(conditionText),
                                                nodeData: targetNode,
                                                onClick:()=>{
                                                    // Store the choice that was made (the target node info) and navigate to it
                                                    // Pass the VirtualChoice node as the source
                                                    const virtualChoiceNode = {
                                                        Type: "VirtualChoice",
                                                        Properties: {
                                                            Options: choiceOptions
                                                        }
                                                    };
                                                    navigateWithChoice(
                                                        targetNode,
                                                        targetNode.Properties.Text || targetNode.Properties.Expression,
                                                        targetNode.Properties.DisplayName,
                                                        targetNode.Properties.Color,
                                                        virtualChoiceNode
                                                    );
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
                                        const targetNode = project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target);
                                        navigateWithChoice(
                                            targetNode,
                                            currentNode.Properties.Text || currentNode.Properties.Expression,
                                            currentNode.Properties.DisplayName,
                                            currentNode.Properties.Color
                                        );
                                    }
                                }
                            }}
                        />
                    )
                case "DialogueFragment":
                case "DialogueInteractiveFragmentTemplate":
                    // Check if this node has no output connections - show end of flow
                    if (!hasOutputConnections(currentNode)) {
                        return <EndOfFlowPanel onRestart={restartFlow} selected={!isPreviousChoiceSelected} />;
                    }

                    // Get speaker name with dialogue icon if available
                    const getSpeakerName = (node: any) => {
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
                    };

                    const speakerName = getSpeakerName(currentNode);

                    // Get speaker name as string for choice title (without JSX)
                    const getSpeakerNameString = (node: any) => {
                        if (node.Properties.Speaker) {
                            const speakerNode = project.GetNodeByID(node.Properties.Speaker);
                            if (speakerNode) {
                                return speakerNode.Properties.DisplayName;
                            }
                        }
                        return node.Properties.DisplayName;
                    };

                    // Check if this node has multiple output connections
                    if (currentNode.Properties.OutputPins &&
                        currentNode.Properties.OutputPins[0] &&
                        currentNode.Properties.OutputPins[0].Connections &&
                        currentNode.Properties.OutputPins[0].Connections.length > 1) {

                        console.log("DialogueInteractiveFragmentTemplate with multiple outputs detected! Connections:", currentNode.Properties.OutputPins[0].Connections);

                        // First show the dialogue text, then when clicked, show the choices
                        return (
                            <InstructionPanel
                                title={speakerName || currentNode.Properties.DisplayName}
                                text={currentNode.Properties.Text}
                                color={currentNode.Properties.Color}
                                selected={!isPreviousChoiceSelected}
                                button={{
                                    hidden: false,
                                    text:"Next",
                                    onClick:()=>{
                                        // Create a virtual choice node to show the response options
                                        const dialogueFragmentOptions = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>{
                                            const targetNode = project.GetNodeByID(conn.Target);
                                            const conditionText = getConditionText(conn);
                                            const conditionMet = conditionText==="" ? true : project.CheckConditionString(conditionText);

                                            console.log("DialogueInteractiveFragmentTemplate choice:", {
                                                targetNodeId: conn.Target,
                                                targetNodeType: targetNode.Type,
                                                targetNodeText: targetNode.Properties.Text,
                                                conditionText: conditionText,
                                                conditionMet: conditionMet,
                                                disabled: !conditionMet
                                            });

                                            return {
                                                disabled: !conditionMet,
                                                nodeData: targetNode,
                                                conditionText: conditionText,
                                                onClick:()=>{
                                                    if (conditionMet) {
                                                        // Pass the VirtualChoice node as the source
                                                        const virtualChoiceNode = {
                                                            Type: "VirtualChoice",
                                                            Properties: {
                                                                Options: dialogueFragmentOptions
                                                            }
                                                        };
                                                        navigateWithChoice(
                                                            targetNode,
                                                            targetNode.Properties.Text || targetNode.Properties.Expression,
                                                            getSpeakerNameString(targetNode), // Use target node's speaker name as title
                                                            targetNode.Properties.Color,
                                                            virtualChoiceNode
                                                        );
                                                    }
                                                }
                                            };
                                        });

                                        // Store the current dialogue as choice info for history
                                        const choiceInfo = {
                                            text: currentNode.Properties.Text,
                                            title: getSpeakerNameString(currentNode),
                                            color: currentNode.Properties.Color
                                        };

                                        // Set a virtual choice node to show the response options
                                        setCurrentNode({
                                            Type: "VirtualChoice",
                                            Properties: {
                                                Options: dialogueFragmentOptions
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
                                    text:"Next",
                                    onClick:()=>{
                                        const targetNode = project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target);
                                        navigateWithChoice(
                                            targetNode,
                                            currentNode.Properties.Text,
                                            getSpeakerNameString(currentNode), // Use speaker name as title
                                            currentNode.Properties.Color
                                        );
                                    }
                                }}
                            />
                        );
                    }
                case "Hub":
                    console.log("Hub case triggered! Current node:", currentNode);

                    const hubOptions = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>{
                        const targetNode = project.GetNodeByID(conn.Target);
                        const conditionText = getConditionText(conn);
                        const conditionMet = conditionText==="" ? true : project.CheckConditionString(conditionText);
                        return {
                            disabled: !conditionMet,
                            nodeData: targetNode,
                            conditionText: conditionText, // Store condition text for display
                            onClick:()=>{
                                if (conditionMet) {
                                    // Navigate to the target node - let navigateWithChoice handle any skipping logic
                                    navigateWithChoice(
                                        targetNode,
                                        targetNode.Properties.Text || targetNode.Properties.Expression,
                                        targetNode.Properties.DisplayName,
                                        targetNode.Properties.Color
                                    );
                                }
                            }
                        };
                    });

                    const hubNodeRefs = useRef<(React.RefObject<HTMLDivElement>)[]>(
                        hubOptions.map(() => createRef<HTMLDivElement>())
                    );

                    return (
                        <div style={{ position: 'relative' }}>
                            {/* Condition bubbles on the left */}
                            {hubOptions.map((option: any, index: number) => {
                                console.log('Hub Option:', { index, conditionText: option.conditionText, disabled: option.disabled });
                                return option.conditionText && (
                                    <ConditionBubble
                                        key={`condition-${index}`}
                                        condition={option.conditionText}
                                        nodeRef={hubNodeRefs.current[index]}
                                        disabled={option.disabled}
                                    />
                                );
                            })}

                            {/* Choice nodes */}
                            {hubOptions.map((option: any, index: number) => {
                                // Calculate offset for previous choice (if visible, it takes index 0)
                                const hasPreviousChoice = showPrevious && previousChoiceHistory.length > 0;
                                const choiceOffset = hasPreviousChoice ? 1 : 0;
                                // Selection index is based on position in all options (including disabled)
                                const forwardChoiceIndex = index + choiceOffset;
                                // Only select if previous choice is NOT selected
                                const isSelected = !isPreviousChoiceSelected && (forwardChoiceIndex === selectedChoiceIndex);

                                return (
                                    <div key={index} ref={hubNodeRefs.current[index]} style={{ marginBottom: '20px' }}>
                                        <InstructionPanel
                                            title={option.nodeData.Properties.DisplayName}
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
                    )
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
                    console.log("Has output connections:", hasOutputConnections(currentNode));
                    console.log("OutputPins:", currentNode.Properties.OutputPins);

                    // Check if this node has no output connections - show end of flow
                    if (!hasOutputConnections(currentNode)) {
                        console.log("No output connections - showing end of flow");
                        return <EndOfFlowPanel onRestart={restartFlow} selected={!isPreviousChoiceSelected} />;
                    }

                    // Check if this node has multiple output connections (acts like a Hub)
                    if (currentNode.Properties.OutputPins[0].Connections && currentNode.Properties.OutputPins[0].Connections.length > 1) {
                        // Treat as Hub with multiple choices - use same logic as Hub case
                        console.log("DialogueIntActionTemplate with multiple outputs (Hub-like) triggered! Current node:", currentNode);

                        // Get speaker name with dialogue icon if available
                        const getSpeakerName = (node: any) => {
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
                        };

                        const dialogueHubOptions = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>{
                            const targetNode = project.GetNodeByID(conn.Target);
                            const conditionText = getConditionText(conn);
                            const conditionMet = conditionText==="" ? true : project.CheckConditionString(conditionText);

                            console.log("DialogueIntActionTemplate choice:", {
                                targetNodeId: conn.Target,
                                targetNodeType: targetNode.Type,
                                targetNodeText: targetNode.Properties.Text,
                                conditionText: conditionText,
                                conditionMet: conditionMet,
                                disabled: !conditionMet
                            });

                            return {
                                disabled: !conditionMet,
                                nodeData: targetNode,
                                conditionText: conditionText,
                                onClick:()=>{
                                    if (conditionMet) {
                                        // Get speaker name as string for choice title
                                        const getSpeakerNameString = (node: any) => {
                                            if (node.Properties.Speaker) {
                                                const speakerNode = project.GetNodeByID(node.Properties.Speaker);
                                                if (speakerNode) {
                                                    return speakerNode.Properties.DisplayName;
                                                }
                                            }
                                            return node.Properties.DisplayName;
                                        };

                                        navigateWithChoice(
                                            targetNode,
                                            targetNode.Properties.Text || targetNode.Properties.Expression,
                                            getSpeakerNameString(targetNode), // Use speaker name as title
                                            targetNode.Properties.Color
                                        );
                                    }
                                }
                            };
                        });

                        const nodeRefs = useRef<(React.RefObject<HTMLDivElement>)[]>(
                            dialogueHubOptions.map(() => createRef<HTMLDivElement>())
                        );

                        return (
                            <div style={{ position: 'relative' }}>
                                {/* Condition bubbles on the left */}
                                {dialogueHubOptions.map((option: any, index: number) => {
                                    console.log('Dialogue Hub Option:', { index, conditionText: option.conditionText, disabled: option.disabled });
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
                                {dialogueHubOptions.map((option: any, index: number) => {
                                    const speakerName = getSpeakerName(option.nodeData);
                                    // Calculate offset for previous choice (if visible, it takes index 0)
                                    const hasPreviousChoice = showPrevious && previousChoiceHistory.length > 0;
                                    const choiceOffset = hasPreviousChoice ? 1 : 0;
                                    // Selection index is based on position in all options (including disabled)
                                    const forwardChoiceIndex = index + choiceOffset;
                                    // Only select if previous choice is NOT selected
                                    const isSelected = !isPreviousChoiceSelected && (forwardChoiceIndex === selectedChoiceIndex);

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
                        )
                    } else {
                        // Single connection - navigate normally like DialogueInteractiveFragmentTemplate
                        // Get speaker name with dialogue icon if available
                        const getSpeakerName = (node: any) => {
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
                        };

                        const speakerName = getSpeakerName(currentNode);

                        return (
                            <InstructionPanel
                                title={speakerName || currentNode.Properties.DisplayName}
                                text={currentNode.Properties.Text}
                                color={currentNode.Properties.Color}
                                selected={!isPreviousChoiceSelected}
                                button={{
                                    hidden:false,
                                    text:"Next",
                                    onClick:()=>{
                                        console.log("Next button clicked, navigating to:", currentNode.Properties.OutputPins[0].Connections[0].Target);
                                        const targetNode = project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target);

                                        // Get speaker name as string for choice title
                                        const getSpeakerNameString = (node: any) => {
                                            if (node.Properties.Speaker) {
                                                const speakerNode = project.GetNodeByID(node.Properties.Speaker);
                                                if (speakerNode) {
                                                    return speakerNode.Properties.DisplayName;
                                                }
                                            }
                                            return node.Properties.DisplayName;
                                        };

                                        navigateWithChoice(
                                            targetNode,
                                            currentNode.Properties.Text,
                                            getSpeakerNameString(currentNode), // Use speaker name as title
                                            currentNode.Properties.Color
                                        );
                                    }
                                }}
                            />
                        )
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

                        const dialogueNodeOptions = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>{
                            const targetNode = project.GetNodeByID(conn.Target);
                            const conditionText = getConditionText(conn);
                            const conditionMet = conditionText==="" ? true : project.CheckConditionString(conditionText);

                            console.log("DialogueNode choice:", {
                                targetNodeId: conn.Target,
                                targetNodeType: targetNode.Type,
                                targetNodeText: targetNode.Properties.Text,
                                conditionText: conditionText,
                                conditionMet: conditionMet,
                                disabled: !conditionMet
                            });

                            return {
                                disabled: !conditionMet,
                                nodeData: targetNode,
                                conditionText: conditionText,
                                onClick:()=>{
                                    if (conditionMet) {
                                        navigateWithChoice(
                                            targetNode,
                                            targetNode.Properties.Text || targetNode.Properties.Expression,
                                            targetNode.Properties.DisplayName,
                                            targetNode.Properties.Color
                                        );
                                    }
                                }
                            };
                        });

                        const nodeRefs = useRef<(React.RefObject<HTMLDivElement>)[]>(
                            dialogueNodeOptions.map(() => createRef<HTMLDivElement>())
                        );

                        return (
                            <div>
                                {/* Choice nodes */}
                                {dialogueNodeOptions.map((option: any, index: number) => {
                                    // Calculate offset for previous choice (if visible, it takes index 0)
                                    const hasPreviousChoice = showPrevious && previousChoiceHistory.length > 0;
                                    const choiceOffset = hasPreviousChoice ? 1 : 0;
                                    // Selection index is based on position in all options (including disabled)
                                    const forwardChoiceIndex = index + choiceOffset;
                                    // Only select if previous choice is NOT selected
                                    const isSelected = !isPreviousChoiceSelected && (forwardChoiceIndex === selectedChoiceIndex);

                                    return (
                                        <div key={index} style={{ marginBottom: '20px' }}>
                                            <InstructionPanel
                                                title={option.nodeData.Properties.DisplayName}
                                                text={option.nodeData.Properties.Text || option.nodeData.Properties.Expression}
                                                color={option.nodeData.Properties.Color}
                                                selected={isSelected}
                                                button={{
                                                    hidden: false,
                                                    text: "Next",
                                                    onClick: option.onClick
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        );
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
                                    text:"Next",
                                    onClick:()=>{
                                        const targetNode = project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target);
                                        navigateWithChoice(
                                            targetNode,
                                            currentNode.Properties.Text || currentNode.Properties.Expression,
                                            currentNode.Properties.DisplayName,
                                            currentNode.Properties.Color
                                        );
                                    }
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
            // return(
            //     <QuestionPanel text="This is an embedded display." />
            // )
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