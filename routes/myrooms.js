var express = require('express');
var router = express.Router();

var Room = require('../models/room');

router.all('/*', function(req, res, next){
	if (!req.isAuthenticated()) return res.redirect('/');
	next();
});

router.get('/', function(req, res, next){
	res.render('myrooms/index');
});

router.get('/create', function(req, res, next){
	res.render('myrooms/create', {
		errors: req.flash('errors'),
		params: req.flash('params')
	});
});

module.exports = router;