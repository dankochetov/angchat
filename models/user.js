var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect('mongodb://kochetov_dd:ms17081981ntv@ds035633.mongolab.com:35633/chatio');

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
  }
});

var User = module.exports = mongoose.model('users', UserSchema);