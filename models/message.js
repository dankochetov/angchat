var mongo = require('mongodb');
var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
  username: String,
  text: String,
  time: Date
});

var Message = module.exports = mongoose.model('messages', MessageSchema);