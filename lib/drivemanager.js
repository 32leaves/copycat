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
const fs = require('fs');
const path = require('path');
const drivelist = require('drivelist');


class DriveManager extends EventEmitter {

    constructor(priorityProvider, usbmountSymlinkPath = "/media/pi") {
        super();

        this.priorityProvider = priorityProvider;
        this.usbmountSymlinkPath = usbmountSymlinkPath;
        this._setupUsbmountListener();

        this.drives = [];
    }

    getDrives() {
	const result = [];
	for (var key in this.drives) {
            if (Object.prototype.hasOwnProperty.call(this.drives, key)) {
		result.push(this.drives[key]);
	    }
	}
	return result;
    }

    _setupUsbmountListener() {
        const installDriveListener = () => {
            console.log("Installing drive listener on " + this.usbmountSymlinkPath);
            fs.watch(this.usbmountSymlinkPath, (event, filename) => {
                console.log("Something happened", event, filename);
                if (!filename.startsWith('.')) {
		    // check later to give the system enough time to mount the drive
                    setTimeout(() => this._updateDriveMap(), 1000);
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
            const newDrives = [];
            for (var drive of drives) {
                const isUnknown = !(name in this.drives);
                const isValid = drive.mountpoints && drive.mountpoints.length > 0 && !drive.system && drive.device != '/dev/mmcblk0';

                if (isUnknown && isValid) {
                    const mountpoint = drive.mountpoints[0].path;
                    const name = path.basename(mountpoint);
                    drive.name = name;
                    const priority = this.priorityProvider(drive);
                    const driveInfo = {
                        'priority': priority,
                        'mountpoint': mountpoint,
                        'name': name
                    };
                    newDrives.push(driveInfo);
                    this.drives[name] = driveInfo;
                } else if (!isValid) {
                    console.log("Ignoring invalid drive", drive);
                }
            }

            // remove old drives
            const removedDrives = [];
            for (var key in this.drives) {
                if (this.drives.hasOwnProperty(key)) {
                    const driveStillAvailable = drives.map((d) => d.description).indexOf(key) > -1;
                    if (!driveStillAvailable) {
                        removedDrives.push(this.drives[key]);
                        delete this.drives[key];
                    }
                }
            }

            // trigger appropriate events
            this.emit('driveUpdate', newDrives, removedDrives);
        });
    }

}

module.exports = DriveManager;
