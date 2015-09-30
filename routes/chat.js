var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Room = require('../models/room');

router.get('/', function(req, res, next){
	res.render('chat/default');
});

router.get('/rooms', function(req, res, next){
	res.render('chat/rooms');
});

router.get('/createroom', function(req, res, next){
	res.render('chat/createroom');
});

router.post('/createroom', function(req, res, next){

	var sockets = require('../sockets')(req.app.locals.io);

	var name = req.body.name;
	var description = req.body.description;
	var protect = req.body.protect;
	if (protect)
		var password = req.body.password;

	req.checkBody('name', 'Name field is empty!').notEmpty();
	req.checkBody('description', 'Description field is empty!').notEmpty();
	if (protect) req.checkBody('password', 'Password field is empty!').notEmpty();

	var errors = req.validationErrors();

	if (errors)
		return res.end(JSON.stringify({status: 'error', errors: errors}));

	Room.findOne({name: name}, function(err, room){
		if (err) return next(err);
		if (room)
			return res.end(JSON.stringify({status: 'error', errors: [{msg: 'Room with this name already exists!'}]}));
		else
		{
			var room = new Room({
				name: name,
				description: description,
				protect: protect,
				password: password,
				owner: req.user._id,
				users: JSON.parse('{"' + req.user._id + '": 4}')
			});
			room.save(function(err){
				if (err) return next(err);
				sockets.updateRooms();
				Room.findOne({name: name}, function(err, room){
					if (err) next(err);
					return res.end(JSON.stringify({status: 'success', id: room._id}));
				});
			});
		}
	});
});

router.get('/myrooms', function(req, res, next){
	res.render('chat/myrooms');
});

router.get('/room/:room', function(req, res, next){
	Room.findById(req.params.room, function(err, room){
		if (err || !room) res.end('Error: no such room');
		else res.render('chat/room');
	});
});

router.get('/user/:user', function(req, res, next){
	User.findById(req.params.user, function(err, user){
		if (err || !user) return res.redirect('/rooms');
	});
	res.render('chat/room');
});

module.exports = router;