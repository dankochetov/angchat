should = require 'should'
request = require 'request'

describe 'sign in', ->
	it 'should sign in', (done)->
		this.timeout 10000
		params =
			login: 'test123'
			password: '123'

		request.post {
			url: 'http://localhost:3000/signin'
			form: params
		}, (err, response, body)->
			body.should.be.equal 'success'
			done()
	
