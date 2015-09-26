chatio.controller('chatCtrl', function($scope, $rootScope, $route, $routeParams, $http, $location, $timeout, socket, ngAudio, popup, autoLogout, tabs){

	tabs.init();

	$scope.friends = [];
	$scope.loading_friends = true;

	$http.get('/getuser').then(function(response){
		$rootScope.user = response.data;
		userInit();
	});

	$scope.$on('socket:users', function(event, users){
		$scope.users = users;
	});

	$scope.$on('rendering finished', function(){
		dropdownSlide();
	});

	function userInit()
	{
		socket.emit('get friends', $rootScope.user._id);
		$scope.$on('socket:friends', function(event, friends){
			$scope.loading_friends = false;
			$scope.friends = friends;
		});

		if ($location.search().room) $scope.openTab($location.search().room, false);
		if ($location.search().user) $scope.openTab($location.search().user, true);
	}

	$scope.addFriend = function(){
		for (var friend in $scope.friends)
			if ($scope.friends[friend]._id == $scope.selected._id) return alert('This user is already your friend');
		socket.emit('add friend', {userid: $rootScope.user._id, friendid: $scope.selected._id});
	}

	$scope.removeFriend = function(){
		socket.emit('remove friend', {userid: $rootScope.user._id, friendid: $scope.selected._id});
	}

	$rootScope.popups = popup.list;

	var notifySound = ngAudio.load('../sounds/notify.mp3');
	$scope.$on('socket:listener event', function(event, data){
		if (data.to != $rootScope.user._id || $rootScope.tab.id == data.from) return;
		$scope.openTab(data.from, true, false);
		popup.add(data);
		//notifySound.play();
	});

	$scope.logout = function(){
		$http.get('/logout');
	}

	$scope.openTab = function(id, isPrivate, open){
		if (open == undefined) open = true;
		var createNew = true;
		for (cur in $rootScope.tabs)
			if ($rootScope.tabs[cur].id == id)
			{
				createNew = false;
				break;
			}
		if (createNew)
		{
			if (isPrivate)
			{
				socket.emit('get user', id);
				var close = $scope.$on('socket:user', function(event, user){
					if (user == '404') return;
					var newTab = {
						title: user.username,
						id: id,
						url: '/chat/user/' + id,
						private: true
					}
					tabs.open(newTab);
					if (open) tabs.active(id);
					close();
				});
			}
			else
			{
				socket.emit('get room', id);
				var close = $scope.$on('socket:room', function(event, room){
					if (room == '404') return;
					tabs.open({
						title: room.name,
						id: id,
						url: '/chat/room/' + id,
						private: false
					});
					if (open) tabs.active(id);
					close();
				});
			}
		}
		else if (open) tabs.active(id);
	}

	$rootScope.closeTab = function(tab){
		if (!tab.private)
			socket.emit('leave room', tab.id);
		var pos = tabs.close(tab.id);
		if (pos > 0) tabs.active(pos - 1);
		else if (pos < tabs.count() - 1) tabs.active(pos + 1);
		else tabs.active('root');
	}
});

chatio.controller('sendMsgCtrl', function($scope, $rootScope, socket){
	$scope.submit = function(msg){
		if ($scope.messageForm.$invalid) return;
		if ($rootScope.tab.private)
			socket.emit('send private message', JSON.stringify({to: $rootScope.tab.id, msg: msg}));
		else
			socket.emit('send message', JSON.stringify({roomid: $rootScope.tab.id, msg: msg}));
		$scope.msg = '';
	}
});