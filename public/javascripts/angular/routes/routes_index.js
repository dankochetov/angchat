chatio.config(function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: '/index',
		controller: 'indexCtrl'
	});

	$routeProvider.when('/signin', {
		templateUrl: '/signin',
		controller: 'signinCtrl'
	});

	$routeProvider.when('/signup', {
		templateUrl: '/signup',
		controller: 'signupCtrl'
	});

	$routeProvider.otherwise({
		redirectTo: '/'
	});
});