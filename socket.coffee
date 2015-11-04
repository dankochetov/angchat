ip = require 'ip'
request = require 'request'
jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'
SockJS = require 'sockjs-client'

socket = null
socketInit = new Promise (resolve)->
	for item in config.ports
		for ps in item.ps
			if ps is 'api'
				PORT_API = item.port
				break

	if config.env is 'dev'
		for item in config.ports
			for ps in item.ps
				if ps is 'socket'
					request "http://#{ip.address()}:#{PORT_API}/api/getsocketport", (err, res, body)->
						socket = new SockJS "http://#{ip.address()}:#{body}/sockjs"
						socket.onopen = ->
							resolve()
					break
	else
		socket = new SockJS "http://#{ip.address()}:#{config.ports[0].port}/sockjs"
		socket.onopen = ->
			resolve()

module.exports =
	emit: (event, data)->
		socketInit.then ->
			socket.send JSON.stringify
				event: event
				data: data