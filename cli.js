#! /usr/bin/env node

var argv = require('optimist')
    .alias('h', 'host')
    .alias('f', 'file')
    .alias('i', 'id')
  .argv

var peer = require('./')

peer(argv, console.log)

