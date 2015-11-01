express = require 'express'
http = require 'http'
redis =
	pub: require('../redis')()
	sub: require('../redis')()

app = express()
app.set 'port', process.env.PORT or parseInt process.argv[2]
# return new port to main app
redis.pub.publish 'port', JSON.stringify
	ps: 'api'
	old: process.argv[2]
	new: app.get 'port'

require('../console')
	redis: redis.pub
	ps: 'api'
	port: app.get 'port'

app.use (req, res, next)->
  res.header 'Access-Control-Allow-Origin', '*'
  res.header 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'
  next()

redis.sub.subscribe 'init'
redis.sub.subscribe 'exit'

redis.sub.on 'message', (ch, data = '{}')->
	data = JSON.parse data
	switch ch

		when 'init'
			getuser = require '../api/getuser'
			getsocketport = require '../api/getsocketport'

			app.use '/api/getuser', getuser
			app.use '/api/getsocketport', getsocketport

			server = http.createServer app
			server.listen app.get 'port'

		when 'exit' then process.exit 0
	