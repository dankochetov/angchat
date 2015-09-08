chatio.factory('autoSync', function($http){
	var socket = io.connect({forceNew: true});
	socket.emit('comment', 'socket opened for autoSync');
	socket.on('logout', function(data){
		$http.get('/getuser').then(function(response){
			if (response.data == '401') location.reload();
		});
	});

	socket.on('login', function(data){
		$http.get('/getuser').then(function(response){
			if (response.data == '401') location.reload();
		});
	});

	return {};
});

chatio.factory('popup', function($timeout){

	var popups = [];

	return {
		add: function(msg){
			popups.push(msg);
			$timeout(function(){
				popups.splice(0, 1);
			}, 5000);
		},
		popups: popups
	}
});