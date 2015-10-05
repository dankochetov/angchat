var express = require('express');
var router = express.Router();
var mongo = require('mongodb')
var mongoose = require('mongoose');

var User = require('../../models/user');
var Room = require('../../models/room');

router.get('/main/:room/getroom', function(req, res, next){
	Room.findById(req.params.room, function(err, room){
		if (err) next(err);
		if (room) res.write(JSON.stringify(room));
		else res.write('404');
		res.end();
	});
});

module.exports = router;
