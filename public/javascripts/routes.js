chatio.config(function($routeProvider){
	$routeProvider.when('/login', {
		templateUrl: 'login',
		controller: 'loginCtrl'
	});

	$routeProvider.when('/chat', {
		templateUrl: 'chat',
		controller: 'chatCtrl'
	})

	$routeProvider.otherwise({
		redirectTo: '/login'
	});
});