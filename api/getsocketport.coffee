express = require 'express'
router = express.Router()
jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'

router.get '/', (req, res, next)->
	for item in config.ports
		for ps in item.ps
			if ps is 'socket'
				return res.end item.port.toString()

module.exports = router