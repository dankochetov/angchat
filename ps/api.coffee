module.exports = ->
	require 'coffee-script'
	express = require 'express'
	http = require 'http'
	redis =
		pub: require('../redis')()
		sub: require('../redis')()

	app = express()
	app.set 'port', process.env.PORT or parseInt process.argv[2]

	require('../console')
		redis: redis.pub
		ps: 'api'
		port: app.get 'port'

	app.use (req, res, next)->
	  res.header 'Access-Control-Allow-Origin', '*'
	  res.header 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'
	  next()

	getuser = require process.cwd() + '/api/getuser'
	getsocketport = require process.cwd() + '/api/getsocketport'

	app.use '/api/getuser', getuser
	app.use '/api/getsocketport', getsocketport

	redis.sub.subscribe 'server'

	redis.sub.on 'message', (ch, data = '{}')->
		switch ch
			when 'server'
				data = JSON.parse data
				switch data.event
					when 'exit' then process.exit 0		

	app