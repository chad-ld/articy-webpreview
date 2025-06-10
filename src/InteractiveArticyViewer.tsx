import packageJson from "../package.json";
import { useEffect, useState } from "react";
import QuestionPanel from "./panels/QuestionPanel";
import ArticyProject from "./ArticyProject";
import InstructionPanel from "./panels/InstructionPanel";
import EndOfFlowPanel from "./panels/EndOfFlowPanel";
import { Button, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";

function InteractiveArticyViewer(){

    const [project, setProject] = useState(undefined as unknown as ArticyProject);
    const [nodeList, setNodeList] = useState([] as any[]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    var currentNode = nodeList.length>0?nodeList[nodeList.length-1]:undefined;
    var lastNode = nodeList.length>1?nodeList[nodeList.length-2]:undefined;

    useEffect(()=>{
        console.log("%c[Articy HTML Viewer - JSON export] version: "+packageJson.version,
         'color: #ffa619; background: #1c282a; font-size: 20px');
        console.log('Ready for file upload - drag and drop a JSON file or click to browse');
    },[]);

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

    function setCurrentNode(node:any){
        // console.log("setting current Node:",node);
        if (node.Type == "Instruction")
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
            switch (currentNode.Type){
                case "VirtualChoice":
                    return (
                        <div>
                            {currentNode.Properties.Options.map((option: any, index: number) => (
                                <div key={index} style={{ marginBottom: '20px' }}>
                                    <InstructionPanel
                                        title={option.nodeData.Properties.DisplayName}
                                        text={option.nodeData.Properties.Text || option.nodeData.Properties.Expression}
                                        color={option.nodeData.Properties.Color}
                                        button={{
                                            hidden: false,
                                            text: "Next",
                                            onClick: option.onClick
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )
                case "Instruction":
                    // Check if this Instruction node has multiple output connections (acts like a Hub)
                    if (currentNode.Properties.OutputPins[0].Connections && currentNode.Properties.OutputPins[0].Connections.length > 1) {
                        // Treat as Hub with multiple choices
                        function getConditionText(node:any){
                            const targetNode = project.GetNodeByID(node.Target);
                            return targetNode.Properties.InputPins && targetNode.Properties.InputPins[0] ? targetNode.Properties.InputPins[0].Text : "";
                        }
                        var options = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>{
                            const targetNode = project.GetNodeByID(conn.Target);
                            return {
                                hidden: getConditionText(conn)==""?false:!project.CheckConditionString(getConditionText(conn)),
                                text: targetNode.Properties.DisplayName || targetNode.Properties.Text || "Continue",
                                onClick:()=>{
                                    setCurrentNode(targetNode);
                                }
                            };
                        });

                        return (
                            <QuestionPanel
                                text={currentNode.Properties.Expression || currentNode.Properties.DisplayName}
                                buttons={options}
                            />
                        )
                    } else {
                        // Regular single-path Instruction
                        // Check if this node has no output connections - show end of flow
                        if (!hasOutputConnections(currentNode)) {
                            return <EndOfFlowPanel onRestart={restartFlow} />;
                        }

                        return (
                            <InstructionPanel
                                title={currentNode.Properties.DisplayName}
                                text={currentNode.Properties.Expression}
                                color={currentNode.Properties.Color}
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
                        return <EndOfFlowPanel onRestart={restartFlow} />;
                    }

                    return (
                        <InstructionPanel
                            title={currentNode.Properties.DisplayName}
                            text={currentNode.Properties.Expression}
                            color={currentNode.Properties.Color}
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
                        return <EndOfFlowPanel onRestart={restartFlow} />;
                    }

                    return (
                        <InstructionPanel
                            title={currentNode.Properties.DisplayName}
                            text={currentNode.Properties.Text}
                            color={currentNode.Properties.Color}
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
                case "DialogueInteractiveFragmentTemplate":
                    // Check if this node has no output connections - show end of flow
                    if (!hasOutputConnections(currentNode)) {
                        return <EndOfFlowPanel onRestart={restartFlow} />;
                    }

                    return (
                        <InstructionPanel
                            title={currentNode.Properties.DisplayName}
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
                    function getConditionText(node:any){
                        console.log(project.GetNodeByID(node.Target).Properties.Text,project.GetNodeByID(node.Target).Properties.InputPins[0].Text);
                        return project.GetNodeByID(node.Target).Properties.InputPins[0].Text;
                    }
                    var options = currentNode.Properties.OutputPins[0].Connections.map((conn:any)=>(
                        {
                            hidden: getConditionText(conn)==""?false:!project.CheckConditionString(getConditionText(conn)),
                            text:project.GetNodeByID(conn.Target).Properties.Text,
                            onClick:()=>{
                                setCurrentNode(project.GetNodeByID(project.GetNodeByID(conn.Target).Properties.OutputPins[0].Connections[0].Target));
                            }
                        }));

                    return (
                        <QuestionPanel 
                            text={project.GetNodeByID(currentNode.Properties.InputPins[0].Owner).Properties.Text}
                            buttons={options}
                        />
                    )
                case "Jump":
                    setTimeout(()=>{
                        setCurrentNode(project.GetNodeByID(currentNode.Properties.Target));
                    },0);
                    return (
                        <>Please wait...</>
                    )
                    break;
                case "FlowFragment":
                case "CombatFlowTemplate":
                case "CraftingFlowTemplate":
                case "TravelFlowTemplate":
                case "PlayerActionFlowTemplate":
                case "DialogueIntActionTemplate":
                case "DialogueInternalActionTemplate":
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
                    }
                    else{

                    }
                    return (
                        <>Please wait...</>
                    )
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
            {project ? <DisplayNode /> : <FileUploadArea />}
        </div>
    )
}

export default InteractiveArticyViewer;