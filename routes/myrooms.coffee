require 'coffee-script'
jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'
conn = require('../mongoose')()

express = require 'express'
router = express.Router()

Room = require('../models/room')
	conn: conn

router.all '/*', (req, res, next) ->
	if not req.isAuthenticated() then return res.redirect '/'
	next()

router.get '/', (req, res, next) ->
	res.render 'myrooms/index', config: config

router.get '/create', (req, res, next) ->
	res.render 'myrooms/create',
		errors: req.flash 'errors'
		params: req.flash 'params'
		config: config

module.exports = router