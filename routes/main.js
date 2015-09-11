var express = require('express');
var router = express.Router();

var Room = require('../models/room');
var User = require('../models/user');

router.all('/*', function(req, res, next){
	if (!req.isAuthenticated()) return res.redirect('/');
	next();
});

router.get('/', function(req, res, next){
	res.render('main/index', {
		service: 'main'
	});
});

router.get('/rooms', function(req, res, next){
	res.render('main/rooms');
});

router.get('/:room', function(req, res, next){
	Room.findById(req.params.room, function(err, room){
		if (err || !room) return next();
		res.render('main/room');
	});
});

router.get('/user/:user', function(req, res, next){
	User.findById(req.params.user, function(err, user){
		if (err || !user) return res.redirect('/main');
		res.render('main/room');
	});
});

module.exports = router;