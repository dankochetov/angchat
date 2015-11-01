require 'coffee-script'
childProcess = require 'child_process'
jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'
redis =
	pub: require('./redis')()
	sub: require('./redis')()

count = total = 0

countTotal = (a)->
	for i, v of a
		if typeof v is 'number'
			++total
		else
			countTotal v

countTotal config.ports

redis.sub.subscribe 'port'
redis.sub.subscribe 'message'

redis.sub.on 'message', (ch, data)->
	data = JSON.parse data
	switch ch

		when 'port'
			if data.ps is 'socket'
				for i, port of config.ports.sockets
					if port is data.old
						config.ports.sockets[i] = data.new
			else
				config.ports[data.ps] = data.new
			console.log "#{data.ps} is running on port #{data.new}"
			jsonfile.writeFileSync 'config.json', config, spaces: 2
			++count
			if count is total
				redis.pub.publish 'init', '{}'

		when 'message' then console.log "#{data.ps}@#{data.port}: #{data.text}"

		when 'exit'
			console.log "#{data.ps}@#{data.port} exited. Restarting..."
			new Process data.ps, data.port

class Process
	constructor: (@cmd, @port)->
		@ps = childProcess.exec "coffee ps/#{@cmd}.coffee #{@port}"

for cmd, ports of config.ports
	if cmd isnt 'sockets'
		new Process cmd, ports
	else
		for i, port of ports
			new Process 'socket', port

process.on 'exit', ->
	redis.pub.publish 'exit', '{}'