chatio.controller('myroomsCtrl', function($scope, $http, $rootScope, $timeout, socket, autoLogout, template){

	$scope.rooms = [];
	$scope.loading = true;

	var listeners = [];

	$scope.$on('$destroy', function(event, data){
		for (var i in listeners) listeners[i]();
	});

	$http.get('/getuser').then(function(response){
		$timeout(function(){
			$rootScope.user = response.data;
			socket.emit('get rooms', $rootScope.user._id);
		});
	});

	listeners.push(socket.on('rooms', function(data){
		$scope.loading = false;
		$scope.rooms = data;
	}));

	$scope.delete = function(room){
		if (room.online == 0 && confirm('Are you sure you want to delete the "' + room.name + '" room?'))
			socket.emit('delete room', {roomid: room._id, userid: $rootScope.user._id});
	}
	$scope.template = template;
});