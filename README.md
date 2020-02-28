# node-red-contrib-box-note
This is a node-red node for performing http(s) requests that use [Request](https://github.com/request/request) library with optimized proxy support 

## Installation
run npm -g install node-red-contrib-box-note

## Features
Create new note box with template

# Get Key
Follow to guideline: https://github.com/taminhhienmor/node-red-contrib-box-note/blob/master/guidelineGetKey.docx

## Example node
``` node
[{"id":"b78eb46d.c569b8","type":"inject","z":"c0cc4cd.3edecb","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":240,"y":500,"wires":[["eb9df988.5ddbc8"]]},{"id":"ad4d1b34.119b78","type":"debug","z":"c0cc4cd.3edecb","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":770,"y":500,"wires":[]},{"id":"eb9df988.5ddbc8","type":"box","z":"c0cc4cd.3edecb","box":"","filename":"testFile.boxnote","localFilename":"","name":"testFile","urlTemplate":"https://app.box.com/notes/574880606388","urlFolder":"https://app.box.com/folder/86032894587","x":520,"y":500,"wires":[["ad4d1b34.119b78"]]}]
```

## Reference
node-red-node-box