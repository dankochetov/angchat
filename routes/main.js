var express = require('express');
var router = express.Router();

var Room = require('../models/room');

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

module.exports = router;