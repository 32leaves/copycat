/**
 * Copyright (c) 2015 Christian Weichel
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
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
var FakeDriveManager = require('./lib/fakedrivemanager');
var CopyManager = require('./lib/copymanager');
var WebUI = require('./lib/webui');



const driveManager = new DriveManager((drive) => {
    if(drive.description.indexOf('Backend') > -1) {
        return 0;
    } else if(drive.description.indexOf('External') > -1) {
        return 10;
    } else {
        return 20;
    }
});
//const driveManager = new FakeDriveManager();
driveManager.on('driveUpdate', (added, removed) => {
    console.log('Drives added ', added);
    console.log('Drives removed ', removed);
});

const copyManager = new CopyManager(driveManager);

const ui = new WebUI();
ui.start();

driveManager.on('driveUpdate', (added, removed) => {
    ui.setDrives(driveManager.drives);
});
copyManager.on('newJob', (job) => {
    console.log('New job', job);
    ui.createJob(job.id(), job.source);

    job.on('error', (err) => {
        console.log('Error', job.id(), err);
        ui.setError(job.id(), err.toString());
    });
    job.on('progress', (perc) => {
        console.log('Progress', job.id(), perc.percentage);
        ui.setProgress(job.id(), perc.percentage);
    });
    job.on('sync', () => {
        console.log('Sync', job.id());
        ui.setSyncing(job.id());
    });
    job.on('done', () => {
        console.log('Done', job.id());
        ui.setDone(job.id());
    });
});

/*
setTimeout(() => {
driveManager.addDrive({'priority': 10, 'mountpoint':'/tmp/dest', 'name':'dest'});
driveManager.addDrive({'priority': 20, 'mountpoint':'/tmp/src', 'name':'src'});
}, 5000);
*/

// var jobid = 'foobar';
// setTimeout(() => {
//     ui._createJob(jobid, jobid);
// }, 5000);
// setTimeout(() => {
//     ui._setProgress(jobid, 22);
// }, 10000);
// setTimeout(() => {
//     ui._setDone(jobid);
// }, 15000);

// const manager = new DriveManager('Out And About');
// manager.on('driveUpdate', (added, removed) => {
//     console.log('Added ', added);
//     console.log('Removed ', removed);

    
// });
