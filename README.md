# copycat
Copies SD card contents to external HD, written in Javascript (NodeJS). This is useful for backing up SD card content to a larger HD drive, e.g. while traveling.

## Prerequisites
 * Raspbian
 * usbmount with "gid=pi" added to MOUNTOPTIONS
 * NodeJs > 8.x (see http://thisdavej.com/beginners-guide-to-installing-node-js-on-a-raspberry-pi/#install-node)

## Concept
1. User plugs in hard drive
    1. _usbmount_ mounts hard drive
    2. _fs.watch_ triggers the drive handler
    2. _drivelist_ confirms the hard drive mount point based on the HD description
2. User plugs in USB stick
    1. _usbmount_ mounts the USB drive
    2. _fs.watch_ triggers the drive handler
    3. _drivelist_ confirms the mount point and that it's a USB stick
    4. using _rsync_ we copy the content to the hard drive. The progress is published through an event emitter
