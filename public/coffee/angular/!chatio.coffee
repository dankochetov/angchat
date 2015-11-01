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

HOST_HTML = 'http://' + window.location.hostname + ":#{config.ports.html}"
HOST_API = 'http://' + window.location.hostname + ":#{config.ports.api}"