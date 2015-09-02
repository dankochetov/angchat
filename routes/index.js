var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');

var User = require('../models/user');

/* GET home page. */
router.get('/', function(req, res, next){
  res.redirect('/');
});

router.get('/signin', function(req, res, next){
	res.render('index/signin', {
		errors: req.flash('errors')
	});
});

router.post('/signin', function(req, res, next){
	passport.authenticate('local', function(err, user, info){
		if (info) req.flash('errors', [{msg: info.error}]);
		if (err) return next(err);
		if (!user)
			return res.redirect('/#/signin');
		req.logIn(user, function(err){
			if (err) return next(err);
			return res.redirect('/chat');
		});
	})(req, res, next);
});

router.get('/signup', function(req, res, next){
	res.render('index/signup', {
		errors: req.flash('errors'),
		login: req.flash('login'),
		username: req.flash('username')
	});
});

router.post('/signup', function(req, res, next){
	var login = req.body.login;
	var username2 = username = req.body.username;
	if (!username) username = login;
	var password = req.body.password;
	var password2 = req.body.password2;

	req.checkBody('login', 'Login field is empty!').notEmpty();
	req.checkBody('password', 'Password field is empty!').notEmpty();
	req.checkBody('password', 'Passwords do not match!').equals(password2);

	password = bcrypt.hashSync(password);

	var err = {};
	User.findOne({login: login}, function(err, user){
		if (err) next(err);
		var errors = req.validationErrors();
		if (!errors) errors = [];
		if (user)
			errors.push({msg: 'User already exists!'});

		if (errors.length > 0)
		{
			req.flash('login', login);
			req.flash('username', username2);
			req.flash('errors', errors);
			res.location('/#/signup');
			res.redirect('/#/signup');
		}

		else
		{
			var user = new User({login: login, username: username, password: password});
			user.save(function(err){
				if (err) return next(err);
				req.logIn(user, function(err){
					if (err) return next(err);
					res.redirect('/chat');
				});
			});
		}
	});
});

router.get('/index', function(req, res, next){
	res.render('index/index');
});

router.get('/logout', function(req, res, next){
	if (req.isAuthenticated())
		req.logout();
	return res.redirect('/#/');
});

module.exports = router;
