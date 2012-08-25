var Peers = require('..')

var connects = 0

function createPeer(port, initial) {

  return new Peers()
    .use(function handler (stream, isClient) {
      console.log(stream.meta, !! isClient)
      stream.on('end', function () {
        console.log('END', !! isClient)
        if(!isClient)
          stream.end()
        else if(connects ++ > 3) {
          console.log('close')
          client.close()
          server.close()
        }
      })

      if(isClient)
        stream.write('*** HI THERE ***'), stream.end()
      else
        stream.on('data', function (data) {
          console.log('RECV', data)
        })
    })
}

var client = createPeer().connect(4242)
var server = createPeer().listen(4242)

