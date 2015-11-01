express = require 'express'
jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'
ip = require 'ip'

router = express.Router()

router.get '/', (req, res, next) ->
	res.redirect 'http://' + ip.address() + ':' + config.ports.html + '/signin/check'

module.exports = router