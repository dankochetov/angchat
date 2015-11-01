module.exports = (config)->
	console.log = (args...)->
		config.redis.publish 'message', JSON.stringify
			ps: config.ps
			port: config.port
			text: args.join ' '