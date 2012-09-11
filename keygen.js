

//ssh-keygen -q -f "$1" -b 768 -N ''
//ssh-keygen -e -f "$1".pub -m PEM > "$1".pem

var spawn = require('child_process').spawn
var fs = require('fs')

//GENERATE A PRIVATE KEY, AND PEM ENCODED PUBLIC KEY
//add a function to load key-pairs


module.exports = function (file, size, cb) {
  var args = [].slice.call(arguments)
  var cb = args.pop()
  var file = args.shift() || '/tmp/'+ (''+Math.random()).substring(2)
  var size = '' + (args.pop() || 786)

  spawn('ssh-keygen', ['-q', '-f', file, '-b', size, '-N', ''])
    .on('exit', function () {
      spawn('ssh-keygen', ['-e', '-f', file + '.pub', '-m', 'PEM'])
        .stdout.pipe(fs.createWriteStream(file + '.pem'))
        .on('close', function () {

          var n = 0, private, public, error
          function done (err) {
            if(error) 
              return
            if(err)
              return cb(error = err)
            if(++n != 2)
              return
            cb(err, private, public)
          }

          fs.readFile(file, function (err, priv) {
            private = priv
            done(err)
          })

          fs.readFile(file + '.pem', function (err, pub) {
            public = pub
            done(err)
          })
        })
    })
}


if(!module.parent) {
  module.exports(function (err, private, public) {
    console.log(''+private, ''+public)
  })
}
