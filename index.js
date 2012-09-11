
module.exports = Peers

var MuxDemux = require('mux-demux')
var net = require('net')
var uuid = require('node-uuid')
var Model = require('./model')

function wrap (name) {
  return function () {
    var args = [].slice.call(arguments)
    this.opts[name].apply(this, args)
    return this
  }
}

var defaults = {
  name: 'defaults',
  choose: function (args) {
    return args[0]
  },
  connect: function (port, host) {
    return net.connect(port, host)
  },
  listen: function (port) {
    return net.createServer().listen(port)
  },
  peers: function () {
    return this.initial
  }
}

function merge (from, to) {
  for(var k in from)
    to[k] = to[k] || from[k]

  return to
}

function Peers (opts, id) {
  if(!(this instanceof Peers)) return new Peers(opts, id)
  this.opts = opts || {}
  this.plugins = {}
  this.reconnect = true
  merge(defaults, this.opts)

  this.model = Model(id || uuid.v4())
  this.id = this.model.id

  this.initial = []
}

Peers.prototype._connect = function () {

  var target = this.model.choose(this.initial)
  var stream = this.opts.connect(target.port, target.host)
  var mx = MuxDemux().close()
  var self = this

  function connect () {
    stream.pipe(mx).pipe(stream)
    for(var k in self.plugins)
      self._apply(mx.createStream({
        type: k, 
        from: self.model.id, 
        to: target.id
      }, {allowHalfOpen: false})
    , true)
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
    }, 100 + Math.random() * 50)
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

Peers.prototype.connect = function (port, host) {
  this.initial.push({port: port, host: host, id: 'init'})

  this._firstConnection()
  return this
}

Peers.prototype.use = function (handler) {
  this.plugins[handler.name] = handler.handler || handler
  return this
}

Peers.prototype._apply = function (stream, isClient) {
  var plug = stream.meta.type
  if(!this.plugins[plug])
    stream.error('no plugin for'+plug)
  else
    this.plugins[plug].call(this, stream, isClient)
}

Peers.prototype.listen = function (port, host) {

  //add self to peers.
  this.model.create(port, host || 'localhost')
  this.server = this.opts.listen(port)
  var self = this
  this.server.on('connection', function (stream) {
    stream.pipe(MuxDemux(
      self._apply.bind(self)
    )).pipe(stream)
  })
  return this
}

Peers.prototype.close = function () {
  //if _handle is truthy the server is in use.
  if(this.server && this.server._handle)
    this.server.close() 
  this.reconnect = false
}
