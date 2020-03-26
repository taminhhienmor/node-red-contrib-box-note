module.exports = function(RED) {
    "use strict";
    var fs = require("fs-extra");   

    function downloadFile(n) {
        RED.nodes.createNode(this,n);
        this.urlFile = n.urlFile || "";
        this.filename = n.filename || ""
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
            var filename = n.filename || msg.filename;
            var urlFile = "";
            switch (propertyType) {
                case "str":
                    urlFile = property
                    break;
                case "msg":
                    urlFile = msg[property]
                    break;
                case "flow":
                    urlFile = flowContext.get(property)
                    break;
                case "global":
                    urlFile = globalContext.get(property)
                    break;
                default:
                    urlFile = property
                    break;
            }
            if (filename === "" || urlFile === "") {
                node.error(RED._("box.error.no-filename-specified"));
                return;
            }
            var file_id = urlFile.split("/").pop();   

            node.status({fill:"blue",shape:"dot",text:"box.status.downloading"});
            node.box.request({
                url: 'https://api.box.com/2.0/files/'+file_id+'/content',
                json: false,
                followRedirect: true,
                maxRedirects: 1,
                encoding: null,
            }, function(err, data) {
                if (err) {
                    node.error(RED._("box.error.download-failed",{err:err.toString()}),msg);
                    node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                    return;
                } else {
                    if ((typeof data === "object") && (!Buffer.isBuffer(data))) {
                        data = JSON.stringify(data);
                    }
                    if (typeof data === "boolean") { data = data.toString(); }
                    if (typeof data === "number") { data = data.toString(); }
                    var buf = Buffer.from(data);
                    var wstream = fs.createWriteStream(filename, { encoding:'binary', flags:'w', autoClose:true });
                    wstream.on("error", function(err) {
                        node.error(RED._("box.errors.writefail",{error:err.toString()}),msg);
                        return;
                    });
                    msg.data = data;
                    wstream.on("open", function() {
                        wstream.end(buf, function(err) {
                            if(err) {
                                node.error(RED._("box.errors.writefail",{error:err.toString()}),msg);
                                return; 
                            }                                                        
                            msg.payload = "Success!";
                            node.send(msg);                                
                        });
                    })
                    // msg.data = data;
                    // delete msg.error;
                    node.status({});
                    // node.send(msg);
                }
            });
        });
    }     
    RED.nodes.registerType("downloadFile",downloadFile);
};