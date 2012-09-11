
var Peers = require('..')
var consistent = require('./helpers')
var keygen = require('../keygen')
var es = require('event-stream')
var security = require('scuttlebutt/security')
var reps = 0
/*
//how many nodes ought to be reached with another round.
1, 2, 4, 8, 16, 32, 64
*/

var ROUND = 2000

var TAIL = false

function replicate(stream, isClient) {
  var s 
  reps ++
//  if(isClient) console.log('REPLICATIE', stream.meta.from, stream.meta.to)
  //the stream is 'raw' (js objects) because mux-demux does JSON for you.
  stream
    .pipe(s = this.model.createStream({wrapper: 'raw', 
      end: false //TAIL
    }))
  .pipe(stream)

//  if(TAIL)
  s.on('synced', function () {
    setTimeout(function () {
      stream.end()
    }, ROUND)
  })
}

function randomPort() {
  return ~~((Math.random() * 40000) + 1024)
}

var keys = {}

function createPeer(id, cb) {
  keygen(function (err, pri, pub) {
    var peer = Peers(null, security(keys, ''+pri, ''+pub))
    console.log(''+pub, peer.id)
    keys[peer.id] = ''+pub
    cb(err, peer)
  })
}


function createPeers (ids) {
  var leaderPort, leader
  var peers = [], models = []

  //using event stream like a async framework.

  es.from(function (i, next) {
    if(i >= ids.length)
      return this.emit('end')
    this.emit('data', ids[i])
    return next()
  })
  .pipe(es.map(createPeer))
  .pipe(es.map(function (peer, cb) {
    if(!leaderPort) {
      leaderPort = randomPort()
      leader = peer
      peer
        .listen(leaderPort)
        .connect(leaderPort)
    }
    else {
      peer
        .listen(randomPort())
        .connect(leaderPort)
    }
    peer.use(replicate)
    peers.push(peer)
    models.push(peer.model)
    cb()
  }))
  .on('end', function () {

    var steps = 0
    var checker = setInterval(function () {
      var c = consistent(models)
      console.log('inconsistent:', c, steps ++, reps)
      if(c)
        return

//      randChange()
      steps = 0
      return

      console.log('CONSISTENT')
      peers.forEach(function (peer) {
        peer.close()
      })
      clearInterval(checker)
      console.log(leader.model.toJSON())

    }, ROUND)

    function randChange() {
      var r = peers[~~(peers.length * Math.random())]
      r.model.get(r.id).set('random', Math.random())
    }

  //  setTimeout(randChange, 300)
  //  setTimeout(randChange, 500)
  //  setTimeout(randChange, 700)
  })

}

createPeers(
  ''
//  'abcdefhijklmnopqrstuvwxyzAOEUIDHTNS_QJKXBMWVPYFGCRL$&' 
+ '[{}(=*)+]!#~%7531902468`'.split(''))
//*/
//createPeers('abcde'.split(''))

