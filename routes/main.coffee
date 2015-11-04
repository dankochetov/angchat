require 'coffee-script'
jsonfile = require 'jsonfile'
config = jsonfile.readFileSync 'config.json'
conn = require('../mongoose')()

express = require 'express'
router = express.Router()

Room = require('../models/room')
  conn: conn
User = require('../models/user')
  conn: conn

router.all '/*', (req, res, next)->
  if not req.isAuthenticated()
    return res.redirect '/'
  next()

router.get '/', (req, res, next)->
  res.render 'main/index',
    service: 'main'
    config: require '../public/config'

router.get '/rooms', (req, res, next)->
  res.render 'main/rooms', config: config

router.get '/:room', (req, res, next)->
  Room.findById req.params.room, (err, room)->
    if err then return next err
    res.render 'main/room', config: config

router.get '/user/:user', (req, res, next)->
  User.findById req.params.user, (err, user)->
    if err or not user then return res.redirect '/main'
    res.render 'main/room', config: config

module.exports = router