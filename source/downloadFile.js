module.exports = function(RED) {
    "use strict";
    function downloadFile(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename || "";
        this.box = RED.nodes.getNode(n.box);
        var node = this;
        if (!this.box || !this.box.credentials.accessToken) {
            this.warn(RED._("box.warn.missing-credentials"));
            return;
        }

        node.on("input", function(msg) {
            var filename = node.filename || msg.filename;
            if (filename === "") {
                node.error(RED._("box.error.no-filename-specified"));
                return;
            }
            msg.filename = filename;
            node.status({fill:"blue",shape:"dot",text:"box.status.resolving-path"});
            node.box.resolveFile(filename, function(err, file_id) {
                if (err) {
                    node.error(RED._("box.error.path-resolve-failed",{err:err.toString()}),msg);
                    node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                    return;
                }
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
                    } else {
                        // msg.payload = data;
                        msg.payload = "Success!";
                        delete msg.error;
                        node.status({});
                        node.send(msg);
                    }
                });
            });
        });
    }
    RED.nodes.registerType("downloadFile",downloadFile);
};