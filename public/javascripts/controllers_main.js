chatio.controller('mainCtrl', function($scope, $rootScope, $routeParams, $http, $q, autoSync){

	var userInit = $q.defer();

	$http.get('/getuser').then(function(response){
		$rootScope.user = $scope.user = response.data;
		userInit.resolve();
	});

	var socket;

	if (!$rootScope.sockets || !$rootScope.sockets['rooms'])
	{
		var socket = io.connect({forceNew: true});
		socket.emit('comment', 'socked opened for Rooms');
		socket.room = {_id: '/', name: 'Rooms'};

		$rootScope.room = socket.room;
		if (!$rootScope.sockets) $rootScope.sockets = {};
		$rootScope.sockets['rooms'] = socket;
	}
	else socket = $rootScope.sockets['rooms'];

	$scope.$on('users', function(event, data){
		$scope.$apply(function(){
			$scope.users = data;
		});
	});

	$scope.$on('rendering finished', function(event, data){
		dropdownSlide();
	});

	userInit.promise.then(function(){
		socket.emit('get friends', $scope.user);
		socket.on('friends', function(data){
			$scope.$apply(function(){
				$scope.friends = data;
			});
		});
	});

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

});