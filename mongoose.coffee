module.exports = ->
	mongo = require 'mongodb'
	mongoose = require 'mongoose'
	conn = mongoose.createConnection 'mongodb://kochetov_dd:ms17081981ntv@ds035633.mongolab.com:35633/chatio'
	#conn = mongoose.createConnection 'mongodb://127.0.0.1/chatio'

	conn