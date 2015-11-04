require 'coffee-script'
express = require 'express'
childProcess = require 'child_process'
jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'
redis =
	pub: require('./redis')()
	sub: require('./redis')()

if process.env.PORT?
	config.env = "prod"
	config.ports[0].port = process.env.PORT
	jsonfile.writeFileSync 'config.json', config

redis.sub.subscribe 'client'

redis.sub.on 'message', (ch, data)->
	
	switch ch
		when 'client'
			data = JSON.parse data
			switch data.event
				when 'exit'
					console.log "#{data.ps}@#{data.port} exited. Restarting..."
					new Process data.ps, data.port

				when 'message' then console.log "#{data.ps}@#{data.port}: #{data.text}"

				when 'error'
					console.log data.error
					process.exit 1

f = true
ps = null

# start socket(s) first, then api, then html
started = {}

startProcess = (data)->
	# launch all processes with matching process in list. Skip already started processes
	for item in config.ports
		if started[item.port] then continue
		for ps in item.ps
			if ps is data
				started[item.port] = true
				if f
					require('./process')
						port: item.port
						arr: item.ps
					f = false
				else
					t = childProcess.exec("coffee process.coffee #{item.port} #{item.ps.join ' '}")
					t.stdout.on 'data', (data)->
						process.stdout.write data
					t.stderr.on 'data', (data)->
						process.stderr.write data
				break

startProcess 'socket'
startProcess 'api'
startProcess 'html'

redis.pub.publish 'server', JSON.stringify
	event: 'init'

process.on 'exit', ->
	redis.pub.publish 'server', JSON.stringify
		event: 'exit'