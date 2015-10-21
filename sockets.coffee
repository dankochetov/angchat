###
new user 0
update users 1
get history 2
history 3
get private history 4
private history 5
send message 6
new message 7
send private message 8
new private message 9
listener event 10
clear history 11
get room 12
room 13
get rooms 14
delete room 15
admin:delete room 16
kick 17
comment 18
get friends 19
add friend 20
remove friend 21
get user 22
user 23
admin:get users 24
set rank 25
admin:delete user 26
leave room 27
admin:get stats 28
admin:stats 29
admin:users 30
rooms 31
users 32
friends 33
autoLogin 34
autoLogout 35
###

User = require './models/user'
uuid = require 'uuid'
couchbase = require 'couchbase'
Message = (new couchbase.Cluster('couchbase://81.181.8.153')).openBucket 'test1', 'kochetov'
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
        e = JSON.parse e
        event = e.event
        data = e.data

        switch event
          when '0'
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
          when '1' then updateUsers data

          #Returns messages list
          when '2'
            if typeof data == 'string' then data = JSON.parse data
            getHistory data, (messages) ->
              emit socket, '3',
                id: data.roomid
                data: messages

          when '4'
            if typeof data == 'string' then data = JSON.parse data
            getPrivateHistory data.id1, data.id2, data.skip, (messages) ->
              emit socket, '5',
                from: data.id1
                to: data.id2
                data: messages

          #Send message
          when '6'
            if typeof data == 'string' then data = JSON.parse data
            Stats.inc ['messages', 'public']
            msg = 
              text: data.msg
              room: data.roomid
              time: Date.now()
              username: users[socket.id].user.username
            addMessage msg, ->
              emitRoom data.roomid, '7', msg
              emitRoom 'listeners', '7', msg

          when '8'
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
                  emit users[i].socket, '9', msg
              emit socket, '9', msg
              broadcast '10', msg

          when '11'
            clearHistory data, users[socket.id].user._id, ->
              updateHistory data

          when '12'
            Room.findById data, (err, room) ->
              #if (err) return console.log(err);
              room = '404' unless room?
              emit socket, '13', room

          when '14' then updateRooms()

          when '15'
            if typeof data == 'string' then data = JSON.parse(data)
            Stats.inc ['rooms', 'deleted']
            Room.findById(data.roomid).remove (err) ->
              #if (err) console.log(err);
              updateRooms()
              Message.query N1QL.fromString 'delete from `test1` where room = "' + data.roomid + '"'
              #if (err) console.log(err);

          when '16'
            Stats.inc ['rooms', 'deleted']
            Room.findById(data).remove ->
              broadcast '17', data
              updateRooms()
              Message.query N1QL.fromString 'delete from `test1` where room = "' + data + '"'

          when '18' then console.log data

          when '19' then updateFriends socket, data

          when '20'
            if typeof data == 'string' then data = JSON.parse(data)
            User.findById data.userid, (err, user) ->
              #if (err) return console.log(err);
              user.friends.push data.friendid if user
              user.save (err) ->
                #if (err) console.log(err);
                updateFriends socket, data.userid

          when '21'
            if typeof data == 'string' then data = JSON.parse(data)
            User.findById data.userid, (err, user) ->
              #if (err) return console.log(err);
              user.friends.splice(user.friends.indexOf(data.friendid), 1) if user
                user.save (err) ->
                  #if (err) return console.log(err);
                  updateFriends socket, data.userid

          when '22'
            User.findById data, (err, user) ->
              #if (err) return console.log(err);
              unless user? then user = '404'
              emit socket, '23', user

          when '24'
            if typeof data == 'string' then data = JSON.parse(data)
            getUsers socket, data

          when '25'
            if typeof data == 'string' then data = JSON.parse data
            User.update {_id: data.user._id}, {rank: data.rank}, ->
              getUsers()

          when '26'
            if typeof data == 'string' then data = JSON.parse(data)
            User.findById(data).remove ->
              getUsers socket

          when '27' then leaveRoom socket, data

          when '28'
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
                emit socket, '29', {today: today, all: all[0]}

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
        broadcast '30', users
      else
        emit socket, '30', users

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
      broadcast '31', found
      
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
        if room then console.log "User '#{users[socket.id].user.username}' disconnected from the room '#{room.name}'."
        else
          User.findById cur, (err, user) ->
            #if (err) return console.log(err);
            if user then console.log "User '#{users[socket.id].user.username}' disconnected from the private chat with '#{user.username}'."
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
      if f then res.push users[rooms[roomid][cur]].user
    emitRoom roomid, '32', res

  updateHistory = (roomid) ->
    getHistory roomid, (messages) ->
      emitRoom roomid, '3',
        id: roomid
        data: messages

  getHistory = (data, callback) ->
    data.skip ?= 0
    condition = "`room` = '#{data.roomid}'"
    query = "select * from `test1` where #{condition} order by `time` desc limit 50 offset #{data.skip}"
    Message.query N1QL.fromString(query), (err, messages) ->
      Message.query N1QL.fromString("select count(*) as `count` from `test1` where #{condition}"),
      (err, count) ->
        if err then console.log err
        if not messages? then return
        for id, message of messages
          messages[id] = message.test1
        callback {messages: messages.reverse(), count: count[0].count}

  getPrivateHistory = (id1, id2, skip = 0, callback) ->
    condition = "(`from` = '#{id1}' and `to` = '#{id2}') or (`from` = '#{id2}' and `to` = '#{id1}')"
    query = "select * from `test1` where #{condition} order by `time` desc limit 50 offset #{skip}"
    Message.query N1QL.fromString(query), (err, messages) ->
      if err then console.log err
      Message.query N1QL.fromString("select count(*) as `count` from `test1` where #{condition}"),
      (err, count) ->
        if err then console.log err
        if not messages? then return
        for id, message of messages
          messages[id] = message.test1
        callback {messages: messages.reverse(), count: count[0].count}

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
          rank = Math.max rank, room.users[user._id]
        if rank < 3 then return console.log "#{user.username} tried to clear history but had no permission"
        Message.query N1QL.fromString("delete from `test1` where room = '#{roomid}'"), (err, res) ->
          console.log 'history cleared'
          callback()

  updateFriends = (socket, userid) ->
    User.findById userid, (err, user) ->
      if err then throw err
      if user
        User.find { _id: $in: user.friends }, (err, friends) ->
          if err then throw err
          if friends? then emit socket, '33', friends

  {
    init: init
    updateRooms: updateRooms
    autoLogin: -> broadcast '34'
    autoLogout: -> broadcast '35'
  }