var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	if (!req.isAuthenticated()) return res.redirect('/#');
	res.render('chat/index', {
		service: 'chat',
		user: req.user
	});
});

router.get('/default', function(req, res, next){
	res.render('chat/default');
});

module.exports = router;
