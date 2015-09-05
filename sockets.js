var User = require('./models/user');
var Message = require('./models/message');
var Room = require('./models/room');

module.exports = function(io){

  var usersInRoom = {};

  function init()
  {
    io.sockets.on('connection', function(socket){
      //When user logins or refreshes the pages
      socket.on('new user', function(data){
        socket.join(data.room);
        socket.room = data.room;
        socket.username = data.username;
        var sockets = io.sockets.connected;
        var f = 0;
        for (var cur in sockets)
        {
          cur = sockets[cur];
          if (cur.username == data.username && cur.room == data.room) ++f;
        }
        if (f == 1)
        {
          if (!usersInRoom[socket.room]) usersInRoom[socket.room] = 1;
           else ++usersInRoom[socket.room];
        }
        //if (usernames.indexOf(socket.username) == -1) usernames.push(socket.username);
        updateUsernames(socket.room);
        updateRooms();

        Room.findById(socket.room, function(err, room){
          if (err) return next(err);
          console.log('User "' + socket.username + '" joined the room "' + room.name + '".');
        });
        
      });

      //Update usernames list
      socket.on('update usernames', function(){
        updateUsernames(socket.room);
      });

      //Returns messages list
      socket.on('get history', function(){
        getHistory(socket.room, function(messages){
          socket.emit('history', messages);
        });
      });

      //Send message
      socket.on('send message', function(text){
        var msg = {
          text: text,
          room: socket.room,
          time: Date.now(),
          username: socket.username
        };
        addMessage(msg, function(){
          io.to(socket.room).emit('new message', msg);
        });
      });

      socket.on('clear history', function(callback){
        clearHistory(socket.room, socket.username, function(){
          updateHistory(socket.room);
          callback();
        });
      });

      socket.on('get rooms', function(){
        updateRooms();
      });

      socket.on('delete room', function(id){
        if (!usersInRoom[id] || usersInRoom[id] == 0)
          Room.findById(id)
          .remove(function(err){
            if (err) console.log(err);
            updateRooms();
          });
      });

      //Disconnect
      socket.on('disconnect', function(){
        disconnect(socket);
      });

    });
  }

  function updateRooms(my, login, socket)
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
    if (!socket.username) return;
    var f = 0;
    var sockets = io.sockets.connected;
    for (var cur in sockets)
      if (sockets[cur].room == socket.room && sockets[cur].username == socket.username)
        ++f;
    if (f > 0) return;
    --usersInRoom[socket.room];
    updateUsernames(socket.room);
    updateRooms();

    Room.findById(socket.room, function(err, room){
      if (err) return next(err);
      console.log('User "' + socket.username + '" disconnected from the room "' + room.name + '".');
    });
  }

  function updateUsernames(room)
  {
    var sockets = io.sockets.connected;
    var usernames = [];
    for (var cur in sockets)
    {
      cur = sockets[cur];
      if (cur.room != room) continue;
      if (usernames.indexOf(cur.username) == -1) usernames.push(cur.username);
    }
    io.to(room).emit('usernames', usernames);
  }

  function updateHistory(room)
  {
    getHistory(room, function(messages){
      io.to(room).emit('history', messages);
    });
  }

  function getHistory(room, callback)
  {
    Message.find({room: room}, function(err, messages){
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

  function clearHistory(room, username, callback)
  {
    User.findOne({username: username}, function(err, user){
      if (err) throw console.log(err);
      if (user.rank < 3) return console.log(username + ' tried to clear history but had no permission');
      Message.remove({room: room}, function(err){
        if (err) return console.log(err);
        console.log('history cleared');
        callback();
      });
    });
  }

  return {
    init: init,
    updateRooms: updateRooms,
    logout: logout,
    login: login
  }

}