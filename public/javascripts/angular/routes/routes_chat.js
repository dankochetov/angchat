chatio.config(function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: '/chat',
		controller: 'chatCtrl',
		reloadOnSearch: false
	});

	$routeProvider.when('/room/:room', {
		templateUrl: '/chat',
		controller: 'chatCtrl',
		reloadOnSearch: false
	});

	$routeProvider.when('/user/:user', {
		templateUrl: '/chat',
		controller: 'chatCtrl',
		reloadOnSearch: false
	});

	$routeProvider.when('/rooms/my', {
		templateUrl: '/chat/myrooms',
		controller: 'myroomsCtrl',
	});

	$routeProvider.when('/rooms/create', {
		templateUrl: '/chat/createroom',
		controller: 'createroomCtrl'
	});

	$routeProvider.otherwise({
		redirectTo: '/'
	});
});