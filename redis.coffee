module.exports = ->
	redis = require 'redis'
	client = redis.createClient 15458, 'pub-redis-15458.us-east-1-4.5.ec2.garantiadata.com'
	client.auth 'ms17081981ntv'
	client