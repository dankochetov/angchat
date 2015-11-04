module.exports = (opts)->
  
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

  Stats = opts.conn.model 'statistics', StatsSchema

  model: Stats
  inc: (field, callback = ->) ->
    Stats.findOne {date: dateFormat(new Date(), 'isoDate')}, (err, stats) ->
      if err then console.log err
      if !stats then stats = new Stats({date: dateFormat(new Date(), 'isoDate')})
      ++stats[field[0]][field[1]]
      stats.markModified field[0]
      stats.save (err, stats) ->
        if err then console.log err
      callback()