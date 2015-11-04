module.exports = (config)->
	process.stdout.on 'data', (data)->
		config.redis.publish 'message', JSON.stringify
			ps: config.ps
			port: config.port
			text: data