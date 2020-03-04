module.exports = function(RED) {
    "use strict";
    function getInfoFolder(n) {
        RED.nodes.createNode(this,n);
        this.box = RED.nodes.getNode(n.box);
        var node = this;
        if (!this.box || !this.box.credentials.accessToken) {
            this.warn(RED._("box.warn.missing-credentials"));
            return;
        }

        node.on("input", function(msg) {            
            var urlFolder = n.urlFolder || msg.urlFolder
            var folder = urlFolder ? urlFolder.split("/").pop() : 0
            
            node.box.request({
                method: 'GET',
                url: 'https://api.box.com/2.0/folders/' + folder
            }, function(err, data) {
                if (err || !data) {                   
                    node.error(RED._("box.error.get-failed",{err:err.toString()}),msg);
                    node.status({fill:"red",shape:"ring",text:"box.status.failed"});        
                    return;
                } else {
                    var arrData = [];                    
                    data.item_collection.entries.forEach(element => {
                        let obj = {};
                        let url = ""
                        if (element.type == "folder") {
                            url = "https://app.box.com/folder/" + element.id || ""
                        } else if (element.type == "file") {
                            url = "https://app.box.com/notes/" + element.id || ""
                        } else {
                            url = "https://app.box.com/file"  + element.id || ""
                        }
                        obj = {
                            "name" : element.name,
                            "type" : element.type,
                            "url"  : url
                        }
                        arrData.push(obj);
                    });
                    msg.payload = arrData || ''; 
                    node.send(msg);                       
                }
                node.status({});
            });                
        });
    }
    RED.nodes.registerType("getInfoFolder",getInfoFolder);
};