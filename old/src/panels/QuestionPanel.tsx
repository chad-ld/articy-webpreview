import { Button } from "antd";
import TextBlock from "../components/TextBlock";

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
        <div className="node">
            <TextBlock>{props.text}</TextBlock>
            <br />
            {props.buttons.map((button) => (<div key={i++}>
                <Button
                    danger={button.hidden}
                    onClick={()=>{button.onClick();}}>
                        {button.text}
                </Button>
            <br/><br/>
            </div>) )}
        </div>
    )
}

export default QuestionPanel