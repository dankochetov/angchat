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

app.locals.io = io;

var sockets = require('./sockets')(io);
sockets.init();

module.exports = app;
