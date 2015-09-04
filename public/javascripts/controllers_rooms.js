chatio.controller('roomsDefaultCtrl', function($scope){
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

	socket.emit('get rooms', function(data){
		$scope.loading = false;
		$scope.$apply(function(){
			$scope.rooms = data;
		});
	});
});