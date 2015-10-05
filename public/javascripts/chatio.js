'use strict';

var chatio = angular.module('chatio', ['ngRoute', 'ngCookies', 'ngAnimate', 'ngAudio', 'ui.bootstrap', 'luegg.directives']);

chatio.directive('actionOnFinish', function(){
	return function(scope){
		if (scope.$last) scope.$emit('rendering finished');
	}
});

var hostname = window.location.host;