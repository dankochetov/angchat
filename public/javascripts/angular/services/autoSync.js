chatio.factory('autoLogin', function($rootScope, $location, $route, $templateCache, $http, socket){
		socket.on('autoLogin', function(data){
			$http.get('/getuser').then(function(response){
				if (response.data != '401') location.reload();
			});
		});

		return {}
});

chatio.factory('autoLogout', function($rootScope, $location, $route, $http, socket){
	socket.on('autoLogout', function(data){
			$http.get('/getuser').then(function(response){
				if (response.data == '401') location.reload();
			});
		});

	return {}
});