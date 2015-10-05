var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');

var User = require('../models/user');

/* GET home page. */

router.get('/', function(req, res, next){
	if (req.isAuthenticated()) res.render('chat/index');
	else res.render('index/index');
});

router.get('/index', function(req, res, next){
	res.render('index/default');
});

router.get('/signin', function(req, res, next){
	res.render('index/signin');
});

router.get('/signin/fb', passport.authenticate('facebook'));

router.get('/signin/fb/cb', passport.authenticate('facebook', {failureRedirect: '/'}), function(req, res, next){
	require('../sockets')(req.app.locals.sockjs, req.app.locals.connections).autoLogin();
	res.redirect('/');
});

router.get('/signin/vk', passport.authenticate('vkontakte'));

router.get('/signin/vk/cb', passport.authenticate('vkontakte', {failureRedirect: '/'}), function(req, res, next){
	require('../sockets')(req.app.locals.sockjs, req.app.locals.connections).autoLogin();
	res.redirect('/');
});

router.post('/signin', function(req, res, next){
	req.checkBody('login', 'Login field is empty!').notEmpty();
	req.checkBody('password', 'Password field is empty!').notEmpty();

	var errors = req.validationErrors();

	if (errors)
		return res.end(JSON.stringify(errors));

	passport.authenticate('local', function(err, user, info){
		if (info) errors = [{msg: info.error}];
		if (err) return next(err);
		if (!user)
			return res.end(JSON.stringify(errors));
		req.logIn(user, function(err){
			if (err) return next(err);
			require('../sockets')(req.app.locals.sockjs, req.app.locals.connections).autoLogin();
			return res.end('success');
		});
	})(req, res, next);
});

router.get('/signup', function(req, res, next){
	if (req.isAuthenticated()) res.end('<h1>Error!</h1>You are already logged in');
	else res.render('index/signup');
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
	console.log('here');
	User.findOne({login: login}, function(err, user){
		if (err) next(err);
		var errors = req.validationErrors();
		if (!errors) errors = [];
		if (user)
			errors.push({msg: 'User already exists!'});

		if (errors.length > 0) res.end(JSON.stringify(errors));
		else
		{
			var user = new User({login: login, username: username, password: password});
			user.save(function(err){
				if (err) return next(err);
				req.logIn(user, function(err){
					if (err) return next(err);
					require('../sockets')(req.app.locals.sockjs, req.app.locals.connections).autoLogin();
					res.end('registered');
				});
			});
		}
	});
});

router.get('/logout', function(req, res, next){
	if (req.isAuthenticated())
	{
		req.logout();
		require('../sockets')(req.app.locals.sockjs, req.app.locals.connections).autoLogout();
		res.end('logged out');
	}
	else res.end('not logged');
});

module.exports = router;
