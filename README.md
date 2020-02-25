# node-red-contrib-box-note
This is a node-red node for performing http(s) requests that use [Request](https://github.com/request/request) library with optimized proxy support 

## Installation
run npm -g install node-red-contrib-box-note

## Features
Upload box note<br/>

# Get Key
Follow to guideline: https://github.com/taminhhienmor/node-red-contrib-box-note/blob/master/guidelineGetKey.docx

## Example node
``` node
[{"id":"4efcdd7c.de8da4","type":"box out","z":"c0cc4cd.3edecb","box":"","filename":"testfile.boxnote","localFilename":"","name":"testfile","x":530,"y":220,"wires":[["ad4d1b34.119b78"]]},{"id":"b78eb46d.c569b8","type":"inject","z":"c0cc4cd.3edecb","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":220,"wires":[["4efcdd7c.de8da4"]]},{"id":"ad4d1b34.119b78","type":"debug","z":"c0cc4cd.3edecb","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":790,"y":220,"wires":[]}]
```

## Reference
node-red-node-box