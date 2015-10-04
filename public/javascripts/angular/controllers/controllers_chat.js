chatio.controller('chatCtrl', function($scope, $rootScope, $route, $routeParams, $http, $location, $timeout, socket, ngAudio, popup, autoLogout, tabs){

	var listeners = [];

	$scope.$on('$destroy', function(event, data){
		for (var i in listeners) listeners[i]();
	});

	$scope.tabs = tabs;

	$scope.friends = [];
	$scope.loading_friends = true;

	$http.get('/getuser').then(function(response){
		$rootScope.user = response.data;
		userInit();
	});

	listeners.push(socket.on('users', function(users){
		$scope.users = users;
	}));

	$scope.$on('rendering finished', function(){
		dropdownSlide();
	});

	function userInit()
	{
	socket.emit('get friends', $rootScope.user._id);
	listeners.push(socket.on('friends', function(friends){
		$scope.loading_friends = false;
		$scope.friends = friends;
	}));

		tabs.init();
		$scope.tabsLoaded = true;
	}

	$scope.addFriend = function(id){
		for (var friend in $scope.friends)
			if ($scope.friends[friend]._id == id) return alert('This user is already your friend');
		socket.emit('add friend', {userid: $rootScope.user._id, friendid: id});
	}

	$scope.removeFriend = function(id){
		socket.emit('remove friend', {userid: $rootScope.user._id, friendid: id});
	}

	$rootScope.popups = popup.list;

	var notifySound = ngAudio.load('../sounds/notify.mp3');
	listeners.push(socket.on('listener event', function(data){
		if (data.to != $rootScope.user._id || $rootScope.tab.id == data.from) return;
		$scope.openTab(data.from, {
			private: true,
			open: false,
			unread: true
		});
		popup.add(data);
		notifySound.play();
	}));

	$scope.logout = function(){
		$http.get('/logout');
	}

	$scope.openTab = function(id, params){
		if (!params) params = {};
		if (params.open == null) params.open = true;
		var createNew = true;
		for (cur in $rootScope.tabs)
			if ($rootScope.tabs[cur].id == id)
			{
				createNew = false;
				break;
			}
		if (createNew)
		{
			if (params.private)
			{
				socket.emit('get user', id);
				var close = socket.on('user', function(user){
					if (user == '404' || id != user._id) return;
					var newTab = {
						active: params.open || false,
						unread: params.unread ? 1 : 0,
						title: user.username,
						id: id,
						url: '/chat/user/' + id,
						private: true
					};
					tabs.open(newTab);
					close();
				});
			}
			else
			{
				socket.emit('get room', id);
				var close = socket.on('room', function(room){
					if (room == '404') return;
					var newTab = {
						active: params.open || false,
						unread: params.unread ? 1 : 0,
						title: room.name,
						id: id,
						url: '/chat/room/' + id,
						private: false
					};
					tabs.open(newTab);
					close();
				});
			}
		}
		else
		{
			if (params.unread) tabs.addUnread(id);
			if (params.open) tabs.active(id);
		}
	}

	$rootScope.closeTab = function(tab){
		if (!tab.private)
			socket.emit('leave room', tab.id);
		var count = tabs.count();
		tabs.close(tab.id, function(pos){
			if (pos > 0) tabs.active(pos - 1);
			else if (pos < count - 1) tabs.active(pos + 1);
			else tabs.active('root');
		});
	}

	$scope.clearChat = function(){
		socket.emit('clear history', $rootScope.tab.id);
		$scope.$broadcast('clear history', $rootScope.tab.id);
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