chatio.controller('loginCtrl', function($scope, $location, $route, $log, userInfo){

	var socket = io.connect();

	if (userInfo.logged()) $location.url('/chat');

	$scope.errorText = '';

	$scope.checkErrors = function(){
		return $scope.errorText.length > 0;
	}

	$scope.submit = function(){
		if ($scope.loginForm.$invalid)
		{
			$scope.errorText = 'Username must not be empty!';
			return;
		}
		socket.emit('new user', $scope.username, function(data){
			if (!data) $scope.errorText = 'Username is already taken';
			else login();
		});
	}

	function login(){
		$scope.errorText = '';
		userInfo.login($scope.username);
		$location.url('/chat');
		$route.reload();
	}

});

chatio.controller('chatCtrl', function($scope, $location, userInfo){

	var socket = io.connect();

	$scope.usernames = [];
	$scope.messages = [];
	$scope.scrollGlue = true;
	if (!userInfo.logged()) $location.url('/login');

	$scope.username = userInfo.name();

	socket.emit('update user', $scope.username);

	socket.emit('get history', function(data){
		$scope.messages = data;
		$scope.scrollGlue = true;
	});

	$scope.submit = function(msg){
		if ($scope.messageForm.$invalid) return;
		socket.emit('send message', msg);
		$scope.msg = '';
	}

	$scope.logout = function(noEmit){
		socket.removeAllListeners('logout');
		if (!noEmit)
		{
			socket.close();
			console.log('logged out');
		}
		userInfo.logout();
		$location.url('/login');
	}

	$scope.formatMessage = function(message){
		if (message.type == 'error')
			res = '.alert.alert-danger ' + message.msg;
		else
			res = 
				'strong ' + message.user + '\n' + 
				message.msg;
		console.log(res);
		return res;
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

	socket.on('logout', function(data){
		if (data == $scope.username)
		{
			$scope.username = '';
			$scope.logout('no emit');
		}
	});

	socket.on('kick', function(data){
		if (data.name == $scope.username) kick(data.reason);
	});

	function kick(reason)
	{
		socket.close('kicked');
		$scope.messages.push({
			user: 'server',
			type: 'error',
			message: 'You have been kicked (Duplicate login)'
		});
	}

	$scope.checkScrollGlue = function(){
		var res = $scope.scrollGlue;
		if (res) $scope.scrollGlue = false;
		return res;
	}

	socket.emit('update usernames');
});