chatio.controller('roomsDefaultCtrl', function($scope, autoSync){

	$scope.rooms = [];
	$scope.showForm = [];
	$scope.pwd = [];
	$scope.error = [];
	$scope.loading = true;

	$scope.tryJoinRoom = function(room){
		if (!room.protect) window.location = '/rooms/' + room._id;
		else $scope.showForm[room._id] = !$scope.showForm[room._id];
	}

	$scope.enterRoom = function(room){
		if ($scope.pwd[room._id] == room.password) window.location = '/rooms/' + room._id;
	}

	socket.emit('get rooms');

	socket.on('rooms', function(data){
		$scope.loading = false;
		$scope.$apply(function(){
			$scope.rooms = data;
		});
	});
});

chatio.controller('roomsMyCtrl', function($scope, $http, $timeout, $filter, autoSync){
	$scope.rooms = [];
	$scope.loading = true;

	$http.get('/getuser').then(function(response){
		$timeout(function(){
			$scope.user = response.data;
		}, 0);
		socket.emit('get rooms');
	});

	
	socket.on('rooms', function(data){
		$scope.loading = false;
		$scope.$apply(function(){
			$scope.rooms = $filter('onlyMy')(data, $scope.user.login);
		});
	});

	$scope.delete = function(room){
		if (room.online == 0 && confirm('Are you sure you want to delete the "' + room.name + '" room?'))
			socket.emit('delete room', room._id);
	}
});