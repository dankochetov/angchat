chatio.controller('chatDefaultCtrl', function($scope, $location, $sce, auth){

	$scope.usernames = [];
	$scope.messages = [];
	$scope.scrollGlue = true;


	$scope.init = function(){
		$scope.user = auth();

		socket.emit('new user', {username: $scope.user.username});

		socket.emit('get history', function(data){
			$scope.messages = data;
			$scope.scrollGlue = true;
		});
		
		socket.emit('update usernames');
	}

	$scope.submit = function(msg){
		if ($scope.messageForm.$invalid) return;
		socket.emit('send message', msg);
		$scope.msg = '';
	}

	$scope.formatMessage = function(message){
		if (message.type == 'error')
			res = '<div class="alert alert-danger">' + message.msg + '</div>';
		else
			res = '<strong>' + message.user + ': </strong>' + message.msg;
		return $sce.trustAsHtml(res);
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

	function kick(reason)
	{
		socket.emit('logout');

		$scope.$apply(function(){
			$scope.messages.push({
				user: 'server',
				type: 'error',
				msg: 'You have been kicked (' + reason + ')'
			});
		});
	}

	$scope.checkScrollGlue = function(){
		var res = $scope.scrollGlue;
		if (res) $scope.scrollGlue = false;
		return res;
	}
});