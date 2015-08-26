var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var login = require('./routes/login');
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

app.use('/', routes);
app.use('/login', login);
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
  socket.on('new user', function(data, callback){
    if (!callback) callback = function(){};
    if (usernames.indexOf(data) != -1) callback(false);
    else login(socket, data, callback);
  });

  function login(socket, data, callback)
  {
    if (callback) callback(true);
    socket.username = data;
    console.log('User "' + socket.username + '" joined.');
    if (usernames.indexOf(data) == -1) usernames.push(socket.username);
    updateUsernames();
    socket.broadcast.emit('kick',{
      name: socket.username,
      reason: 'Duplicate login'
    });
  }

  socket.on('update user', function(data, callback){
    login(socket, data, callback);
    console.log('User "' + socket.username + '" re-joined.');
  });

  //Update Usernames
  function updateUsernames()
  {
    io.sockets.emit('usernames', usernames);
  }

  socket.on('update usernames', function(){
    updateUsernames();
  });

  socket.on('get history', function(callback){
    callback(history);
  });

  //Send Message
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

  function logout(socket, data)
  {
    if (!socket.username) return false;
    if (usernames.indexOf(socket.username) != -1) usernames.splice(usernames.indexOf(socket.username), 1);
    updateUsernames();
    return true;
  }
  //Disconnect
  socket.on('disconnect', function(data){
    if (data == 'kicked') return;
    if (!logout(socket, data)) return;
    console.log('User "' + socket.username + '" disconnected.');
  });

  socket.on('logout', function(data){
    if (!logout(socket, data)) return;
    console.log('User "' + socket.username + '" logged out.');
    socket.broadcast.emit('logout', socket.username);
  })

});
module.exports = app;
