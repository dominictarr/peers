var assert = require('assert')
var crypto = require('crypto')

module.exports = function (ary) {
//  var leader = ary.shift()
    var inconsistent = 0
    var states = {}
    ary.forEach(function (other) {
      var hash = crypto.createHash('sha1')
        .update(JSON.stringify(other.history())).digest('hex')
      if(!states[hash])
        states[hash] = {count: 1, knows: Object.keys(other.rows).length}
      else
        states[hash].count ++

    })
    console.log(states)
    return Object.keys(states).length - 1

}

