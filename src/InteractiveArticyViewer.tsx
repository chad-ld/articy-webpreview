import packageJson from "../package.json";
import React, { useEffect, useState, useRef, createRef } from "react";
import QuestionPanel from "./panels/QuestionPanel";
import ArticyProject from "./ArticyProject";
import InstructionPanel from "./panels/InstructionPanel";
import EndOfFlowPanel from "./panels/EndOfFlowPanel";
import VariablesPanel from "./components/VariablesPanel";
import { Button, message } from "antd";
import { InboxOutlined, CommentOutlined } from "@ant-design/icons";

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
        setSelectedChoiceIndex(0);
    }, [currentNode]);

    function setCurrentNode(node:any){
        // console.log("setting current Node:",node);
        if (node.Type == "Instruction" || node.Type == "WaypointTemplate")
            project.StoreVariablesFromNode(node);
        setNodeList([...nodeList,node]);
    }

    function restartFlow(){
        setNodeList([]);
        setTimeout(() => {
            setCurrentNode(project.GetStartNode());
        }, 0);
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

        switch (currentNode.Type) {
            case "VirtualChoice":
                return currentNode.Properties.Options.filter((option: any) => !option.hidden);

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
                    return instructionHubOptions.filter((option: any) => !option.disabled);
                }
                return [{ isSingleChoice: true }]; // Single choice indicator

            case "DialogueInteractiveFragmentTemplate":
                if (currentNode.Properties.OutputPins &&
                    currentNode.Properties.OutputPins[0] &&
                    currentNode.Properties.OutputPins[0].Connections) {

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
                                    const finalTarget = project.GetNodeByID(targetNode.Properties.OutputPins[0].Connections[0].Target);
                                    setCurrentNode(finalTarget);
                                }
                            }
                        };
                    });
                    return hubOptions.filter((option: any) => !option.disabled);
                }
                return [{ isSingleChoice: true }];

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
                    return dialogueHubOptions.filter((option: any) => !option.disabled);
                }
                return [{ isSingleChoice: true }];

            default:
                // For other node types that have single "Next" buttons
                if (hasOutputConnections(currentNode)) {
                    return [{ isSingleChoice: true }];
                }
                return [{ isEndOfFlow: true }]; // End of flow
        }
    }

    // Helper function to handle Enter key press
    function handleEnterKey(availableChoices: any[]) {
        if (availableChoices.length === 0) return;

        const selectedChoice = availableChoices[selectedChoiceIndex];

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
                    setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
                }
            } else {
                // Handle other single-choice node types
                if (hasOutputConnections(currentNode)) {
                    setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
                }
            }
        } else {
            // Handle multiple choice selection
            if (selectedChoice.onClick) {
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
    
    function DisplayNode(){
        if (currentNode != undefined){
            console.log("DisplayNode - Current node type:", currentNode.Type);
            console.log("DisplayNode - Current node:", currentNode);
            switch (currentNode.Type){
                case "VirtualChoice":
                    const visibleOptions = currentNode.Properties.Options.filter((option: any) => !option.hidden);
                    return (
                        <div>
                            {currentNode.Properties.Options.map((option: any, index: number) => {
                                if (option.hidden) return null;
                                const visibleIndex = visibleOptions.indexOf(option);
                                return (
                                    <div key={index} style={{ marginBottom: '20px' }}>
                                        <InstructionPanel
                                            title={option.nodeData.Properties.DisplayName}
                                            text={option.nodeData.Properties.Text || option.nodeData.Properties.Expression}
                                            color={option.nodeData.Properties.Color}
                                            selected={visibleIndex === selectedChoiceIndex}
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
                                        setCurrentNode(targetNode);
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
                                    const enabledOptions = instructionHubOptions.filter((opt: any) => !opt.disabled);
                                    const enabledIndex = enabledOptions.indexOf(option);
                                    return (
                                        <div key={index} ref={nodeRefs.current[index]} style={{ marginBottom: '20px' }}>
                                            <InstructionPanel
                                                title={option.nodeData.Properties.DisplayName}
                                                text={option.nodeData.Properties.Text || option.nodeData.Properties.Expression}
                                                color={option.nodeData.Properties.Color}
                                                selected={!option.disabled && enabledIndex === selectedChoiceIndex}
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
                            return <EndOfFlowPanel onRestart={restartFlow} selected={true} />;
                        }

                        return (
                            <InstructionPanel
                                title={currentNode.Properties.DisplayName}
                                text={currentNode.Properties.Expression}
                                color={currentNode.Properties.Color}
                                selected={true}
                                button={{
                                    hidden:false,
                                    text:"Next",
                                    onClick:()=>{
                                        setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
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
                        return <EndOfFlowPanel onRestart={restartFlow} selected={true} />;
                    }

                    return (
                        <InstructionPanel
                            title={currentNode.Properties.DisplayName}
                            text={currentNode.Properties.Expression}
                            color={currentNode.Properties.Color}
                            selected={true}
                            button={{
                                hidden:false,
                                text:"Next",
                                onClick:()=>{
                                    setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
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
                        return <EndOfFlowPanel onRestart={restartFlow} selected={true} />;
                    }

                    return (
                        <InstructionPanel
                            title={currentNode.Properties.DisplayName}
                            text={currentNode.Properties.Text}
                            color={currentNode.Properties.Color}
                            selected={true}
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
                                                    setCurrentNode(targetNode);
                                                }
                                            };
                                        });

                                        // Set a virtual choice node
                                        setCurrentNode({
                                            Type: "VirtualChoice",
                                            Properties: {
                                                Options: choiceOptions
                                            }
                                        });
                                    } else {
                                        // Single connection - navigate normally
                                        setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
                                    }
                                }
                            }}
                        />
                    )
                case "DialogueFragment":
                case "DialogueInteractiveFragmentTemplate":
                    // Check if this node has no output connections - show end of flow
                    if (!hasOutputConnections(currentNode)) {
                        return <EndOfFlowPanel onRestart={restartFlow} selected={true} />;
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

                    return (
                        <InstructionPanel
                            title={speakerName || currentNode.Properties.DisplayName}
                            text={currentNode.Properties.Text}
                            color={currentNode.Properties.Color}
                            button={{
                                hidden: false,
                                text:"Next",
                                onClick:()=>{
                                    setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
                                }
                            }}
                        />
                    )
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
                                    // Navigate to the actual target node (skip intermediate nodes)
                                    const finalTarget = project.GetNodeByID(targetNode.Properties.OutputPins[0].Connections[0].Target);
                                    setCurrentNode(finalTarget);
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
                                const enabledOptions = hubOptions.filter((opt: any) => !opt.disabled);
                                const enabledIndex = enabledOptions.indexOf(option);
                                return (
                                    <div key={index} ref={hubNodeRefs.current[index]} style={{ marginBottom: '20px' }}>
                                        <InstructionPanel
                                            title={option.nodeData.Properties.DisplayName}
                                            text={option.nodeData.Properties.Text || option.nodeData.Properties.Expression}
                                            color={option.nodeData.Properties.Color}
                                            selected={!option.disabled && enabledIndex === selectedChoiceIndex}
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
                        return <EndOfFlowPanel onRestart={restartFlow} selected={true} />;
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
                                    const enabledOptions = dialogueHubOptions.filter((opt: any) => !opt.disabled);
                                    const enabledIndex = enabledOptions.indexOf(option);
                                    const speakerName = getSpeakerName(option.nodeData);
                                    return (
                                        <div key={index} ref={nodeRefs.current[index]} style={{ marginBottom: '20px' }}>
                                            <InstructionPanel
                                                title={speakerName || option.nodeData.Properties.DisplayName}
                                                text={option.nodeData.Properties.Text || option.nodeData.Properties.Expression}
                                                color={option.nodeData.Properties.Color}
                                                selected={!option.disabled && enabledIndex === selectedChoiceIndex}
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
                                selected={true}
                                button={{
                                    hidden:false,
                                    text:"Next",
                                    onClick:()=>{
                                        console.log("Next button clicked, navigating to:", currentNode.Properties.OutputPins[0].Connections[0].Target);
                                        setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
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
                        return <EndOfFlowPanel onRestart={restartFlow} selected={true} />;
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
                {project ? <DisplayNode /> : <FileUploadArea />}
            </div>
        </div>
    )
}

export default InteractiveArticyViewer;