chatio.controller('privateCtrl', function($scope, $routeParams, $timeout, $q, $rootScope, $location, autoSync){

	var socket;
	var user;
	var companion = {};

	$scope.messages = [];
	$scope.scrollGlue = true;
	$scope.user = user = $rootScope.user;
	$scope.companion = {};
	companion._id = $routeParams.user;

	if (!$rootScope.sockets || !$rootScope.sockets[companion._id])
	{
		socket = io.connect({forceNew: true});
		socket.emit('comment', 'socket opened for private with ' + companion._id);
		socket.emit('new user', {user: $scope.user, room: companion});
		socket.emit('get user', companion._id);


		socket.on('user', function(user){
			$timeout(function(){
				socket.room = user;
				socket.private = true;
				socket.user = $scope.user;
				$rootScope.sockets[companion._id] = socket;
				socketInit();
			}, 0);
		});
	}
	else socketInit();

	function socketInit()
	{
		socket = $rootScope.sockets[companion._id];
		$rootScope.room = $scope.companion = companion = socket.room;
		socket.unread = 0;
		socket.emit('get private history', {id1: user._id, id2: companion._id});

		socket.off();

		socket.on('reconnect', function(){
			location.reload();
		});

		socket.on('disconnect', function(){
			addServerMessage('Connection lost', 'error');
		});

		socket.on('private history', function(data){
			$scope.$apply(function(){
				$scope.messages = data;
				$scope.scrollGlue = true;
			});
		});

		socket.on('new private message', function(data){
			if ($rootScope.room._id != data.from && $rootScope.room._id != data.to)
			{
				$rootScope.$apply(function(){
					if ($rootScope.sockets[data.from]) ++$rootScope.sockets[data.from].unread;
					if ($rootScope.sockets[data.to]) ++$rootScope.sockets[data.to].unread;
				});
			}
			$scope.$apply(function(){
				$scope.messages.push(data);
				$scope.scrollGlue = true;
			});
		});
	}

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
		if (prev) $location.url($rootScope.sockets[prev].room._id);
		else $location.url('/');
		delete $rootScope.sockets[id];
	}

	$scope.submit = function(msg){
		if ($scope.messageForm.$invalid) return;
		socket.emit('send private message', msg);
		$scope.msg = '';
	}
});