#peers

a simple peer-to-peer framework.

replicate dynamic data through a trusted network with a gossip protocol and [crdt](http://github.com/dominictarr/crdt)

## Usage

``` js

peers()
  .use(function name (stream, other) {
    //plugin style, can stream to other side.
  })
  .connect(initial_port, initial_host)
  .connect(initial_port2)   //.. as many as you like...
  .listen(port, host)       //port to listen on.

```

peers needs to know a it's id, a file where it can persist it's data, 
an address to listen on, and an initial address to connect to.

the first time you run a peer, pass these as options.

``` sh

./cli.js --id TEST1 --file ./TEST1.crdt --host localhost:4000
```
the peer will persist this information about it self, and the second time you run a peer
you only need to pass the file

``` sh
./cli.js --file ./TEST1.crdt
```

once you have one peer running, tell another to connect to it!

``` sh

./cli.js --id TEST2 --file ./TEST2.crdt --host localhost:4001 --init 4000

```

you only need to introduce a peer the first time, once it's connected to the network,
it will learn about other peers, and it will connect to them next time.
although, if their addresses have all changed, then you will need to introduce it again.

