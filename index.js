var crdt = require('crdt')
var fs = require('fs')
var parse = require('url').parse
var net = require('net')
var es = require('event-stream')

/*
  approaching things from the other end here.

  read persisted state, and connect to init server,
  and/or known servers.

*/

function address (row, op) {
  var address = {}
  if(op) {
    var host = (''+op).split(':')
    return {port: +host.pop(), host: host.pop() || 'localhost'}
  }
  return {port: row.get('port'), host: row.get('host')} 
}

function sync(doc, file, synced) {

  if(!file) {
    doc.sync = true
    return synced()
  } else
    doc.once('sync', synced)

  function write(hist) {
    console.log('HIST', hist, hist != null)
    doc.sync = true
    doc.emit('sync')
    doc.createReadStream({end: false, history: hist != null })
//      .pipe(es.log('TO FILE>>'))
      .pipe(es.stringify())
      .pipe(fs.createWriteStream(file, {flags: 'a'}))
      .on('end', function () {
        console.log('ON END')
      })
  }

  fs.stat(file, function (err) { 
    console.log(err)
    if(err) return write(true)
    else
      fs.createReadStream(file)
        .on('end', write)
        .pipe(es.split())
        .pipe(es.parse())
        .pipe(doc.createWriteStream()) 
  })
}
/*
  okay, I paused this a week, gotta think it through again.
  each peer has an address, and may connect to any other peer if it has thier
  address and that peer is up.

  so to create a peer, need setup a server, have a connect function, 
  and assign/detect an address.


  hmm, looks like the most straightforward way to config this is
  to load from /etc/peers, or ~/.peersrc or ~/.config/peers/config.json
  or ~/.peers/config.json

  or search fro a relative peers.json, which could be more feasible on
  some PaaS. 

  that could all be bundled into a module.

  or, wherever a --config option points.
*/

module.exports = 
function (opts, ready) {

  console.log('HELLO1')
  var doc = new crdt.Doc(), server
  if(opts.id)
    doc.id = opts.id
  sync(doc, opts.file, function () {
    //create a record for this node if there is not one already.
    var peer = doc.get(doc.id)
    var peers = doc.createSet('type', 'peer')
    if(!peer.get('type'))
      peer.set({type: 'peer'}) 
    function connect(con, doc) {
      con
        .pipe(es.split())
        .pipe(es.parse())
        .pipe(doc.createStream())
        .pipe(es.stringify())
        .pipe(con)
    }

    var a = address(peer, opts.host)

    if(!opts.client)
    server = net.createServer(function (con) {
      console.log('remote connection')
      connect(con, doc)
      //copy data for 3 seconds.
      var timeout = setTimeout(function () {
        con.end()
      }, 3000)

      con.on('error', function (err) {
        console.error(err)
        clearTimeout(timeout)
      })

    }).listen(a.port, a.host, function () {
      console.log('peer:', opts.id, 'listening on', a.host,':', a.port)
      peer.set({online: Date.now(), host: a.host, port: a.port})
    })

    ready(null, {peers: peers, peer: peer, server: server})
    //also, start connecting to other nodes...
    //every second, connect to a random server & exchange data.
    setInterval(function () {
      var l = peers.asArray().length
      var n = peers.asArray()[~~(Math.random()*l)]
      //console.log('attempt connect to', n ? n.toJSON() : n)
      var con
      if(n && n !== peer) {
        con = net.connect(n.get('port'), n.get('host'))
      } else if (opts.init) {
        var host = (''+opts.init).split(':')
        var port = +host.pop() //should be a number
        host = host.pop() || 'localhost'
        con = net.connect(port, host)
      }
      if (con) {
        connect(con, doc)
        //when the stream timesout, ends', or errors. 
        //look for another connection.
        //node will dispose of this connection, 
        //but peers will connect to another server in the next round
        con.once('error', function (err) {
          console.error(err.code, 'connecting to:', n.get('id'))
        })
        con.once('connect', function () {
          console.log('replicating',doc.id, '->', n.get('id')) 
        })
        con.on('end', function () {
          console.log('disconnect',doc.id, '->', n.get('id')) 
        })
      }
      else if (!l)
        console.log('no peers :(')
    }, 1000)

  })


  //if(/([\w\d\.]+(:?\d+)/.test(opts.host)) //test if host is a correct format.
    
}


