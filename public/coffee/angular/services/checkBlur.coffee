chatio.run ['$rootScope', '$timeout', ($rootScope, $timeout) ->

	$rootScope.active = true
	jQuery(window).blur -> $timeout -> $rootScope.active = false
	jQuery(window).focus -> $timeout -> $rootScope.active = true

]