module.exports = function(RED) {
    "use strict";
    var fs = require("fs");
    function uploadFile(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename || "";
        this.localFilename = n.localFilename || "";
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
            setTimeout(function () {
                var filename = node.filename || msg.filename;
                if (filename === "") {
                    node.error(RED._("box.error.no-filename-specified"));
                    return;
                }
                var path = filename.split("/");
                var basename = path.pop();
                basename = basename.includes(".") ? basename : basename + ".boxnote"
                node.status({fill:"blue",shape:"dot",text:"box.status.resolving-path"});
                var localFilename = node.localFilename || msg.localFilename;
                if (!localFilename && typeof msg.payload === "undefined") {
                    return;
                }
                var urlFolder = "";
                switch (propertyType) {
                    case "str":
                        urlFolder = property
                        break;
                    case "msg":
                        urlFolder = msg[property]
                        break;
                    case "flow":
                        urlFolder = flowContext.get(property)
                        break;
                    case "global":
                        urlFolder = globalContext.get(property)
                        break;
                    default:
                        urlFolder = property
                        break;
                }
                var folderID = urlFolder ? urlFolder.split("/").pop() : 0

                node.box.resolvePath(path, function(err, parent_id) {
                    parent_id = folderID;                
                    if (err) {
                        node.error(RED._("box.error.path-resolve-failed",{err:err.toString()}),msg);
                        node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                        return;
                    }
                    node.status({fill:"blue",shape:"dot",text:"box.status.uploading"});
                    var r = node.box.request({
                        method: 'POST',
                        url: 'https://upload.box.com/api/2.0/files/content',
                    }, function(err, data) {
                        if (err) {
                            if (data && data.status === 409 &&
                                data.context_info && data.context_info.conflicts) {
                                // existing file, attempt to overwrite it
                                node.status({fill:"blue",shape:"dot",text:"box.status.overwriting"});
                                var resolveConflictRequest = node.box.request({
                                    method: 'POST',
                                    url: 'https://upload.box.com/api/2.0/files/'+
                                        data.context_info.conflicts.id+'/content',
                                }, function(err, data) {
                                    if (err) {
                                        node.error(RED._("box.error.upload-failed",{err:err.toString()}),msg);
                                        node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                                        return;
                                    } else {
                                        var type = data.entries[0].name.split(".").pop() == "boxnote" ? "notes" : "file";
                                        msg.payload = "https://app.box.com/" + type + "/" + data.entries[0].id || ''; 
                                        node.send(msg);                       
                                    }
                                    node.status({});
                                });
                                var form = resolveConflictRequest.form();
                                if (localFilename) {
                                    form.append('filename', fs.createReadStream(localFilename), { filename: basename });
                                } else {
                                    form.append('filename', RED.util.ensureBuffer(msg.payload), { filename: basename });
                                }
                            } else {
                                node.error(RED._("box.error.upload-failed",{err:err.toString()}),msg);
                                node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                            }
                            return;
                        } else {                        
                            var type = data.entries[0].name.split(".").pop() == "boxnote" ? "notes" : "file";
                            msg.payload = "https://app.box.com/" + type + "/" + data.entries[0].id || ''; 
                            node.send(msg);                       
                        }
                        node.status({});
                    });
                    var form = r.form();
                    if (localFilename) {
                        form.append('filename', fs.createReadStream(localFilename), { filename: basename });
                    } else {
                        form.append('filename', RED.util.ensureBuffer(msg.payload), { filename: basename });
                    }
                    form.append('parent_id', parent_id);
                });
            }, 2000);
        });
    }
    RED.nodes.registerType("uploadFile",uploadFile);
};