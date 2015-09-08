var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
	if (req.isAuthenticated()) res.write(JSON.stringify(req.user));
	else res.write('401');
	res.end();
});

module.exports = router;