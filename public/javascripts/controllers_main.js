chatio.controller('mainCtrl', function($scope, $rootScope, $routeParams, $http, $q, autoSync, $location, $timeout, popup){

	var user;
	$scope.friends = [];

	if (!$rootScope.sockets) $rootScope.sockets = {};

	var socket = io.connect(hostname, {forceNew: true});
	socket.emit('comment', 'socked opened for Rooms');
	socket.room = {_id: '/', name: 'Rooms'};
	$rootScope.room = socket.room;
	$rootScope.roomsSocket = socket;

	$http.get('/getuser').then(function(response){
		$rootScope.user = user = $scope.user = response.data;
		userInit();
	});

	$scope.$on('users', function(event, data){
		$scope.$apply(function(){
			$scope.users = data;
		});
	});

	$scope.$on('rendering finished', function(event, data){
		dropdownSlide();
	});

	function userInit()
	{
		socket.emit('get friends', user._id);
		socket.on('friends', function(data)
		{
			$timeout(function(){
				$scope.friends = data;
			});
		});
	}

	$scope.setSelection = function(user){
		$scope.selected = user;
	}

	$scope.addFriend = function(){
		for (var friend in $scope.friends)
			if ($scope.friends[friend]._id == $scope.selected._id) return alert('This user is already your friend');
		socket.emit('add friend', {userid: $scope.user._id, friendid: $scope.selected._id});
	}

	$scope.removeFriend = function(){
		socket.emit('remove friend', {userid: $scope.user._id, friendid: $scope.selected._id});
	}

	$scope.checkActiveTab = function(cur){
		return $rootScope.room._id == cur.room._id;
	}

	$scope.leave = function(id)
	{
		var prev, next;
		var f = false;
		for (cur in $rootScope.sockets)
		{
			if (f)
			{
				next = cur;
				break;
			}
			if ($rootScope.sockets[cur].room._id == id) f = true;
			else if (!f) prev = cur;
		}
		$rootScope.sockets[id].off();
		$rootScope.sockets[id].disconnect();
		delete $rootScope.sockets[id];
		if (!prev) prev = next;
		if (prev) $location.url(($rootScope.sockets[prev].private?'user/':'') + $rootScope.sockets[prev].room._id);
		else $location.url('/');
	}

	$rootScope.popups = popup.list;

	var listener = io.connect(hostname, {forceNew: true});
	listener.emit('comment', 'socket opened for private messages listening');
	listener.emit('register listener');
	listener.on('new private message', function(data){
		updateTab(data.from, true);
		if (data.to != user._id || $rootScope.room._id == data.from) return;
		popup.add(data);
	});

	$rootScope.listener = listener;

	listener.on('new message', function(data){
		updateTab(data.room);
	});

	function updateTab(id, private)
	{
		if (id == $rootScope.user._id) return;
		if (private && !$rootScope.sockets[id])
		{
			var newSocket = io.connect(hostname, {forceNew: true});
			newSocket.emit('comment', 'socket opened for private with ' + id);
			newSocket.emit('get user', id);
			newSocket.on('user', function(companion){
				newSocket.emit('new user', {user: $scope.user, room: companion});
				newSocket.room = companion;
				newSocket.private = true;
				newSocket.user = $scope.user;
				$rootScope.sockets[id] = newSocket;
				$rootScope.sockets[id].unread = 0;
				update();
			});
		}
		else update();

		function update()
		{
			if ($rootScope.sockets[id] && id != $rootScope.room._id)
				$timeout(function(){
					++$rootScope.sockets[id].unread;
				});
		}
	}

});