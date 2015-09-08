chatio.controller('roomsCtrl', function($scope, $rootScope, $http){

	var socket = $scope.socket = $rootScope.sockets['rooms'];

	$scope.rooms = [];
	$scope.showForm = [];
	$scope.pwd = [];
	$scope.error = [];
	$scope.loading = true;

	$scope.tryJoinRoom = function(room){
		if (!room.protect) window.location = '#/' + room._id;
		else $scope.showForm[room._id] = !$scope.showForm[room._id];
	}

	socket.emit('get rooms');

	socket.on('rooms', function(data){
		$scope.loading = false;
		$scope.$apply(function(){
			$scope.rooms = data;
		});
	});
});