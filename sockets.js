var User = require('./models/user');
var Message = require('./models/message');
var Room = require('./models/room');
var Promise = require('promise');

module.exports = function(io){

  function init()
  {
    io.sockets.on('connection', function(socket){
      console.log('new connection');
      //When user logins or refreshes the pages
      socket.on('new user', function(data){
        socket.join(data.room._id);
        socket.room = data.room;
        socket.user = data.user;

        updateUsers(socket.room._id);
        updateRooms();

        Room.findById(socket.room._id, function(err, room){
          if (err) return console.log(err);
          if (room) console.log('User "' + socket.user.username + '" joined the room "' + room.name + '".');
          else User.findById(socket.room._id, function(err, user){
            if (err) return console.log(err);
            if (user) console.log('User "' + socket.user.username + '" joined the private chat with "' + user.username + '".');
          });
        });
        
      });

      socket.on('register listener', function(){
        socket.join('listeners');
      });

      //Update usernames list
      socket.on('update users', function(){
        updateUsers(socket.room._id);
        console.log('update users');
      });

      //Returns messages list
      socket.on('get history', function(){
        getHistory(socket.room._id, function(messages){
          socket.emit('history', messages);
        });
      });

      socket.on('get private history', function(data){
        getPrivateHistory(data.id1, data.id2, function(messages){
          socket.emit('private history', messages);
        });
      });

      //Send message
      socket.on('send message', function(text){
        var msg = {
          text: text,
          room: socket.room._id,
          time: Date.now(),
          username: socket.user.username
        };
        addMessage(msg, function(){
          io.to(socket.room._id).emit('new message', msg);
        });
      });

      socket.on('send private message', function(text){
        var msg = {
          text: text,
          private: true,
          from: socket.user._id,
          to: socket.room._id,
          username: socket.user.username,
          time: Date.now()
        };
        addMessage(msg, function(){
          var sockets = io.sockets.connected;
          for(var cur in sockets)
          {
            cur = sockets[cur];
            if (!cur.user) continue;
            if (cur.user._id == socket.room._id)
            {
              io.to(cur.id).emit('new private message', msg);
              break;
            }
          }
          socket.emit('new private message', msg);
          io.to('listeners').emit('new private message', msg);
        });
      });

      socket.on('clear history', function(callback){
        clearHistory(socket.room._id, socket.user._id, function(){
          updateHistory(socket.room._id);
          callback();
        });
      });

      socket.on('get rooms', function(){
        updateRooms();
      });

      socket.on('delete room', function(id){
        Room.findById(id).remove(function(err){
          if (err) console.log(err);
          updateRooms();
        });
        Message.find({room: id}).remove(function(err){
          if (err) console.log(err);
        });
      });

      socket.on('comment', function(data){
        console.log(data);
      });

      socket.on('get friends', function(userid){
        updateFriends(socket, userid);
      });

      socket.on('add friend', function(data){
        User.findById(data.userid, function(err, user){
          if (err) return console.log(err);
          if (user)
          {
            user.friends.push(data.friendid);
            user.save(function(err){
              if (err) console.log(err);
              updateFriends(socket, data.userid);
            });
          }
        });
      });

      socket.on('remove friend', function(data){
        User.findById(data.userid, function(err, user){
          if (err) return console.log(err);
          if (user)
          {
            user.friends.splice(user.friends.indexOf(data.friendid), 1);
            user.save(function(err){
              if (err) return console.log(err);
              updateFriends(socket, data.userid);
            });
          }
        });
      });

      socket.on('get user', function(id){
        User.findById(id, function(err, user){
          if (err) return console.log(err);
          if (user) socket.emit('user', user);
        });
      });

      //Disconnect
      socket.on('disconnect', function(){
        console.log('disconnected');
        disconnect(socket);
      });

    });
  }

  function socketsInRoom(roomid)
  {
    roomid = roomid.toString();
    var sockets = io.nsps['/'].adapter.rooms[roomid];
    var res = [];
    for (var cur in sockets)
    {
      var f = true;
      for(var user in res)
        if (res[user].user._id == io.sockets.connected[cur].user._id)
        {
          f = false;
          break;
        }
      if (f) res.push(io.sockets.connected[cur]);
    }
    return res;
  }

  function updateRooms()
  {
    Room.find({}, function(err, rooms){
      if (err) return console.log(err);
      for (var roomid in rooms)
      {
        var room = rooms[roomid];
        var sockets = socketsInRoom(room._id);
        rooms[roomid].online = sockets?sockets.length:0;
      }
      io.emit('rooms', rooms);
    });
  }

  function logout(login)
  {
    io.emit('logout', login);
  }

  function login(login)
  {
    io.emit('login', login);
  }

  function disconnect(socket)
  {
    if (!socket.user) return;
    console.log('disconnect');
    updateUsers(socket.room._id);
    updateRooms();

    Room.findById(socket.room._id, function(err, room){
      if (err) return console.log(err);
      if (room) console.log('User "' + socket.user.username + '" disconnected from the room "' + room.name + '".');
      else User.findById(socket.room._id, function(err, user){
        if (err) return console.log(err);
        if (user) console.log('User "' + socket.user.username + '" disconnected from the private chat with "' + user.username + '".');
      });
    });
  }

  function updateUsers(id)
  {
    id = id.toString();
    var sockets = socketsInRoom(id);
    var users = [];
    for (var cur in sockets) users.push(sockets[cur].user);
    io.to(id).emit('users', users);
  }

  function updateHistory(roomid)
  {
    getHistory(roomid, function(messages){
      io.to(roomid).emit('history', messages);
    });
  }

  function getHistory(roomid, callback)
  {
    Message.find({room: roomid}, function(err, messages){
      if (err) return console.log(err);
      if (messages) callback(messages);
    });
  }

  function getPrivateHistory(id1, id2, callback)
  {
    Message.find({private: true}).and({$or: [{$and: [{from: id1}, {to: id2}]}, {$and: [{from: id2, to: id1}]}]}).exec(function(err, messages){
      if (messages) callback(messages);
    });
  }

  function addMessage(msg, callback)
  {
    var message = new Message(msg);
    message.save(function(err){
      if (err) return console.log(err);
      callback();
    });
  }

  function clearHistory(roomid, userid, callback)
  {
    User.findById(userid, function(err, user){
      if (err) throw console.log(err);
      var rank = user.rank;
      Room.findById(roomid, function(err, room){
        if (err) return console.log(err);
        if (room && room.users[user._id]) rank = Math.max(rank, room.users[user._id]);
        if (rank < 3) return console.log(user.username + ' tried to clear history but had no permission');
        Message.remove({room: roomid}, function(err){
          if (err) return console.log(err);
          console.log('history cleared');
          callback();
        });
      });
    });
  }

  function updateFriends(socket, userid){
    User.findById(userid, function(err, user){
      if (err) return console.log(err);
      if (user)
      {
        User.find({_id: {$in: user.friends}}, function(err, friends){
          if (err) return console.log(err);
          if (friends) socket.emit('friends', friends);
        });
      }
    });
  }

  return {
    init: init,
    updateRooms: updateRooms,
    logout: logout,
    login: login
  }

}