# node-red-contrib-box-note

## Features
Create collaboration
Create folder
Create new note box with template
Create tag name
Download file
Get Infomation folder
Upload file 

## Get Key
By far the more flexible way to use Box Platform is through a Custom App integration.

Custom Apps support OAuth 2.0 authentication. They allow the application to manipulate files and folders, as well as interact with tasks, legal holds, and other enterprise-level properties.

To get OAuth 2.0 authentication, follow to guideline: https://github.com/taminhhienmor/node-red-contrib-box-note/blob/master/guidelineGetKey.docx

## Usage

### Create collaboration
<p>Adds a collaboration for a single user/ muiltiple users to a file or folder.</p>
<p>Input Parameters:
<ul>
  <li><b>Url Share</b> - The url of folder/file want to share. The url on Box is taken from the node <b>Name Folder</b> property or the <code>msg.[name]</code> property</li>
  <li><b>Collaborator</b> - The name for the collaborator. The name on Box is taken from the node <b>Collaborator</b> property or the <code>msg.collaborator</code> property</li>
  <li><b>Role</b> - The level of access granted. Value is one of "editor", "viewer", "previewer", "uploader", "previewer uploader", "viewer uploader", "co-owner". The role collaborator is taken from the node <b>Url Folder</b> property or the <code>msg.[name]</code> property</li>
</ul>
</p>
<p>Return values:
<ul>
  <li><b>payload</b> Will either be link url created or provide an error state</li>
