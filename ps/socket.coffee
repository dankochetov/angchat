module.exports = (opts)->

  uuid = require 'uuid'
  couchbase = require 'couchbase'
  Message = (new couchbase.Cluster('couchbase://81.181.8.153')).openBucket 'test1', 'kochetov'
  N1QL = require('couchbase').N1qlQuery
  dateFormat = require '../public/coffee/date.format'
  jsonfile = require 'jsonfile'
  conn = require('../mongoose')()
  config = jsonfile.readFileSync 'config.json'
  redis =
    pub: require('../redis')()
    sub: require('../redis')()
    request: (opts)->
      count = 0
      id = uuid.v4()
      opts.id = id
      redis.pub.publish 'socket', JSON.stringify opts
      listener = (ch, data)->
        data = JSON.parse data
        if ch is 'socket' and data.id is opts.id
          @onChunk data.data
          ++count
          if count is redis.pub.pubsub 'numsub', 'socket'
            redis.sub.removeListener 'message', listener
            @onEnd()
      redis.sub.addListener 'message', listener

      onChunk: (fn)=>
        @onChunk = fn

      onEnd: (fn)=>
        @onEnd = fn

  Room = require('../models/room')
    conn: conn
  Stats = require('../models/stats')
    conn: conn
  User = require('../models/user')
    conn: conn

  require('../console')
    ps: 'socket'
    port: opts.server.address().port
    redis: redis.pub

  redis.sub.subscribe 'server'
  redis.sub.subscribe 'socket'

  redis.sub.on 'message', (ch, data)->
    switch ch
      when 'server'
        data = JSON.parse data
        switch data.event
          when 'exit' then process.exit 0

  sockjs = require('sockjs').createServer sockjs_url: 'javascripts/source/sockjs.min.js'
  sockjs.installHandlers opts.server, prefix: '/sockjs'

  connections = []
  users = []
  rooms = []

  emit = (socket, event, data)->
    res = JSON.stringify
      event: event
      data: data
    #console.log(event, data);
    socket.write res

  emitRoom = (room, event, data)->
    for id of rooms[room]
      emit users[rooms[room][id]].socket, event, data
      redis.pub.publish 'emit:room', JSON.stringify
        room: room
        event: event
        data: data

  broadcast = (event, data)->
    for sockid of connections
      emit connections[sockid], event, data
      redis.pub.publish 'emit:all', JSON.stringify
        event: event
        data: data

  sockjs.on 'connection', (socket)->

    console.log 'new connection'
    connections.push socket

    socket.on 'data', (e)->
      e = JSON.parse e
      event = e.event
      data = e.data

      switch event
        when config.events['new user']
          if typeof data is 'string' then data = JSON.parse(data)
          if not rooms[data.room._id]? then rooms[data.room._id] = []
          if not (data.user._id in rooms[data.room._id])
            rooms[data.room._id].push data.user._id
          if not users[data.user._id]?
            users[data.user._id] =
              socket: socket
              rooms: [data.room._id]
              user: data.user
              connections: 1
          else
            if not (data.room._id in users[data.user._id])
              users[data.user._id].rooms.push data.room._id
            ++users[data.user._id].connections
          updateUsers data.room._id
          updateRooms()

          Room.findById data.room._id, (err, room)->
            if err then throw err
            if room then console.log 'User "' + data.user.username + '" joined the room "' + room.name + '".'
            else
              User.findById data.room._id, (err, user)->
                if err then throw err
                if user then console.log 'User "' + data.user.username + '" joined the private chat with "' + user.username + '".' 

        #Update usernames list
        when config.events['update users'] then updateUsers data

        #Returns messages list
        when config.events['get history']
          if typeof data is 'string' then data = JSON.parse data
          getHistory data, (messages)->
            emit socket, config.events['history'],
              id: data.roomid
              data: messages

        when config.events['get private history']
          if typeof data is 'string' then data = JSON.parse data
          getPrivateHistory data.id1, data.id2, data.skip, (messages)->
            emit socket, config.events['private history'],
              from: data.id1
              to: data.id2
              data: messages

        #Send message
        when config.events['send message']
          if typeof data is 'string' then data = JSON.parse data
          Stats.inc ['messages', 'public']
          for user in users
            if user.socket.id is socket.id
              username = user.user.username
              break
          msg = 
            text: data.msg
            room: data.roomid
            time: Date.now()
            username: username
          addMessage msg, ->
            emitRoom data.roomid, config.events['new message'], msg
            emitRoom 'listeners', config.events['new message'], msg

        when config.events['send private message']
          if typeof data is 'string' then data = JSON.parse(data)
          Stats.inc ['messages', 'private']
          for user in users
            if user.socket.id is socket.id
              user = user.user
              break
          msg = 
            text: data.msg
            private: true
            from: user._id
            to: data.to
            username: user.username
            time: Date.now()
          addMessage msg, ->
            redis.pub.publish 'socket', JSON.stringify
              event: 'send private message'
              to: data.to
              msg: msg

