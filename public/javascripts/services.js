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

	var list = [];

	return {
		add: function(msg){
			$timeout(function(){
				var time = 0;
				if (list.length > 5)
				{
					list.splice(0, 1);
					time = 300;
				}
				$timeout(function(){
					list.push(msg);
				}, time);
			});
		},
		list: list
	}
});