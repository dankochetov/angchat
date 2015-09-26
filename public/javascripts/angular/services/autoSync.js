chatio.factory('autoLogin', function($rootScope, $location, $route, $templateCache, $http){
		$rootScope.$on('socket:autoLogin', function(event, data){
			$http.get('/getuser').then(function(response){
				if (response.data != '401') location.reload();
			});
		});

		return {}
});

chatio.factory('autoLogout', function($rootScope, $location, $route, $http){
	$rootScope.$on('socket:autoLogout', function(event, data){
			$http.get('/getuser').then(function(response){
				if (response.data == '401') location.reload();
			});
		});

	return {}
});