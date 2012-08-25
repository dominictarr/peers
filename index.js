
module.exports = Peers

var MuxDemux = require('mux-demux')
var net = require('net')

function wrap (name) {
  return function () {
    var args = [].slice.call(arguments)
    this.opts[name].apply(this, args)
    return this
  }
}

var defaults = {
  choose: function (args) {
    return args[0]
  },
  connect: function (port) {
    return net.connect(port)
  },
  listen: function (port) {
    return net.createServer().listen(port)
  }
}

function merge (from, to) {
  for(var k in from)
    to[k] = to[k] || from[k]

  return to
}

function Peers (opts) {
  if(!(this instanceof Peers)) return new Peers(opts)
  this.opts = opts || {}
  this.plugins = {}
  this.reconnect = true
  merge(defaults, this.opts)

  this.initial = []
}

Peers.prototype._connect = function () {
  console.log('attempt connection')

  var stream = this.opts.connect(this.opts.choose(this.initial))
  var mx = MuxDemux().close()
  var self = this

  function connect () {
    console.log('CONNECT!!!')
    stream.pipe(mx).pipe(stream)
    for(var k in self.plugins)
      self._apply(mx.createStream(k), true)
  }

  var n = 0
  function reconnect (err) {
    if(err) console.log(err)
    if(!self.reconnect)
      return
    // okay, this is not the right logic for 
    // handling rounds of connections
    if(n++) return

      setTimeout(function () {
        self._connect()
      }, 100)

    stream.removeListener('end',   reconnect)
    stream.removeListener('error', reconnect)
    stream.removeListener('connect', connect)
  }

  stream.on('end', reconnect)
  stream.on('error', reconnect)
  stream.on('connect', connect)
}

//ONLY FOR THE VERY FIRST CONNECTION
Peers.prototype._firstConnection = function () {
  if(this._queued) return
  this._queued = true

  process.nextTick(this._connect.bind(this))

}

Peers.prototype.connect = function (port) {
  if(arguments.length === 1)
    this.initial.push(port)
  else 
    this.initial.push([].slice.call(arguments))

  this._firstConnection()
  return this
}

Peers.prototype.use = function (handler) {
  this.plugins[handler.name] = handler.handler || handler
  return this
}

Peers.prototype._apply = function (stream, client) {
  console.log('APPLY')
  var plug = stream.meta
  if(!this.plugins[plug])
    stream.error('no plugin for'+plug)
  else
    this.plugins[plug].call(this, stream, client)
}

Peers.prototype.listen = function (port) {

  this.server = this.opts.listen(port)
  var self = this
  this.server.on('connection', function (stream) {
    console.log('CONNECTION!!!')
    stream.pipe(MuxDemux(
      self._apply.bind(self)
    )).pipe(stream)
  })
  return this
}

Peers.prototype.close = function () {
  console.log(this.server)
  if(this.server)
    this.server.close()
  this.reconnect = false
}
