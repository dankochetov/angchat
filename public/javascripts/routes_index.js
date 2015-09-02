chatio.config(function($routeProvider){

	$routeProvider.when('/', {
		templateUrl: 'index/index',
		controller: 'indexCtrl'
	});

	$routeProvider.when('/signup', {
		templateUrl: 'index/signup',
		controller: 'signupCtrl'
	});

	$routeProvider.when('/signin', {
		templateUrl: 'index/signin',
		controller: 'signinCtrl'
	});

	$routeProvider.otherwise({
		redirectTo: '/'
	});
});