chatio.config(function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: '/main/rooms',
		controller: 'roomsCtrl',
		resolve: {
			factory: function($rootScope){
				$rootScope.room = {_id: '/', name: 'Rooms'};
				$rootScope.isRoom = false;
			}
		}
	});

	$routeProvider.when('/user/:user', {
		templateUrl: function(params){
			return '/main/user/' + params.user;
		},
		controller: 'privateCtrl',
		resolve: {
			factory: function($rootScope){
				$rootScope.isRoom = false;
			}
		}
	});

	$routeProvider.when('/:room', {
		templateUrl: function(params){
			return '/main/' + params.room;
		},
		controller: 'roomCtrl',
		resolve: {
			factory: function($rootScope){
				$rootScope.isRoom = true;
			}
		}
	});

	$routeProvider.otherwise({
		redirectTo: '/'
	});
});