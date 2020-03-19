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
            var urlShare = msg.urlShare || n.urlShare
            var collaborator = msg.collaborator || n.collaborator
            var role = msg.role || n.role
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

            var arrCollaborator = [];
            if(typeof collaborator == "string") {
                arrCollaborator.push(collaborator);
            } else {
                arrCollaborator = collaborator;
            }

            
            node.box.request({
                method: 'GET',
                url: 'https://api.box.com/2.0/users/me'
            }, function(err1, data) { 
                if(err1) {
                    node.error(RED._("box.error.get-failed",{err:err1.toString()}),msg);
                    node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                    return;
                } else {
                    arrCollaborator.forEach(email => {
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
                                  "login": email.trim()
                                },
                                "role": role
                              }
                        }, function(err, data) {                                    
                            if (err || !data) {                   
                                if(err.toString() == "400: User is already a collaborator") {
                                    msg.payload = email.trim() + " is already a collaborator"             
                                    node.send(msg);                                    
                                } else {
                                    node.error(RED._("box.error.get-failed",{err:err.toString()}),msg);
                                    node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                                    return;                        
                                }                
                            } else {          
                                msg.payload = email.trim() + " be invited successfully!"             
                                node.send(msg);                       
                            }
                            node.status({});
                        });              
                    });
                }
            })
            
        });
    }
    RED.nodes.registerType("createCollaboration",createCollaboration);
};