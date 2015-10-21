should = require 'should'
request = require 'request'

describe 'sign up', ->
	it 'should not sign up', (done)->
		this.timeout 10000
		params =
			login: 'kochetov_dd'
			username: 'kochetov_dd'
			password: '123'
			password2: '123'

		request.post {
			url: 'http://localhost:3000/signup'
			form: params
		}, (err, response, body)->
			body = JSON.parse body
			body.should.containEql msg: 'User already exists!'
			done()

	it.skip 'should sign up', (done)->
		this.timeout 10000
		params =
			login: 'test123'
			username: 'Test 123'
			password: '123'
			password2: '123'

		request.post {
			url: 'http://localhost:3000/signup'
			form: obj
		}, (err, response, body)->
			body.should.be.equal 'success'
			done()

