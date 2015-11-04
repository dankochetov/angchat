chatio = angular.module 'chatio', [
	'ngRoute'
	'ngCookies'
	'ngAnimate'
	'ngAudio'
	'ngSanitize'
	'ngStorage'
	'ui.bootstrap'
	'luegg.directives'
]

chatio.directive 'actionOnFinish', ->
	(scope)-> if scope.$last then scope.$emit 'rendering finished'

chatio.config ['$locationProvider', ($locationProvider)->
	$locationProvider.html5Mode
		enabled: true
		requireBase: false
]

HOST = window.location.hostname

if config.env is 'dev'
	for item in config.ports
		for ps in item.ps
			if ps is 'html'
				HOST_HTML = 'http://' + window.location.hostname + ":#{item.port}"
			if ps is 'api'
				HOST_API = 'http://' + window.location.hostname + ":#{item.port}"
else
	HOST_HTML = HOST_API = HOST