/*
  just thinking out loud

ABSTRACT CLASS
*/

var inherits = require('util').inherits
var es = require('es')
var crdt = require('crdt')

inherits(Peer, crdt.Row)

function Peer () {
  //where do I set the address?
  //do I pass the address in?
  //or do I detect the address?
  //it will probably be in a config file.
  //and I can't detect the port,
  //because it isn't assigned yet
  //and it may change.

  //so, it must get passed in.
}
//@remote {Peer} the remote peer to connect to.
//lets say that connect should return an object stream.
Peer.prototype.connect = function (address) { 

  return es.connect(es.stringify(), net.connect(address), es.split(), es.parse())
}

Peer.prototype.serve = function (onConnect, ready) {
  var address = this.get('address')
  var port = address.port
  var host = address.host

  return net.createServer(function (con) {
     onConnect(
        es.connect(
          es.stringify()
        , con
        , es.split()
        , es.parse()
      )
    )
  }).listen(port, host, ready)
}
