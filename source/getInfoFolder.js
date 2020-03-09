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
                url: 'https://api.box.com/2.0/folders/' + folder + "?fields=created_at,modified_at,size,created_by,modified_by,shared_link,tags,item_collection,name"
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
                            let type = ""                            

                            if (element.type == "file") {
                                if(element.name.split(".").pop() == "boxnote") {
                                    type = "notes"
                                } else {
                                    type = "file"
                                }
                            } else {
                                type = "folder"
                            }
                            let url = "https://app.box.com/" + type + "/" + element.id || ""
                            obj = {
                                "name" : element.name,
                                "type" : element.type,
                                "url"  : url,
                                "Create at": element.created_at,
                                "Modifile at": element.modified_at,
                                "Size": element.size,
                                "Create by": element.created_by,
                                "Modified by":element.modified_by,
                                "Shared link":element.shared_link,
                                "Tags name":element.tags
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