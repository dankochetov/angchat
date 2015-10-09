express = require 'express'
router = express.Router()

router.get '/', (req, res, next) -> res.render 'chat/adminpanel/default'

module.exports = router