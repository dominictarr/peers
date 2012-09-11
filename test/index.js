//API WILL LOOKLIKE THIS
var a = require('assertions')
var macgyver = require('macgyver')
var EventEmitter = require('events').EventEmitter
var invert = require('invert-stream')


return

var peers = require('..')
var through = require('through')

exports['inject connect function'] = function (t) {
  var r
  peers({
    connect: function (port) {
      a.equal(port, r)
      return through()
    }
  })
  .connect(r = Math.random())
}

exports['inject listen function'] = function (t) {
  var r, mac = macgyver()
  process.on('exit', mac.validate)

  peers({
    listen: mac(function (port) {
      a.equal(port, r)
      return through()
    }).once()
  })
  .listen(r = Math.random())
}

exports['inject choose function'] = function (t) {
  var r = []
  var mac = macgyver()
  process.on('exit', mac.validate)

  function rand () {
    var _r = Math.round(Math.random() * 40000) + 1024
    r.push({port: _r, host: 'localhost'})
    return _r
  }

  peers({
    //connect takes the chosen port
    //and creates a connection.
    connect: mac(function (port) {
      console.log('ports', port, r[0].port)

      a.equal(port, r[0].port)
      return through()
    }).once(),
    choose: mac(function (array) {
      a.deepEqual(array, r)
      return array[0]
    }).once()
  })
  .connect(rand(), 'localhost') //generate some ports!
  .connect(rand(), 'localhost')
  .connect(rand(), 'localhost')
  .connect(rand(), 'localhost')
  .connect(rand(), 'localhost')
}

exports['fake server'] = function (t) {
  var r = []
  var emitter = new EventEmitter()
  var mac = macgyver()
  process.on('exit',function () {

    console.log('EXIT')
    mac.validate()

  })

  function rand () {
    var _r = Math.round(Math.random() * 40000) + 1024
    r.push(_r)
    return _r
  }

  var data = Math.random()
  var handler = mac(function handler (stream, client) {
    console.log('HANDLER', client)
    if(client) {
      console.log('SEND DATA>', data)
      stream.write(data)
    }
    else {
      stream.on('data', function (_data) {
        console.log('RECV DATA>', _data)
        a.equal(_data, data)
      })
    }
  }).times(2)

  var stream = invert()

  peers({
    //returns an event emitter
    //than emits a connection event.
    listen: function () {
      return emitter
    }
  }).listen(0).use(handler)

  peers({
    //connect takes the chosen port
    //and creates a connection.
    connect:function (port) {
      a.equal(port, 0)
      process.nextTick(function () {
        //make the server pretend it's connected.
        emitter.emit('connection', stream)
        //make the client think it's connected.
        stream.other.emit('connect')
      })
      return stream.other
    },
    choose: mac(function (array) {
      return  array[0]
    }).once(),
  })
  .use(handler)
  .connect(0)

}

for (var k in exports)
  console.log('#', k), exports[k]()
