/**
 * Copyright (c) 2015 Christian Weichel
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

var DriveManager = require('./lib/drivemanager');
var filecopy = require('./lib/filecopy');
var WebUI = require('./lib/webui');


const ui = new WebUI();
ui.start();

var jobid = "foobar";
setTimeout(() => {
    ui._createJob(jobid, jobid);
}, 5000);
setTimeout(() => {
    ui._setProgress(jobid, 22);
}, 10000);


// const manager = new DriveManager("Out And About");
// manager.on("driveUpdate", (added, removed) => {
//     console.log("Added ", added);
//     console.log("Removed ", removed);

    
// });
