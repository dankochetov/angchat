User = require './models/user'
uuid = require 'uuid'
couchbase = require 'couchbase'
Message = (new couchbase.Cluster('couchbase://127.0.0.1')).openBucket 'messages'
N1QL = require('couchbase').N1qlQuery
Room = require './models/room'
Stats = require './models/stats'
dateFormat = require './public/coffee/date.format'

module.exports = (sockjs, connections) ->

  users = []
  rooms = []

  emit = (socket, event, data) ->
    res = JSON.stringify
      event: event
      data: data
    #console.log(event, data);
    socket.write res

  emitRoom = (room, event, data) ->
    for id of rooms[room]
      emit users[rooms[room][id]].socket, event, data

  broadcast = (event, data) ->
    for sockid of connections
      emit connections[sockid], event, data

  init = ->
    sockjs.on 'connection', (socket) ->

      console.log 'new connection'
      connections.push socket

      socket.on 'data', (e) ->
        e = JSON.parse(e)
        #console.log(e);
        event = e.event
        data = e.data

        switch event
          when 'new user'
            data = JSON.parse(data) if typeof data == 'string'
            rooms[data.room._id] = [] if !rooms[data.room._id]
            f = true
            for i of rooms[data.room._id]
              if rooms[data.room._id][i] == socket.id
                f = false
                break
            rooms[data.room._id].push socket.id if f
            if !users[socket.id]
              users[socket.id] =
                socket: socket
                rooms: [ data.room._id ]
                user: data.user
            else
              users[socket.id].rooms.push data.room._id
            updateUsers data.room._id
            updateRooms()

            Room.findById data.room._id, (err, room) ->
              #if (err) return console.log(err);
              if room then console.log 'User "' + data.user.username + '" joined the room "' + room.name + '".'
              else
                User.findById data.room._id, (err, user) ->
                  #if (err) return console.log(err);
                  if user then console.log 'User "' + data.user.username + '" joined the private chat with "' + user.username + '".' 

          #Update usernames list
          when 'update users' then updateUsers data

          #Returns messages list
          when 'get history'
            getHistory data, (messages) ->
              emit socket, 'history',
                id: data
                data: messages

          when 'get private history'
            if typeof data == 'string' then data = JSON.parse data
            getPrivateHistory data.id1, data.id2, (messages) ->
              emit socket, 'private history',
                from: data.id1
                to: data.id2
                data: messages

          #Send message
          when 'send message'
            if typeof data == 'string' then data = JSON.parse data
            Stats.inc ['messages', 'public']
            msg = 
              text: data.msg
              room: data.roomid
              time: Date.now()
              username: users[socket.id].user.username
            addMessage msg, ->
              emitRoom data.roomid, 'new message', msg
              emitRoom 'listeners', 'new message', msg

          when 'send private message'
            if typeof data == 'string' then data = JSON.parse(data)
            Stats.inc ['messages', 'private']
            msg = 
              text: data.msg
              private: true
              from: users[socket.id].user._id
              to: data.to
              username: users[socket.id].user.username
              time: Date.now()
            addMessage msg, ->
              for i of users
                if users[i].user._id == msg.to
                  emit users[i].socket, 'new private message', msg
              emit socket, 'new private message', msg
              broadcast 'listener event', msg

          when 'clear history'
            clearHistory data, users[socket.id].user._id, ->
              updateHistory data

          when 'get room'
            Room.findById data, (err, room) ->
              #if (err) return console.log(err);
              room = '404' unless room?
              emit socket, 'room', room

          when 'get rooms' then updateRooms()

          when 'delete room'
            if typeof data == 'string' then data = JSON.parse(data)
            Stats.inc ['rooms', 'deleted']
            Room.findById(data.roomid).remove (err) ->
              #if (err) console.log(err);
              updateRooms()
              Message.query N1QL.fromString 'delete from messages where room = "' + data.roomid + '"'
              #if (err) console.log(err);

          when 'admin:delete room'
            Stats.inc ['rooms', 'deleted']
            Room.findById(data).remove ->
              broadcast 'kick', data
              updateRooms()
              Message.query N1QL.fromString 'delete from messages where room = "' + data + '"'

          when 'comment' then console.log data

          when 'get friends' then updateFriends socket, data

          when 'add friend'
            if typeof data == 'string' then data = JSON.parse(data)
            User.findById data.userid, (err, user) ->
              #if (err) return console.log(err);
              user.friends.push data.friendid if user
              user.save (err) ->
                #if (err) console.log(err);
                updateFriends socket, data.userid

          when 'remove friend'
            if typeof data == 'string' then data = JSON.parse(data)
            User.findById data.userid, (err, user) ->
              #if (err) return console.log(err);
              user.friends.splice(user.friends.indexOf(data.friendid), 1) if user
                user.save (err) ->
                  #if (err) return console.log(err);
                  updateFriends socket, data.userid

          when 'get user'
            User.findById data, (err, user) ->
              #if (err) return console.log(err);
              unless user? then user = '404'
              emit socket, 'user', user

          when 'admin:get users'
            if typeof data == 'string' then data = JSON.parse(data)
            getUsers socket, data

          when 'set rank'
            if typeof data == 'string' then data = JSON.parse data
            User.update {_id: data.user._id}, {rank: data.rank}, ->
              getUsers()

          when 'admin:delete user'
            if typeof data == 'string' then data = JSON.parse(data)
            User.findById(data).remove ->
              getUsers socket

          when 'leave room' then leaveRoom socket, data

          when 'admin:get stats'
            Stats.model.findOrCreate {date: data}, (err, today, created) ->
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
              ], (err, all) ->
                emit socket, 'admin:stats', {today: today, all: all[0]}

      #Disconnect
      socket.on 'close', ->
        disconnect socket
        for i of users
          if users[i].socket.id == socket.id
            users.splice i, 1
        for i of connections
          if connections[i].id == socket.id
            connections.splice i, 1

  getUsers = (socket, data = {}) ->
    User.find {}, (err, users) ->
      unless users? then users = '404'
      unless socket?
        broadcast 'admin:users', users
      else
        emit socket, 'admin:users', users

  updateRooms = ->
    Room.find {}, (err, found) ->
      #if (err) return console.log(err);
      for cur of found
        id = found[cur]._id
        arr = []
        for i of rooms[id]
          f = true
          for k of arr
            if users[arr[k]].user._id == users[rooms[id][i]].user._id
              f = false
              break
          if f
            arr.push rooms[id][i]
        found[cur].online = arr.length
      broadcast 'rooms', found
      
  leaveRoom = (socket, id) ->
    if rooms[id]? and rooms[id].length > 0
      len = rooms[id].length
      cur = 0
      while cur < len
        if rooms[id][cur] == socket.id
          rooms[id].splice cur, 1
        else
          ++cur
    if users[socket.id]?
      for cur of users[socket.id].rooms
        if users[socket.id].rooms[cur] == id
          users[socket.id].rooms.splice cur, 1
          break
    updateRooms()
    updateUsers id

  disconnect = (socket) ->
    console.log 'disconnected'
    return if !users[socket.id]?
    len = users[socket.id].rooms.length
    i = 0
    while i < len
      cur = users[socket.id].rooms[0]
      leaveRoom socket, cur
      Room.findById cur, (err, room) ->
        #if (err) return console.log(err);
        if room then console.log('User "' + users[socket.id].user.username + '" disconnected from the room "' + room.name + '".') 
        else
          User.findById cur, (err, user) ->
            #if (err) return console.log(err);
            if user then console.log('User "' + users[socket.id].user.username + '" disconnected from the private chat with "' + user.username + '".') 
      ++i

  updateUsers = (roomid) ->
    roomid = roomid.toString()
    res = []
    for cur of rooms[roomid]
      f = true
      for id of res
        if res[id]._id == users[rooms[roomid][cur]].user._id
          f = false
          break
      res.push users[rooms[roomid][cur]].user if f
    emitRoom roomid, 'users', res

  updateHistory = (roomid) ->
    getHistory roomid, (messages) ->
      emitRoom roomid, 'history',
        id: roomid
        data: messages

  getHistory = (roomid, callback) ->
    Message.query N1QL.fromString('select * from messages where room = "' + roomid + '" order by time'),
    (err, messages) ->
      if messages?
        for message of messages
          messages[message] = messages[message].messages
        callback messages
    
    ###
    Message.find { room: roomid }, null, { sort: 'time' }, (err, messages) ->
      #if (err) return console.log(err);   
        callback messages if messages?
    ###

  getPrivateHistory = (id1, id2, callback) ->
    Message.query N1QL.fromString('select * from messages where (`from` = "' + id1 + '" and `to` = "' + id2 + '") or (`from` = "' + id2 + '" and `to` = "' + id1 + '") order by time'), (err, messages) ->
      if messages?
        for message of messages
          messages[message] = messages[message].messages
        callback messages

    ###
    Message.find(private: true).sort('time').and($or: [
      { $and: [
        { from: id1 }
        { to: id2 }
      ] }
      { $and: [ {
        from: id2
        to: id1
      } ] }
    ]).exec (err, messages) ->
      callback messages if messages?
    ###

  addMessage = (msg, callback) ->
    Message.insert uuid.v4(), msg, (err, res) ->
      callback()

  clearHistory = (roomid, userid, callback) ->
    User.findById userid, (err, user) ->
      #if (err) throw console.log(err);
      rank = user.rank
      Room.findById roomid, (err, room) ->
        #if (err) return console.log(err);
        if room and room.users[user._id]
          rank = Math.max(rank, room.users[user._id])
        return console.log(user.username + ' tried to clear history but had no permission') if rank < 3
        Message.query N1QL.fromString('delete from messages where room = "' + roomid + '"'), (err, res) ->
          console.log 'history cleared'
          callback()

  updateFriends = (socket, userid) ->
    User.findById userid, (err, user) ->
      #if (err) return console.log(err);
      if user
        User.find { _id: $in: user.friends }, (err, friends) ->
          #if (err) return console.log(err);
            emit socket, 'friends', friends if friends?

  {
    init: init
    updateRooms: updateRooms
    autoLogin: -> broadcast 'autoLogin'
    autoLogout: -> broadcast 'autoLogout'
  }