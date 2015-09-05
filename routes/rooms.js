var express = require('express');
var Room = require('../models/room');
var router = express.Router();

/* GET home page. */
router.all('/*', function(req, res, next){
	if (!req.isAuthenticated()) return res.redirect('/');
	next();
});

router.get('/', function(req, res, next) {
	res.render('rooms/default', {
		service: 'rooms'
	});
});

router.get('/create', function(req, res, next){
	res.render('rooms/create', {
		service: 'rooms',
		errors: req.flash('errors'),
		params: req.flash('params')
	});
});

router.post('/create', function(req, res, next){

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
	{
		req.flash('errors', errors);
		req.flash('params', {
			name: req.body.name,
			password: req.body.password
		});
		return res.redirect('/rooms/create');
	}

	Room.findOne({name: name}, function(err, room){
		if (err) return next(err);
		if (room)
		{
			req.flash('errors', [{msg: 'Room with this name already exists!'}]);
			return res.redirect('/rooms/create');
		}
		else
		{
			var room = new Room({
				name: name,
				description: description,
				protect: protect,
				password: password,
				owner: req.user.login
			});
			room.save(function(err){
				if (err) return next(err);
				sockets.updateRooms();
				Room.findOne({name: name}, function(err, room){
					if (err) next(err);
					return res.redirect('/rooms/' + room.id);
				});
			});
		}
	});
});

router.get('/my', function(req, res, next){
	res.render('rooms/my', {
		service: 'rooms'
	});
});

router.get('/:room', function(req, res, next){
	res.render('rooms/chat/default', {
		service: 'chat'
	});
});

module.exports = router;
