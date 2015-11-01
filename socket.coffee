ip = require 'ip'
request = require 'request'
jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'
SockJS = require 'sockjs-client'

socket = null
socketInit = new Promise (resolve)->
	request "http://#{ip.address()}:#{config.ports.api}/api/getsocketport", (err, res, body)->
		socket = new SockJS "http://#{ip.address()}:#{body}/sockjs"
		socket.onopen = ->
			resolve()

		


module.exports =
	emit: (event, data)->
		socketInit.then ->
			socket.send JSON.stringify
				event: event
				data: data