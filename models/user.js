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
  password: String,
  rank: {
    type: Number,
    default: 1
  },
  facebook: {
    type: Boolean,
    default: false
  }
});

UserSchema.plugin(require('mongoose-findorcreate'));

var User = module.exports = mongoose.model('users', UserSchema);