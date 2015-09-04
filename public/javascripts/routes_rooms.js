chatio.config(function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: '/rooms/default',
		controller: 'roomsDefaultCtrl'
	});
	
	$routeProvider.when('/create', {
		templateUrl: '/rooms/create',
		controller: 'roomsCreateCtrl'
	});

});