chatio.controller('myroomsCtrl', function($scope, $http, $timeout, $filter){
	var socket = io.connect(hostname, {forceNew: true});
	socket.emit('connect', 'socket opened for myrooms');

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
			$scope.rooms = $filter('onlyMy')(data, $scope.user._id);
		});
	});

	$scope.delete = function(room){
		if (room.online == 0 && confirm('Are you sure you want to delete the "' + room.name + '" room?'))
			socket.emit('delete room', room._id);
	}
});