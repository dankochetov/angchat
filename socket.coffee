ip = require 'ip'
request = require 'request'
jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'
SockJS = require 'sockjs-client'

socket = null
socketInit = new Promise (resolve)->
	
	if config.env is 'dev'
		for item in config.ports.dev
			if 'api' in item.ps
				PORT_API = item.port
				break
		for item in config.ports.dev
			if 'socket' in item.ps
					request "http://#{ip.address()}:#{PORT_API}/api/getsocketport", (err, res, body)->
						socket = new SockJS "http://#{ip.address()}:#{body}/sockjs"
						socket.onopen = ->
							resolve()
					break
	else
		socket = new SockJS "http://#{ip.address()}:#{config.ports.prod[0].port}/sockjs"
		socket.onopen = ->
			resolve()

module.exports =
	emit: (event, data)->
		socketInit.then ->
			socket.send JSON.stringify
				event: event
				data: data