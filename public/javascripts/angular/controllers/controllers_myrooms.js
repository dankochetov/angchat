chatio.controller('myroomsCtrl', function($scope, $http, $rootScope, $timeout, socket, autoLogout, template){

	$scope.rooms = [];
	$scope.loading = true;

	$http.get('/getuser').then(function(response){
		$timeout(function(){
			$rootScope.user = $scope.user = response.data;
			socket.emit('get rooms', $rootScope.user._id);
		});
	});

	if ($rootScope['listeners.myrooms.rooms']) $rootScope['listeners.myrooms.rooms']();
	$rootScope['listeners.myrooms.rooms'] = $scope.$on('socket:rooms', function(event, data){
		$scope.loading = false;
		$scope.rooms = data;
	});

	$scope.delete = function(room){
		if (room.online == 0 && confirm('Are you sure you want to delete the "' + room.name + '" room?'))
			socket.emit('delete room', room._id);
	}
	$scope.template = template;
});