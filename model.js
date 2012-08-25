

//create - create object representing my id.

//choose - return a port / host to connect to.

//replicate - on each new connection

var Doc = require('crdt').Doc

module.exports = function (id) {

  var model = new Doc(id)
//  model.sync = true
  model.create = function (port, address) {

    var me = model.add({
      id: id, 
      port: port, 
      address: address
    })

    return me
  }

  //this is pretty crude...

  model.choose = function (initial, depth) {

    var all = initial.concat(Object.keys(model.rows).map(function (k){ 
      return model.rows[k].toJSON()
    }))

    var r= all[~~(Math.random()*all.length)]
    
    var me = model.get(id).toJSON()

    if(r.port == me.port && r.host == me.host && all.length > 1 && depth < 10)
      return model.choose(initial, (depth || 1) + 1)

    if(!r)
      throw new Error('fail to select target')

    return r

  }

  return model

}
