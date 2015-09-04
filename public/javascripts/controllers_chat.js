chatio.controller('chatDefaultCtrl', function($scope, $http, $timeout, $location, $q){

	$scope.usernames = [];
	$scope.messages = [];
	$scope.scrollGlue = true;
	var room = $q.defer();
	$http.get(window.location + '/getroom').then(function(res){
		if (res.data == '404')
		{
			$timeout(function(){
				$scope.hide = true;
			}, 0);
			window.location = '/rooms';
		}
		else
			$timeout(function(){
				room.resolve(res.data);
				$scope.room = res.data;
			}, 0);
	});
	$http.get('/getuser').then(function(res){
		$timeout(function(){
			$scope.$apply(function(){
				$scope.user = res.data;
			});
			room.promise.then(function(){
				socket.emit('new user', {username: $scope.user.username, room: $scope.room._id});
				socket.emit('update usernames');
				socket.emit('get history');
			});
		}, 0);
	});

	function addServerMessage(text, type)
	{
		$scope.$apply(function(){
			$scope.messages.push({
				username: 'server',
				text: text,
				type: type,
				time: Date.now()
			});
		});
	}

	socket.on('reconnect', function(){
		socket.emit('new user', {username: $scope.user.username, room: $scope.room._id});
		addServerMessage('Connection restored', 'info');
	});

	socket.on('disconnect', function(){
		addServerMessage('Connection lost', 'error');
	});

	socket.on('history', function(data){
		$scope.$apply(function(){
			$scope.messages = data;
			$scope.scrollGlue = true;
		});
	});

	$scope.clearChat = function(){
		socket.emit('clear history', function(){
			$scope.$apply(function(){
				$scope.messages = [];
			});
		});
	}

	$scope.submit = function(msg){
		if ($scope.messageForm.$invalid) return;
		socket.emit('send message', msg);
		$scope.msg = '';
	}

	socket.on('usernames', function(data){
		$scope.$apply(function(){
			$scope.usernames = data;
		});
	});

	socket.on('new message', function(data){
		$scope.$apply(function(){
			$scope.messages.push(data);
			$scope.scrollGlue = true;
		});
	});

	socket.on('kick', function(data){
		if (data.name == $scope.username) kick(data.reason);
	});
});