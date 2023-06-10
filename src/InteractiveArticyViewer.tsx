import { useEffect, useState } from "react";
import QuestionPanel from "./panels/QuestionPanel";
import ArticyProject from "./ArticyProject";
import InstructionPanel from "./panels/InstructionPanel";

function InteractiveArticyViewer(){

    const [project, setProject] = useState(undefined as unknown as ArticyProject);
    const [nodeList, setNodeList] = useState([] as any[])
    const [parentNodeList, setParentNodeList] = useState([] as any[])
    

    var currentNode = nodeList.length>0?nodeList[nodeList.length-1]:undefined;
    var lastNode = nodeList.length>1?nodeList[nodeList.length-2]:undefined;
    var parentNode = parentNodeList.length>0?parentNodeList[parentNodeList.length-1]:undefined;

    useEffect(()=>{
        fetch('../Articy Base Project.json?'+(Date.now().toString())).then( response => {return response.json();}).then( data => {
            setProject(new ArticyProject(data));
        })
        .catch((error)=>{
          console.error(error);
        });
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
    }, [nodeList]);

    function setCurrentNode(node:any){
        // console.log("setting current Node:",node);
        if (node.Type == "Instruction")
            project.StoreVariablesFromNode(node);
        setNodeList([...nodeList,node]);
    }
    
    function DisplayNode(){
        if (currentNode != undefined){
            switch (currentNode.Type){
                case "Instruction":
                    return (
                        <InstructionPanel 
                            text={currentNode.Properties.Expression}
                            button={{
                                hidden:false,
                                text:"Next",
                                onClick:()=>{
                                    setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
                                }
                            }}
                        />
                    )
                case "DialogueInteractiveFragmentTemplate":
                    //console.log(currentNode.Properties.OutputPins[0].Connections==undefined);
                    return (
                        <InstructionPanel 
                            text={currentNode.Properties.Text}
                            button={{
                                hidden:currentNode.Properties.OutputPins[0].Connections==undefined?true:false,
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
                    if (parentNodeList.length>0 && parentNodeList[parentNodeList.length-1].Properties.Id == currentNode.Properties.Id)
                    {
                        console.log(parentNodeList[parentNodeList.length-1], currentNode);
                        setTimeout(()=>{
                            parentNodeList.pop();
                            setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
                        },0);
                    }
                    else{
                        let childnode = project.GetFirstChildOfNode(currentNode);
                        if (childnode != undefined){
                            setTimeout(()=>{
                                setParentNodeList([...parentNodeList,currentNode]);
                                setCurrentNode(childnode);
                            },0);
                        }
                        else{
                            setTimeout(()=>{
                                setCurrentNode(project.GetNodeByID(currentNode.Properties.OutputPins[0].Connections[0].Target));
                            },0);
                        }
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

    return (
        <div>
            <DisplayNode />
        </div>
    )
}

export default InteractiveArticyViewer;