import TextBlock from "../components/TextBlock";
import { Button } from "antd"

interface InstructionPanelProps{
    text:string;
    button:{
        hidden:boolean;
        text:string;
        onClick:Function
    };
}

function InstructionPanel (props:InstructionPanelProps){
    return(
        <>
        <TextBlock>{props.text}</TextBlock>
        <br />
        <Button 
            disabled={props.button.hidden}
            onClick={()=>{props.button.onClick()}}>{props.button.text}</Button>
        </>
    )
}

export default InstructionPanel