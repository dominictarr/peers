
module.exports = Peers

var MuxDemux = require('mux-demux')

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
  }
}

function merge (from, to) {
  for(var k in from)
    to[k] = to[k] || from[k]

  return to
}

function Peers (opts) {
  if(!(this instanceof Peers)) return new Peers(opts)
  this.opts = opts
  this.plugins = {}

  merge(defaults, this.opts)

  this.initial = []
}

Peers.prototype._connect = function () {
  if(this._queued) return
  this._queued = true
  var stream = this.opts.connect(this.opts.choose(this.initial))
  var mx = MuxDemux()
  var self = this
  stream.on('connect', function () {
    console.log('CONNECT!!!')
    stream.pipe(mx).pipe(stream)
    for(var k in self.plugins)
      self._apply(mx.createStream(k), true)
  })
}

Peers.prototype.connect = function (port) {
  if(arguments.length === 1)
    this.initial.push(port)
  else 
    this.initial.push([].slice.call(arguments))

  this._connect()
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
