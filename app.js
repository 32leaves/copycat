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

var os = require('os');
var DriveManager = require('./lib/drivemanager');
var FakeDriveManager = require('./lib/fakedrivemanager');
var CopyManager = require('./lib/copymanager');
var WebUI = require('./lib/webui');


// start webui first to ease debugging
const ui = new WebUI();
ui.start();

if(os.type() == 'Windows_NT') {
    console.log('Running on windows. Starting WebUI only.');
    setInterval(() => {
        var id = Math.floor(Math.random() * 1000);
        ui.createJob(id, '/media/' + id);
        ui.setProgress(id, Math.floor(Math.random() * 100));

        const rand = Math.random();
        if(rand < 0.3) {
            ui.setSyncing(id);
        }
    }, 5000);
} else {
    const driveManager = new DriveManager((drive) => {
        if(drive.name.indexOf('Backup') > -1) {
            return 0;
        } else if(drive.name.indexOf('OutAndAbout') > -1) {
            return 10;
        } else {
            return 20;
        }
    });

    const copyManager = new CopyManager(driveManager);

    driveManager.on('driveUpdate', (added, removed) => {
        console.log('Drives added ', added);
        console.log('Drives removed ', removed);
        ui.setDrives(driveManager.getDrives());
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
}
