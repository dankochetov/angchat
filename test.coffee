express = require 'express'
sockjs = require('sockjs').createServer sockjs_url: 'javascripts/source/sockjs.min.js'
client = require 'sockjs-client'
http = require 'http'

app = express()

app.get '/', (req, res, next)-> res.end 'hello world!'

sockjs.installHandlers app.listen('5555'), prefix: '/sockjs'


client = new client 'http://localhost:5555/sockjs'
client.onopen = -> console.log 123