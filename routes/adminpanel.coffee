express = require 'express'
router = express.Router()

jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'

router.get '/', (req, res, next)-> res.render 'chat/adminpanel/default', config: config

module.exports = router