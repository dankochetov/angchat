should = require 'should'
SockJS = require 'sockjs-client-node'

describe 'get friends list', ->
	it 'should load friends list', (done)->
		data = ''
		socket = new SockJS 'http://localhost:3000/sockjs'
		socket.onopen = ->
			socket.onmessage = (e)->
				data = JSON.parse e.data
				if data.event is '33'
					data.data.should.have.length 0
					done()
			socket.send JSON.stringify
				event: '19'
				data: '562668b0e05eb8ac14fdbb05'