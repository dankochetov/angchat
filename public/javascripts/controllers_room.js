chatio.controller('roomCtrl', function($scope, $rootScope, $http, $timeout, $location, $routeParams, $q, $modal, popup){

	var room;
	var roomInit = $q.defer();

	var socket;
	var socketInit = $q.defer();

	$scope.usernames = [];
	$scope.messages = [];
	$scope.scrollGlue = true;

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
				room = res.data;
				roomInit.resolve();
				$scope.room = $rootScope.room = res.data;
			}, 0);
	});
	$http.get('/getuser').then(function(res){
		$timeout(function(){
			$scope.$apply(function(){
				$scope.user = $rootScope.user = res.data;
			});
			roomInit.promise.then(function(){
				if (!$rootScope.sockets || !$rootScope.sockets[$scope.room._id])
					showPasswordModal(room.protect, function(){
						socket = io.connect({forceNew: true});
						socket.emit('comment', 'socket opened for ' + $scope.room._id);
						socket.emit('new user', {username: $scope.user.username, room: $scope.room._id});
						socket.user = $scope.user;
						socket.room = $scope.room;
						$scope.sockets[$scope.room._id] = socket;
						socket.emit('update usernames');
					});
				socket = $rootScope.sockets[$scope.room._id];
				socket.user.rank = $rootScope.user.rank = Math.max(socket.user.rank, socket.room.users[socket.user.login]?socket.room.users[socket.user.login]:0);
				socketInit.resolve();
				socket.room.unread = 0;
				socketInit.resolve();
				socket.emit('get history');
			});
		}, 0);
	});

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

		passwordModal.opened.then(function(){
			$timeout(function(){
				jQuery('#passwordModalInput').focus();
			}, 200);
		});

		passwordModal.result.then(function(password){
			if (password != room.password) showPasswordModal(show, callback);
			else if (callback) callback();
		},
		function(){
			$location.url('/');
		});
	}

	socketInit.promise.then(function(){

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

		socket.on('usernames', function(data){
			$scope.$emit('usernames', data);
		});

		socket.on('new message', function(data){
			if ($rootScope.room._id != $scope.room._id)
				$rootScope.$apply(function(){
					++$rootScope.sockets[data.room].room.unread;
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

	$rootScope.clearChat = function(){
		socket.emit('clear history', function(){
			$scope.$apply(function(){
				$scope.messages = [];
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
		socket.emit('send message', msg);
		$scope.msg = '';
	}

	$scope.popups = popup.popups;
	$timeout(function(){
		popup.add({
			username: 'kochetov_dd',
			text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque in ultrices arcu. Pellentesque sed elit cursus, ullamcorper lectus id, feugiat urna. Proin molestie luctus sem, at laoreet tellus fermentum vitae. Nulla cursus suscipit odio ac efficitur. Pellentesque vestibulum, eros ut rhoncus dapibus, enim est eleifend mauris, at tempus mi arcu in sapien. Sed nec iaculis lacus. Mauris varius ornare massa eget convallis. Phasellus sem eros, lobortis tristique augue et, sollicitudin iaculis nulla.'
		});
	}, 1000);

});