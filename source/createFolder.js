module.exports = function(RED) {
    "use strict";
    function createFolder(n) {
        RED.nodes.createNode(this,n);
        this.box = RED.nodes.getNode(n.box);
        var node = this;
        if (!this.box || !this.box.credentials.accessToken) {
            this.warn(RED._("box.warn.missing-credentials"));
            return;
        }

        node.on("input", function(msg) {            
            var nameFolder = n.nameFolder || msg.nameFolder || "";
            if (nameFolder === "") {
                node.error(RED._("box.error.no-foldername-specified"));
                return;
            }
            var urlFolder = n.urlFolder || msg.urlFolder
            var folder = urlFolder ? urlFolder.split("/").pop() : 0

            node.box.request({
                method: 'POST',
                url: 'https://api.box.com/2.0/folders',
                body: {
                    "name": nameFolder,
                    "parent": {
                        "id": folder
                    }
                }
            }, function(err, data) {
                if (err) {
                    if (err && data && data.status === 409 && data.context_info && data.context_info.conflicts) {
                        node.status({fill:"blue",shape:"dot",text:"box.status.overwriting"});                        
                        msg.payload = "https://app.box.com/folder/" + data.context_info.conflicts[0].id || ''; 
                        node.send(msg);                        
                    } else {
                        node.error(RED._("box.error.create-failed",{err:err.toString()}),msg);
                        node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                    }            
                    return;
                } else {
                    msg.payload = "https://app.box.com/folder/" + data.id || ''; 
                    node.send(msg);                       
                }
                node.status({});
            });                
        });
    }
    RED.nodes.registerType("createFolder",createFolder);
};