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

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const drivelist = require('drivelist');


class DriveManager extends EventEmitter {

    constructor(destinationIdentifier, usbmountSymlinkPath="/var/run/usbmount") {
        this.destinationIdentifier = destinationIdentifier;
        this.usbmountSymlinkPath = usbmountSymlinkPath;
        this._setupUsbmountListener();

        this._drives = {};
    }

    _setupUsbmountListener() {
        const installDriveListener = () => {
            fs.watch(this.usbmountSymlinkPath, (event, filename) => {
                if(!filename.startsWith('.')) {
                    this._updateDriveMap();
                }
            });
        };

        if(fs.exists(this.usbmountSymlinkPath)) {
            installDriveListener();
        } else {
            // usbmountSymlinkPath does not exist yet. Wait for it to come to life.
            fs.watch(path.join(this.usbmountSymlinkPath, '..'), (event, filename) => {
                if(event == 'rename' && filename == path.basename(this.usbmountSymlinkPath)) {
                    installDriveListener();
                }
            });
        }
    }

    _updateDriveMap() {
        drivelist.list((error, drives) => {
            if (error) {
                throw error;
            }

            // find the new drives
            const newDrives = {};
            for(drive of drives) {
                const isDestination = !drive.system && drive.name.contains(this.destinationIdentifier);
                const isUnknown = this._drives.get(drive.name) == null;
                const isValid = drive.mountpoints && drive.mountpoints.length > 0;

                if(isUnknown && isValid) {
                    driveInfo = {
                        'isDestination': isDestination,
                        'mountpoint': drive.mountpoints[0]
                    };
                    newDrives[drive.name] = driveInfo;
                    this._drives[drive.name] = driveInfo;
                } else if(!isValid) {
                    console.log("Ignoring invalid drive", drive);
                }
            }

            // remove old drives
            const removedDrives = {};
            for(var key in this._drives) {
                if(this._drives.hasOwnProperty(key)) {
                    const driveStillAvailable =  drives.map((d) => d.name).indexOf(key) > -1;
                    if(!driveStillAvailable) {
                        removedDrives[key] = this._drives[key];
                        delete this._drives[key];
                    }
                }
            }

            // trigger appropriate events
            this.emit('driveUpdate', newDrives, removedDrives);
        });
    }

}

module.exports = DriveManager;