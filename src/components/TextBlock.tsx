import { PropsWithChildren } from "react";

function TextBlock (props:PropsWithChildren){
    
    var textChunks = (props.children as string).split("\n");

    var i = 0;

    return(
        <>
        {textChunks.map((chunk) => (<div key={i++}>{chunk}<br/></div>) )}
        </>
    )
}

export default TextBlock