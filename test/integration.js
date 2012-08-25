
var Peers = require('..')
var consistent = require('./helpers')

var reps = 0
/*
1, 2, 4, 8, 16, 32, 64

*/

var ROUND = 1000

function replicate(stream, isClient) {
  reps ++
  stream.pipe(this.model.createStream({wrapper: 'raw'})).pipe(stream)
  setTimeout(function () {
    stream.end()
  }, ROUND)
}

function randomPort() {
  return ~~((Math.random() * 40000) + 1024)
}

function createPeers (ids) {
  var leaderPort, leader
  var peers = ids.map(function (id) {
    var peer = Peers(null, id)
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
    return peer
  })

  var models = peers.map(function (peer) {
    return peer.model
  })

  var steps = 0

  var checker = setInterval(function () {

    var c = consistent(models)
    console.log('inconsistent:', c, steps ++, reps)
    if(c)
      return

    randChange()
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


}

createPeers('abcdefhijklmnopqrstuvwxyzAOEUIDHTNS_QJKXBMWVPYFGCRL$&[{}(=*)+]!#~%7531902468`'.split(''))

