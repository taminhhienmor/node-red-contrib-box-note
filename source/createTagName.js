module.exports = function(RED) {
    "use strict";
    function createTagName(n) {
        RED.nodes.createNode(this,n);
        this.box = RED.nodes.getNode(n.box);
        var node = this;
        if (!this.box || !this.box.credentials.accessToken) {
            this.warn(RED._("box.warn.missing-credentials"));
            return;
        }

        node.on("input", function(msg) {
            var tag = n.tag || msg.tag
            if (tag === "" || typeof(tag) == "undefined") {
                node.error(RED._("box.error.no-tag-specified"));
                return;
            }
            var tagArr = tag.split(",")

            var url = n.url || msg.url
            if (url === "" || typeof(url) == "undefined") {
                node.error(RED._("box.error.no-url-specified"));
                return;
            }
            var isFolder = url.split("/")[3] == "folder";
            var id = url.split("/").pop();
            var urlRequest = "";            
            if(isFolder) {
                urlRequest = 'https://api.box.com/2.0/folders/' + id
            } else {
                urlRequest = 'https://api.box.com/2.0/files/' + id
            }                                      
            
            node.box.request({
                method: 'PUT',
                url: urlRequest,
                body: {
                    "tags" : tagArr
                }
            }, function(err, data) {                    
                if (err || !data) {                   
                    node.error(RED._("box.error.tag-failed",{err:err.toString()}),msg);
                    node.status({fill:"red",shape:"ring",text:"box.status.failed"});        
                    return;
                } else {                        
                    msg.payload = "Success!"; 
                    node.send(msg);                       
                }
                node.status({});
            });
        });
    }
    RED.nodes.registerType("createTagName",createTagName);
};