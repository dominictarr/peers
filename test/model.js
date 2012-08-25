
var Model = require('../model')
var assert = require('assertions')

var a = Model('aaa')
var b = Model('bbb')

a.create(6666, 'localhost', 'aaa')
b.create(4444, 'localhost', 'bbb')

assert.equal(a.id, 'aaa')
assert.equal(b.id, 'bbb')

var ms
(ms = a.createStream()).pipe(b.createStream()).pipe(ms)

process.nextTick(function () {

  //consistent
  assert.deepEqual(a.toJSON(), b.toJSON())

  assert.ok(/aaa|bbb|init/.test(a.choose([{id: "init"}]).id))
  assert.ok(/aaa|bbb|init/.test(a.choose([{id: "init"}]).id))
  assert.ok(/aaa|bbb|init/.test(a.choose([{id: "init"}]).id))
  assert.ok(/aaa|bbb|init/.test(a.choose([{id: "init"}]).id))
  assert.ok(/aaa|bbb|init/.test(a.choose([{id: "init"}]).id))
  assert.ok(/aaa|bbb|init/.test(a.choose([{id: "init"}]).id))

})

