express = require 'express'
router = express.Router()
jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'

router.get '/', (req, res, next)->
	for item in config.ports[config.env]
		if 'socket' in item.ps
			return res.end item.port.toString()

module.exports = router