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

    constructor(destinationIdentifier, usbmountSymlinkPath = "/var/run/usbmount") {
        super();

        this.destinationIdentifier = destinationIdentifier;
        this.usbmountSymlinkPath = usbmountSymlinkPath;
        this._setupUsbmountListener();

        this._drives = {};
    }

    _setupUsbmountListener() {
        const installDriveListener = () => {
            console.log("Installing drive listener on " + this.usbmountSymlinkPath);
            fs.watch(this.usbmountSymlinkPath, (event, filename) => {
                if (!filename.startsWith('.')) {
                    this._updateDriveMap();
                }
            });
        };

        if (fs.existsSync(this.usbmountSymlinkPath)) {
            installDriveListener();
        } else {
            // usbmountSymlinkPath does not exist yet. Wait for it to come to life.
            const parent = path.join(this.usbmountSymlinkPath, '..');
            console.log("Symlink directory (" + this.usbmountSymlinkPath + ") does not yet exist. Watching " + parent);
            fs.watch(parent, (event, filename) => {
                console.log("Something happened in parent", event, filename);
                if (event == 'rename' && filename == path.basename(this.usbmountSymlinkPath)) {
                    installDriveListener();
                }
            });
        }
    }

    _updateDriveMap() {
        console.log("Updating drive map");
        drivelist.list((error, drives) => {
            if (error) {
                throw error;
            }

            // find the new drives
            const newDrives = {};
            for (var drive of drives) {
                const name = drive.description;
                const isDestination = drive.system && name.indexOf(this.destinationIdentifier) > -1;
                const isUnknown = !(name in this._drives);
                const isValid = drive.mountpoints && drive.mountpoints.length > 0 && !drive.system;

                if (isUnknown && isValid) {
                    const driveInfo = {
                        'isDestination': isDestination,
                        'mountpoint': drive.mountpoints[0]
                    };
                    newDrives[name] = driveInfo;
                    this._drives[name] = driveInfo;
                } else if (!isValid) {
                    console.log("Ignoring invalid drive", drive);
                }
            }

            // remove old drives
            const removedDrives = {};
            for (var key in this._drives) {
                if (this._drives.hasOwnProperty(key)) {
                    const driveStillAvailable = drives.map((d) => d.description).indexOf(key) > -1;
                    if (!driveStillAvailable) {
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
