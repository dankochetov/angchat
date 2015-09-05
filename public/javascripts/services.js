chatio.factory('autoSync', function($http){
	socket.on('logout', function(data){
		$http.get('/getuser').then(function(response){
			if (response.data == '401') location.reload();
		});
	});

	socket.on('login', function(data){
		$http.get('/getuser').then(function(response){
			if (response.data != '401') location.reload();
		});
	});

	return {}
});