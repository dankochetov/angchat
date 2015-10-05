var mongo = require('mongodb');
var mongoose = require('mongoose');

var RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    index: true
  },
  description: String,
  protect: Boolean,
  password: String,
  owner: String,
  users: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  online: {
  	type: Number,
  	default: 0
  }
});

RoomSchema.plugin(require('mongoose-findorcreate'));

var Room = module.exports = mongoose.model('rooms', RoomSchema);