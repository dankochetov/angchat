require 'coffee-script'
require 'coffee-script/register'
childProcess = require 'child_process'
config = require './config'

class Process
	constructor: (@cmd, @port)->
		@ps = childProcess.exec "coffee ps/#{@cmd}.coffee #{@port}"
		console.log "#{@cmd} is running on port #{@port}"
		@ps.stdout.on 'data', (data)=>
			process.stdout.write "#{@cmd}: #{data}"
		@ps.stderr.on 'data', (data)=>
			process.stderr.write "#{@cmd}: #{data}"
		@ps.on 'exit', (code, signal)=>
			console.log "#{@cmd} exited with code #{code} and signal #{signal}"
			if code is 1
				console.log "restarting #{@cmd} at port #{@port}..."
				new Process @cmd, @port

class Socket
	constructor: (@port)->
		@ps = childProcess.exec "coffee ps/socket.coffee #{@port}"
		console.log "socket is running on port #{@port}"
		@ps.stdout.on 'data', (data)=>
			process.stdout.write "socket@#{@port}: #{data}"
		@ps.stderr.on 'data', (data)=>
			process.stderr.write "socket@#{@port}: #{data}"
		@ps.on 'exit', (code, signal)=>
			console.log "socket@#{@port} exited with code #{code} and signal #{signal}"
			if code is 1
				console.log "restarting socket at port #{@port}..."
				new Socket @port


for cmd, ports of config.ports
	if cmd isnt 'sockets'
		new Process cmd, ports
	else
		for port in ports
			new Socket port