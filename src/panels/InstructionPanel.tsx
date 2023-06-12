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
    if (!props.button.hidden){
        return(
            <>
            <TextBlock>{props.text}</TextBlock>
            <br />
            <Button 
                danger={props.button.hidden}
                onClick={()=>{props.button.onClick()}}>{props.button.text}</Button>
            </>
        )
    }
    else{
        return(
            <>
            <TextBlock>{props.text}</TextBlock>
            </>
        )
    }
}

export default InstructionPanel