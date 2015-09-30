chatio.controller('roomCtrl', function($scope, $rootScope, $http, $timeout, $location, $routeParams, $q, $modal, socket, $templateCache){

	$scope.tabInit = $q.defer();
	$scope.usernames = [];
	$scope.messages = [];
	var user = $scope.user = $rootScope.user;

	$scope.tabInit.promise.then(function(tab){
		socket.emit('get room', tab.id);
		var close = $scope.$on('socket:room', function(event, room){
			if (room._id != tab.id) return;
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
				if ($rootScope['listeners.room.history.' + tab.id]) $rootScope['listeners.room.history.' + tab.id]();
				$rootScope['listeners.room.history.' + tab.id] = $scope.$on('socket:history', function(event, data){
					if (data.id != tab.id) return;
					$scope.messages = data.data;
					$scope.scrollGlue = true;
					$timeout(function(){
						$scope.scrollGlue = false;
					}, 100);
				});

				if ($rootScope['listeners.room.message.' + tab.id]) $rootScope['listeners.room.message.' + tab.id]();
				$rootScope['listeners.room.message.' + tab.id] = $scope.$on('socket:new message', function(event, data){
					if (data.room != tab.id) return;
					$scope.messages.push(data);
					$scope.scrollGlue = true;
					$timeout(function(){
						$scope.scrollGlue = false;
					}, 100);
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

			if ($rootScope['listeners.room.clearHistory.' + tab.id]) $rootScope['listeners.room.clearHistory.' + tab.id]();
			$rootScope['listeners.room.clearHistory.' + tab.id] = $scope.$on('clear history', function(event, id){
				if (id == room._id) $scope.messages = [];
			});
		}
	});
});