</ul>
</p>
![Create-collaboration](https://cdn.jsdelivr.net/gh/taminhhienmor/node-red-contrib-box-note/source/image/createCollaboration.png)
``` node
[{"id":"6686abdc.2778d4","type":"inject","z":"1d3bdf8d.565df","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":680,"wires":[["d276bcee.dbf6c"]]},{"id":"251b4747.e93ca8","type":"debug","z":"1d3bdf8d.565df","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":680,"y":680,"wires":[]},{"id":"d276bcee.dbf6c","type":"createCollaboration","z":"1d3bdf8d.565df","box":"","property":"https://app.box.com/notes/640671630660","propertyType":"str","collaborator":"hien.taminh@mor.com.vn","role":"editor","x":440,"y":680,"wires":[["251b4747.e93ca8"]]}]
```

### Create folder
<p>Creates a new empty folder within the specified parent folder.</p>
<p>Input Parameters:
<ul>
  <li><b>Name Folder</b> - The name for the new folder. The name on Box is taken from the node <b>Name Folder</b> property or the <code>msg.nameFolder</code> property</li>
  <li><b>Url Folder</b> - The parent folder to create the new folder within. The url folder on Box is taken from the node <b>Url Folder</b> property or the <code>msg.[name]</code> property</li>
</ul>
</p>
<p>Return values:
<ul>
  <li><b>payload</b> Will either be link url created or provide an error state</li>
</ul>
</p>
![Create-folder](https://cdn.jsdelivr.net/gh/taminhhienmor/node-red-contrib-box-note/source/image/createFolder.png)
``` node
[{"id":"bf42b73.2a79948","type":"inject","z":"1d3bdf8d.565df","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":140,"wires":[["e2a22742.9d3208"]]},{"id":"af785146.3ad42","type":"debug","z":"1d3bdf8d.565df","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":680,"y":140,"wires":[]},{"id":"e2a22742.9d3208","type":"Create a Box Note","z":"1d3bdf8d.565df","box":"","filename":"Test Create Box","localFilename":"","urlTemplate":"https://app.box.com/notes/626406500456","property":"https://app.box.com/folder/108099161365","propertyType":"str","propertyTemplate":"https://app.box.com/notes/640664677053","propertyTypeTemplate":"str","x":460,"y":140,"wires":[["af785146.3ad42"]]}]
```

### Create new note box with template
<p>Create new note box with template.</p>
<p>Input Parameters:
<ul>
  <li><b>Filename</b> - The name for the new folder. The name on Box is taken from the node <b>Filename</b> property or the <code>msg.filename</code> property</li>
  <li><b>Url Template</b> - The url of file template. The url template on Box is taken from the node <b>Url Template</b> property or the <code>msg.[name]</code> property</li>
  <li><b>Url Folder</b> - The parent folder to create the new file within. The url folder on Box is taken from the node <b>Url Folder</b> property or the <code>msg.[name]</code> property</li>
</ul>
</p>
<p>Return values:
<ul>
  <li><b>payload</b> Will either be link url file created or provide an error state</li>
</ul>
</p>
![Create-note](https://cdn.jsdelivr.net/gh/taminhhienmor/node-red-contrib-box-note/source/image/createNote.png)
``` node
[{"id":"bf42b73.2a79948","type":"inject","z":"1d3bdf8d.565df","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":140,"wires":[["e2a22742.9d3208"]]},{"id":"af785146.3ad42","type":"debug","z":"1d3bdf8d.565df","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":680,"y":140,"wires":[]},{"id":"e2a22742.9d3208","type":"Create a Box Note","z":"1d3bdf8d.565df","box":"","filename":"Test Create Box","localFilename":"","property":"https://app.box.com/folder/108099161365","propertyType":"str","propertyTemplate":"https://app.box.com/notes/640664677053","propertyTypeTemplate":"str","x":460,"y":140,"wires":[["af785146.3ad42"]]}]
```

### Create tag name
<p>The tags for this item. These tags are shown in the Box web app and mobile apps next to an item. There is a limit of 100 tags per item, and 10,000 unique tags per enterprise.</p>
<p>Input Parameters:
<ul>
  <li><b>Url</b> - The folder/file wants to add tag/tags name. The url folder on Box is taken from the node <b>Url</b> property or the <code>msg.[name]</code> property</li>
  <li><b>Tag</b> - The name of tag. The name tag is taken from the node <b>Tag</b> property or the <code>msg.tag</code> property</li>. The name is splited by comma in property node or created from array string in property <code>msg.tag</code>.
</ul>
</p>
<p>Return values:
<ul>
  <li><b>payload</b> Will either be link url created tag or provide an error state</li>
</ul>
</p>
![Create-tag](https://cdn.jsdelivr.net/gh/taminhhienmor/node-red-contrib-box-note/source/image/createTag.png)
``` node
[{"id":"796a0baa.769a34","type":"inject","z":"1d3bdf8d.565df","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":420,"wires":[["ae1328fb.df8e98"]]},{"id":"a95f8ae.91a9a78","type":"debug","z":"1d3bdf8d.565df","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":680,"y":420,"wires":[]},{"id":"ae1328fb.df8e98","type":"createTagName","z":"1d3bdf8d.565df","box":"","property":"https://app.box.com/folder/108099161365","propertyType":"str","tag":"tag1, tag2","x":440,"y":420,"wires":[["a95f8ae.91a9a78"]]}]
```

### Download file
<p>Download file to local.</p>
<p>Input Parameters:
<ul>
  <li><b>Url File</b> - The file wants to download. The url file on Box is taken from the node <b>Url File</b> property or the <code>msg.[name]</code> property</li>
  <li><b>Filename</b> - The name for the file that save in local. The name on Box is taken from the node <b>Name Folder</b> property or the <code>msg.nameFolder</code> property</li>
</ul>
</p>
<p>Return values:
<ul>
  <li><b>payload</b> Will either be success or provide an error state</li>
</ul>
</p>
![Download-file](https://cdn.jsdelivr.net/gh/taminhhienmor/node-red-contrib-box-note/source/image/downloadFile.png)
``` node
[{"id":"9376c3d3.2c4a3","type":"inject","z":"1d3bdf8d.565df","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":257,"y":613,"wires":[["14124899.d6e477"]]},{"id":"6b5a95b2.92344c","type":"debug","z":"1d3bdf8d.565df","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":677,"y":613,"wires":[]},{"id":"14124899.d6e477","type":"downloadFile","z":"1d3bdf8d.565df","box":"","property":"https://app.box.com/notes/640664677053","propertyType":"str","filename":"testDownload","x":460,"y":614,"wires":[["6b5a95b2.92344c"]]}]
```

### Get Infomation folder
<p>Retrieves details for a folder or folder contain, including the first 100 entries in the folder.</p>
<p>Input Parameters:
<ul>
  <li><b>Url Folder</b> - The folder wants to get information. The url folder on Box is taken from the node <b>Url Folder</b> property or the <code>msg.[name]</code> property</li>
  <li><b>Options</b> - Choose details for a folder or folder contain. <b>"True"</b> value is Folder Content (default), <b>"False"</b> value is Folder Infomation. The option is taken from the node <b>Options</b> property or the <code>msg.option</code> property</li>
</ul>
</p>
<p>Return values:
<ul>
  <li><b>payload</b> Will either be details for a folder/folder contain or provide an error state</li>
</ul>
</p>
![Infomation-folder](https://cdn.jsdelivr.net/gh/taminhhienmor/node-red-contrib-box-note/source/image/infomationFolder.png)
``` node
[{"id":"88a39dac.5b916","type":"inject","z":"1d3bdf8d.565df","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":340,"wires":[["9acb1530.fdf298"]]},{"id":"2531c2e4.71d41e","type":"debug","z":"1d3bdf8d.565df","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":680,"y":340,"wires":[]},{"id":"9acb1530.fdf298","type":"getInfoFolder","z":"1d3bdf8d.565df","box":"","property":"0","propertyType":"str","option":"true","x":440,"y":340,"wires":[["2531c2e4.71d41e"]]}]
```

### Upload file
<p>Uploads a small file to Box. For file sizes over 50MB we recommend using the Chunk Upload APIs.</p>
<p>Input Parameters:
<ul>
  <li><b>Filename</b> - The name for the file upload. The name on Box is taken from the node <b>Filename</b> property or the <code>msg.filename</code> property</li>
  <li><b>Local File</b> - The name for file in local. The name on Local is taken from the node <b>Local File</b> property or the <code>msg.localFilename</code> property</li>
  <li><b>Url Folder</b> - The folder want to upload the this file. The url folder on Box is taken from the node <b>Url Folder</b> property or the <code>msg.[name]</code> property</li>
</ul>
</p>
<p>Return values:
<ul>
  <li><b>payload</b> Will either be link url uploaded or provide an error state</li>
</ul>
</p>
![Upload-file](https://cdn.jsdelivr.net/gh/taminhhienmor/node-red-contrib-box-note/source/image/uploadFile.png)
``` node
[{"id":"5afbd652.ad3d78","type":"inject","z":"1d3bdf8d.565df","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":520,"wires":[["3ec03ba2.4773b4"]]},{"id":"20d2c8e2.58c9a8","type":"debug","z":"1d3bdf8d.565df","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":680,"y":520,"wires":[]},{"id":"3ec03ba2.4773b4","type":"uploadFile","z":"1d3bdf8d.565df","box":"","filename":"testUpload","localFilename":"testDownload","property":"https://app.box.com/folder/108099161365","propertyType":"str","x":450,"y":520,"wires":[["20d2c8e2.58c9a8"]]}]
```

## Reference
node-red-node-box