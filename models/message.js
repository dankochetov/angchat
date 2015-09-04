var mongo = require('mongodb');
var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
  username: String,
  text: String,
  time: Date,
  type: {
  	type: String,
  	default: 'message'
  },
  room: String
});

var Message = module.exports = mongoose.model('messages', MessageSchema);