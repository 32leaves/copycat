/**
 * Copyright (c) 2017 Christian Weichel
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */

'use strict';

const express = require('express');
const http = require('http');
const socketio = require('socket.io');

class WebUI {

    constructor() {
        this._app = express();
        this._server = http.Server(this._app);
        this._io = socketio(this._server);

        // Set up routing
        this._app.use('/js',  express.static(__dirname + '/webui/js'));
        this._app.use('/css', express.static(__dirname + '/webui/css'));
        this._app.use('/', express.static(__dirname + '/webui'));
    }

    start(hostname='localhost', port=8080) {
        this._server.listen(port, hostname, () => {
            console.log('WebUI running on http://' + hostname + ':' + port);
        });
    }

    _createJob(id, source) {
        this._io.emit('new_job', id, source);
    }

    _setProgress(jobid, progress) {
        this._io.emit('progress', jobid, progress);
    }

}

module.exports = WebUI;
