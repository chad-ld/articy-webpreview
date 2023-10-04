# Articy HTML Flow Preview
One of Articy’s biggest pain points is that you need Articy installed and shared access to a repository in order to preview a flow with someone who isn’t sitting at the same computer as you. This involves the clunky process of screenshots and/or recording your screen while you play through the flow. Neither option is ideal. This plugin was developed to overcome those limitations, letting any user with a web browser demo the flow first hand for repeated playthroughs. You can see a demo of an exported Articy flow in action here:

https://dev.chadbriggs.com/articy/testing/demo/index.html

### Requirements:

- A web server to host files for preview.
- Articy Draft 3.0 or later.
- Text editor to modify HTML to point to Articy JSON file.

### Current Features:

- Supports all major Articy node types.
- Supports custom node templates and custom color on nodes.
- Shows syntax highlighting on code elements.
- Processes Articy variables.
- Can change the Articy JSON file the plugin pulls the flow from.
- Shows input/output pin conditions on nodes.
- Toggles nodes that can’t be accessed due to lack of conditions met, darkens them out.

### On Roadmap Features:

- Investigate consolidating code so HTML files may be run locally without uploading to a web server or running a local web server.
- Add support for external hyperlinks in node body/text.
- Add support to jump to “bark” nodes.
- Tweak view/formatting on mobile devices.
- Have a “variable” sidebar/view where you can toggle to see the states of all the variables at any point in the flow.
- Add item/character images to node renderings in HTML.

### Usage Instructions

1. Download the HTML template files here:
    
    [html_viewer_template_v1.zip](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/5854c665-33b1-4151-8c7e-417d7def6d4b/html_viewer_template_v1.zip)
    
2. Export the files to a folder on your hard drive, keeping the same folder structure as the zip file. 
3. Open up your Articy project in the Articy Editor. 
4. Wherever you want the HTML preview of your flow to start, create an instruction node and insert the following line in the node: //HTMLPREVIEW
An example of such a node in Articy is as follows:
    
    ![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/312a30e2-c07b-475b-8a46-fb707d3516aa/Untitled.png)
    
5. Save your Articy project.
6. Export your Articy project. 
    
    ![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/cd286e9e-c2f3-4784-8c5c-85bdfe37d79b/Untitled.png)
    
7. Select the JSON format, and then set the location of the JSON export. In most cases, the other default export settings will work just fine, no need to modify those. The HTML preview exporter will only use the flows that are connected to your //HTMLPREVEW start node. 
    
    ![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/27db179d-6f07-4de0-a4ee-ce150c74d698/Untitled.png)
    
8. Move the newly exported Articy JSON file in the same folder as the index.hml that you downloaded above. 
9. Open the index.html file inside a text editor, change the default JSON file export to the name of your Articy export. Save and close the text editor. 
    
    ![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/c3171ddf-5180-4162-aece-b1d242cea74b/Untitled.png)
    
10. Copy the Articy template folder to a webserver. The main folder your index.html and associated files will reside in can be renamed from “html_viewer_template_v1” to whatever you wish, just do not rename or move the “assets” folder relative to the index.html file.  
11. Navigate to the URL of the folder location based where you uploaded the file to on your webserver. So a sample path might be https://www.customurl.com/myflowname/index.html

As always, any feedback is greatly appreciated to help me improve the project.
