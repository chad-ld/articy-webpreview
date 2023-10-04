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
    
   https://github.com/chad-ld/articy-webpreview/tree/main/builds
    
2. Export the files to a folder on your hard drive, keeping the same folder structure as the zip file. 
3. Open up your Articy project in the Articy Editor. 
4. Wherever you want the HTML preview of your flow to start, create an instruction node and insert the following line in the node: //HTMLPREVIEW
An example of such a node in Articy is as follows:
    
![Untitled](https://github.com/chad-ld/articy-webpreview/assets/124286589/301456c0-2225-4184-8cbd-744b6e34efa6)

5. Save your Articy project.
6. Export your Articy project. 
    
![Untitled (1)](https://github.com/chad-ld/articy-webpreview/assets/124286589/a26450e8-e086-425f-baeb-bcf3af6ecc19)
    
7. Select the JSON format, and then set the location of the JSON export. In most cases, the other default export settings will work just fine, no need to modify those. The HTML preview exporter will only use the flows that are connected to your //HTMLPREVEW start node. 
    
![Untitled (2)](https://github.com/chad-ld/articy-webpreview/assets/124286589/9d9440bd-c122-4d22-9137-c6d4008d764c)

8. Move the newly exported Articy JSON file in the same folder as the index.hml that you downloaded above. 
9. Open the index.html file inside a text editor, change the default JSON file export to the name of your Articy export. Save and close the text editor. 
    
![Untitled (3)](https://github.com/chad-ld/articy-webpreview/assets/124286589/16d66700-a294-41e2-8ac8-a684bee92b0d)

10. Copy the Articy template folder to a webserver. The main folder your index.html and associated files will reside in can be renamed from “html_viewer_template_v1” to whatever you wish, just do not rename or move the “assets” folder relative to the index.html file.  
11. Navigate to the URL of the folder location based where you uploaded the file to on your webserver. So a sample path might be https://www.customurl.com/myflowname/index.html

As always, any feedback is greatly appreciated to help me improve the project.
