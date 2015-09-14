chatio.controller('roomCtrl', function($scope, $rootScope, $http, $timeout, $location, $routeParams, $q, $modal){

	var room;

	var socket;

	$scope.usernames = [];
	$scope.messages = [];
	$scope.scrollGlue = true;
	var user = $scope.user = $rootScope.user;

	$http.get('/main/' + $routeParams.room + '/getroom').then(function(res){
		if (res.data == '404')
		{
			$timeout(function(){
				$scope.hide = true;
			}, 0);
			$location.url('/');
		}
		else
			$timeout(function(){
				$scope.room = $rootScope.room = room = res.data;
				roomInit();
			}, 0);
	});
	function roomInit()
	{
		if (!$rootScope.sockets || !$rootScope.sockets[room._id])
			showPasswordModal(room.protect, function(){
				socket = io.connect({forceNew: true});
				socket.emit('comment', 'socket opened for ' + room._id);
				socket.emit('new user', {user: $scope.user, room: room});
				socket.user = user;
				socket.room = room;
				socket.private = false;
				socket.emit('update users');
				$rootScope.sockets[room._id] = socket;
				socketInit();
			});
		else socketInit();
	}

	function showPasswordModal(show, callback)
	{
		if (!show) return callback();
		var passwordModal = $modal.open({
			size: 'sm',
			templateUrl: 'passwordModal',
			backdrop: 'static',
			resolve: {
				room: function(){
					return room;
				}
			}
		});

		passwordModal.result.then(function(password){
			if (password != room.password) showPasswordModal(show, callback);
			else if (callback) callback();
		},
		function(){
			$location.url('/');
		});
	}

	function socketInit()
	{
		socket = $rootScope.sockets[room._id];
		socket.user.rank = $rootScope.user.rank = Math.max(socket.user.rank, room.users[user._id]?room.users[user._id]:0);
		socket.unread = 0;

		$rootScope.sockets[$scope.room._id] = socket;

		socket.emit('get history');

		socket.off();

		socket.on('reconnect', function(){
			location.reload();
		});

		socket.on('disconnect', function(){
			addServerMessage('Connection lost', 'error');
		});

		socket.on('history', function(data){
			$timeout(function(){
				$scope.messages = data;
				$scope.scrollGlue = true;
			});
		});

		socket.on('users', function(data){
			$scope.$emit('users', data);
		});

		socket.on('new message', function(data){
			if ($rootScope.room._id != $scope.room._id)
				$rootScope.$apply(function(){
					++$rootScope.sockets[data.room].unread;
				});
			$timeout(function(){
				$scope.messages.push(data);
				$scope.scrollGlue = true;
			}, 0);
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

	$rootScope.clearChat = function(){
		socket.emit('clear history', function(){
			$timeout(function(){
				$scope.messages = [];
			}, 0);
		});
	}

	$scope.submit = function(msg){
		if ($scope.messageForm.$invalid) return;
		socket.emit('send message', msg);
		$scope.msg = '';
	}

});