require('coffee-script')

express = require 'express'
router = express.Router()

router.get '/getuser', (req, res, next) ->
	if req.isAuthenticated()
		res.write JSON.stringify req.user
	else
		res.write '401'
	res.end()

module.exports = router