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
                    if(n.target == "true") {
                        var arrData = [];                    
                        data.item_collection.entries.forEach(element => {                       
                            let obj = {};
                            let type = element.type == "folder" ? 'folder' : 'notes'
                            let url = "https://app.box.com/" + type + "/" + element.id || ""
                            obj = {
                                "name" : element.name,
                                "type" : element.type,
                                "url"  : url
                            }
                            arrData.push(obj);
                        });
                        msg.payload = arrData || '';
                    } else {
                        var objData = {
                            "Create at": data.created_at,
                            "Modifile at": data.modified_at,
                            "Size": data.size,
                            "Create by": data.created_by,
                            "Modified by":data.modified_by,
                            "Shared link":data.shared_link,
                            "Tags name":data.tags                        
                        }
                        msg.payload = objData || ''; 
                    }                                       
                    node.send(msg);                       
                }
                node.status({});
            });                
        });
    }
    RED.nodes.registerType("getInfoFolder",getInfoFolder);
};