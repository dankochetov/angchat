chatio.config(function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: '/chat/default',
		controller: 'chatDefaultCtrl'
	});
});