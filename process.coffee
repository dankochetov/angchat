require 'coffee-script'
express = require 'express'
redis = 
	pub: require('./redis')()
	sub: require('./redis')()

app = express()

initApp = (arr, app)->
	server = app.listen app.get 'port'
	# start socket first, then api, then html
	if 'socket' in arr
		require('./ps/socket')
			server: server
	if 'api' in arr
		app.use '/', require("./ps/api")()
	if 'html' in arr
		app.use '/', require("./ps/html")()

if not process.argv[2]?
	module.exports = (opts)->
		app.set 'port', opts.port
		initApp opts.arr, app
else
	app.set 'port', process.argv[2]
	initApp process.argv[3..], app
	module.exports = app

process.on 'exit', ->
	redis.pub.publish 'client', JSON.stringify
		event: 'exit'
		ps: 'api'
		port: app.get 'port'

process.on 'uncaughtException', (err)->
	redis.pub.publish 'client', JSON.stringify
		event: 'error',
		error: err.stack