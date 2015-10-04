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
	(scope) -> scope.$emit 'rendering finished' if scope.$last

chatio.config ['$locationProvider', ($locationProvider) ->
	$locationProvider.html5Mode
		enabled: true
		requireBase: false
]

hostname = window.location.host