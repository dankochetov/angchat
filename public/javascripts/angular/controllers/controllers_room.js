chatio.controller('roomCtrl', function($scope, $rootScope, $http, $timeout, $location, $routeParams, $q, $modal, socket, $templateCache){

	$scope.tabInit = $q.defer();
	$scope.usernames = [];
	$scope.messages = [];
	$scope.scrollGlue = true;
	var user = $scope.user = $rootScope.user;

	$scope.tabInit.promise.then(function(tab){
		$rootScope.tab = tab;
		socket.emit('get room', tab.id);
		var close = $scope.$on('socket:room', function(event, room){
			init(room);
			close();
		});
		function init(room)
		{
			if (typeof room == 'string') room = JSON.parse(room);
			showPasswordModal(function(){
				socket.emit('new user', {user: $scope.user, room: room});
				
				$rootScope.title = ' - ' + room.name;
				user.rank = $rootScope.user.rank = Math.max(user.rank, room.users[user._id]?room.users[user._id]:0);
				tab.unread = 0;

				socket.emit('get history', room._id);

				$scope.$on('socket:reconnect', function(){
					location.reload();
				});

				$scope.$on('socket:disconnect', function(){
					addServerMessage('Connection lost', 'error');
				});

				var close = $scope.$on('socket:history', function(event, data){
					$scope.messages = data;
					$scope.scrollGlue = true;
					close();
				});

				$scope.$on('socket:new message', function(event, data){
					if (data.room != tab.id) return;
					$scope.messages.push(data);
					$scope.scrollGlue = true;
				});

			});

			function showPasswordModal(callback)
			{
				if (!room.protect) return callback();
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
					if (password != room.password) showPasswordModal(callback);
					else if (callback) callback();
				},
				function(){
					$rootScope.closeTab(tab);
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

			$scope.$on('clear history', function(event, id){
				if (id == room._id) $scope.messages = [];
			});
		}
	});
});