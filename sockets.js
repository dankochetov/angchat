var User = require('./models/user');
var Message = require('./models/message');
var Room = require('./models/room');
var Promise = require('promise');

module.exports = function(io){

  var usersInRoom = {};

  function init()
  {
    io.sockets.on('connection', function(socket){
      console.log('new connection');
      //When user logins or refreshes the pages
      socket.on('new user', function(data){
        socket.join(data.room._id);
        socket.room = data.room;
        socket.user = data.user;
        var sockets = io.sockets.connected;
        var f = 0;
        for (var cur in sockets)
        {
          cur = sockets[cur];
          if (!cur.user) continue;
          if (cur.user._id == data.user._id && cur.room._id == data.room._id) ++f;
        }
        if (f == 1)
        {
          if (!usersInRoom[socket.room]) usersInRoom[socket.room._id] = 1;
           else ++usersInRoom[socket.room._id];
        }
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

      //Update usernames list
      socket.on('update usernames', function(){
        updateUsers(socket.room._id);
      });

      //Returns messages list
      socket.on('get history', function(){
        getHistory(socket.room._id, function(messages){
          socket.emit('history', messages);
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
          room: socket.room._id,
          time: Date.now(),
          username: socket.user.username
        };
        addMessage(msg, function(){
          var sockets = io.sockets.connected;
          for(var cur in sockets)
          {
            cur = sockets[cur];
            if (!cur.user) continue;
            if (cur.user._id == socket.room._id)
            {
              io.to(cur.id).emit('new message', msg);
              return;
            }
          }
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
        if (!usersInRoom[id] || usersInRoom[id] == 0)
        {
          Room.findById(id).remove(function(err){
            if (err) console.log(err);
            updateRooms();
          });
          Message.find({room: id}).remove(function(err){
            if (err) console.log(err);
          });
        }
      });

      socket.on('comment', function(data){
        console.log(data);
      });

      socket.on('get friends', function(userid){
        updateFriends(socket, userid);
      });

      socket.on('add friend', function(data){
        console.log('user: ' + data.userid + ' friend: ' + friend.id);
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

  function updateRooms()
  {
    Room.find({}, function(err, rooms){
      if (err) return console.log(err);
      var _rooms = [];
      for (var room in rooms)
      {
        room = rooms[room];
        room['online'] = usersInRoom[room._id] ? usersInRoom[room._id] : 0;
        _rooms.push(room);
      }
      rooms = _rooms;
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
    var f = 0;
    var sockets = io.sockets.connected;
    for (var cur in sockets)
    {
      if (!sockets[cur].user) continue;
      if (sockets[cur].room._id == socket.room._id && sockets[cur].user._id == socket.user._id)
        ++f;
    }
    if (f > 0) return;
    --usersInRoom[socket.room._id];
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
    var sockets = io.sockets.connected;
    var users = [];
    for (var cur in sockets)
    {
      cur = sockets[cur];
      if (!cur.user || cur.room._id != id) continue;
      if (users.indexOf(cur.user) == -1) users.push(cur.user);
    }
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
      callback(messages);
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