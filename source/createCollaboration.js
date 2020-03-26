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
        var propertyType = n.propertyType || "msg";
        var property = n.property;
        var globalContext = this.context().global;
        var flowContext = this.context().flow;       

        node.on("input", function(msg) {            
            var urlShare = "";
            switch (propertyType) {
                case "str":
                    urlShare = property
                    break;
                case "msg":
                    urlShare = msg[property]
                    break;
                case "flow":
                    urlShare = flowContext.get(property)
                    break;
                case "global":
                    urlShare = globalContext.get(property)
                    break;
                default:
                    urlShare = property
                    break;
            }
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

            var flagFirst = true;
            
            node.box.request({
                method: 'GET',
                url: 'https://api.box.com/2.0/users/me'
            }, function(err1, data1) { 
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
                                if(flagFirst) {
                                    msg.payload = urlShare
                                    node.send(msg);                       
                                }
                                flagFirst = false          
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