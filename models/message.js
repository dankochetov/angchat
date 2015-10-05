var mongo = require('mongodb');
var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
  username: String,
  text: String,
  time: Date,
  private: {
  	type: Boolean,
  	default: false
  },
  room: String,
  from: String,
  to: String
});

MessageSchema.plugin(require('mongoose-findorcreate'));

var Message = module.exports = mongoose.model('messages', MessageSchema);