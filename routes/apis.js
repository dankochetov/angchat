var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');

var User = require('../models/user');
var Room = require('../models/room');

router.get('/getuser', function(req, res, next){
	if (req.isAuthenticated())
		return res.send(req.user);
	return res.send('401');
});

router.get('/rooms/:room/getroom', function(req, res, next){
	Room.findById( req.params.room, function(err, room){
		if (err) next(err);
		if (room) res.send(room);
		else res.send('404');
	});
});

module.exports = router;
