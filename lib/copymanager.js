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

const EventEmitter = require('events');
const Rsync = require('rsync');
const path = require('path');

class CopyJob extends EventEmitter {

    constructor(source, destination) {
        super();
        this.source = source;
        this.destination = destination;
        this.status = 'prepared';
    }

    id() {
        const base = this.source + "->" + this.destination;
        var hash = 0, i, chr;
        for (i = 0; i < base.length; i++) {
            chr   = base.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    }

    _parseProgress(data) {
        const lines = data
            .split("\n")
            .map((e) => { return e.trim().split(" ").filter((x) => { return x.length > 0 }); })
            .filter((e) => { return e.length > 3; })        
        const parsedLines = lines.map((e) => {
                return {
                    'bytesTransfered' : parseInt(e[0].replace(',', '')),
                    'percentage': parseInt(e[1].replace('%', ''))
                }
            });
        return parsedLines[parsedLines.length - 1];
    }

    start() {
        this.status = 'running';

        const self = this;
        const rsync = new Rsync()
            .flags('a')
            .set('recursive')
            .set('info=progress2')
            .source(source)
            .destination(target)
            .execute(
                (error, code, cmd) => {
                    if(error) self.emit('error', error);
                    self.emit('done');
                    self.status = 'done';
                },
                (stdout) => {
                    const info = self._parseProgress(stdout.toString());
                    if(info) {
                        self.emit('progress', info)
                    }
                }
            );
    }

    equals(other) {
        /*Make sure the object is of the same type as this*/
        if(typeof other != typeof this)
            return false;

        return this.source === other.source && this.destination === other.destination;
    }

}

function defaultDriveTargetPathProvider(dest, src) {
    return path.join(dest.mountpoint, src.name.replace(' ', ''));
}

class CopyManager extends EventEmitter {

    constructor(driveManager, driveTargetPathProvider=defaultDriveTargetPathProvider) {
        super();

        this._driveManager = driveManager;
        this._jobs = [];
        this._driveTargetPathProvider = driveTargetPathProvider;

        const self = this;
        driveManager.on('driveUpdate', (added, removed) => {
            for(var drive of added) {
                self._createJobsFor(drive);
            }
        });
    }

    _createJobsFor(drive) {
        const destinations = this._driveManager.drives.filter((candidate) => {
            return candidate.priority < drive.priority;
        });
        const sources = this._driveManager.drives.filter((candidate) => {
            return candidate.priority > drive.priority;
        });
        
        const jobCandidates = destinations.map((destinationDrive) => {
            const destination = this._driveTargetPathProvider(destinationDrive, drive);
            return new CopyJob(drive.mountpoint, destination);
        }).concat(sources.map((sourceDrive) => {
            const destination = this._driveTargetPathProvider(drive, sourceDrive);
            return new CopyJob(sourceDrive.mountpoint, destination);
        }));
        const jobsToRun = jobCandidates.filter((candidate) => !this._jobs.some((other) => other.equals(candidate)));

        for(var job of jobsToRun) {
            this.emit('newJob', job);
            job.start();
        }
    }

}

module.exports = CopyManager;
