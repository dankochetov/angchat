require('coffee-script')

express = require 'express'
router = express.Router()

Room = require '../models/room'

router.all '/*', (req, res, next) ->
	return res.redirect '/' if !req.isAuthenticated()
	next()

router.get '/', (req, res, next) ->
	res.render 'myrooms/index'

router.get '/create', (req, res, next) ->
	res.render 'myrooms/create',
		errors: req.flash 'errors'
		params: req.flash 'params'

module.exports = router