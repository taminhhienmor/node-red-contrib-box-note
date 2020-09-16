/**
 * Copyright 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var crypto = require("crypto");
    var fs = require("fs");
    var request = require("request");
    var url = require("url");

    function BoxNode(n) {
        RED.nodes.createNode(this,n);
    }
    RED.nodes.registerType("box-credentials", BoxNode, {
        credentials: {
            displayName: {type:"text"},
            clientId: {type:"text"},
            clientSecret: {type:"password"},
            accessToken: {type:"password"},
            refreshToken: {type:"password"},
            expireTime: {type:"password"}
        }
    });

    BoxNode.prototype.refreshToken = function(cb) {
        var credentials = this.credentials;
        var node = this;
        //console.log("refreshing token: " + credentials.refreshToken);
        if (!credentials.refreshToken) {
            // TODO: add a timeout to make sure we make a request
            // every so often (if no flows trigger one) to ensure the
            // refresh token does not expire
            node.error(RED._("box.error.no-refresh-token"));
            return cb(RED._("box.error.no-refresh-token"));
        }
        request.post({
            url: 'https://api.box.com/oauth2/token',
            json: true,
            form: {
                grant_type: 'refresh_token',
                client_id: credentials.clientId,
                client_secret: credentials.clientSecret,
                refresh_token: credentials.refreshToken,
            },
        }, function(err, result, data) {
            if (err) {
                node.error(RED._("box.error.token-request-error",{err:err}));
                return;
            }
            if (data.error) {
                node.error(RED._("box.error.refresh-token-error",{message:data.error.message}));
                return;
            }
            // console.log("refreshed: " + require('util').inspect(data));
            credentials.accessToken = data.access_token;
            if (data.refresh_token) {
                credentials.refreshToken = data.refresh_token;
            }
            credentials.expiresIn = data.expires_in;
            credentials.expireTime =
                data.expires_in + (new Date().getTime()/1000);
            credentials.tokenType = data.token_type;
            RED.nodes.addCredentials(node.id, credentials);
            if (typeof cb !== undefined) {
                cb();
            }
        });
    };

    BoxNode.prototype.request = function(req, retries, cb) {
        var node = this;
        if (typeof retries === 'function') {
            cb = retries;
            retries = 1;
        }
        if (typeof req !== 'object') {
            req = { url: req };
        }
        req.method = req.method || 'GET';
        if (!req.hasOwnProperty("json")) {
            req.json = true;
        }
        // always set access token to the latest ignoring any already present
        req.auth = { bearer: this.credentials.accessToken };
        if (!this.credentials.expireTime ||
            this.credentials.expireTime < (new Date().getTime()/1000)) {
            if (retries === 0) {
                node.error(RED._("box.error.too-many-refresh-attempts"));
                cb(RED._("box.error.too-many-refresh-attempts"));
                return;
            }
            node.warn(RED._("box.warn.refresh-token"));
            node.refreshToken(function (err) {
                if (err) {
                    return;
                }
                node.request(req, 0, cb);
            });
            return;
        }
        return request(req, function(err, result, data) {
            if (err) {
                // handled in callback
                return cb(err, data);
            }
            if (result.statusCode === 401 && retries > 0) {
                retries--;
                node.warn(RED._("box.warn.refresh-401"));
                node.refreshToken(function (err) {
                    if (err) {
                        return cb(err, null);
                    }
                    return node.request(req, retries, cb);
                });
            }
            if (result.statusCode >= 400) {
                return data ? cb(result.statusCode + ": " + data.message, data) : cb(result.statusCode);
            }
            return cb(err, data);
        });
    };

    BoxNode.prototype.folderInfo = function(parent_id, cb) {
        this.request('https://api.box.com/2.0/folders/'+parent_id, cb);
    };

    BoxNode.prototype.resolvePath = function(path, parent_id, cb) {
        var node = this;
        if (typeof parent_id === 'function') {
            cb = parent_id;
            parent_id = 0;
        }
        if (typeof path === "string") {
            // split path and remove empty string components
            path = path.split("/").filter(function(e) { return e !== ""; });
            // TODO: could also handle '/blah/../' and '/./' perhaps
        } else {
            path = path.filter(function(e) { return e !== ""; });
        }
        if (path.length === 0) {
            return cb(null, parent_id);
        }
        var folder = path.shift();
        node.folderInfo(parent_id, function(err, data) {
            if (err) {
                return cb(err, -1);
            }
            var entries = data.item_collection.entries;
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].type === 'folder' &&
                    entries[i].name === folder) {
                    // found
                    return node.resolvePath(path, entries[i].id, cb);
                }
            }
            return cb(RED._("box.error.not-found"), -1);
        });
    };

    BoxNode.prototype.resolveFile = function(path, parent_id, cb) {
        var node = this;
        if (typeof parent_id === 'function') {
            cb = parent_id;
            parent_id = 0;
        }
        if (typeof path === "string") {
            // split path and remove empty string components
            path = path.split("/").filter(function(e) { return e !== ""; });
            // TODO: could also handle '/blah/../' and '/./' perhaps
        } else {
            path = path.filter(function(e) { return e !== ""; });
        }
        if (path.length === 0) {
            return cb(RED._("box.error.missing-filename"), -1);
        }
        var file = path.pop();
        node.resolvePath(path, function(err, parent_id) {
            if (err) {
                return cb(err, parent_id);
            }
            node.folderInfo(parent_id, function(err, data) {
                if (err) {
                    return cb(err, -1);
                }
                var entries = data.item_collection.entries;
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].type === 'file' &&
                        entries[i].name === file) {
                        // found
                        return cb(null, entries[i].id);
                    }
                }
                return cb(RED._("box.error.not-found"), -1);
            });
        });
    };

    RED.httpAdmin.get('/box-credentials/auth', function(req, res) {
        if (!req.query.clientId || !req.query.clientSecret ||
            !req.query.id || !req.query.callback) {
            res.send(400);
            return;
        }
        var node_id = req.query.id;
        var callback = req.query.callback;
        var credentials = {
            clientId: req.query.clientId,
            clientSecret: req.query.clientSecret
        };

        var csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
        credentials.csrfToken = csrfToken;
        credentials.callback = callback;
        res.cookie('csrf', csrfToken);
        res.redirect(url.format({
            protocol: 'https',
            hostname: 'app.box.com',
            pathname: '/api/oauth2/authorize',
            query: {
                response_type: 'code',
                client_id: credentials.clientId,
                state: node_id + ":" + csrfToken,
                redirect_uri: callback
            }
        }));
        RED.nodes.addCredentials(node_id, credentials);
    });

    RED.httpAdmin.get('/box-credentials/auth/callback', function(req, res) {
        if (req.query.error) {
            return res.send('ERROR: '+ req.query.error + ': ' + req.query.error_description);
        }
        var state = req.query.state.split(':');
        var node_id = state[0];
        var credentials = RED.nodes.getCredentials(node_id);
        if (!credentials || !credentials.clientId || !credentials.clientSecret) {
            return res.send(RED._("box.error.no-credentials"));
        }
        if (state[1] !== credentials.csrfToken) {
            return res.status(401).send(
                RED._("box.error.token-mismatch")
            );
        }

        request.post({
            url: 'https://app.box.com/api/oauth2/token',
            json: true,
            form: {
                grant_type: 'authorization_code',
                code: req.query.code,
                client_id: credentials.clientId,
                client_secret: credentials.clientSecret,
                redirect_uri: credentials.callback,
            },
        }, function(err, result, data) {
            if (err) {
                console.log("request error:" + err);
                return res.send(RED._("box.error.something-broke"));
            }
            if (data.error) {
                console.log("oauth error: " + data.error);
                return res.send(RED._("box.error.something-broke"));
            }
            //console.log("data: " + require('util').inspect(data));
            credentials.accessToken = data.access_token;
            credentials.refreshToken = data.refresh_token;
            credentials.expiresIn = data.expires_in;
            credentials.expireTime = data.expires_in + (new Date().getTime()/1000);
            credentials.tokenType = data.token_type;
            delete credentials.csrfToken;
            delete credentials.callback;
            RED.nodes.addCredentials(node_id, credentials);
            request.get({
                url: 'https://api.box.com/2.0/users/me',
                json: true,
                auth: { bearer: credentials.accessToken },
            }, function(err, result, data) {
                if (err) {
                    console.log('fetching box profile failed: ' + err);
                    return res.send(RED._("box.error.profile-fetch-failed"));
                }
                if (result.statusCode >= 400) {
                    console.log('fetching box profile failed: ' +
                                result.statusCode + ": " + data.message);
                    return res.send(RED._("box.error.profile-fetch-failed"));
                }
                if (!data.name) {
                    console.log('fetching box profile failed: no name found');
                    return res.send(RED._("box.error.profile-fetch-failed"));
                }
                credentials.displayName = data.name;
                RED.nodes.addCredentials(node_id, credentials);
                res.send(RED._("box.error.authorized"));
            });
        });
    });

    function BoxOutNode(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.payload || "";
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
        var propertyTypeTemplate = n.propertyTypeTemplate || "msg";
        var propertyTemplate = n.propertyTemplate;
        var globalContextTemplate = this.context().global;
        var flowContextTemplate = this.context().flow;

        node.on("input", function(msg) {
            var filename = n.filename || msg.payload || "";
            if (filename === "") {
                node.status({fill:"red",shape:"dot",text:"box.error.no-filename-specified"});
                node.error(RED._("box.error.no-filename-specified"));
                return;
            }            
            var path = filename.split("/");
            var basename = path.pop();
            basename = filename.includes(".") ? filename : filename + ".boxnote"
            node.status({fill:"blue",shape:"dot",text:"box.status.resolving-path"});
            var localFilename = node.localFilename || msg.localFilename;
            if (!localFilename && typeof msg.payload === "undefined") {
                node.status({fill:"red",shape:"dot",text:"box.status.failed"});
                return;
            }

            var urlFolder  = "";
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
            var folder = urlFolder ? urlFolder.split("/").pop() : 0

            var urlTemplate = "";
            switch (propertyTypeTemplate) {
                case "str":
                    urlTemplate = propertyTemplate
                    break;
                case "msg":
                    urlTemplate = msg[propertyTemplate]
                    break;
                case "flow":
                    urlTemplate = flowContextTemplate.get(propertyTemplate)
                    break;
                case "global":
                    urlTemplate = globalContextTemplate.get(propertyTemplate)
                    break;
                default:
                    urlTemplate = propertyTemplate
                    break;
            }
            if(!urlTemplate || typeof(urlTemplate) == "undefined") {
                node.box.resolvePath(path, function(err, parent_id) {
                    if (err) {
                        node.error(RED._("box.error.path-resolve-failed",{err:err.toString()}),msg);
                        node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                        return;
                    }
                    node.status({fill:"blue",shape:"dot",text:"box.status.uploading"});                  
                    var r = node.box.request({
                        method: 'POST',
                        url: 'https://upload.box.com/api/2.0/files/content'
                    }, function(err, data) {                                      
                        if (err) {
                            if (data && data.status === 409 &&
                                data.context_info && data.context_info.conflicts) {
                                // existing file, attempt to overwrite it
                                node.status({fill:"blue",shape:"dot",text:"box.status.overwriting"});
                                var r = node.box.request({
                                    method: 'POST',
                                    url: 'https://upload.box.com/api/2.0/files/'+
                                        data.context_info.conflicts.id+'/content',
                                }, function(err, data) {
                                    if (err) {
                                        node.error(RED._("box.error.upload-failed",{err:err.toString()}),msg);
                                        node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                                        return;
                                    } else {
                                        msg.payload = "https://app.box.com/notes/" + data.entries[0].id || ''; 
                                        node.send(msg);                       
                                    }
                                    node.status({});
                                });
                                var form = r.form();
                                if (localFilename) {
                                    form.append('filename', fs.createReadStream(localFilename), { filename: basename });
                                } else {
                                    form.append('attributes', JSON.stringify({"name": basename, "parent": {"id": folder}}));
                                    form.append('file', RED.util.ensureBuffer(Date.now()), { filename: basename });
                                }
                            } else {
                                node.error(RED._("box.error.upload-failed",{err:err.toString()}),msg);
                                node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                            }
                            return;
                        } else {
                            msg.payload = "https://app.box.com/notes/" + data.entries[0].id || ''; 
                            node.send(msg);                       
                        }                    
                        node.status({});
                    });
                    if(typeof(r) == "undefined") return;
                    var form = r.form();
                    if (localFilename) {
                        form.append('filename', fs.createReadStream(localFilename), { filename: basename });
                    } else {
                        form.append('attributes', JSON.stringify({"name": basename, "parent": {"id": folder}}));
                        form.append('file', RED.util.ensureBuffer(Date.now()), { filename: basename });
                    }
                    form.append('parent_id', parent_id);
                });
                return;
            }
            var template = urlTemplate.split("/").pop()                      
                
            node.box.request({
                method: 'POST',
                url: 'https://api.box.com/2.0/files/' + template + '/copy',
                body: {
                    "name": basename,
                    "parent": {
                        "id": folder
                    }
                }
            }, function(err, data) {                   
                if (err) {
                    if (data && data.status === 409 &&
                        data.context_info && data.context_info.conflicts) {
                        // existing file, attempt to overwrite it
                        node.status({fill:"blue",shape:"dot",text:"box.status.overwriting"});
                        var r = node.box.request({
                            method: 'POST',
                            url: 'https://upload.box.com/api/2.0/files/'+
                                data.context_info.conflicts.id+'/content',
                        }, function(err, data) {
                            if (err) {
                                node.error(RED._("box.error.upload-failed",{err:err.toString()}),msg);
                                node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                                return;
                            } else {
                                msg.payload = "https://app.box.com/notes/" + data.entries[0].id || ''; 
                                node.send(msg);                       
                            }
                            node.status({});
                        });
                        var form = r.form();
                        if (localFilename) {
                            form.append('filename', fs.createReadStream(localFilename), { filename: basename });
                        } else {
                            form.append('filename', RED.util.ensureBuffer(Date.now()), { filename: basename });
                        }
                    } else {
                        node.error(RED._("box.error.upload-failed",{err:err.toString()}),msg);
                        node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                    }
                    return;
                } else {
                    msg.payload = "https://app.box.com/notes/" + data.id || ''; 
                    node.send(msg);                       
                }                    
                node.status({});
            });                
        });
    }
    RED.nodes.registerType("Create a Box Note",BoxOutNode);
};