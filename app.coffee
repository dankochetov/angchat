express = require('express')
path = require('path')
favicon = require('serve-favicon')
logger = require('morgan')
cookieParser = require('cookie-parser')
bodyParser = require('body-parser')
session = require('express-session')
passport = require('passport')
LocalStrategy = require('passport-local').Strategy
FacebookStrategy = require('passport-facebook').Strategy
VkontakteStrategy = require('passport-vkontakte').Strategy
bcrypt = require('bcrypt-nodejs')
flash = require('connect-flash')
validator = require('express-validator')
mongo = require('mongodb')
mongoose = require('mongoose')
mongoose.connect 'mongodb://kochetov_dd:ms17081981ntv@ds035633.mongolab.com:35633/chatio'
#mongoose.connect('mongodb://127.0.0.1/chatio');

User = require('./models/user')
Message = require('./models/message')
Room = require('./models/room')

passport.serializeUser (user, done) ->
	done null, user.id

passport.deserializeUser (id, done) ->
	User.findById id, (err, user) ->
		done err, user

passport.use new LocalStrategy({
	usernameField: 'login'
	passwordField: 'password'
}, (username, password, done) ->
	User.findOne {login: username}, (err, user) ->
		if err
			return done(err)
		if user
			bcrypt.compare password, user.password, (err, res) ->
				if err
					return done(err)
				if res
					return done(null, user)
				done null, false, error: 'Incorrect password!'
		else
			return done(null, false, error: 'Incorrect username!')
)

passport.use new FacebookStrategy({
	clientID: '480228708804223'
	clientSecret: '3aa575d92af323a2f766e95a07762f07'
	callbackURL: '/signin/fb/cb'
	enableProof: false
	profileFields: ['displayName']
}, (accessToken, refreshToken, profile, done) ->
	User.findOrCreate {
		login: profile.id
		username: profile.displayName
		facebook: true
	}, (err, user, created) ->
		done err, user
)

passport.use new VkontakteStrategy({
	clientID: '5062854'
	clientSecret: 'us5ZrVTD8BUP1vL6TZ4Z'
	callbackURL: '/signin/vk/cb'
	apiVersion: '5.37'
}, (accessToken, refreshToken, profile, done) ->
	User.findOrCreate {
		login: profile.id
		username: profile.displayName
		vkontakte: true
	}, (err, user, created) ->
		done err, user
)

index = require('./routes/index')
myrooms = require('./routes/myrooms')
chat = require('./routes/chat')
getuser = require('./routes/api/getuser')

app = express()

# view engine setup
app.set 'port', process.env.PORT or 3000
app.set 'views', path.join(__dirname, 'views')
app.set 'view engine', 'jade'

# uncomment after placing your favicon in /public
#app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
#app.use(logger('dev'));
app.use bodyParser.json()
app.use bodyParser.urlencoded(extended: false)
app.use cookieParser()
app.use express.static(path.join(__dirname, 'public'))
app.use session(
	saveUninitialized: true
	secret: 'SECRET'
	resave: true)
app.use flash()
app.use validator()

app.use passport.initialize()
app.use passport.session()

app.use '/', index
app.use '/chat', chat
app.use '/myrooms', myrooms
app.use '/', getuser

app.get '/test', (req, res, next) ->
	res.render 'test'

# catch 404 and forward to error handler
app.use (req, res, next) ->
	err = new Error('Not Found')
	err.status = 404
	next err

# error handlers
# development error handler
# will print stacktrace
if app.get('env') == 'development'
	app.use (err, req, res, next) ->
		console.log 'ERROR AT ' + req.originalUrl
		res.status err.status or 500
		res.render 'error',
			message: err.message
			error: err

# production error handler
# no stacktraces leaked to user
app.use (err, req, res, next) ->
	res.status err.status or 500
	res.render 'error',
		message: err.message
		error: {}

server = require('http').createServer(app).listen app.get 'port'
sockjs = require('sockjs').createServer sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js'
connections = []
sockjs.installHandlers server, prefix: '/sockjs'

app.locals.sockjs = sockjs
app.locals.connections = connections

sockets = require('./sockets')(sockjs, connections)
sockets.init()

module.exports = app