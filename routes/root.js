var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	if (req.isAuthenticated()) return res.redirect('/chat#');
	res.render('index', {
		service: 'index'
	});
});

module.exports = router;
