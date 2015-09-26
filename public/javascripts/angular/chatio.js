'use strict';

var chatio = angular.module('chatio', ['ngRoute', 'ngCookies', 'ngAnimate', 'ngAudio', 'ngSanitize', 'ui.bootstrap', 'luegg.directives']);

chatio.directive('actionOnFinish', function(){
	return function(scope){
		if (scope.$last) scope.$emit('rendering finished');
	}
});

chatio.config(function($locationProvider){
	$locationProvider.html5Mode({
		enabled: true,
		requireBase: false
	});
});

var hostname = window.location.host;