require('coffee-script')

express = require('express')
router = express.Router()

Room = require('../models/room')
User = require('../models/user')

router.all '/*', (req, res, next) ->
  if !req.isAuthenticated()
    return res.redirect('/')
  next()

router.get '/', (req, res, next) ->
  res.render 'main/index', service: 'main'

router.get '/rooms', (req, res, next) ->
  res.render 'main/rooms'

router.get '/:room', (req, res, next) ->
  Room.findById req.params.room, (err, room) ->
    if err
      return next(err)
    res.render 'main/room'

router.get '/user/:user', (req, res, next) ->
  User.findById req.params.user, (err, user) ->
    if err or !user
      return res.redirect('/main')
    res.render 'main/room'

module.exports = router