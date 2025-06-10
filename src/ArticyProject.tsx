import _ from "lodash";

class ArticyProject{
    
    data:any;

    variables:any;
    
    constructor(data:Object){
        this.data = data;
        this.variables = {};
        for (let i = 0; i<this.data.GlobalVariables.length; i++){
            let namespace = this.data.GlobalVariables[i].Namespace;
            this.variables[namespace]={};
            for (let j = 0; j<this.data.GlobalVariables[i].Variables.length; j++){
                let v = this.data.GlobalVariables[i].Variables[j];
                this.variables[namespace][v.Variable] = v.Value.toLowerCase();
            }
        }
        console.log("variables initialized",this.variables);
    }

    GetNodeByID(ID:string){
        // console.log("Getting node...", ID);
        for (let i = 0; i < this.data.Packages[0].Models.length; i++) {
            const element = this.data.Packages[0].Models[i];
            if (element.Properties == undefined)
                continue;
            if (element.Properties.Id == undefined)
                continue;
            if (element.Properties.Id == ID)
                return element;
        }
        return undefined;
    }

    GetStartNode(){
        for (let i = 0; i < this.data.Packages[0].Models.length; i++) {
            const element = this.data.Packages[0].Models[i];
            if (element.Properties == undefined)
                continue;
            if (element.Properties.Expression == undefined)
                continue;
            if ((element.Properties.Expression as string).includes("HTMLPREVIEW")){
                return element;
            }
        };
    }

    StoreVariablesFromNode(node:any){
        if (node.Properties == undefined)
            return;
        if (node.Properties.Expression == undefined)
            return;
        this.variables = _.merge(this.variables,this.GetVariablesFromNode(node));
        return undefined;
    }

    GetFirstChildOfNode(parentnode:any){
        function recursiveSearch(node:any){
            if (node.Children==undefined)
                return undefined;
            if (node.Id == parentnode.Properties.Id)
                return node.Children[0];
            let child:any = undefined;
            for (let i=0; i < node.Children.length; i++){
                child = recursiveSearch(node.Children[i]);
                if (child != undefined)
                    return child;
            }
            return undefined;
        }
        let child:any = recursiveSearch(this.data.Hierarchy);
        if (child == undefined) {
            return undefined;
        }
        return this.GetNodeByID(child.Id);
    }

    GetVariablesFromNode(node:any){
       
        if (node.Properties == undefined)
            return;
        if (node.Properties.Expression == undefined)
            return;
        
        var textChunks:string[] = (node.Properties.Expression as string).split("\n");

        var newVars:{[k:string]:any} = {};

        //remove all commented and empty lines
        for (let i=textChunks.length-1; i>=0; i--){
            if (textChunks[i].trim().slice(0,2) == "//"){
                textChunks.splice(i,1);
                continue;
            }
            if (textChunks[i].trim().length > 0){
                //NEED SANITY CHECKING HERE
                console.log("processing...",textChunks[i]);
                let value = this.SplitValueFromText(textChunks[i]);
                let newData:{[k:string]:any} = {};
                let dataChunks = this.SplitIndexersFromText(textChunks[i]);
                newData[dataChunks[dataChunks.length-1].trim()] = value;
                for (let j=dataChunks.length-2; j>=0; j--){
                    newData = {[dataChunks[j]]:newData} as {[k:string]:any};
                }
                newVars = _.merge(newData,newVars);
            }
        }
        
        return newVars;
    }

    CheckConditionString(condition:string){
        // Handle compound conditions with && and || operators
        if (condition.includes('&&')) {
            const parts = condition.split('&&');
            return parts.every(part => this.CheckSingleCondition(part.trim()));
        } else if (condition.includes('||')) {
            const parts = condition.split('||');
            return parts.some(part => this.CheckSingleCondition(part.trim()));
        } else {
            return this.CheckSingleCondition(condition);
        }
    }

    CheckSingleCondition(condition:string){
        let value = this.SplitValueFromText(condition);
        let newData:{[k:string]:any} = {};
        let dataChunks = this.SplitIndexersFromText(condition);
        newData[dataChunks[dataChunks.length-1].trim()] = value;
        for (let j=dataChunks.length-2; j>=0; j--){
            newData = {[dataChunks[j]]:newData} as {[k:string]:any};
        }
        return this.ObjectCompare(this.variables,newData);
    }

    CheckCondition(condition:{}){
        return this.ObjectCompare(this.variables,condition);
    }

    ObjectCompare(objx:any,objy:any):boolean{
        //checks if obj2 key is in obj1
        //returns value comparison

        function GetValue(obj1:any,obj2:any):any{
            const obj1Keys = Object.keys(obj1).sort();
            const obj2Keys = Object.keys(obj2).sort();
            if (typeof obj1 === 'string'){
                //we have our value
                return obj1;
            }
            for (let i=0; i<obj2Keys.length; i++){
                if (obj1Keys.indexOf(obj2Keys[i]) != -1){
                    let result = GetValue(obj1[obj2Keys[i]],obj2[obj2Keys[i]]);
                    return result;
                }
            }
            return "false";
        }

        let obj1Value = GetValue(objx,objy);
        let obj2Value = GetValue(objy,objy);
        return obj1Value == obj2Value;
    }

    SplitIndexersFromText(text:string){
        return text.split("=")[0].trim().split(".");
    }
    SplitValueFromText(text:string){
        let chunks = text.split("=");
        return chunks[chunks.length-1].trim().replaceAll(";","").trim();
    }
}

export default ArticyProject