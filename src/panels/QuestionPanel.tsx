import { Button } from "antd";
import TextBlock from "../components/TextBlock";
import ArticyProject from "../ArticyProject";

interface QuestionPanelProps{
    text:string;
    buttons:{
        hidden:boolean;
        text:string;
        onClick:Function
    }[];
}

var i = 0;

function QuestionPanel (props:QuestionPanelProps){
    return(
        <>
        <TextBlock>{props.text}</TextBlock>
        <br />
        {props.buttons.map((button) => (<div key={i++}>
            <Button 
                disabled={button.hidden}
                onClick={()=>{button.onClick();}}>
                    {button.text}
            </Button>
        <br/><br/>
        </div>) )}
        </>
    )
}

export default QuestionPanel