#################################### move to listener ####################################
            for i of users
              if users[i].user._id is msg.to
                emit users[i].socket, config.events['new private message'], msg
            emit socket, config.events['new private message'], msg
            broadcast config.events['listener event'], msg
#################################### / move to listener ##################################

        when config.events['clear history']
          clearHistory data, users[socket.id].user._id, ->
            updateHistory data

        when config.events['get room']
          Room.findById data, (err, room)->
            if err then throw err
            unless room? then room = '404'
            emit socket, config.events['room'], room

        when config.events['get rooms'] then updateRooms()

        when config.events['delete room']
          if typeof data is 'string' then data = JSON.parse(data)
          Stats.inc ['rooms', 'deleted']
          Room.findById(data.roomid).remove (err)->
            if err then throw err
            updateRooms()
            Message.query N1QL.fromString 'delete from `test1` where room = "' + data.roomid + '"'

        when config.events['admin:delete room']
          Stats.inc ['rooms', 'deleted']
          Room.findById(data).remove (err)->
            if err then throw err
            broadcast config.events['kick'], data
            updateRooms()
            Message.query N1QL.fromString 'delete from `test1` where room = "' + data + '"'

        when config.events['comment'] then console.log data

        when config.events['get friends'] then updateFriends socket, data

        when config.events['add friend']
          if typeof data is 'string' then data = JSON.parse(data)
          User.findById data.userid, (err, user)->
            if err then throw err
            user.friends.push data.friendid if user
            user.save (err)->
              if err then throw err
              updateFriends socket, data.userid

        when config.events['remove friend']
          if typeof data is 'string' then data = JSON.parse(data)
          User.findById data.userid, (err, user)->
            if err then throw err
            user.friends.splice(user.friends.indexOf(data.friendid), 1) if user
              user.save (err)->
                if err then throw err
                updateFriends socket, data.userid

        when config.events['get user']
          User.findById data, (err, user)->
            if err then throw err
            unless user? then user = '404'
            emit socket, config.events['user'], user

        when config.events['admin:get users']
          if typeof data is 'string' then data = JSON.parse(data)
          getUsers socket, data

        when config.events['set rank']
          if typeof data is 'string' then data = JSON.parse data
          User.update {_id: data.user._id}, {rank: data.rank}, ->
            getUsers()

        when config.events['admin:delete user']
          if typeof data is 'string' then data = JSON.parse(data)
          User.findById(data).remove ->
            getUsers socket

        when config.events['leave room'] then leaveRoom socket, data

        when config.events['admin:get stats']
          Stats.model.findOrCreate {date: data}, (err, today, created)->
            Stats.model.aggregate [
              {$group:
                _id: 0
                roomsCreated:
                  $sum: '$rooms.created'
                roomsDeleted:
                  $sum: '$rooms.deleted'
                messagesPublic:
                  $sum: '$messages.public'
                messagesPrivate:
                  $sum: '$messages.private'
                usersSignedUp:
                  $sum: '$users.signedUp'
                usersSignedIn:
                  $sum: '$users.signedIn'
              },
              {
                $project:
                  _id: 0
                  rooms:
                    created: '$roomsCreated'
                    deleted: '$roomsDeleted'
                  messages:
                    public: '$messagesPublic'
                    private: '$messagesPrivate'
                  users:
                    signedUp: '$usersSignedUp'
                    signedIn: '$usersSignedIn'
              }
            ], (err, all)->
              emit socket, config.events['admin:stats'], {today: today, all: all[0]}

        when config.events['autoLogin'] then broadcast config.events['autoLogin'], data

        when config.events['autoLogout'] then broadcast config.events['autoLogout'], data

    #Disconnect
    socket.on 'close', ->
      disconnect socket
      for i of users
        if users[i].socket.id is socket.id
          users.splice i, 1
      for i of connections
        if connections[i].id is socket.id
          connections.splice i, 1

  getUsers = (socket, data = {})->
    User.find {}, (err, users)->
      unless users? then users = '404'
      unless socket?
        broadcast config.events['admin:users'], users
      else
        emit socket, config.events['admin:users'], users

  updateRooms = ->
    Room.find {}, (err, found)->
      if err then throw err
      for cur of found
        id = found[cur]._id
        arr = []
        @rooms = []
        req = new redis.request
          event: 'get content'
          arr: 'rooms'
          id: id
        req.onChunk (data)=>
          @rooms = @rooms.concat JSON.parse data
        req.onEnd =>
          @users = []
          req = new redis.request
            event: 'get content'
            arr: 'users'
          req.onChunk (data)=>
            @users = @users.concat JSON.parse data
          req.onEnd =>
            for i of rooms[id]
              f = true
              for k of arr
                if users[arr[k]].user._id is users[rooms[id][i]].user._id
                  f = false
                  break
              if f
                arr.push rooms[id][i]
            found[cur].online = arr.length
          broadcast config.events['rooms'], found
      
  leaveRoom = (socket, id)->
    if rooms[id]? and rooms[id].length > 0
      len = rooms[id].length
      cur = 0
      while cur < len
        if rooms[id][cur] is socket.id
          rooms[id].splice cur, 1
        else
          ++cur
    if users[socket.id]?
      for cur of users[socket.id].rooms
        if users[socket.id].rooms[cur] is id
          users[socket.id].rooms.splice cur, 1
          break
    updateRooms()
    updateUsers id

  disconnect = (socket)->
    console.log 'disconnected'
    f = true
    for user in users
      if user.socket.id is socket.id
        f = false
        break
    if f then return
    len = users[socket.id].rooms.length
    i = 0
    while i < len
      cur = users[socket.id].rooms[i]
      leaveRoom socket, cur
      Room.findById cur, (err, room)->
        if err then throw err
        if room then console.log "User '#{users[socket.id].user.username}' disconnected from the room '#{room.name}'."
        else
          User.findById cur, (err, user)->
            if err then throw err
            if user then console.log "User '#{users[socket.id].user.username}' disconnected from the private chat with '#{user.username}'."
      ++i

  updateUsers = (roomid)->
    roomid = roomid.toString()
    res = []
    @rooms = []
    req = new redis.request
      event: 'get content'
      arr: 'rooms'
      id: roomid
    req.onChunk (data)=>
      @rooms = res.concat JSON.parse data
    req.onEnd =>
      req = new redis.request
        event: 'get content'
        arr: 'users'
      @users = []
      req.onChunk (data)=>
        @users = @users.concat JSON.parse data
      req.onEnd =>
        for i, room in @rooms
          f = true
          for k, item in res
            if item._id is @users[room].user._id
              f = false
              break
          if f then res.push @users[room].user
        emitRoom roomid, config.events['users'], res

  updateHistory = (roomid)->
    getHistory roomid, (messages)->
      emitRoom roomid, config.events['history'],
        id: roomid
        data: messages

  getHistory = (data, callback)->
    data.skip ?= 0
    condition = "`room` = '#{data.roomid}'"
    query = "select * from `test1` where #{condition} order by `time` desc limit 50 offset #{data.skip}"
    Message.query N1QL.fromString(query), (err, messages)->
      Message.query N1QL.fromString("select count(*) as `count` from `test1` where #{condition}"),
      (err, count)->
        if err then throw err
        if not messages? then return
        for id, message of messages
          messages[id] = message.test1
        callback {messages: messages.reverse(), count: count[0].count}

  getPrivateHistory = (id1, id2, skip = 0, callback)->
    condition = "(`from` = '#{id1}' and `to` = '#{id2}') or (`from` = '#{id2}' and `to` = '#{id1}')"
    query = "select * from `test1` where #{condition} order by `time` desc limit 50 offset #{skip}"
    Message.query N1QL.fromString(query), (err, messages)->
      if err then throw err
      Message.query N1QL.fromString("select count(*) as `count` from `test1` where #{condition}"),
      (err, count)->
        if err then throw err
        if not messages? then return
        for id, message of messages
          messages[id] = message.test1
        callback {messages: messages.reverse(), count: count[0].count}

  addMessage = (msg, callback)->
    Message.insert uuid.v4(), msg, (err, res)->
      callback()

  clearHistory = (roomid, userid, callback)->
    User.findById userid, (err, user)->
      if err then throw err
      rank = user.rank
      Room.findById roomid, (err, room)->
        if err then throw err
        if room and room.users[user._id]
          rank = Math.max rank, room.users[user._id]
        if rank < 3 then return console.log "#{user.username} tried to clear history but had no permission"
        Message.query N1QL.fromString("delete from `test1` where room = '#{roomid}'"), (err, res)->
          console.log 'history cleared'
          callback()

  updateFriends = (socket, userid)->
    User.findById userid, (err, user)->
      if err then throw err
      if user?
        User.find { _id: $in: user.friends }, (err, friends)->
          if err then throw err
          if friends? then emit socket, config.events['friends'], friends