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

var User = require('./models/user');

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


var root = require('./routes/root');
var index = require('./routes/index');
var chat = require('./routes/chat');

var app = express();

// view engine setup
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
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

app.use('/', root);
app.use('/index', index);
app.use('/chat', chat);

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

usernames = [];
history = [];

io.sockets.on('connection', function(socket){

  console.log('new connection');

  //When user logins or refreshes the pages
  socket.on('new user', function(data){
    if (!data.callback) data.callback = function(){};
    if (usernames.indexOf(data.username) != -1) data.callback(false);
    else
    {
      socket.username = data.username;
      if (usernames.indexOf(data.username) == -1) usernames.push(socket.username);
      updateUsernames();

      //Drop connection on other pages where this user is logged
      socket.broadcast.emit('kick', {
        name: socket.username,
        reason: 'Duplicate login'
      });
      
      data.callback(true);
      console.log('User "' + socket.username + '" joined.');
    }
  });

  //Update usernames list
  socket.on('update usernames', function(){
    updateUsernames();
  });

  function updateUsernames()
  {
    io.sockets.emit('usernames', usernames);
  }

  //Returns messages list
  socket.on('get history', function(callback){
    callback(history);
  });

  //Send message
  socket.on('send message', function(data){
    history.push({
      msg: data,
      type: 'message',
      user: socket.username
    });
    if (history.length > 50) history.splice(0, 1);
    io.sockets.emit('new message', {
      msg: data,
      user: socket.username
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
      if (sockets[cur].username == socket.username)
        ++f;
    if (f > 0) return;
    if (usernames.indexOf(socket.username) != -1) usernames.splice(usernames.indexOf(socket.username), 1);
    updateUsernames();
    console.log('User "' + socket.username + '" disconnected.');
  }

});
module.exports = app;
