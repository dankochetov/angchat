mongo = require 'mongodb'
mongoose = require 'mongoose'
dateFormat = require '../public/coffee/date.format'

StatsSchema = new mongoose.Schema
  date: Date
  rooms:
    type: Object
    default:
      created: 0
      deleted: 0
  messages:
    type: Object
    default:
      public: 0
      private: 0
  users:
    type: Object
    default:
      signedUp: 0
      signedIn: 0


StatsSchema.plugin require 'mongoose-findorcreate'

Stats = module.exports.model = mongoose.model 'statistics', StatsSchema

module.exports.inc = (field, callback = ->) ->
  Stats.findOne {date: dateFormat(new Date(), 'isoDate')}, (err, stats) ->
    if !stats then stats = new Stats({date: dateFormat(new Date(), 'isoDate')})
    ++stats[field[0]][field[1]]
    stats.markModified field[0]
    stats.save()
    callback()