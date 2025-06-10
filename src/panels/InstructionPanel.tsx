import TextBlock from "../components/TextBlock";
import { Button } from "antd"

interface InstructionPanelProps{
    text:string;
    title?:string;
    button:{
        hidden:boolean;
        text:string;
        onClick:Function
    };
}

function InstructionPanel (props:InstructionPanelProps){
    if (!props.button.hidden){
        return(
            <div className="node">
                {props.title && (
                    <div className="articy-node-header">
                        {props.title}
                    </div>
                )}
                <TextBlock>{props.text}</TextBlock>
                <br />
                <Button
                    danger={props.button.hidden}
                    onClick={()=>{props.button.onClick()}}>{props.button.text}</Button>
            </div>
        )
    }
    else{
        return(
            <div className="node">
                {props.title && (
                    <div className="articy-node-header">
                        {props.title}
                    </div>
                )}
                <TextBlock>{props.text}</TextBlock>
            </div>
        )
    }
}

export default InstructionPanel