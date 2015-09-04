var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var flash = require('connect-flash');
var validator = require('express-validator');
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect('mongodb://kochetov_dd:ms17081981ntv@ds035633.mongolab.com:35633/chatio');

var User = require('./models/user');
var Message = require('./models/message');
var Room = require('./models/room');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user){
    done(err, user);
  });
});

passport.use(new LocalStrategy({
  usernameField: 'login',
  passwordField: 'password'
  },
  function(username, password, done){
    User.findOne({login: username}, function(err, user){
      if (err) return done(err);
      if (user)
        bcrypt.compare(password, user.password, function(err, res){
            if (err) return done(err);
            if (res) return done(null, user);
            return done(null, false, {error: 'Incorrect password!'});
        });
      else return done(null, false, {error: 'Incorrect username!'});
    });
  }
));

var index = require('./routes/index');
var chat = require('./routes/chat');
var rooms = require('./routes/rooms');
var apis = require('./routes/apis');

var app = express();

// view engine setup
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  saveUninitialized: true,
  secret: 'SECRET',
  resave: true
}));
app.use(flash());
app.use(validator());

app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/', apis);
app.use('/chat', chat);
app.use('/rooms', rooms);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(app.get('port'));

//usernames = [];
usersInRoom = {};

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
    updateUsernames();

    console.log('User "' + socket.username + '" joined.');
  });

  //Update usernames list
  socket.on('update usernames', function(){
    updateUsernames(socket.room);
  });

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

  socket.on('get rooms', function(callback){
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
      callback(rooms);
    });
  });

  //Disconnect
  socket.on('disconnect', function(){
    disconnect(socket);
  });

  socket.on('logout', function(){
    disconnect(socket);
  });

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
    console.log('User "' + socket.username + '" disconnected from room "' + socket.room + '".');
  }

});

module.exports = app;
