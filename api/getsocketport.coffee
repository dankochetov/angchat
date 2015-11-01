express = require 'express'
router = express.Router()
jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'

router.get '/', (req, res, next)->
	res.end config.ports.sockets[0].toString()

module.exports = router