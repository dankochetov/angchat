var mongo = require('mongodb');
var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  login: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  username: {
    type: String
  },
  password: {
    type: String,
    required: true
  },
  rank: {
    type: Number,
    default: 1
  }
});

var User = module.exports = mongoose.model('users', UserSchema);