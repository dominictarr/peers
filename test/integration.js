
var Peers = require('..')

function replicate(stream, isClient) {
  stream.pipe(this.model.createStream()).pipe(stream)
  setTimeout(function () {
    stream.end()
  }, 1000)
  console.log(this.model.toJSON())
  console.log(stream.meta, isClient)
}

var a = Peers(null, 'a')
  .use(replicate)
  .listen(6464)

var b = Peers(null, 'b')
  .use(replicate)
  .connect(6464)
  .listen(4242)

var c = Peers(null, 'c')
  .use(replicate)
  .connect(6464)
  .listen(8686)


