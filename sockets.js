var User = require('./models/user');
var Message = require('./models/message');
var Room = require('./models/room');

module.exports = function(sockjs, connections){

  var users = [];
  var rooms = [];

  function emit(socket, event, data)
  {
    var res = JSON.stringify({
      event: event,
      data: data
    });
    //console.log(event, data);
    socket.write(res);
  }

  function emitRoom(room, event, data)
  {
    for (var id in rooms[room])
      emit(users[rooms[room][id]].socket, event, data);
  }

  function broadcast(event, data)
  {
    for (var sockid in connections)
      emit(connections[sockid], event, data);
  }

  function init()
  {
    sockjs.on('connection', function(socket){

      console.log('new connection');
      connections.push(socket);

      socket.on('data', function(e){
        e = JSON.parse(e);
        //console.log(e);
        if (e.event == 'get history' || e.event == 'get room') console.log(e);
        var event = e.event;
        var data = e.data;

        switch (event)
        {

          case 'new user':
            if (typeof data == 'string') data = JSON.parse(data);
            if (!rooms[data.room._id]) rooms[data.room._id] = [];
            rooms[data.room._id].push(socket.id);
            if (!users[socket.id])
              users[socket.id] = {
                socket: socket,
                rooms: [data.room._id],
                user: data.user
              };
            else users[socket.id].rooms.push(data.room._id);
            updateUsers(data.room._id);
            updateRooms();

            Room.findById(data.room._id, function(err, room){
              //if (err) return console.log(err);
              if (room) console.log('User "' + data.user.username + '" joined the room "' + room.name + '".');
              else User.findById(data.room._id, function(err, user){
                //if (err) return console.log(err);
                if (user) console.log('User "' + data.user.username + '" joined the private chat with "' + user.username + '".');
              });
            });
          break;

          //Update usernames list
          case 'update users':
            updateUsers(data);
          break;

          //Returns messages list
          case 'get history':
            getHistory(data, function(messages){
              emit(socket, 'history', {id: data, data: messages});
            });
          break;

          case 'get private history':
            if (typeof data == 'string') data = JSON.parse(data);
            getPrivateHistory(data.id1, data.id2, function(messages){
              emit(socket, 'private history', {from: data.id1, to: data.id2, data: messages});
            });
          break;

          //Send message
          case 'send message':
            if (typeof data == 'string') data = JSON.parse(data);
            var msg = {
              text: data.msg,
              room: data.roomid,
              time: Date.now(),
              username: users[socket.id].user.username
            };
            addMessage(msg, function(){
              emitRoom(data.roomid, 'new message', msg);
              emitRoom('listeners', 'new message', msg);
            });
          break;

          case 'send private message':
            if (typeof data == 'string') data = JSON.parse(data);
            var msg = {
              text: data.msg,
              private: true,
              from: users[socket.id].user._id,
              to: data.to,
              username: users[socket.id].user.username,
              time: Date.now()
            };
            addMessage(msg, function(){
              for (var i in users)
                if (users[i].user._id == msg.to)
                {
                  emit(users[i].socket, 'new private message', msg);
                }
              emit(socket, 'new private message', msg);
              broadcast('listener event', msg);
            });
          break;

          case 'clear history':
            clearHistory(data, users[socket.id].user._id, function(){
              updateHistory(data);
            });
          break;

          case 'get room':
            Room.findById(data, function(err, room){
              console.log('room: ', room);
              //if (err) return console.log(err);
              if (!room) room = '404';
              emit(socket, 'room', room);
            });
          break;

          case 'get rooms':
            updateRooms(data);
          break;

          case 'delete room':
            Room.findById(data).remove(function(err){
              //if (err) console.log(err);
              updateRooms(data);
            });
            Message.find({room: data}).remove(function(err){
              //if (err) console.log(err);
            });
          break;

          case 'comment':
            console.log(data);
          break;

          case 'get friends':
            updateFriends(socket, data);
          break;

          case 'add friend':
            if (typeof data == 'string') data = JSON.parse(data);
            User.findById(data.userid, function(err, user){
              //if (err) return console.log(err);
              if (user)
              {
                user.friends.push(data.friendid);
                user.save(function(err){
                  //if (err) console.log(err);
                  updateFriends(socket, data.userid);
                });
              }
            });
          break;

          case 'remove friend':
            if (typeof data == 'string') data = JSON.parse(data);
            User.findById(data.userid, function(err, user){
              //if (err) return console.log(err);
              if (user)
              {
                user.friends.splice(user.friends.indexOf(data.friendid), 1);
                user.save(function(err){
                  //if (err) return console.log(err);
                  updateFriends(socket, data.userid);
                });
              }
            });
          break;

          case 'get user':
            User.findById(data, function(err, user){
              //if (err) return console.log(err);
              if (!user) user = '404';
              emit(socket, 'user', user);
            });
          break;

          case 'leave room':
            leaveRoom(socket, data);
          break;
        }

      });

      //Disconnect
      socket.on('close', function(){
        disconnect(socket);
        for (var i in users)
          if (users[i].socket.id == socket.id) users.splice(i, 1);
        for (var i in connections)
          if (connections[i].id == socket.id) connections.splice(i, 1);
      });

    });
  }
  

  function updateRooms(data)
  {
    var search;
    if (data) search = {owner: data};
    else search = {};
    Room.find(search, function(err, found){
      //if (err) return console.log(err);
      for (var cur in found)
      {
        var id = found[cur]._id;
        var arr = [];
        for (var i in rooms[id])
        {
          var f = true;
          for (var k in arr)
            if (users[arr[k]].user._id == users[rooms[id][i]].user._id)
            {
              f = false;
              break;
            }
          if (f) arr.push(rooms[id][i]);
        }
        found[cur].online = arr.length;
      }
      broadcast('rooms', found);
    });
  }

  function leaveRoom(socket, id)
  {
    if (rooms[id] && rooms[id].length > 0)
    {
      var len = rooms[id].length;
      for (var cur = 0; cur < len; ++cur)
        if (rooms[id][cur] == socket.id)
        {
          rooms[id].splice(cur, 1);
          --cur;
        }
    }
    if (users[socket.id])
      for (var cur in users[socket.id].rooms)
        if (users[socket.id].rooms[cur] == id)
        {
          users[socket.id].rooms.splice(cur, 1);
          break;
        }
     updateRooms();
     updateUsers(id);
  }

  function disconnect(socket)
  {
    console.log('disconnected');
    if (!users[socket.id]) return;
    var len = users[socket.id].rooms.length;
    for (var i = 0; i < len; ++i)
    {
      var cur = users[socket.id].rooms[0];
      leaveRoom(socket, cur);
      
      Room.findById(cur, function(err, room){
        //if (err) return console.log(err);
        if (room) console.log('User "' + users[socket.id].user.username + '" disconnected from the room "' + room.name + '".');
        else User.findById(cur, function(err, user){
          //if (err) return console.log(err);
          if (user) console.log('User "' + users[socket.id].user.username + '" disconnected from the private chat with "' + user.username + '".');
        });
      });
    }
  }

  function updateUsers(roomid)
  {
    roomid = roomid.toString();
    var res = [];
    for (var cur in rooms[roomid])
    {
      var f = true;
      for (var id in res)
        if (res[id]._id == users[rooms[roomid][cur]].user._id)
        {
          f = false;
          break;
        }
      if (f) res.push(users[rooms[roomid][cur]].user);
    }
    emitRoom(roomid, 'users', res);
  }

  function updateHistory(roomid)
  {
    getHistory(roomid, function(messages){
      emitRoom(roomid, 'history', {id: roomid, data: messages});
    });
  }

  function getHistory(roomid, callback)
  {
    Message.find({room: roomid}, null, {sort: 'time'}, function(err, messages){
      console.log(roomid, messages);
      //if (err) return console.log(err);
      if (messages) callback(messages);
    });
  }

  function getPrivateHistory(id1, id2, callback)
  {
    Message.find({private: true}).sort('time').and({$or: [{$and: [{from: id1}, {to: id2}]}, {$and: [{from: id2, to: id1}]}]}).exec(function(err, messages){
      if (messages) callback(messages);
    });
  }

  function addMessage(msg, callback)
  {
    var message = new Message(msg);
    message.save(function(err){
      //if (err) return console.log(err);
      callback();
    });
  }

  function clearHistory(roomid, userid, callback)
  {
    User.findById(userid, function(err, user){
      //if (err) throw console.log(err);
      var rank = user.rank;
      Room.findById(roomid, function(err, room){
        //if (err) return console.log(err);
        if (room && room.users[user._id]) rank = Math.max(rank, room.users[user._id]);
        if (rank < 3) return console.log(user.username + ' tried to clear history but had no permission');
        Message.remove({room: roomid}, function(err){
          //if (err) return console.log(err);
          console.log('history cleared');
          callback();
        });
      });
    });
  }

  function updateFriends(socket, userid){
    User.findById(userid, function(err, user){
      //if (err) return console.log(err);
      if (user)
        User.find({_id: {$in: user.friends}}, function(err, friends){
          //if (err) return console.log(err);
          if (friends) emit(socket, 'friends', friends);
        });
    });
  }

  return {
    init: init,
    updateRooms: updateRooms,
    autoLogin: function(){
      broadcast('autoLogin');
    },
    autoLogout: function(){
      broadcast('autoLogout');
    }
  }

}