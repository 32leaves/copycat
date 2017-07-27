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

function parseProgress(data) {
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

function filecopy(source, target) {
    const result = new EventEmitter();
    const rsync = new Rsync()
        .flags('a')
        .set('recursive')
        .set('info=progress2')
        .source(source)
        .destination(target)
        .execute(
            (error, code, cmd) => {
                if(error) result.emit('error', error);
                result.emit('done');
            },
            (stdout) => {
                const info = parseProgress(stdout.toString());
                if(info) {
                    result.emit('progress', info)
                }
            }
        )
    
    return result;
}

module.exports = filecopy;
