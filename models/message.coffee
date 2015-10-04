mongo = require('mongodb')
mongoose = require('mongoose')

MessageSchema = new mongoose.Schema
  username: String
  text: String
  time: Date
  private:
    type: Boolean
    default: false
  room: String
  from: String
  to: String

MessageSchema.plugin require('mongoose-findorcreate')

Message = module.exports = mongoose.model 'messages', MessageSchema