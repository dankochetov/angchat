chatio.controller('privateCtrl', function($scope, $routeParams, $timeout, $q, $rootScope, popup, autoSync){

	var socket;
	var socketInit = $q.defer();

	$scope.messages = [];
	$scope.scrollGlue = true;
	$scope.user = $rootScope.user;
	$scope.companion = {};
	$scope.companion._id = $rootScope.room._id = $routeParams.user;

	if (!$rootScope.sockets || !$rootScope.sockets[$scope.user._id])
	{
		socket = io.connect({forceNew: true});
		socket.emit('comment', 'socket opened for private with ' + $scope.companion._id);
		socket.emit('new user', {user: $scope.user, room: $scope.companion});
		socket.emit('get user', $scope.companion._id);

		socket.on('user', function(user){
			$timeout(function(){
				$scope.companion = user;
				socket.user = $scope.user;
				socket.companion = user;
				$scope.sockets[$scope.companion._id] = socket;
				socketInit.resolve();
			}, 0);
		});
	}
	else socketInit.resolve();

	socketInit.promise.then(function(){
		socket = $rootScope.sockets[$scope.companion._id];
		socket.unread = 0;
		socket.emit('get history');

		socket.on('reconnect', function(){
			location.reload();
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

		socket.on('new message', function(data){
			if ($rootScope.room._id != $scope.companion._id)
				$rootScope.$apply(function(){
					++$rootScope.sockets[$scope.companion._id].unread;
				});
			$scope.$apply(function(){
				$scope.messages.push(data);
				$scope.scrollGlue = true;
			});
		});
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

	$rootScope.leave = function(id)
	{
		var socket = $rootScope.sockets[id];
		socket.off('disconnect');
		socket.disconnect();
		var prev;
		for (cur in $rootScope.sockets)
		{
			if (cur == id) break;
			prev = cur;
		}
		$location.url($rootScope.sockets[prev].room._id);
		delete $rootScope.sockets[id];
	}

	$scope.submit = function(msg){
		if ($scope.messageForm.$invalid) return;
		socket.emit('send private message', msg);
		$scope.msg = '';
	}

	$scope.popups = popup.popups;
});