module.exports = function(RED) {
    "use strict";
    function createCollaboration(n) {
        RED.nodes.createNode(this,n);
        this.box = RED.nodes.getNode(n.box);
        var node = this;
        if (!this.box || !this.box.credentials.accessToken) {
            this.warn(RED._("box.warn.missing-credentials"));
            return;
        }        

        node.on("input", function(msg) {            
            var urlShare = n.urlShare || msg.urlShare
            var collaborator = n.collaborator || msg.collaborator
            var role = n.role || msg.role
            var typeItem = "";
            var typeId = "";
            var splitUrl = urlShare.split("https://app.box.com/")[1].split("/")
            var isFolder = splitUrl[0] == "folder"
            if (isFolder) {
                typeItem = "folder";
                typeId = splitUrl[1]
            } else {
                typeItem = "file";
                typeId = splitUrl[1];
            }

            node.box.request({
                method: 'POST',
                url: 'https://api.box.com/2.0/collaborations',
                body: {
                    "item": {
                      "type": typeItem,
                      "id": typeId
                    },
                    "accessible_by": {
                      "type": "user",
                      "login": collaborator
                    },
                    "role": role
                  }
            }, function(err, data) {                
                if (err || !data) {                   
                    if(err.toString() == "400: User is already a collaborator") {                       
                        var urlGetIdCollaboration = "";
                        if(isFolder) {
                            urlGetIdCollaboration = "folders/" + typeId
                        } else {
                            urlGetIdCollaboration = "files/" + typeId
                        }
                        node.box.request({
                            method: 'GET',
                            url: 'https://api.box.com/2.0/' + urlGetIdCollaboration + '/collaborations',
                        }, function(err1, data1) {
                            if(err1) {
                                node.error(RED._("box.error.get-failed",{err:err1.toString()}),msg);
                                node.status({fill:"red",shape:"ring",text:"Get Id Collaboration Fail"});        
                                return;  
                            } else {
                                node.box.request({
                                    method: 'PUT',
                                    url: 'https://api.box.com/2.0/collaborations/' + data1.entries[0].id,
                                    body: {
                                        "role": role
                                      }
                                }, function(err2, data2) {
                                    if(err2) {
                                        node.error(RED._("box.error.get-failed",{err:err2.toString()}),msg);
                                        node.status({fill:"red",shape:"ring",text:"box.status.failed"});        
                                        return;    
                                    } else {          
                                        msg.payload = "Edit Role Success!"             
                                        node.send(msg);                       
                                    }
                                })

                            }
                        })
                        
                    } else {
                        node.error(RED._("box.error.get-failed",{err:err.toString()}),msg);
                        node.status({fill:"red",shape:"ring",text:"box.status.failed"});        
                        return;                        
                    }                
                } else {          
                    msg.payload = "Success!"             
                    node.send(msg);                       
                }
                node.status({});
            });                
        });
    }
    RED.nodes.registerType("createCollaboration",createCollaboration);
};